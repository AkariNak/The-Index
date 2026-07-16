// ============================================================
// Onyx — player.js
// ============================================================

// ---------- Theme ----------
(function() {
  document.body.classList.toggle('light', localStorage.getItem('aurum-theme') === 'light');
  if (sessionStorage.getItem('fromAbyss') === '1') document.documentElement.classList.add('abyss-theme');
})();

// ---------- DOM refs ----------
const playerVideoEl  = document.getElementById('playerVideo');
const playerTitleEl  = document.getElementById('playerTitle');
const playerDescEl   = document.getElementById('playerDesc');
const playerEpMetaEl = document.getElementById('playerEpMeta');
const episodeSidebar = document.getElementById('episodeSidebar');
const showTitleEl    = document.getElementById('showTitle');
const showMetaEl     = document.getElementById('showMeta');
const showSynopsisEl = document.getElementById('showSynopsis');
const tagListEl      = document.getElementById('tagList');
const recsGrid       = document.getElementById('recsGrid');
const recsSection    = document.getElementById('recsSection');
const backLink       = document.getElementById('backLink');
const yearEl         = document.getElementById('year');

if (yearEl) yearEl.textContent = '© ' + new Date().getFullYear();

// ---------- State ----------
let currentGroup = null;
let currentVideo = null;
let currentJikan = null;
let _tsInterval  = null;

// ---------- URL ----------
function getParams() {
  const p = new URLSearchParams(window.location.search);
  return { show: p.get('show'), ep: p.get('ep'), t: p.get('t') };
}

// ---------- Timestamp ----------
function saveCurrentTimestamp() {
  if (!playerVideoEl || !currentVideo || !currentGroup) return;
  if (playerVideoEl.currentTime < 5) return;
  saveTimestamp(currentGroup.title, currentVideo.title, Math.floor(playerVideoEl.currentTime));
}

function startTimestampSaving() {
  stopTimestampSaving();
  _tsInterval = setInterval(saveCurrentTimestamp, 4000);
}

function stopTimestampSaving() {
  if (_tsInterval) { clearInterval(_tsInterval); _tsInterval = null; }
}

// ---------- Load video ----------
// ---------- Episode description helpers ----------
const EP_DESC_CACHE_KEY = 'onyx-ep-desc';

function stripMalCredit(text) {
  if (!text) return '';
  return text.replace(/\s*\[Written by MAL Rewrite\]/gi, '').replace(/\s*\[Source:.*?\]/gi, '').trim();
}

function loadEpDescCache() {
  try { return JSON.parse(localStorage.getItem(EP_DESC_CACHE_KEY) || '{}'); } catch { return {}; }
}

function saveEpDescCache(cache) {
  try { localStorage.setItem(EP_DESC_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

async function fetchEpisodeDescription(collectionTitle, episodeNumber) {
  if (!episodeNumber) return null;
  const epNum = parseInt(String(episodeNumber).replace(/[^0-9]/g, ''), 10);
  if (!epNum) return null;
  const cacheKey = `${slug(collectionTitle)}-${epNum}`;
  const cache = loadEpDescCache();
  if (cache[cacheKey]) return cache[cacheKey];
  try {
    const searchRes = await jikanRequest(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(collectionTitle)}&limit=1`);
    const malId = searchRes?.data?.[0]?.mal_id;
    if (!malId) return null;
    await new Promise(r => setTimeout(r, 500));
    const epRes = await jikanRequest(`https://api.jikan.moe/v4/anime/${malId}/episodes/${epNum}`);
    const synopsis = epRes?.data?.synopsis;
    if (!synopsis) return null;
    const cleaned = stripMalCredit(synopsis);
    cache[cacheKey] = cleaned;
    saveEpDescCache(cache);
    return cleaned;
  } catch (e) {
    console.warn('[EpDesc] Failed:', e);
    return null;
  }
}

// ---------- Watch Analytics ----------
const ANALYTICS_SESSION_KEY = 'onyx-session-id';

function getSessionId() {
  let id = localStorage.getItem(ANALYTICS_SESSION_KEY);
  if (!id) {
    id = 'guest-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(ANALYTICS_SESSION_KEY, id);
  }
  return id;
}

let _analyticsTimer = null;
let _analyticsCollection = null;
let _analyticsAccum = 0;
let _analyticsLastTick = null;

async function flushAnalytics() {
  if (!_analyticsCollection || _analyticsAccum < 1) return;
  const seconds = Math.floor(_analyticsAccum);
  _analyticsAccum = 0;
  const sessionId = getSessionId();
  const today = new Date().toISOString().slice(0, 10);
  console.log('[Analytics] flushing', seconds, 'seconds for', _analyticsCollection, 'on', today);
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const isGuest = !userId;
    let username = null;
    if (userId) {
      try {
        const { data: profile } = await sb.from('user_profiles').select('username').eq('id', userId).maybeSingle();
        username = profile?.username || null;
      } catch {}
    }
    const { data: existing, error: fetchErr } = await sb
      .from('watch_analytics')
      .select('id, watch_seconds')
      .eq('session_id', sessionId)
      .eq('collection', _analyticsCollection)
      .eq('watch_date', today)
      .maybeSingle();
    if (fetchErr) { console.warn('[Analytics] fetch error:', fetchErr.message); return; }
    if (existing) {
      const { error: updateErr } = await sb.from('watch_analytics')
        .update({ watch_seconds: existing.watch_seconds + seconds, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updateErr) console.warn('[Analytics] update error:', updateErr.message);
      else console.log('[Analytics] updated row, total:', existing.watch_seconds + seconds);
    } else {
      const { error: insertErr } = await sb.from('watch_analytics').insert({
        session_id: sessionId, user_id: userId, username,
        collection: _analyticsCollection, watch_seconds: seconds,
        is_guest: isGuest, watch_date: today
      });
      if (insertErr) console.warn('[Analytics] insert error:', insertErr.message);
      else console.log('[Analytics] inserted new row for', today);
    }
  } catch (e) {
    console.warn('[Analytics] flush failed:', e.message);
  }
}

function startAnalytics(collection) {
  stopAnalytics();
  _analyticsCollection = collection;
  _analyticsAccum = 0;
  _analyticsLastTick = null;
  _analyticsTimer = setInterval(() => {
    if (!playerVideoEl || playerVideoEl.paused || playerVideoEl.ended) {
      _analyticsLastTick = null;
      return;
    }
    const now = Date.now();
    if (_analyticsLastTick) _analyticsAccum += (now - _analyticsLastTick) / 1000;
    _analyticsLastTick = now;
    if (_analyticsAccum >= 30) flushAnalytics();
  }, 1000);
}

function stopAnalytics() {
  if (_analyticsTimer) { clearInterval(_analyticsTimer); _analyticsTimer = null; }
  flushAnalytics();
  _analyticsLastTick = null;
}

async function logEpisodeWatched(collection, episodeTitle, episodeNumber) {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();
    const sessionId = getSessionId();
    // Avoid duplicate logs for same session+episode
    const { data: existing } = await sb
      .from('episodes_watched')
      .select('id')
      .eq('session_id', sessionId)
      .eq('collection', collection)
      .eq('episode_title', episodeTitle)
      .maybeSingle();
    if (existing) return; // already logged
    await sb.from('episodes_watched').insert({
      session_id: sessionId,
      user_id: user?.id || null,
      collection,
      episode_title: episodeTitle,
      episode_number: episodeNumber || null,
      is_guest: !user
    });
    console.log('[Analytics] episode logged:', episodeTitle);
  } catch (e) {
    console.warn('[Analytics] episode log failed:', e.message);
  }
}

function loadVideo(video, overrideTs) {
  if (!video) return;
  // Flush the outgoing episode's position BEFORE currentVideo is reassigned.
  // Without this, clicking a new episode dropped the previous episode's
  // progress: the new video sits at time 0, and the next save writes 0 over
  // the real spot. Home page and detail then point at the wrong episode.
  saveCurrentTimestamp();
  stopTimestampSaving();

  const url = video.downloadUrl;
  if (!url || url === '#') {
    if (playerVideoEl) { playerVideoEl.removeAttribute('src'); playerVideoEl.load(); }
    if (playerTitleEl) playerTitleEl.textContent = `${video.title} — no video URL`;
    return;
  }

  // Use override timestamp if provided, otherwise fall back to saved progress
  let startTs = 0;
  if (typeof overrideTs === 'number' && overrideTs > 5) {
    startTs = overrideTs;
  } else {
    const saved = getLastWatched(currentGroup?.title);
    if (saved && saved.lastEpisodeTitle === video.title && typeof saved.timestamp === 'number' && saved.timestamp > 5) {
      startTs = saved.timestamp;
    }
  }

  // Record the episode being opened as the last-watched one immediately, so
  // Continue Watching (home) and the detail page point here, not the old ep.
  if (currentGroup && video) {
    const _epNum   = parseFloat(String(video.episode || '0').replace(/[^0-9.]/g, '')) || 0;
    const _resumeAt = (typeof overrideTs === 'number' && overrideTs > 5) ? Math.floor(overrideTs) : 0;
    markEpisodeWatched(currentGroup.title, video.title, _resumeAt, _epNum);
  }

  currentVideo = video;

  // Refresh episode pills so active state reflects currentVideo
  if (currentGroup) {
    const allGroups = groupVideos(AppState.videos);
    renderSeriesOnPlayer(allGroups);
  }

  // Enable download only for Akari Admin
  getCurrentUser().then(async user => {
    if (user && user.email === 'lukehare1007@gmail.com') {
        playerVideoEl.removeAttribute('controlsList');
        playerVideoEl.oncontextmenu = null;
    } else {
        playerVideoEl.setAttribute('controlsList', 'nodownload noremoteplayback');
        playerVideoEl.oncontextmenu = () => false;
    }
  });

  playerVideoEl.src = url;
  playerVideoEl.load();
  if (currentGroup) startAnalytics(currentGroup.title);

  playerVideoEl.addEventListener('loadedmetadata', () => {
    if (startTs > 0 && startTs < playerVideoEl.duration - 5) {
      playerVideoEl.currentTime = startTs;
    }
    playerVideoEl.play().catch(() => {});
    startTimestampSaving();
  }, { once: true });

  // Mark watched only when near end (within 10 mins) — not on load
  if (currentGroup) {
    const epNum = parseFloat(String(video.episode || '0').replace(/[^0-9.]/g, '')) || 0;
    let _markedWatched = false;

    playerVideoEl.addEventListener('timeupdate', function onTimeUpdate() {
      if (_markedWatched) return;
      const duration = playerVideoEl.duration;
      if (!duration || duration < 1) return;
      const remaining = duration - playerVideoEl.currentTime;
      if (remaining <= 600) { // within 10 mins of end
        _markedWatched = true;
        markEpisodeWatched(currentGroup.title, video.title, playerVideoEl.currentTime, epNum);
        renderSeriesOnPlayer(groupVideos(AppState.videos));
        // Re-apply active state after re-render since currentVideo may differ by reference
        const activeIdx = currentGroup.videos.findIndex(v => v.title === video.title);
        document.querySelectorAll('.ep-pill').forEach(btn => {
          const idx = btn.dataset.idx !== undefined ? parseInt(btn.dataset.idx) : -1;
          btn.classList.toggle('active', idx === activeIdx);
        });
        playerVideoEl.removeEventListener('timeupdate', onTimeUpdate);
        logEpisodeWatched(currentGroup.title, video.title, epNum);
      }
    });

    getCurrentUser().then(async user => {
      if (!user) return;
      const status = await getWatchStatus(currentGroup.title);
      if (!status) setWatchStatus(currentGroup.title, 'watching');
      const progress = AppState.progress || {};
      const totalWatched = Object.keys(progress).length;
      checkAchievements({ episodeWatched: true, totalWatched });
    });
  }

  // Update UI
  if (playerTitleEl) playerTitleEl.textContent = video.title;

  // Update active episode pill without full re-render
  if (currentGroup) {
    const newIdx = currentGroup.videos.indexOf(video);
    document.querySelectorAll('.ep-pill, .sidebar-ep').forEach(btn => {
      const btnIdx = btn.dataset.idx !== undefined ? parseInt(btn.dataset.idx) : null;
      const isActive = btnIdx !== null ? btnIdx === newIdx : btn.dataset.title === video.title;
      btn.classList.toggle('active', isActive);
      if (isActive && !btn.classList.contains('watched')) btn.classList.remove('watched');
    });
  }
  if (playerDescEl) {
    const fallback = stripMalCredit(video.description || '');
    playerDescEl.textContent = fallback;
    playerDescEl.hidden = !fallback;
    if (currentGroup) {
      fetchEpisodeDescription(currentGroup.title, video.episode).then(desc => {
        if (desc && playerDescEl) { playerDescEl.textContent = desc; playerDescEl.hidden = false; }
      });
    }
  }
  if (playerEpMetaEl) {
    const parts = [];
    if (video.episode) parts.push(`EP ${video.episode}`);
    if (video.fileType && video.fileType !== '—') parts.push(video.fileType);
    if (video.fileSize && video.fileSize !== '—') parts.push(video.fileSize);
    playerEpMetaEl.textContent = parts.join(' · ');
  }

  // Update URL
  if (currentGroup) {
    const epIdx = currentGroup.videos.indexOf(video);
    history.replaceState(null, '', `player.html?show=${encodeURIComponent(currentGroup.slug)}&ep=${epIdx}`);
  }

  highlightSidebarEp(video);

  // Load comments
  const commentsContainer = document.getElementById('commentsContainer');
  if (commentsContainer && currentGroup) {
    renderComments(commentsContainer, currentGroup.title, video.title);
  }
}

// ---------- Sidebar ----------
function highlightSidebarEp(video) {
  if (!episodeSidebar) return;
  episodeSidebar.querySelectorAll('.sidebar-ep, .ep-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.title === video.title);
  });
  episodeSidebar.querySelector('.active')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function cleanEpNum(ep, index) {
  if (!ep) return String(index + 1);
  const str = String(ep);
  // "1.01" → "1", "1.25" → "25", "01" → "1"
  if (str.includes('.')) return String(parseInt(str.split('.')[1], 10));
  return String(parseInt(str, 10) || index + 1);
}

function renderSidebar(group, allGroups) {
  if (!episodeSidebar || !group) return;
  const useGrid  = group.videos.length > 12;
  const progress = getLastWatched(group.title);

  // Season pills — only if there are related seasons
  let seasonPillsHtml = '';
  if (allGroups) {
    const baseTitle    = getSeriesBase(group.title);
    const isCurrentSubbed = /\(subbed\)/i.test(group.title) || group.videos[0]?.language === 'subbed';
    const seriesGroups = allGroups
      .filter(g => getSeriesBase(g.title) === baseTitle)
      .filter(g => !/\(subbed\)/i.test(g.title)) // work from dubbed list, then find subbed pair if needed
      .sort((a, b) => {
        const n = t => { const m = t.match(/(?:season|part|cour|s)\s*(\d+)/i); return m ? parseInt(m[1], 10) : 999; };
        const na = n(a.title), nb = n(b.title);
        if (na !== nb) return na - nb;
        const da = Math.max(...a.videos.map(v => new Date(v.dateAdded || 0).getTime()));
        const db = Math.max(...b.videos.map(v => new Date(v.dateAdded || 0).getTime()));
        return da - db;
      });
    if (seriesGroups.length > 1) {
      const getLabel = t => {
        const m = t.match(/(?:season|part|cour)\s*(\w+)/i);
        return m ? `S${m[1].replace(/one/i,'1').replace(/two/i,'2').replace(/three/i,'3')}` : 'S1';
      };
      seasonPillsHtml = `<div class="season-pills">${seriesGroups.map(g => {
        // If currently on subbed, find the subbed version of this season
        let targetGroup = g;
        if (isCurrentSubbed) {
          const subbedVariant = allGroups.find(g2 => {
            const base2 = g2.title.replace(/\s*\(Subbed\)/i, '').trim();
            return base2 === g.title && /\(subbed\)/i.test(g2.title);
          });
          if (subbedVariant) targetGroup = subbedVariant;
        }
        const isCurrent = targetGroup.slug === group.slug;
        const label     = getLabel(g.title);
        const href      = isCurrent ? '#' : `player.html?show=${encodeURIComponent(targetGroup.slug)}&ep=0`;
        return `<a class="season-pill ${isCurrent ? 'active' : ''}" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
      }).join('')}</div>`;
    }
  }

  if (useGrid) {
    const lastWatchedTitle = progress?.lastEpisodeTitle;
    const lastWatchedIdx = lastWatchedTitle
      ? group.videos.findIndex(v => v.title === lastWatchedTitle)
      : -1;

    episodeSidebar.innerHTML = seasonPillsHtml + `<div class="ep-grid">${group.videos.map((video, i) => {
      const ep       = cleanEpNum(video.episode, i);
      const isActive = currentVideo && video.title === currentVideo.title;
      const watched  = i <= lastWatchedIdx && lastWatchedIdx >= 0;
      return `<button class="ep-pill${isActive ? ' active' : ''}${watched && !isActive ? ' watched' : ''}" data-idx="${i}" type="button" title="${escapeHtml(video.title)}">${escapeHtml(ep)}</button>`;
    }).join('')}</div>`;
  } else {
    episodeSidebar.innerHTML = seasonPillsHtml + group.videos.map((video, i) => {
      const isActive = currentVideo && video.title === currentVideo.title;
      const ep       = cleanEpNum(video.episode, i);
      return `<button class="sidebar-ep${isActive ? ' active' : ''}" data-title="${escapeHtml(video.title)}" type="button">
        <span class="sidebar-ep-num">EP ${escapeHtml(ep)}</span>
        <span class="sidebar-ep-title">${escapeHtml(video.title)}</span>
      </button>`;
    }).join('');
  }

  episodeSidebar.querySelectorAll('.sidebar-ep, .ep-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.dataset.idx !== undefined ? parseInt(btn.dataset.idx) : null;
      const video = idx !== null ? group.videos[idx] : group.videos.find(v => v.title === btn.dataset.title);
      if (video) loadVideo(video);
    });
  });
}

// ---------- Series (seasons) ----------
function getSeriesBase(title) {
  return title
    .replace(/\s+(season|part|cour)\s*\w+.*$/i, '')
    .replace(/\s+S\d+.*$/i, '')
    .replace(/\s+\d+(st|nd|rd|th)?\s*(season|part|cour).*$/i, '')
    .replace(/:\s*.+$/, '')
    .trim().toLowerCase();
}

function renderSeriesOnPlayer(allGroups) {
  const container = document.getElementById('playerSeriesContainer');
  const grid      = document.getElementById('playerSeriesGrid');
  if (!container || !grid || !currentGroup) return;

  const baseTitle    = getSeriesBase(currentGroup.title);
  const seriesGroups = allGroups
    .filter(g => getSeriesBase(g.title) === baseTitle)
    .filter(g => !/\(subbed\)/i.test(g.title))
    .sort((a, b) => {
      const getNum = t => { const m = t.match(/(?:season|part|cour|s)\s*(\d+)/i); return m ? parseInt(m[1], 10) : 999; };
      const na = getNum(a.title), nb = getNum(b.title);
      if (na !== nb) return na - nb;
      const da = Math.max(...a.videos.map(v => new Date(v.dateAdded || 0).getTime()));
      const db = Math.max(...b.videos.map(v => new Date(v.dateAdded || 0).getTime()));
      return da - db;
    });

  if (seriesGroups.length <= 1) { container.hidden = true; return; }
  container.hidden = false;

  const getLabel = title => {
    const m = title.match(/(?:season|part|cour)\s*\w+/i) ||
              title.match(/\b(Movie|OVA|Special|Final Season|Final Part)\b.*/i);
    if (m) return (m[1] || m[0]).replace(/^\w/, c => c.toUpperCase());
    const colon = title.match(/:\s*(.+)$/);
    if (colon) return colon[1].trim();
    return 'Season 1';
  };

  grid.innerHTML = seriesGroups.map(g => {
    const isCurrent = g.slug === currentGroup.slug;
    const label     = getLabel(g.title);
    const epCount   = g.videos.length;
    return `
      <a class="series-card ${isCurrent ? 'series-card-active' : ''}" href="detail.html?show=${encodeURIComponent(g.slug)}">
        <div class="series-card-bg" style="background-image:url('${escapeHtml(g.firstCover || '')}')"></div>
        <div class="series-card-info">
          <div class="series-card-label">${escapeHtml(label)}</div>
          <div class="series-card-eps">${epCount} ${epCount === 1 ? 'ep' : 'eps'}</div>
        </div>
        ${isCurrent ? '<div class="series-card-now">Watching</div>' : ''}
      </a>
    `;
  }).join('');
}

// ---------- Show info ----------
function renderShowInfo(group, jikan) {
  if (backLink) backLink.href = `detail.html?show=${encodeURIComponent(group.slug)}`;
  if (showTitleEl) {
    const cleanName = group.title.replace(/\s*\(Subbed\)/i, '').replace(/\s*\(Dubbed\)/i, '').trim();
    const isSub = /\(subbed\)/i.test(group.title) || group.videos[0]?.language === 'subbed';
    showTitleEl.textContent = cleanName + (isSub ? ' (Subbed)' : '');
  }
  if (showMetaEl) {
    const parts = [];
    if (jikan?.year)     parts.push(String(jikan.year));
    if (jikan?.type)     parts.push(jikan.type);
    if (jikan?.episodes) parts.push(`${jikan.episodes} eps`);
    if (jikan?.score)    parts.push(`★ ${jikan.score}`);
    showMetaEl.textContent = parts.join(' · ');
    showMetaEl.hidden = !parts.length;
  }
  if (showSynopsisEl) { showSynopsisEl.textContent = stripMalCredit(jikan?.synopsis || ''); showSynopsisEl.hidden = !jikan?.synopsis; }
  if (tagListEl) {
    const tags = getTagsForCollection(group.title, jikan?.tags || []);
    tagListEl.innerHTML = tags.length ? tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') : '';
    tagListEl.hidden = !tags.length;
  }

  // Language toggle
  const allGroups = groupVideos(AppState.videos);
  const base = group.title.replace(/\s*\(Subbed\)/i, '').replace(/\s*\(Dubbed\)/i, '').trim();
  const isSubbed = /\(subbed\)/i.test(group.title) || group.videos[0]?.language === 'subbed';
  const paired = allGroups.find(g2 => {
    if (g2.slug === group.slug) return false;
    const base2 = g2.title.replace(/\s*\(Subbed\)/i, '').replace(/\s*\(Dubbed\)/i, '').trim();
    if (base2 !== base) return false;
    const isSubbed2 = /\(subbed\)/i.test(g2.title) || g2.videos[0]?.language === 'subbed';
    return isSubbed !== isSubbed2;
  });
  let langToggle = document.getElementById('playerLangToggle');
  if (paired) {
    if (!langToggle) {
      langToggle = document.createElement('div');
      langToggle.id = 'playerLangToggle';
      langToggle.className = 'lang-toggle';
      showTitleEl?.parentNode?.insertBefore(langToggle, showTitleEl.nextSibling);
    }
    langToggle.innerHTML = `
      <button class="lang-toggle-btn${!isSubbed ? ' active' : ''}" data-target="${!isSubbed ? '' : escapeHtml(paired.slug)}" type="button">DUB</button>
      <button class="lang-toggle-btn${isSubbed ? ' active' : ''}" data-target="${isSubbed ? '' : escapeHtml(paired.slug)}" type="button">SUB</button>
    `;
    langToggle.querySelectorAll('.lang-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSlug = btn.dataset.target;
        if (!targetSlug) return;
        const epIdx = currentVideo ? group.videos.findIndex(v => v.title === currentVideo.title) : 0;
        // Full page reload so layout, series pills, and all state refresh correctly
        window.location.href = `player.html?show=${encodeURIComponent(targetSlug)}&ep=${Math.max(0, epIdx)}`;
      });
    });
  } else if (langToggle) {
    langToggle.remove();
  }
}

// ---------- Recommendations ----------
function renderRecommendations(allGroups) {
  if (!recsGrid || !recsSection || !currentGroup) return;
  const tags = getTagsForCollection(currentGroup.title, currentJikan?.tags || []);
  const recs  = getRecommendationsForCollection(currentGroup.title, currentGroup.category, allGroups, tags);
  if (!recs.length) { recsSection.hidden = true; return; }
  recsSection.hidden = false;
  recsGrid.innerHTML = recs.map(g => `
    <article class="poster-card">
      <a class="poster-clickable" href="detail.html?show=${encodeURIComponent(g.slug)}">
        <div class="poster-cover">
          ${g.firstCover ? `<img src="${escapeHtml(g.firstCover)}" alt="" loading="lazy">` : `<div class="cover-placeholder">${escapeHtml(g.title.charAt(0).toUpperCase())}</div>`}
          <div class="poster-overlay"><span class="poster-play-icon">▶</span></div>
        </div>
        <div class="poster-info">
          <div class="poster-cat">${escapeHtml((g.category || 'Other').toUpperCase())}</div>
          <h3 class="poster-title">${escapeHtml(g.title)}</h3>
        </div>
      </a>
    </article>
  `).join('');
}

// ---------- Comments ----------
(function ensureCommentLinkStyle(){
  if (document.getElementById('onyxCommentLinkStyle')) return;
  const s = document.createElement('style');
  s.id = 'onyxCommentLinkStyle';
  s.textContent = `
    .comment-profile-link { text-decoration:none; color:inherit; cursor:pointer; }
    .comment-username.comment-profile-link:hover { color: var(--accent, #3B82F6); text-decoration: underline; }
    .comment-avatar.comment-profile-link { display:inline-block; }
    .comment-avatar.comment-profile-link:hover { opacity:0.85; }
  `;
  document.head.appendChild(s);
})();

async function renderComments(container, collectionName, episodeTitle) {
  container.innerHTML = `<div class="comments-loading">Loading comments…</div>`;
  const [comments, user, profile] = await Promise.all([
    getComments(collectionName, episodeTitle),
    getCurrentUser(),
    getCurrentUser().then(u => u ? getCurrentProfile() : null)
  ]);

  // Admin can delete any comment; regular users only their own.
  const isAdmin = user?.email === 'lukehare1007@gmail.com';

  const avatar = (url, name) => url
    ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(name)}">`
    : `<div class="comment-avatar-placeholder">${escapeHtml(name.charAt(0).toUpperCase())}</div>`;

  const commentsHtml = comments.length
    ? comments.map(c => `
        <div class="comment">
          <a class="comment-avatar comment-profile-link" href="user.html?u=${encodeURIComponent(c.username)}">${avatar(c.avatar_url, c.username)}</a>
          <div class="comment-body">
            <div class="comment-header">
              <a class="comment-username comment-profile-link" href="user.html?u=${encodeURIComponent(c.username)}">${escapeHtml(c.username)}</a>
              <span class="comment-date">${formatDate(c.created_at)}</span>
              ${(user && (isAdmin || c.user_id === user.id)) ? `<button class="comment-delete btn btn-small" data-id="${escapeHtml(c.id)}" type="button"${isAdmin && c.user_id !== user.id ? ' title="Delete as admin"' : ''}>Delete</button>` : ''}
            </div>
            <p class="comment-content">${escapeHtml(c.content)}</p>
          </div>
        </div>`).join('')
    : `<div class="comments-empty">No comments yet. Be the first!</div>`;

  const inputHtml = user
    ? `<div class="comment-input-wrap">
        <div class="comment-avatar">${avatar(profile?.avatar_url || null, profile?.username || '?')}</div>
        <div class="comment-input-inner">
          <textarea id="commentInput" placeholder="Write a comment…" rows="2" maxlength="1000"></textarea>
          <button class="btn btn-solid btn-small" id="commentSubmit" type="button">Post</button>
        </div>
      </div>`
    : `<div class="comment-signin-prompt"><button class="btn btn-outline btn-small" id="commentSignInBtn" type="button">Sign in to comment</button></div>`;

  container.innerHTML = `
    <div class="comments-section">
      <h4 class="comments-heading">Comments <span class="episodes-count">${comments.length}</span></h4>
      ${inputHtml}
      <div class="comments-list">${commentsHtml}</div>
    </div>
  `;

  document.getElementById('commentSubmit')?.addEventListener('click', async () => {
    const input = document.getElementById('commentInput');
    const text  = input?.value?.trim();
    if (!text) return;
    const btn = document.getElementById('commentSubmit');
    btn.disabled = true;
    try { await postComment(collectionName, episodeTitle, text); renderComments(container, collectionName, episodeTitle); }
    catch (err) { alert(`Could not post: ${err.message}`); btn.disabled = false; }
  });

  container.querySelectorAll('.comment-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this comment?')) return;
      try { await deleteComment(btn.dataset.id); renderComments(container, collectionName, episodeTitle); }
      catch (err) { alert(`Could not delete: ${err.message}`); }
    });
  });

  document.getElementById('commentSignInBtn')?.addEventListener('click', () => { window.location.href = 'account.html'; });
}

// ---------- Auto-advance ----------
function wireAutoAdvance(group) {
  if (!playerVideoEl || !group) return;
  playerVideoEl.addEventListener('pause', stopTimestampSaving);
  playerVideoEl.addEventListener('ended', async () => {
    stopTimestampSaving();
    if (!currentVideo) return;
    const idx  = group.videos.indexOf(currentVideo);
    const next = group.videos[idx + 1];
    const isLast = !next;

    // Auto-complete if this was the last episode
    if (isLast) {
      const user = await getCurrentUser();
      if (user) {
        const status = await getWatchStatus(group.title);
        if (status === 'watching') {
          await setWatchStatus(group.title, 'completed');
        }
      }
    }

    if (next) loadVideo(next);
  });
}

// ---------- Fog ----------
const FOG_KEY = 'aurum-fog-color';
function applyFog(color) {
  const page   = document.querySelector('.player-page');
  const swatch = document.getElementById('fogSwatch');
  if (!page || !swatch) return;
  if (!color || color === 'off') {
    page.style.removeProperty('--fog-color');
    swatch.classList.remove('active');
    swatch.style.removeProperty('--fog-swatch-color');
    swatch.style.setProperty('--fog-swatch-show', 'none');
    return;
  }
  page.style.setProperty('--fog-color', color);
  swatch.classList.add('active');
  swatch.style.setProperty('--fog-swatch-color', color);
  swatch.style.setProperty('--fog-swatch-show', 'block');
}
function wireFog() {
  const input  = document.getElementById('fogInput');
  const offBtn = document.getElementById('fogOffButton');
  const saved  = localStorage.getItem(FOG_KEY);
  if (saved && saved !== 'off') { if (input) input.value = saved; applyFog(saved); }
  input?.addEventListener('input',  e => { applyFog(e.target.value); localStorage.setItem(FOG_KEY, e.target.value); });
  offBtn?.addEventListener('click', () => { applyFog('off'); localStorage.setItem(FOG_KEY, 'off'); });
}

// ---------- Active-episode highlight (grid view) ----------
// The grid pill for the current episode needs to stand out at rest, not only
// on hover. Injected here so it lives with the player and doesn't depend on
// styles.css being edited separately.
(function ensureActivePillStyle() {
  if (document.getElementById('onyxActivePillStyle')) return;
  const style = document.createElement('style');
  style.id = 'onyxActivePillStyle';
  style.textContent = `
    .ep-grid .ep-pill.active {
      background: var(--accent);
      color: #000;
      font-weight: 700;
      border-color: var(--accent);
      box-shadow: 0 0 0 2px var(--accent);
    }
    .ep-grid .ep-pill.active:hover { background: var(--accent); color: #000; }
    .ep-grid .ep-pill.watched:not(.active) { opacity: 0.55; }
    .season-pill.active { background: var(--accent); color: #000; }
  `;
  document.head.appendChild(style);
})();

// ---------- Bootstrap ----------
(async function init() {
  await coreInit();
  if (typeof loadAllProgressFromSupabase === 'function') await loadAllProgressFromSupabase();
  initGlobalSearch();
  const _fromAbyss = sessionStorage.getItem('fromAbyss') === '1';
  if (_fromAbyss) {
    // Red tab icon + red logo underline, matching the detail page's abyss look.
    document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(link => {
      link.href = 'favicon-256-abyss.png';
    });
    if (!document.getElementById('abyssLogoStyle')) {
      const st = document.createElement('style');
      st.id = 'abyssLogoStyle';
      st.textContent = '.abyss-theme .topnav-brand svg line{stroke:#e23636 !important;}';
      document.head.appendChild(st);
    }
    document.querySelectorAll('a[href="index.html"]').forEach(a => {
      a.href = 'home.html';
      if (a.getAttribute('aria-label') === 'Onyx home') {
        a.setAttribute('aria-label', 'Abyss home');
        a.textContent = 'ABYSS';
      }
    });
  }
  const { show: showSlug, ep: epParam, t: tParam } = getParams();
  if (!showSlug) { if (playerTitleEl) playerTitleEl.textContent = 'No show specified.'; return; }

  let allGroups = groupVideos(AppState.videos);
  currentGroup = allGroups.find(g => g.slug === showSlug);
  // If not found, try loading void shows
  if (!currentGroup) {
    try {
      const sb = getSupabase();
      let voidData = []; let vFrom = 0;
      while(true){
        const {data} = await sb.from('videos').select('*').eq('void',true).range(vFrom,vFrom+999);
        if(!data||!data.length) break;
        voidData = voidData.concat(data);
        if(data.length<1000) break;
        vFrom+=1000;
      }
      if(voidData.length){
        voidData.forEach(v=>{
          AppState.baseVideos.push({
            id:v.id,title:v.title||'Untitled',description:v.description||'',
            collection:v.collection||'Unsorted',episode:v.episode||'',
            category:v.category||'Other',fileType:v.file_type||'MP4',
            fileSize:'—',dateAdded:v.date_added||'',downloadUrl:v.download_url||'#',
            coverUrl:v.cover_url||'',temporary:false,season:1,type:'Episode',
            sources:null,createdAt:v.created_at||null,language:v.language||null,void:true
          });
        });
        syncVideos();
        allGroups = groupVideos(AppState.videos);
        currentGroup = allGroups.find(g => g.slug === showSlug);
      }
    } catch(e){ console.warn('Void load error:',e); }
  }
  if (!currentGroup || !currentGroup.videos.length) { if (playerTitleEl) playerTitleEl.textContent = 'Show not found.'; return; }

  document.title = `${currentGroup.title} — Onyx`;

  // Determine starting episode
  let startVideo = null;
  const epIdx    = parseInt(epParam, 10);
  if (!Number.isNaN(epIdx) && currentGroup.videos[epIdx]) {
    startVideo = currentGroup.videos[epIdx];
  } else {
    const progress = getLastWatched(currentGroup.title);
    if (progress) startVideo = currentGroup.videos.find(v => v.title === progress.lastEpisodeTitle);
    if (!startVideo) startVideo = currentGroup.videos[0];
  }

  // If a t param was passed (from resume button), use it as override
  const resumeTs = tParam ? parseInt(tParam, 10) : 0;

  playerVideoEl.addEventListener('seeked',  saveCurrentTimestamp);
  playerVideoEl.addEventListener('pause',   saveCurrentTimestamp);
  window.addEventListener('beforeunload',   saveCurrentTimestamp);
  window.addEventListener('pagehide',       saveCurrentTimestamp);
  window.addEventListener('beforeunload',   stopAnalytics);
  window.addEventListener('pagehide',       stopAnalytics);

  // Prefer stored meta from Supabase (works even when Jikan is down). The
  // meta column isn't carried onto video objects, so read it directly.
  let _pMeta = null;
  try {
    const _base = currentGroup.title.replace(/\s*\((subbed|dubbed)\)\s*$/i, '').trim();
    const { data } = await getSupabase()
      .from('videos').select('meta')
      .in('collection', [_base, `${_base} (Subbed)`])
      .not('meta', 'is', null).limit(1).maybeSingle();
    _pMeta = data?.meta || null;
  } catch { _pMeta = null; }

  if (_pMeta) {
    currentJikan = {
      synopsis: _pMeta.description || '',
      year: _pMeta.year, type: _pMeta.type,
      episodes: _pMeta.episodes, score: _pMeta.score, tags: [],
    };
  }

  renderShowInfo(currentGroup, currentJikan);
  renderSidebar(currentGroup, allGroups);
  wireAutoAdvance(currentGroup);
  wireFog();
  renderSeriesOnPlayer(allGroups);
  loadVideo(startVideo, resumeTs > 5 ? resumeTs : undefined);

  // Jikan only when meta is missing, or in the background for tags. Its failure
  // never blanks the already-rendered info.
  fetchJikanDetails(currentGroup.title).then(details => {
    if (!details) return;
    // If we already have stored meta text, keep it and only borrow Jikan's tags.
    currentJikan = _pMeta
      ? { synopsis: _pMeta.description || details.synopsis, year: _pMeta.year ?? details.year,
          type: _pMeta.type || details.type, episodes: _pMeta.episodes ?? details.episodes,
          score: _pMeta.score ?? details.score, tags: details.tags || [] }
      : details;
    renderShowInfo(currentGroup, currentJikan);
    renderRecommendations(allGroups);
    renderSeriesOnPlayer(allGroups);
  }).catch(() => {});
})();
