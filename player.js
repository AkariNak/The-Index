// ============================================================
// Aurum — player.js
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
function loadVideo(video, overrideTs) {
  if (!video) return;
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

  currentVideo = video;

  playerVideoEl.src = url;
  playerVideoEl.load();

  playerVideoEl.addEventListener('loadedmetadata', () => {
    if (startTs > 0 && startTs < playerVideoEl.duration - 5) {
      playerVideoEl.currentTime = startTs;
    }
    playerVideoEl.play().catch(() => {});
    startTimestampSaving();
  }, { once: true });

  // Mark watched + auto-set status + check achievements
  if (currentGroup) {
    markEpisodeWatched(currentGroup.title, video.title, startTs);
    getCurrentUser().then(async user => {
      if (!user) return;
      const status = await getWatchStatus(currentGroup.title);
      if (!status) setWatchStatus(currentGroup.title, 'watching');

      // Count total watched episodes from progress
      const progress = AppState.progress || {};
      const totalWatched = Object.keys(progress).length;

      // Check achievements
      checkAchievements({ episodeWatched: true, totalWatched });
    });
  }

  // Update UI
  if (playerTitleEl) playerTitleEl.textContent = video.title;
  if (playerDescEl)  { playerDescEl.textContent = video.description || ''; playerDescEl.hidden = !video.description; }
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
    const seriesGroups = allGroups
      .filter(g => getSeriesBase(g.title) === baseTitle)
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
        const isCurrent = g.slug === group.slug;
        const label     = getLabel(g.title);
        const href      = isCurrent
          ? '#'
          : `player.html?show=${encodeURIComponent(g.slug)}&ep=0`;
        return `<a class="season-pill ${isCurrent ? 'active' : ''}" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
      }).join('')}</div>`;
    }
  }

  if (useGrid) {
    episodeSidebar.innerHTML = seasonPillsHtml + `<div class="ep-grid">${group.videos.map((video, i) => {
      const ep       = cleanEpNum(video.episode, i);
      const isActive = currentVideo && video.title === currentVideo.title;
      const watched  = progress && progress.lastEpisodeTitle === video.title;
      return `<button class="ep-pill${isActive ? ' active' : ''}${watched && !isActive ? ' watched' : ''}" data-title="${escapeHtml(video.title)}" type="button" title="${escapeHtml(video.title)}">${escapeHtml(ep)}</button>`;
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
      const video = group.videos.find(v => v.title === btn.dataset.title);
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
  if (showTitleEl) showTitleEl.textContent = group.title;
  if (showMetaEl) {
    const parts = [];
    if (jikan?.year)     parts.push(String(jikan.year));
    if (jikan?.type)     parts.push(jikan.type);
    if (jikan?.episodes) parts.push(`${jikan.episodes} eps`);
    if (jikan?.score)    parts.push(`★ ${jikan.score}`);
    showMetaEl.textContent = parts.join(' · ');
    showMetaEl.hidden = !parts.length;
  }
  if (showSynopsisEl) { showSynopsisEl.textContent = jikan?.synopsis || ''; showSynopsisEl.hidden = !jikan?.synopsis; }
  if (tagListEl) {
    const tags = getTagsForCollection(group.title, jikan?.tags || []);
    tagListEl.innerHTML = tags.length ? tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') : '';
    tagListEl.hidden = !tags.length;
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
async function renderComments(container, collectionName, episodeTitle) {
  container.innerHTML = `<div class="comments-loading">Loading comments…</div>`;
  const [comments, user, profile] = await Promise.all([
    getComments(collectionName, episodeTitle),
    getCurrentUser(),
    getCurrentUser().then(u => u ? getCurrentProfile() : null)
  ]);

  const avatar = (url, name) => url
    ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(name)}">`
    : `<div class="comment-avatar-placeholder">${escapeHtml(name.charAt(0).toUpperCase())}</div>`;

  const commentsHtml = comments.length
    ? comments.map(c => `
        <div class="comment">
          <div class="comment-avatar">${avatar(c.avatar_url, c.username)}</div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-username">${escapeHtml(c.username)}</span>
              <span class="comment-date">${formatDate(c.created_at)}</span>
              ${user && c.user_id === user.id ? `<button class="comment-delete btn btn-small" data-id="${escapeHtml(c.id)}" type="button">Delete</button>` : ''}
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

// ---------- Bootstrap ----------
(async function init() {
  await coreInit();
  initGlobalSearch();
  const { show: showSlug, ep: epParam, t: tParam } = getParams();
  if (!showSlug) { if (playerTitleEl) playerTitleEl.textContent = 'No show specified.'; return; }

  const allGroups = groupVideos(AppState.videos);
  currentGroup    = allGroups.find(g => g.slug === showSlug);
  if (!currentGroup || !currentGroup.videos.length) { if (playerTitleEl) playerTitleEl.textContent = 'Show not found.'; return; }

  document.title = `${currentGroup.title} — Aurum`;

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

  renderShowInfo(currentGroup, null);
  renderSidebar(currentGroup, allGroups);
  wireAutoAdvance(currentGroup);
  wireFog();
  renderSeriesOnPlayer(allGroups);
  loadVideo(startVideo, resumeTs > 5 ? resumeTs : undefined);

  fetchJikanDetails(currentGroup.title).then(details => {
    if (!details) return;
    currentJikan = details;
    renderShowInfo(currentGroup, currentJikan);
    renderRecommendations(allGroups);
    renderSeriesOnPlayer(allGroups);
  });
})();
