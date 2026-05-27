// ============================================================
// Aurum — detail.js
// ============================================================

// ---------- Theme ----------
(function() {
  document.body.classList.toggle('light', localStorage.getItem('aurum-theme') === 'light');
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.textContent = document.body.classList.contains('light') ? '☀' : '☾';
    btn.addEventListener('click', () => {
      const nowLight = !document.body.classList.contains('light');
      document.body.classList.toggle('light', nowLight);
      localStorage.setItem('aurum-theme', nowLight ? 'light' : 'dark');
      btn.textContent = nowLight ? '☀' : '☾';
    });
  }
})();

// ---------- DOM refs ----------
const detailMain             = document.getElementById('detailMain');
const recommendationsSection = document.getElementById('recommendationsSection');
const recsGrid               = document.getElementById('recsGrid');
const seriesSection          = document.getElementById('seriesSection');
const seriesGrid             = document.getElementById('seriesGrid');
const adminDialog            = document.getElementById('adminDialog');
const adminLoginForm         = document.getElementById('adminLoginForm');
const adminLoginButton       = document.getElementById('adminLoginButton');
const adminCancelButton      = document.getElementById('adminCancelButton');
const adminEmailInput        = document.getElementById('adminEmailInput');
const adminPasswordInput     = document.getElementById('adminPasswordInput');
const adminError             = document.getElementById('adminError');
const authDialog             = document.getElementById('authDialog');
const authDialogInner        = document.getElementById('authDialogInner');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = '© ' + new Date().getFullYear();

// ---------- State ----------
let currentGroup  = null;
let currentJikan  = null;
let episodeFilter = '';
let activeSeason  = null;
let focusMode     = false;

// ---------- URL ----------
function getShowSlug() {
  return new URLSearchParams(window.location.search).get('show');
}

// ---------- Render ----------
function renderDetail() {
  if (!currentGroup) {
    const _fv = sessionStorage.getItem('fromVoid') === '1';
    detailMain.innerHTML = `
      <div class="detail-empty">
        <h2>Show not found</h2>
        <p>This collection doesn't exist or may have been removed.</p>
        <a href="${_fv ? 'void.html' : 'index.html'}" class="btn btn-outline">${_fv ? 'Back to Void' : 'Back to Onyx'}</a>
      </div>`;
    return;
  }

  const g        = currentGroup;
  const cover    = g.firstCover
    ? `<img src="${escapeHtml(g.firstCover)}" alt="${escapeHtml(g.title)}">`
    : `<div class="cover-placeholder">${escapeHtml(g.title.charAt(0).toUpperCase())}</div>`;
  const tags     = getTagsForCollection(g.title, currentJikan?.tags || []).filter(t => !['Shounen','Seinen','Shoujo','Josei','Kids'].includes(t));
  const tagsHtml = tags.length
    ? tags.map(t => `<span class="tag">${escapeHtml(t)}${isAdminUnlocked() ? `<button class="tag-remove" type="button" data-tag="${escapeHtml(t)}">×</button>` : ''}</span>`).join('')
    : '<span class="tag-empty">No tags yet</span>';

  const adminAddTag = isAdminUnlocked() ? `
    <div class="tag-add">
      <input id="newTagInput" type="text" placeholder="Add tag…" maxlength="40">
      <button id="addTagButton" type="button" class="btn btn-outline btn-small">Add</button>
    </div>` : '';

  const adminShowControls = isAdminUnlocked() ? `
    <div class="admin-show-controls">
      <button id="deleteShowButton" type="button" class="btn btn-outline btn-small danger">Delete Entire Show</button>
    </div>` : '';

  const progress = getLastWatched(g.title);
  let continueBanner = '';
  if (progress) {
    const lastEp = g.videos.find(v => v.title === progress.lastEpisodeTitle);
    if (lastEp) continueBanner = `
      <div class="continue-banner">
        <div>
          <div class="continue-label">Continue watching</div>
          <div class="continue-title">${escapeHtml(lastEp.title)}</div>
        </div>
        <button class="btn btn-solid continue-btn" data-title="${escapeHtml(lastEp.title)}" type="button">▶ Resume</button>
      </div>`;
  }

  // Season grouping
  const seasons    = {};
  g.videos.forEach(v => { const s = v.season || 1; (seasons[s] = seasons[s] || []).push(v); });
  const seasonKeys = Object.keys(seasons).sort((a, b) => Number(a) - Number(b));
  const seasonTabsHtml = seasonKeys.length > 1 ? `
    <div class="season-tabs">
      <button class="season-tab ${activeSeason === null ? 'active' : ''}" data-season="all" type="button">All</button>
      ${seasonKeys.map(s => `<button class="season-tab ${String(activeSeason) === s ? 'active' : ''}" data-season="${s}" type="button">Season ${s}</button>`).join('')}
    </div>` : '';

  let displayedEps = g.videos;
  if (activeSeason !== null) displayedEps = displayedEps.filter(v => String(v.season || 1) === String(activeSeason));
  if (episodeFilter.trim()) {
    const q = episodeFilter.trim().toLowerCase();
    displayedEps = displayedEps.filter(v => v.title.toLowerCase().includes(q) || String(v.episode).toLowerCase().includes(q));
  }

  const meta = [];
  if (currentJikan?.year)     meta.push(String(currentJikan.year));
  if (currentJikan?.type)     meta.push(currentJikan.type);
  if (currentJikan?.episodes) meta.push(`${currentJikan.episodes} eps`);
  if (currentJikan?.score)    meta.push(`★ ${currentJikan.score}`);
  const lang = g.videos[0]?.language;
  if (lang === 'dubbed') meta.push('<span class="lang-badge-dubbed" aria-label="Dubbed">Dubbed</span>');
  else if (lang === 'subbed') meta.push('<span class="lang-badge-subbed" aria-label="Subbed">Subbed</span>');

  detailMain.innerHTML = `
    <div class="detail-hero">
      <div class="detail-cover-wrap">
        <div class="detail-cover">${cover}</div>
        <div id="detailSeriesGrid" class="detail-series-grid"></div>
      </div>
      <div class="detail-info">
        <div class="detail-cat">${escapeHtml((g.category || 'Other').toUpperCase())}</div>
        <h1 class="detail-title">${escapeHtml(g.title)}</h1>
        ${meta.length ? `<div class="detail-meta">${meta.map(m => `<span>${m.startsWith('<span') ? m : escapeHtml(m)}</span>`).join('<span class="dot">·</span>')}</div>` : ''}
        ${currentJikan?.synopsis ? `<p class="detail-synopsis">${escapeHtml(currentJikan.synopsis)}</p>` : ''}
        <div id="watchStatusContainer"></div>
        <div id="episodeProgressContainer"></div>
        <div id="communityRatingContainer"></div>
        <div class="tag-list">${tagsHtml}</div>
        ${adminAddTag}
        ${adminShowControls}
      </div>
    </div>

    ${continueBanner}

    <section class="episodes-section">
      <div class="episodes-head">
        <h2>Episodes <span class="episodes-count">${displayedEps.length}</span></h2>
        <div class="episodes-head-right">
          <input id="episodeSearch" type="search" placeholder="Filter episodes…" value="${escapeHtml(episodeFilter)}">
          <button id="focusModeButton" type="button" class="btn btn-outline btn-small${focusMode ? ' active' : ''}">Focus</button>
        </div>
      </div>
      ${seasonTabsHtml}
      <div class="episode-list${focusMode ? ' focus-mode' : ''}">
        ${displayedEps.length ? displayedEps.map(episodeRowHtml).join('') : '<div class="empty">No episodes match.</div>'}
      </div>
    </section>
  `;

  wireDetailEvents();
  renderWatchStatus(document.getElementById('watchStatusContainer'), g.title);
  renderEpisodeProgress(document.getElementById('episodeProgressContainer'), g);
  renderCommunityRating(document.getElementById('communityRatingContainer'), g.title);
}

function episodeRowHtml(video) {
  const ep  = video.episode || '—';
  const idx = AppState.videos.indexOf(video);
  const adminControls = isAdminUnlocked() ? `
    <button class="btn btn-outline btn-small edit-btn" type="button">Edit</button>
    <button class="btn btn-outline btn-small delete-btn" type="button">Delete</button>` : '';
  return `
    <div class="episode-row" data-idx="${idx}" data-id="${escapeHtml(String(video.id || ''))}">
      <div class="episode-num"><small>EP</small>${escapeHtml(ep)}</div>
      <div class="episode-info">
        <h4 class="episode-title">${escapeHtml(video.title)}</h4>
        <div class="episode-meta">${escapeHtml(video.fileType)} · ${escapeHtml(video.fileSize)} · ${escapeHtml(formatDate(video.dateAdded))}${isPublicDownload(video) ? '' : ' · LOCAL ONLY'}</div>
      </div>
      <div class="episode-actions">
        <button class="btn btn-outline btn-small play-btn" type="button">Play</button>
        ${adminControls}
      </div>
    </div>
  `;
}

// ---------- Wire detail events ----------
function wireDetailEvents() {
  // Episode search
  const searchInput = document.getElementById('episodeSearch');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      episodeFilter = e.target.value;
      renderDetail();
      const el = document.getElementById('episodeSearch');
      if (el) { el.focus(); el.setSelectionRange(episodeFilter.length, episodeFilter.length); }
    });
  }

  // Focus mode
  const focusBtn = document.getElementById('focusModeButton');
  if (focusBtn) {
    focusBtn.addEventListener('click', () => {
      focusMode = !focusMode;
      document.querySelector('.episode-list')?.classList.toggle('focus-mode', focusMode);
      focusBtn.classList.toggle('active', focusMode);
    });
  }

  // Season tabs
  document.querySelectorAll('.season-tab').forEach(btn => {
    btn.addEventListener('click', () => { activeSeason = btn.dataset.season === 'all' ? null : btn.dataset.season; renderDetail(); });
  });

  // Play
  document.querySelectorAll('.episode-row .play-btn').forEach(btn => {
    const row = btn.closest('.episode-row');
    const video = AppState.videos[Number(row?.dataset.idx)];
    if (video) btn.addEventListener('click', async () => {
      const user = await getCurrentUser();
      if (user) {
        const status = await getWatchStatus(currentGroup.title);
        if (!status) await setWatchStatus(currentGroup.title, 'watching');
      }
      openPlayer(video);
    });
  });

  // Edit (admin)
  document.querySelectorAll('.episode-row .edit-btn').forEach(btn => {
    const row = btn.closest('.episode-row');
    const video = AppState.videos[Number(row?.dataset.idx)];
    if (video) btn.addEventListener('click', () => simpleEditPrompt(video));
  });

  // Delete episode (admin)
  document.querySelectorAll('.episode-row .delete-btn').forEach(btn => {
    const row = btn.closest('.episode-row');
    const video = AppState.videos[Number(row?.dataset.idx)];
    if (video) btn.addEventListener('click', () => simpleDelete(video));
  });

  // Continue watching
  document.querySelector('.continue-btn')?.addEventListener('click', function() {
    const video = currentGroup.videos.find(v => v.title === this.dataset.title);
    if (video) {
      const progress = getLastWatched(currentGroup.title);
      openPlayer(video, progress?.timestamp || 0);
    }
  });

  // Tags (admin)
  document.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => { removeTag(currentGroup.title, btn.dataset.tag); renderDetail(); });
  });
  const addTagBtn = document.getElementById('addTagButton');
  const newTagInput = document.getElementById('newTagInput');
  if (addTagBtn && newTagInput) {
    const submitTag = () => {
      const t = newTagInput.value.trim();
      if (!t) return;
      addCustomTag(currentGroup.title, t);
      newTagInput.value = '';
      renderDetail();
    };
    addTagBtn.addEventListener('click', submitTag);
    newTagInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitTag(); } });
  }

  // Delete show (admin)
  document.getElementById('deleteShowButton')?.addEventListener('click', async () => {
    if (!confirm(`Delete ALL videos in "${currentGroup.title}"? Cannot be undone.`)) return;
    try {
      await supabaseDeleteCollection(currentGroup.title);
      window.location.href = 'index.html';
    } catch (err) { alert(`Delete failed: ${err.message}`); }
  });
}

// ---------- Community rating ----------
function starsHtml(rating, count) {
  if (!rating || !count) return '';
  const full  = Math.floor(rating);
  const half  = (rating % 1) >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty) + ` <span class="rating-count">${rating.toFixed(1)} (${count})</span>`;
}

async function renderCommunityRating(container, collectionName) {
  if (!container) return;
  container.innerHTML = `<div class="rating-loading">Loading ratings…</div>`;

  const [ratingData, user, userRating] = await Promise.all([
    getRatingForCollection(collectionName),
    getCurrentUser(),
    getCurrentUser().then(u => u ? getUserRating(collectionName) : null)
  ]);

  const avgHtml = ratingData.count
    ? `<div class="rating-average">${starsHtml(ratingData.average, ratingData.count)} ratings</div>`
    : `<div class="rating-average rating-none">No ratings yet</div>`;

  const inputHtml = user ? `
    <div class="rating-input-wrap">
      <div class="rating-label">Your Rating${userRating ? ` — <span class="rating-current-val">${userRating}</span> / 5` : ''}</div>
      <div class="rating-track" id="ratingTrack" data-current="${userRating || 0}">
        ${[1,2,3,4,5].map(i => `
          <span class="rating-star-segment">
            <span class="rating-half" data-value="${i - 0.5}">&#9733;</span>
            <span class="rating-half" data-value="${i}">&#9733;</span>
          </span>
        `).join('')}
      </div>
      ${userRating ? `<button class="rating-clear-btn" type="button">Clear rating</button>` : ''}
    </div>
  ` : `<div class="rating-signin"><button class="btn btn-outline btn-small" id="ratingSignInBtn" type="button">Sign in to rate</button></div>`;

  container.innerHTML = `
    <div class="community-rating">
      ${avgHtml}
      ${inputHtml}
    </div>
  `;

  const track = document.getElementById('ratingTrack');
  if (track) {
    const current = parseFloat(track.dataset.current) || 0;
    updateStarDisplay(track, current, current);

    track.querySelectorAll('.rating-half').forEach(half => {
      half.addEventListener('mouseenter', () => {
        updateStarDisplay(track, parseFloat(half.dataset.value), current);
      });
    });

    track.addEventListener('mouseleave', () => {
      updateStarDisplay(track, current, current);
    });

    track.querySelectorAll('.rating-half').forEach(half => {
      half.addEventListener('click', async () => {
        const val = parseFloat(half.dataset.value);
        try {
          await setUserRating(collectionName, val);
          renderCommunityRating(container, collectionName);
        } catch (err) { alert(`Could not save rating: ${err.message}`); }
      });
    });
  }

  container.querySelector('.rating-clear-btn')?.addEventListener('click', async () => {
    try {
      const sb   = getSupabase();
      const user = await getCurrentUser();
      await sb.from('ratings').delete().eq('user_id', user.id).eq('collection', collectionName);
      renderCommunityRating(container, collectionName);
    } catch (err) { alert(`Could not clear: ${err.message}`); }
  });

  document.getElementById('ratingSignInBtn')?.addEventListener('click', () => openUserAuthDialog('signin'));
}

function updateStarDisplay(track, hoverVal, currentVal) {
  track.querySelectorAll('.rating-half').forEach(half => {
    const v = parseFloat(half.dataset.value);
    // Full lit: value <= hover
    // Locked: value <= current
    half.classList.toggle('lit',    v <= hoverVal);
    half.classList.toggle('locked', v <= currentVal);
  });
}

// ---------- Global cover overrides ----------
let _coverOverrides = {};
let _seasonOrder    = {};

async function loadGlobalSettings() {
  [_coverOverrides, _seasonOrder] = await Promise.all([getCoverOverrides(), getSeasonOrder()]);
}

function applySeasonOrder(seriesGroups, baseTitle) {
  const order = _seasonOrder[baseTitle];
  if (!order || !order.length) return seriesGroups;
  const ordered   = order.map(s => seriesGroups.find(g => g.slug === s)).filter(Boolean);
  const remaining = seriesGroups.filter(g => !order.includes(g.slug));
  return [...ordered, ...remaining];
}

// ---------- Drag and drop ----------
function wireDragDrop(seriesGroups, baseTitle) {
  const cards = document.querySelectorAll('.series-card[data-slug]');
  if (cards.length < 2) return;

  let dragging = null;

  cards.forEach(card => {
    card.setAttribute('draggable', 'true');

    card.addEventListener('dragstart', e => {
      dragging = card;
      card.classList.add('drag-active');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.slug);
    });

    card.addEventListener('dragend', () => {
      dragging = null;
      cards.forEach(c => c.classList.remove('drag-active', 'drag-over'));
    });

    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (card !== dragging) card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));

    card.addEventListener('drop', async e => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (!dragging || dragging === card) return;

      const container = card.closest('.detail-series-grid, .series-grid');
      if (!container) return;

      const allCards  = [...container.querySelectorAll('.series-card[data-slug]')];
      const fromIdx   = allCards.indexOf(dragging);
      const toIdx     = allCards.indexOf(card);
      if (fromIdx < 0 || toIdx < 0) return;

      // Reorder in DOM
      if (fromIdx < toIdx) container.insertBefore(dragging, card.nextSibling);
      else container.insertBefore(dragging, card);

      // Save new order
      const newOrder = [...container.querySelectorAll('.series-card[data-slug]')].map(c => c.dataset.slug);
      await setSeasonOrder(baseTitle, newOrder);
    });

    // Cover swap: drag one cover image onto another card
    card.addEventListener('dragover', e => {
      if (e.dataTransfer.types.includes('text/uri-list') || e.dataTransfer.types.includes('text/plain')) {
        e.preventDefault();
        card.classList.add('drag-over');
      }
    });
  });

  // Also wire cover image drag-onto-card from external sources
  cards.forEach(card => {
    card.addEventListener('drop', async e => {
      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (!url || !url.startsWith('http')) return;
      // Only treat as cover swap if it looks like an image URL
      if (!/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)) return;
      e.preventDefault();
      e.stopPropagation();
      const targetSlug = card.dataset.slug;
      if (!targetSlug) return;
      await setCoverOverride(targetSlug, url);
      // Update in AppState
      AppState.baseVideos.filter(v => slug(v.collection) === targetSlug).forEach(v => v.coverUrl = url);
      syncVideos();
      renderDetail();
    });
  });
}

// ---------- Episode progress ----------
async function renderEpisodeProgress(container, group) {
  if (!container || !group) return;
  const user = await getCurrentUser();
  if (!user) { container.innerHTML = ''; return; }

  const status   = await getWatchStatus(group.title);
  const progress = getLastWatched(group.title);
  const total    = group.videos.length;

  if (!status && !progress) { container.innerHTML = ''; return; }

  let watched = 0;
  if (progress?.lastEpisodeTitle) {
    const idx = group.videos.findIndex(v => v.title === progress.lastEpisodeTitle);
    if (idx >= 0) watched = idx + 1;
  }

  if (status === 'completed') watched = total;
  if (!watched && !status) { container.innerHTML = ''; return; }

  const pct = total > 0 ? Math.round((watched / total) * 100) : 0;

  container.innerHTML = `
    <div class="ep-progress-wrap">
      <div class="ep-progress-label">
        <span class="ep-progress-count">${watched} / ${total} Episodes</span>
        <span class="ep-progress-pct">${pct}%</span>
      </div>
      <div class="ep-progress-bar">
        <div class="ep-progress-fill" style="width:${pct}%"></div>
      </div>
    </div>
  `;
}
function openPlayer(video, resumeTimestamp) {
  const url = video.downloadUrl;
  if (!url || url === '#' || url.includes('example.com')) { alert(`"${video.title}" has no video URL.`); return; }
  if (url.startsWith('blob:') && video.temporary) { alert(`"${video.title}" is a local-only preview.`); return; }
  const epIdx = currentGroup.videos.indexOf(video);
  const ts    = resumeTimestamp || 0;
  markEpisodeWatched(currentGroup.title, video.title, ts);
  const tsParam = ts > 5 ? `&t=${Math.floor(ts)}` : '';
  window.location.href = `player.html?show=${encodeURIComponent(currentGroup.slug)}&ep=${epIdx}${tsParam}`;
}

// ---------- Edit / Delete (admin) ----------
async function simpleEditPrompt(video) {
  const newTitle  = prompt('Title:', video.title); if (newTitle === null) return;
  const newCover  = prompt('Cover URL (blank = keep):', video.coverUrl || ''); if (newCover === null) return;
  const newHosted = prompt('Hosted URL (blank = keep):', !video.downloadUrl?.startsWith('blob:') ? video.downloadUrl : ''); if (newHosted === null) return;
  const updated   = normalizeVideo({ ...video, title: newTitle || video.title, coverUrl: newCover || video.coverUrl, downloadUrl: newHosted || video.downloadUrl, temporary: newHosted ? false : video.temporary });
  if (video.id && isAdminUnlocked()) {
    try {
      const saved = await supabaseUpdate(video.id, updated);
      const idx = AppState.baseVideos.findIndex(v => v.id === video.id);
      if (idx >= 0) AppState.baseVideos[idx] = saved;
    } catch (err) { alert(`Update failed: ${err.message}`); return; }
  } else {
    const arr = AppState.localVideos;
    const i   = arr.indexOf(video);
    if (i >= 0) { arr[i] = updated; saveLocalVideos(); }
  }
  syncVideos();
  const groups = groupVideos(AppState.videos);
  currentGroup  = groups.find(g => g.slug === currentGroup.slug) || currentGroup;
  renderDetail();
}

async function simpleDelete(video) {
  if (!confirm(`Delete "${video.title}"?`)) return;
  if (video.id && isAdminUnlocked()) {
    try { await supabaseDelete(video.id); AppState.baseVideos = AppState.baseVideos.filter(v => v.id !== video.id); }
    catch (err) { alert(`Delete failed: ${err.message}`); return; }
  } else {
    const i = AppState.localVideos.indexOf(video);
    if (i >= 0) { AppState.localVideos.splice(i, 1); saveLocalVideos(); }
  }
  syncVideos();
  const groups = groupVideos(AppState.videos);
  currentGroup  = groups.find(g => g.slug === currentGroup.slug);
  if (!currentGroup) { window.location.href = 'index.html'; return; }
  renderDetail();
}

// ---------- Recommendations ----------
function posterCardHtml(g) {
  return `
    <article class="poster-card">
      <a class="poster-clickable" href="detail.html?show=${encodeURIComponent(g.slug)}">
        <div class="poster-cover">
          ${g.firstCover ? `<img src="${escapeHtml(g.firstCover)}" alt="" loading="lazy">` : `<div class="cover-placeholder">${escapeHtml(g.title.charAt(0).toUpperCase())}</div>`}
          <div class="poster-overlay"><span class="poster-play-icon">▶</span></div>
          <span class="poster-ep-badge">${g.videos.length} ${g.videos.length === 1 ? 'episode' : 'episodes'}</span>
        </div>
        <div class="poster-info">
          <div class="poster-cat">${escapeHtml((g.category || 'Other').toUpperCase())}</div>
          <h3 class="poster-title">${escapeHtml(g.title)}</h3>
        </div>
      </a>
    </article>
  `;
}

function getBaseTitle(title) {
  return title
    .replace(/\s+(season|part|cour|arc)\s+\w+.*$/i, '')
    .replace(/\s+S\d+.*$/i, '')
    .replace(/\s+\d+(st|nd|rd|th)\s+(season|part|cour).*$/i, '')
    .replace(/:\s*.+$/, '')
    .trim()
    .toLowerCase();
}

function extractSeriesNum(title) {
  // Try to pull a season/part number for sorting
  const m = title.match(/(?:season|part|cour|s)\s*(\d+)/i) ||
            title.match(/(\d+)(?:st|nd|rd|th)?\s*(?:season|part|cour)/i) ||
            title.match(/\bS(\d+)\b/i);
  if (m) return parseInt(m[1], 10);
  // Movies/OVAs after the main series — put them at the end
  if (/movie|film|ova|special/i.test(title)) return 999;
  return 1; // Base season
}

function extractSeriesLabel(title) {
  // Return the part that differentiates this entry within the series
  // e.g. "Attack on Titan Season 2" → "Season 2"
  //      "Attack on Titan: The Final Season" → "The Final Season"
  //      "Attack on Titan Movie" → "Movie"
  const seasonMatch = title.match(/(?:season|part|cour)\s*\w+/i);
  if (seasonMatch) return seasonMatch[0].replace(/^\w/, c => c.toUpperCase());
  const colonMatch = title.match(/:\s*(.+)$/);
  if (colonMatch) return colonMatch[1].trim();
  const typeMatch = title.match(/\b(Movie|OVA|Special|Film|Final Season|Final Part)\b.*/i);
  if (typeMatch) return typeMatch[0];
  return 'Season 1';
}

function renderRecommendations(allGroups) {
  if (!currentGroup) return;

  const baseTitle  = getBaseTitle(currentGroup.title);
  const currentSlug = currentGroup.slug;

  // Split into same-series vs general
  const seriesGroups = allGroups.filter(g =>
    g.slug !== currentSlug &&
    getBaseTitle(g.title) === baseTitle
  );

  const otherGroups = allGroups.filter(g =>
    g.slug !== currentSlug &&
    getBaseTitle(g.title) !== baseTitle
  );

  const seriesCardsHtml = (groups) => groups.map(g => {
    const isCurrent = g.slug === currentSlug;
    const label     = extractSeriesLabel(g.title);
    const epCount   = g.videos.length;
    const progress  = getLastWatched(g.title);

    let progressHtml = '';
    if (progress?.lastEpisodeTitle) {
      const lastVid = g.videos.find(v => v.title === progress.lastEpisodeTitle);
      if (lastVid) {
        const epNum = lastVid.episode || g.videos.indexOf(lastVid) + 1;
        progressHtml = `<div class="series-card-progress">EP ${epNum}</div>`;
      }
    }

    return `
      <a class="series-card ${isCurrent ? 'series-card-active' : ''}" href="detail.html?show=${encodeURIComponent(g.slug)}">
        <div class="series-card-bg" style="background-image:url('${escapeHtml(g.firstCover || '')}')"></div>
        <div class="series-card-info">
          <div class="series-card-label">${escapeHtml(label)}</div>
          <div class="series-card-eps">${epCount} ${epCount === 1 ? 'ep' : 'eps'}</div>
          ${progressHtml}
        </div>
        ${isCurrent ? '<div class="series-card-now">Watching</div>' : ''}
      </a>
    `;
  }).join('');

  const allSeriesGroups = applySeasonOrder(
    allGroups
      .filter(g => getBaseTitle(g.title) === baseTitle)
      .sort((a, b) => {
        const na = extractSeriesNum(a.title);
        const nb = extractSeriesNum(b.title);
        if (na !== nb) return na - nb;
        const da = Math.max(...a.videos.map(v => new Date(v.dateAdded || 0).getTime()));
        const db = Math.max(...b.videos.map(v => new Date(v.dateAdded || 0).getTime()));
        return da - db;
      }),
    baseTitle
  );

  // Apply global cover overrides
  allSeriesGroups.forEach(g => {
    if (_coverOverrides[g.slug]) g.firstCover = _coverOverrides[g.slug];
  });

  // Render inside detail hero under cover
  const detailSeriesGrid = document.getElementById('detailSeriesGrid');
  if (detailSeriesGrid) {
    detailSeriesGrid.innerHTML = allSeriesGroups.length > 1
      ? seriesCardsHtml(allSeriesGroups) : '';
    detailSeriesGrid.querySelectorAll('.series-card').forEach((card, i) => {
      if (allSeriesGroups[i]) card.dataset.slug = allSeriesGroups[i].slug;
    });
    if (allSeriesGroups.length > 1) wireDragDrop(allSeriesGroups, baseTitle);
  }

  // Hide the standalone section since we show inline now
  if (seriesSection) seriesSection.hidden = true;

  // You might also like — tag-based, exclude series entries
  if (recsGrid && recommendationsSection) {
    const tags = getTagsForCollection(currentGroup.title, currentJikan?.tags || []);
    const recs  = getRecommendationsForCollection(currentGroup.title, currentGroup.category, otherGroups, tags);
    if (recs.length) {
      recommendationsSection.hidden = false;
      recsGrid.innerHTML = recs.map(posterCardHtml).join('');
    } else {
      recommendationsSection.hidden = true;
    }
  }
}

// ---------- Watch status ----------
const STATUS_LABELS = {
  watching: 'Watching', completed: 'Completed', plan_to_watch: 'Plan to Watch',
  on_hold: 'On Hold', dropped: 'Dropped'
};

async function renderWatchStatus(container, collectionName) {
  if (!container) return;
  const user     = await getCurrentUser();
  const status   = user ? await getWatchStatus(collectionName) : null;
  const progress = getLastWatched(collectionName);
  const epLabel  = progress?.lastEpisodeTitle && currentGroup
    ? (() => {
        const v = currentGroup.videos.find(v => v.title === progress.lastEpisodeTitle);
        return v ? `EP ${v.episode || (currentGroup.videos.indexOf(v) + 1)}` : '';
      })()
    : '';

  container.innerHTML = `
    <div class="watch-status-wrap">
      <select class="watch-status-select" id="watchStatusSelect" ${!user ? 'disabled title="Sign in to track"' : ''}>
        <option value="">— Add to list —</option>
        ${Object.entries(STATUS_LABELS).map(([val, label]) => `<option value="${val}" ${status === val ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
      ${status === 'watching' && epLabel ? `<span class="watch-status-ep">${escapeHtml(epLabel)}</span>` : ''}
    </div>
  `;
  if (user) {
    document.getElementById('watchStatusSelect')?.addEventListener('change', async e => {
      if (e.target.value) await setWatchStatus(collectionName, e.target.value);
      else await setWatchStatus(collectionName, null);
    });
  }
}

// ---------- Admin auth ----------
function refreshAdminUi() {
  if (adminLoginButton) adminLoginButton.textContent = isAdminUnlocked() ? 'Sign Out' : 'Admin';
  renderDetail();
}

function openAdminDialog() {
  if (!adminDialog) return;
  if (adminError)         adminError.hidden        = true;
  if (adminEmailInput)    adminEmailInput.value     = '';
  if (adminPasswordInput) adminPasswordInput.value  = '';
  if (typeof adminDialog.showModal === 'function') adminDialog.showModal();
  else adminDialog.setAttribute('open', '');
  adminEmailInput?.focus();
}

function closeAdminDialog() {
  if (typeof adminDialog?.close === 'function') adminDialog.close();
  else adminDialog?.removeAttribute('open');
}

async function handleAdminSubmit(e) {
  e.preventDefault();
  const email = adminEmailInput?.value?.trim() || '';
  const pass  = adminPasswordInput?.value?.trim() || '';
  if (!email || !pass) return;
  const submitBtn = adminLoginForm?.querySelector('[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  if (adminError) adminError.hidden = true;
  try {
    await supabaseSignIn(email, pass);
    closeAdminDialog();
    refreshAdminUi();
  } catch (err) {
    if (adminError) { adminError.textContent = err.message || 'Sign-in failed.'; adminError.hidden = false; }
    if (adminPasswordInput) { adminPasswordInput.value = ''; adminPasswordInput.focus(); }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// ---------- User auth dialog ----------
function openUserAuthDialog(mode) {
  if (!authDialog || !authDialogInner) return;
  const closeX = `<button type="button" class="dialog-close" id="authClose">×</button>`;
  if (mode === 'signin') {
    authDialogInner.innerHTML = `
      ${closeX}<h3>Sign In</h3>
      <input id="authEmail" type="email" placeholder="Email" autocomplete="username">
      <input id="authPassword" type="password" placeholder="Password" autocomplete="current-password">
      <p id="authError" class="admin-error" hidden></p>
      <div class="admin-actions">
        <button type="button" class="btn btn-outline btn-small" id="authSwitch">Create account</button>
        <button type="button" class="btn btn-solid btn-small" id="authSubmit">Sign In</button>
      </div>`;
    document.getElementById('authClose').addEventListener('click', closeUserAuthDialog);
    document.getElementById('authSwitch').addEventListener('click', () => openUserAuthDialog('signup'));
    document.getElementById('authSubmit').addEventListener('click', async () => {
      const errEl = document.getElementById('authError');
      try {
        await supabaseSignIn(document.getElementById('authEmail').value.trim(), document.getElementById('authPassword').value.trim());
        closeUserAuthDialog(); wireNavAuth(); renderDetail();
      } catch (err) { errEl.textContent = err.message; errEl.hidden = false; }
    });
  } else {
    authDialogInner.innerHTML = `
      ${closeX}<h3>Create Account</h3>
      <input id="authEmail" type="email" placeholder="Email" autocomplete="username">
      <input id="authUsername" type="text" placeholder="Username" maxlength="24">
      <input id="authPassword" type="password" placeholder="Password" autocomplete="new-password">
      <div id="authUsernameAvail" class="username-availability"></div>
      <p id="authError" class="admin-error" hidden></p>
      <div class="admin-actions">
        <button type="button" class="btn btn-outline btn-small" id="authSwitch">Sign in instead</button>
        <button type="button" class="btn btn-solid btn-small" id="authSubmit">Create Account</button>
      </div>`;
    document.getElementById('authClose').addEventListener('click', closeUserAuthDialog);
    document.getElementById('authSwitch').addEventListener('click', () => openUserAuthDialog('signin'));
    let timer = null;
    document.getElementById('authUsername').addEventListener('input', e => {
      clearTimeout(timer);
      const el = document.getElementById('authUsernameAvail');
      el.textContent = ''; el.className = 'username-availability';
      if (e.target.value.trim().length < 3) return;
      timer = setTimeout(async () => {
        const ok = await checkUsernameAvailable(e.target.value.trim());
        el.textContent = ok ? '✓ Available' : '✗ Already taken';
        el.className   = `username-availability ${ok ? 'available' : 'taken'}`;
      }, 500);
    });
    document.getElementById('authSubmit').addEventListener('click', async () => {
      const errEl    = document.getElementById('authError');
      const username = document.getElementById('authUsername').value.trim();
      if (username.length < 3) { errEl.textContent = 'Username must be at least 3 characters.'; errEl.hidden = false; return; }
      try {
        await supabaseSignUp(document.getElementById('authEmail').value.trim(), document.getElementById('authPassword').value.trim(), username);
        closeUserAuthDialog(); wireNavAuth(); renderDetail();
      } catch (err) { errEl.textContent = err.message; errEl.hidden = false; }
    });
  }
  if (typeof authDialog.showModal === 'function') authDialog.showModal();
  else authDialog.setAttribute('open', '');
}

function closeUserAuthDialog() {
  if (typeof authDialog?.close === 'function') authDialog.close();
  else authDialog?.removeAttribute('open');
}

// ---------- Nav auth wiring ----------
function wireNavAuth() {
  const signInBtn   = document.getElementById('signInNavBtn');
  const accountLink = document.getElementById('accountLink');
  getCurrentUser().then(user => {
    if (user) {
      if (signInBtn)   signInBtn.style.display = 'none';
      if (accountLink) accountLink.hidden = false;
    } else {
      if (signInBtn)   { signInBtn.style.display = ''; signInBtn.onclick = () => openUserAuthDialog('signin'); }
      if (accountLink) accountLink.hidden = true;
    }
  });
}

function wireAdmin() {
  if (adminLoginButton) adminLoginButton.addEventListener('click', () => {
    if (isAdminUnlocked()) supabaseSignOut().then(refreshAdminUi);
    else openAdminDialog();
  });
  if (adminCancelButton) adminCancelButton.addEventListener('click', closeAdminDialog);
  if (adminLoginForm)    adminLoginForm.addEventListener('submit', handleAdminSubmit);
}

// ---------- Auto-save metadata from Jikan ----------
async function autoSaveMetadata(details) {
  if (!details || !isAdminUnlocked()) return;
  const missing = currentGroup.videos.filter(v => v.id && (!v.coverUrl || !v.description));
  if (!missing.length) return;
  for (const video of missing) {
    const updates = { ...video };
    if (!video.coverUrl    && details.image)    updates.coverUrl    = details.image;
    if (!video.description && details.synopsis) updates.description = details.synopsis;
    if (updates.coverUrl === video.coverUrl && updates.description === video.description) continue;
    try {
      const saved = await supabaseUpdate(video.id, updates);
      const idx   = AppState.baseVideos.findIndex(v => v.id === video.id);
      if (idx >= 0) AppState.baseVideos[idx] = saved;
      video.coverUrl    = saved.coverUrl;
      video.description = saved.description;
    } catch (err) { console.warn('Auto metadata save failed:', video.title, err); }
  }
  syncVideos();
  const groups = groupVideos(AppState.videos);
  currentGroup  = groups.find(g => g.slug === currentGroup.slug) || currentGroup;
  renderDetail();
}

// ---------- Bootstrap ----------
(async function init() {
  await coreInit();
  await loadGlobalSettings();
  initGlobalSearch();
  // Void navigation — if user came from void, all back links go back to void
  const fromVoid = sessionStorage.getItem('fromVoid') === '1';
  if (fromVoid) {
    document.querySelectorAll('a[href="index.html"]').forEach(a => {
      a.href = 'void.html';
      if (a.id === 'backLink') a.textContent = '← Back to Void';
      if (a.getAttribute('aria-label') === 'Onyx home') a.setAttribute('aria-label', 'Back to Void');
    });
  }
  const showSlug = getShowSlug();
  if (!showSlug) {
    const backHref = fromVoid ? "void.html" : "index.html";
    const backLabel = fromVoid ? "Back to Void" : "Back to Onyx";
    detailMain.innerHTML = `<div class="detail-empty"><h2>No show specified</h2><a href="${backHref}" class="btn btn-outline">${backLabel}</a></div>`;
    wireAdmin(); wireNavAuth(); return;
  }
  let allGroups = groupVideos(AppState.videos);
  currentGroup = allGroups.find(g => g.slug === showSlug);
  // If not found in main library, fetch void shows
  if (!currentGroup) {
    try {
      const sb = getSupabase();
      let voidData = [];
      let vFrom = 0;
      while (true) {
        const { data, error } = await sb.from('videos').select('*').eq('void', true).range(vFrom, vFrom + 999);
        if (error) { console.warn('Void fetch error:', error); break; }
        if (!data || !data.length) break;
        voidData = voidData.concat(data);
        if (data.length < 1000) break;
        vFrom += 1000;
      }
      if (voidData.length) {
        voidData.forEach(v => {
          AppState.baseVideos.push({
            id: v.id, title: v.title || 'Untitled', description: v.description || '',
            collection: v.collection || 'Unsorted', episode: v.episode || '',
            category: v.category || 'Other', fileType: v.file_type || 'MP4',
            fileSize: '—', dateAdded: v.date_added || '', downloadUrl: v.download_url || '#',
            coverUrl: v.cover_url || '', temporary: false, season: 1, type: 'Episode',
            sources: null, createdAt: v.created_at || null, language: v.language || null, void: true
          });
        });
        syncVideos();
        allGroups = groupVideos(AppState.videos);
        currentGroup = allGroups.find(g => g.slug === showSlug);
      }
    } catch(e) { console.warn('Could not load void shows:', e); }
  }
  document.title = currentGroup ? `${currentGroup.title} — Onyx` : 'Onyx';
  renderDetail();
  renderRecommendations(allGroups);
  wireAdmin();
  wireNavAuth();

  // Fetch current show's Jikan data first
  fetchJikanDetails(currentGroup?.title || '').then(async details => {
    if (!details) return;
    currentJikan = details;
    renderDetail();
    renderRecommendations(groupVideos(AppState.videos));
    await autoSaveMetadata(details);

    // Fetch tags for all other shows in background — with spacing to avoid 429s
    const otherGroups = allGroups.filter(g => g.slug !== currentGroup.slug);
    const seenBase    = new Set();
    for (const g of otherGroups) {
      const base = getBaseTitle(g.title);
      if (seenBase.has(base)) continue;
      seenBase.add(base);
      try {
        await fetchJikanDetails(g.title);
        await new Promise(r => setTimeout(r, 600)); // extra spacing on top of jikanRequest's own delay
      } catch { /* silent */ }
    }
    renderRecommendations(groupVideos(AppState.videos));
  });
})();
