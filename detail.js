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
    detailMain.innerHTML = `
      <div class="detail-empty">
        <h2>Show not found</h2>
        <p>This collection doesn't exist or may have been removed.</p>
        <a href="index.html" class="btn btn-outline">Back to Aurum</a>
      </div>`;
    return;
  }

  const g        = currentGroup;
  const cover    = g.firstCover
    ? `<img src="${escapeHtml(g.firstCover)}" alt="${escapeHtml(g.title)}">`
    : `<div class="cover-placeholder">${escapeHtml(g.title.charAt(0).toUpperCase())}</div>`;
  const tags     = getTagsForCollection(g.title, currentJikan?.tags || []);
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

  detailMain.innerHTML = `
    <div class="detail-hero">
      <div class="detail-cover-wrap">
        <div class="detail-cover">${cover}</div>
        <div id="detailSeriesGrid" class="detail-series-grid"></div>
      </div>
      <div class="detail-info">
        <div class="detail-cat">${escapeHtml((g.category || 'Other').toUpperCase())}</div>
        <h1 class="detail-title">${escapeHtml(g.title)}</h1>
        ${meta.length ? `<div class="detail-meta">${meta.map(m => `<span>${escapeHtml(m)}</span>`).join('<span class="dot">·</span>')}</div>` : ''}
        ${currentJikan?.synopsis ? `<p class="detail-synopsis">${escapeHtml(currentJikan.synopsis)}</p>` : ''}
        <div id="watchStatusContainer"></div>
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
    if (video) btn.addEventListener('click', () => openPlayer(video));
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
    if (video) openPlayer(video);
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

// ---------- Player navigation ----------
function openPlayer(video) {
  const url = video.downloadUrl;
  if (!url || url === '#' || url.includes('example.com')) { alert(`"${video.title}" has no video URL.`); return; }
  if (url.startsWith('blob:') && video.temporary) { alert(`"${video.title}" is a local-only preview.`); return; }
  markEpisodeWatched(currentGroup.title, video.title, 0);
  const epIdx = currentGroup.videos.indexOf(video);
  window.location.href = `player.html?show=${encodeURIComponent(currentGroup.slug)}&ep=${epIdx}`;
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
  // Strip common season/part suffixes to find the base series name
  // e.g. "Attack on Titan Season 2" → "Attack on Titan"
  return title
    .replace(/\s+(season|part|cour|arc)\s+\w+.*$/i, '')
    .replace(/\s+S\d+.*$/i, '')
    .replace(/\s+\d+(st|nd|rd|th)\s+(season|part|cour).*$/i, '')
    .replace(/:\s+.+$/, '') // "Show: Subtitle" → "Show"
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

  const allSeriesGroups = allGroups
    .filter(g => getBaseTitle(g.title) === baseTitle)
    .sort((a, b) => extractSeriesNum(a.title) - extractSeriesNum(b.title));

  // Render inside detail hero under cover
  const detailSeriesGrid = document.getElementById('detailSeriesGrid');
  if (detailSeriesGrid) {
    detailSeriesGrid.innerHTML = allSeriesGroups.length > 1
      ? seriesCardsHtml(allSeriesGroups) : '';
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
  const user   = await getCurrentUser();
  const status = user ? await getWatchStatus(collectionName) : null;
  container.innerHTML = `
    <div class="watch-status-wrap">
      <select class="watch-status-select" id="watchStatusSelect" ${!user ? 'disabled title="Sign in to track"' : ''}>
        <option value="">— Add to list —</option>
        ${Object.entries(STATUS_LABELS).map(([val, label]) => `<option value="${val}" ${status === val ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
    </div>
  `;
  if (user) {
    document.getElementById('watchStatusSelect')?.addEventListener('change', async e => {
      if (e.target.value) await setWatchStatus(collectionName, e.target.value);
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
  const showSlug = getShowSlug();
  if (!showSlug) {
    detailMain.innerHTML = `<div class="detail-empty"><h2>No show specified</h2><a href="index.html" class="btn btn-outline">Back to Aurum</a></div>`;
    wireAdmin(); wireNavAuth(); return;
  }
  const allGroups = groupVideos(AppState.videos);
  currentGroup    = allGroups.find(g => g.slug === showSlug);
  document.title  = currentGroup ? `${currentGroup.title} — Aurum` : 'Aurum';
  renderDetail();
  renderRecommendations(allGroups);
  wireAdmin();
  wireNavAuth();

  fetchJikanDetails(currentGroup?.title || '').then(async details => {
    if (!details) return;
    currentJikan = details;
    renderDetail();
    renderRecommendations(groupVideos(AppState.videos));
    await autoSaveMetadata(details);
  });
})();
