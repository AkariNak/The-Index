// ============================================================
// detail.html — single show page
// Depends on core.js (and the Supabase CDN loaded before it)
// ============================================================

const detailMain             = document.getElementById('detailMain');
const recommendationsSection = document.getElementById('recommendationsSection');
const recsGrid               = document.getElementById('recsGrid');

// Admin
const adminDialog        = document.getElementById('adminDialog');
const adminLoginForm     = document.getElementById('adminLoginForm');
const adminLoginButton   = document.getElementById('adminLoginButton');
const adminCancelButton  = document.getElementById('adminCancelButton');
const adminEmailInput    = document.getElementById('adminEmailInput');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminError         = document.getElementById('adminError');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = '© ' + new Date().getFullYear();

// ---------- Local state ----------
let currentGroup  = null;
let currentJikan  = null;
let episodeFilter = '';
let activeSeason  = null;   // null = all seasons
let focusMode     = false;

// ---------- URL ----------
function getShowSlugFromUrl() {
  return new URLSearchParams(window.location.search).get('show');
}

// ---------- Render ----------
function renderDetail() {
  if (!currentGroup) {
    detailMain.innerHTML = `
      <div class="detail-empty">
        <h2>Show not found</h2>
        <p>This collection doesn't exist or has been removed.</p>
        <a href="index.html" class="btn btn-outline">Back to The Index</a>
      </div>`;
    return;
  }

  const g     = currentGroup;
  const cover = g.firstCover
    ? `<img src="${escapeHtml(g.firstCover)}" alt="${escapeHtml(g.title)} cover">`
    : `<div class="cover-placeholder">${escapeHtml(g.title.charAt(0).toUpperCase())}</div>`;

  // Tags
  const tags    = getTagsForCollection(g.title, currentJikan?.tags || []);
  const tagsHtml = tags.length
    ? tags.map(t => `
        <span class="tag">
          ${escapeHtml(t)}
          ${isAdminUnlocked() ? `<button class="tag-remove" type="button" data-tag="${escapeHtml(t)}" title="Remove tag">×</button>` : ''}
        </span>`).join('')
    : '<span class="tag-empty">No tags yet</span>';

  const adminAddTag = isAdminUnlocked()
    ? `<div class="tag-add">
         <input id="newTagInput" type="text" placeholder="Add tag…" maxlength="40">
         <button id="addTagButton" type="button" class="btn btn-outline btn-small">Add</button>
       </div>`
    : '';

  // Admin show-level controls
  const adminShowControls = isAdminUnlocked()
    ? `<div class="admin-show-controls">
         <button id="deleteShowButton" type="button" class="btn btn-outline btn-small danger">Delete Entire Show</button>
       </div>`
    : '';

  // Continue-watching banner
  const progress = getLastWatched(g.title);
  let continueBanner = '';
  if (progress) {
    const lastEp = g.videos.find(v => v.title === progress.lastEpisodeTitle);
    if (lastEp) {
      continueBanner = `
        <div class="continue-banner">
          <div class="continue-info">
            <div class="continue-label">Continue watching</div>
            <div class="continue-title">${escapeHtml(lastEp.title)}</div>
          </div>
          <button class="btn btn-solid continue-btn" data-title="${escapeHtml(lastEp.title)}" type="button">▶ Resume</button>
        </div>`;
    }
  }

  // Season grouping
  const seasons    = {};
  g.videos.forEach(v => { const s = v.season || 1; if (!seasons[s]) seasons[s] = []; seasons[s].push(v); });
  const seasonKeys = Object.keys(seasons).sort((a, b) => Number(a) - Number(b));

  const seasonTabsHtml = seasonKeys.length > 1
    ? `<div class="season-tabs">
         <button class="season-tab ${activeSeason === null ? 'active' : ''}" data-season="all" type="button">All</button>
         ${seasonKeys.map(s =>
           `<button class="season-tab ${String(activeSeason) === s ? 'active' : ''}" data-season="${s}" type="button">Season ${s}</button>`
         ).join('')}
       </div>`
    : '';

  // Filter episodes
  let displayedEps = g.videos;
  if (activeSeason !== null) {
    displayedEps = displayedEps.filter(v => String(v.season || 1) === String(activeSeason));
  }
  if (episodeFilter.trim()) {
    const q = episodeFilter.trim().toLowerCase();
    displayedEps = displayedEps.filter(v =>
      v.title.toLowerCase().includes(q) ||
      String(v.episode).toLowerCase().includes(q) ||
      (v.description || '').toLowerCase().includes(q)
    );
  }

  // Jikan meta
  const meta = [];
  if (currentJikan?.year)     meta.push(`${currentJikan.year}`);
  if (currentJikan?.type)     meta.push(currentJikan.type);
  if (currentJikan?.episodes) meta.push(`${currentJikan.episodes} eps`);
  if (currentJikan?.score)    meta.push(`★ ${currentJikan.score}`);

  detailMain.innerHTML = `
    <div class="detail-hero">
      <div class="detail-cover">${cover}</div>
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
          <button id="focusModeButton" type="button" class="btn btn-outline btn-small ${focusMode ? 'active' : ''}">Focus</button>
        </div>
      </div>
      ${seasonTabsHtml}
      <div class="episode-list ${focusMode ? 'focus-mode' : ''}">
        ${displayedEps.length
          ? displayedEps.map(episodeRowHtml).join('')
          : '<div class="empty">No episodes match.</div>'}
      </div>
    </section>
  `;

  wireDetailEvents();

  // Render watch status async
  renderWatchStatus(document.getElementById('watchStatusContainer'), g.title);
}

function episodeRowHtml(video) {
  const ep  = video.episode || '—';
  const idx = AppState.videos.indexOf(video);
  const adminControls = isAdminUnlocked() ? `
    <button class="btn btn-outline btn-small edit-btn"   type="button">Edit</button>
    <button class="btn btn-outline btn-small delete-btn" type="button">Delete</button>
  ` : '';
  return `
    <div class="episode-row" data-idx="${idx}" data-id="${escapeHtml(String(video.id || ''))}">
      <div class="episode-num">
        <small>EP</small>
        ${escapeHtml(ep)}
      </div>
      <div class="episode-info">
        <h4 class="episode-title">${escapeHtml(video.title)}</h4>
        <div class="episode-meta">${escapeHtml(video.fileType)} · ${escapeHtml(video.fileSize)} · ${escapeHtml(formatDate(video.dateAdded))}${isPublicDownload(video) ? '' : ' · LOCAL PREVIEW ONLY'}</div>
      </div>
      <div class="episode-actions">
        <button class="btn btn-outline btn-small play-btn" type="button">Play</button>
        ${adminControls}
      </div>
    </div>
  `;
}

function wireDetailEvents() {
  // Episode search
  const searchInput = document.getElementById('episodeSearch');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      episodeFilter = e.target.value;
      renderDetail();
      const newInput = document.getElementById('episodeSearch');
      if (newInput) { newInput.focus(); newInput.setSelectionRange(episodeFilter.length, episodeFilter.length); }
    });
  }

  // Focus mode toggle
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
    btn.addEventListener('click', () => {
      activeSeason = btn.dataset.season === 'all' ? null : btn.dataset.season;
      renderDetail();
    });
  });

  // Play
  document.querySelectorAll('.episode-row .play-btn').forEach(btn => {
    const row   = btn.closest('.episode-row');
    const idx   = Number(row.dataset.idx);
    const video = AppState.videos[idx];
    if (video) btn.addEventListener('click', () => openPlayer(video));
  });

  // Edit (admin)
  document.querySelectorAll('.episode-row .edit-btn').forEach(btn => {
    const row   = btn.closest('.episode-row');
    const idx   = Number(row.dataset.idx);
    const video = AppState.videos[idx];
    if (video) btn.addEventListener('click', () => simpleEditPrompt(video));
  });

  // Delete episode (admin)
  document.querySelectorAll('.episode-row .delete-btn').forEach(btn => {
    const row   = btn.closest('.episode-row');
    const idx   = Number(row.dataset.idx);
    const video = AppState.videos[idx];
    if (video) btn.addEventListener('click', () => simpleDelete(video));
  });

  // Continue watching
  const continueBtn = document.querySelector('.continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      const title = continueBtn.dataset.title;
      const video = currentGroup.videos.find(v => v.title === title);
      if (video) openPlayer(video);
    });
  }

  // Tag remove (admin)
  document.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeTag(currentGroup.title, btn.dataset.tag);
      renderDetail();
    });
  });

  // Tag add (admin)
  const addTagBtn   = document.getElementById('addTagButton');
  const newTagInput = document.getElementById('newTagInput');
  if (addTagBtn && newTagInput) {
    const submit = () => {
      const t = newTagInput.value.trim();
      if (!t) return;
      addCustomTag(currentGroup.title, t);
      newTagInput.value = '';
      renderDetail();
    };
    addTagBtn.addEventListener('click', submit);
    newTagInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  }

  // Delete entire show (admin)
  const deleteShowBtn = document.getElementById('deleteShowButton');
  if (deleteShowBtn) {
    deleteShowBtn.addEventListener('click', async () => {
      if (!confirm(`Delete ALL videos in "${currentGroup.title}" from Supabase? This cannot be undone.`)) return;
      try {
        await supabaseDeleteCollection(currentGroup.title);
        window.location.href = 'index.html';
      } catch (err) {
        alert(`Delete failed: ${err.message}`);
      }
    });
  }
}

// ---------- Locate video in state ----------
function locateVideo(video) {
  let i = AppState.baseVideos.findIndex(v => v === video);
  if (i >= 0) return { source: 'base', index: i };
  i = AppState.localVideos.findIndex(v => v === video);
  if (i >= 0) return { source: 'local', index: i };
  i = AppState.sessionVideos.findIndex(v => v === video);
  if (i >= 0) return { source: 'session', index: i };
  return null;
}

function getSourceArray(source) {
  if (source === 'base')  return AppState.baseVideos;
  if (source === 'local') return AppState.localVideos;
  return AppState.sessionVideos;
}

// ---------- Edit ----------
async function simpleEditPrompt(video) {
  const newTitle  = prompt('Title:', video.title);
  if (newTitle === null) return;
  const newCover  = prompt('Cover URL (blank = keep):', video.coverUrl || '');
  if (newCover === null) return;
  const newHosted = prompt('Hosted URL (blank = keep):', video.downloadUrl && !video.downloadUrl.startsWith('blob:') ? video.downloadUrl : '');
  if (newHosted === null) return;

  const updated = normalizeVideo({
    ...video,
    title:       newTitle  || video.title,
    coverUrl:    newCover  || video.coverUrl,
    downloadUrl: newHosted || video.downloadUrl,
    temporary:   newHosted ? false : video.temporary
  });

  const t = locateVideo(video);
  if (!t) return;

  if (t.source === 'base' && video.id && isAdminUnlocked()) {
    try {
      const saved = await supabaseUpdate(video.id, updated);
      AppState.baseVideos[t.index] = saved;
    } catch (err) {
      alert(`Update failed: ${err.message}`);
      return;
    }
  } else {
    const arr = getSourceArray(t.source);
    arr[t.index] = updated;
    if (t.source === 'local') saveLocalVideos();
  }

  syncVideos();
  const groups = groupVideos(AppState.videos);
  currentGroup  = groups.find(g => g.slug === currentGroup.slug) || currentGroup;
  renderDetail();
  renderRecommendations(groups);
}

// ---------- Delete episode ----------
async function simpleDelete(video) {
  if (!confirm(`Delete "${video.title}"?`)) return;

  const t = locateVideo(video);
  if (!t) return;

  if (t.source === 'base' && video.id && isAdminUnlocked()) {
    try {
      await supabaseDelete(video.id);
      AppState.baseVideos.splice(t.index, 1);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
      return;
    }
  } else {
    const arr = getSourceArray(t.source);
    arr.splice(t.index, 1);
    if (t.source === 'local') saveLocalVideos();
  }

  syncVideos();
  const groups = groupVideos(AppState.videos);
  currentGroup  = groups.find(g => g.slug === currentGroup.slug);
  if (!currentGroup) { window.location.href = 'index.html'; return; }
  renderDetail();
  renderRecommendations(groups);
}

// ---------- Player ----------
function openPlayer(video) {
  const url = video.downloadUrl;
  if (!url || url === '#' || url.includes('example.com')) {
    alert(`"${video.title}" has no real video URL.`);
    return;
  }
  if (url.startsWith('blob:') && video.temporary) {
    alert(`"${video.title}" was added as a device preview. Browser preview URLs don't survive a page reload.`);
    return;
  }
  markEpisodeWatched(currentGroup.title, video.title);
  const epIdx = currentGroup.videos.indexOf(video);
  window.location.href = `player.html?show=${encodeURIComponent(currentGroup.slug)}&ep=${epIdx}`;
}

// ---------- Recommendations ----------
function renderRecommendations(allGroups) {
  if (!currentGroup) return;
  const tags = getTagsForCollection(currentGroup.title, currentJikan?.tags || []);
  const recs  = getRecommendationsForCollection(currentGroup.title, currentGroup.category, allGroups, tags);
  if (!recs.length) { if (recommendationsSection) recommendationsSection.hidden = true; return; }
  if (recommendationsSection) recommendationsSection.hidden = false;
  if (recsGrid) {
    recsGrid.innerHTML = recs.map(g => `
      <article class="poster-card">
        <a class="poster-clickable" href="detail.html?show=${encodeURIComponent(g.slug)}">
          <div class="poster-cover">
            ${g.firstCover
              ? `<img src="${escapeHtml(g.firstCover)}" alt="" loading="lazy">`
              : `<div class="cover-placeholder">${escapeHtml(g.title.charAt(0).toUpperCase())}</div>`}
            <div class="poster-overlay"><span class="poster-play-icon">▶</span></div>
          </div>
          <div class="poster-info">
            <div class="poster-cat">${escapeHtml((g.category || 'Other').toUpperCase())}</div>
            <h3 class="poster-title">${escapeHtml(g.title)}</h3>
            <div class="poster-count">${g.videos.length} ${g.videos.length === 1 ? 'entry' : 'entries'}</div>
          </div>
        </a>
      </article>
    `).join('');
  }
}

// ---------- Admin ----------
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
  if (adminEmailInput) adminEmailInput.focus();
}

function closeAdminDialog() {
  if (!adminDialog) return;
  if (typeof adminDialog.close === 'function') adminDialog.close();
  else adminDialog.removeAttribute('open');
}

async function handleAdminSubmit(event) {
  event.preventDefault();
  const email    = adminEmailInput?.value?.trim()    || '';
  const password = adminPasswordInput?.value?.trim() || '';
  if (!email || !password) return;

  const submitBtn = adminLoginForm?.querySelector('[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  if (adminError) adminError.hidden = true;

  try {
    await supabaseSignIn(email, password);
    closeAdminDialog();
    refreshAdminUi();
  } catch (err) {
    if (adminError) {
      adminError.textContent = err.message || 'Sign-in failed.';
      adminError.hidden = false;
    }
    if (adminPasswordInput) { adminPasswordInput.value = ''; adminPasswordInput.focus(); }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function handleAdminSignOut() {
  await supabaseSignOut();
  refreshAdminUi();
}

// ---------- Fog color picker (cinema mode) ----------
const FOG_KEY = 'the-index-fog-color';

function applyFog(color) {
  const dialog = document.getElementById('playerDialog');
  const swatch = document.getElementById('fogSwatch');
  if (!dialog || !swatch) return;

  if (!color || color === 'off') {
    dialog.style.removeProperty('--fog-color');
    dialog.style.removeProperty('--fog-glow');
    swatch.classList.remove('active');
    swatch.style.removeProperty('--fog-swatch-color');
    swatch.style.removeProperty('--fog-swatch-show');
    return;
  }

  const hex = color.replace('#', '');
  const r   = parseInt(hex.substring(0, 2), 16);
  const g   = parseInt(hex.substring(2, 4), 16);
  const b   = parseInt(hex.substring(4, 6), 16);

  dialog.style.setProperty('--fog-color', `rgba(${r},${g},${b},0.45)`);
  dialog.style.setProperty('--fog-glow',  `rgba(${r},${g},${b},0.18)`);
  swatch.classList.add('active');
  swatch.style.setProperty('--fog-swatch-color', color);
  swatch.style.setProperty('--fog-swatch-show',  'block');
}

function wireFogControl() {
  const input  = document.getElementById('fogInput');
  const offBtn = document.getElementById('fogOffButton');

  const saved = localStorage.getItem(FOG_KEY);
  if (saved && saved !== 'off') {
    if (input) input.value = saved;
    applyFog(saved);
  }

  if (input)  input.addEventListener('input', e => { applyFog(e.target.value); localStorage.setItem(FOG_KEY, e.target.value); });
  if (offBtn) offBtn.addEventListener('click',  () => { applyFog('off');        localStorage.setItem(FOG_KEY, 'off'); });
}

// ---------- Wire admin ----------
function wireAdmin() {
  refreshAdminUi();
  if (adminLoginButton) {
    adminLoginButton.addEventListener('click', () => {
      if (isAdminUnlocked()) handleAdminSignOut();
      else openAdminDialog();
    });
  }
  if (adminCancelButton) adminCancelButton.addEventListener('click', closeAdminDialog);
  if (adminLoginForm)    adminLoginForm.addEventListener('submit', handleAdminSubmit);
  wireFogControl();
  wireSignInNavBtn();
  wireAccountLink();
}

// ---------- Sign in nav button (for regular users) ----------
function wireSignInNavBtn() {
  const btn = document.getElementById('signInNavBtn');
  const accountLink = document.getElementById('accountLink');
  if (!btn) return;
  getCurrentUser().then(user => {
    if (user) {
      btn.hidden = true;
      if (accountLink) accountLink.hidden = false;
    } else {
      btn.hidden = false;
      if (accountLink) accountLink.hidden = true;
      btn.addEventListener('click', () => openUserAuthDialog('signin'));
    }
  });
}

function wireAccountLink() {
  const accountLink = document.getElementById('accountLink');
  getCurrentUser().then(user => {
    if (accountLink) accountLink.hidden = !user;
  });
}

// ---------- User auth dialog (sign in / sign up for regular users) ----------
const authDialog     = document.getElementById('authDialog');
const authDialogInner = document.getElementById('authDialogInner');

function openUserAuthDialog(mode) {
  if (!authDialog || !authDialogInner) return;
  if (mode === 'signin') {
    authDialogInner.innerHTML = `
      <h3>Sign In</h3>
      <input id="authEmail" type="email" placeholder="Email" autocomplete="username">
      <input id="authPassword" type="password" placeholder="Password" autocomplete="current-password">
      <p id="authError" class="admin-error" hidden></p>
      <div class="admin-actions">
        <button type="button" class="btn btn-outline btn-small" id="authSwitch">Create account</button>
        <button type="button" class="btn btn-solid btn-small" id="authSubmit">Sign In</button>
      </div>
    `;
    document.getElementById('authSubmit').addEventListener('click', async () => {
      const email    = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value.trim();
      const errEl    = document.getElementById('authError');
      try {
        await supabaseSignIn(email, password);
        closeUserAuthDialog();
        wireSignInNavBtn();
        renderDetail();
      } catch (err) { errEl.textContent = err.message; errEl.hidden = false; }
    });
    document.getElementById('authSwitch').addEventListener('click', () => openUserAuthDialog('signup'));
  } else {
    authDialogInner.innerHTML = `
      <h3>Create Account</h3>
      <input id="authEmail" type="email" placeholder="Email" autocomplete="username">
      <input id="authUsername" type="text" placeholder="Username" maxlength="24">
      <input id="authPassword" type="password" placeholder="Password" autocomplete="new-password">
      <div id="authUsernameAvail" class="username-availability"></div>
      <p id="authError" class="admin-error" hidden></p>
      <div class="admin-actions">
        <button type="button" class="btn btn-outline btn-small" id="authSwitch">Sign in instead</button>
        <button type="button" class="btn btn-solid btn-small" id="authSubmit">Create Account</button>
      </div>
    `;
    let checkTimer = null;
    document.getElementById('authUsername').addEventListener('input', e => {
      clearTimeout(checkTimer);
      const availEl = document.getElementById('authUsernameAvail');
      availEl.textContent = ''; availEl.className = 'username-availability';
      if (e.target.value.trim().length < 3) return;
      checkTimer = setTimeout(async () => {
        const ok = await checkUsernameAvailable(e.target.value.trim());
        availEl.textContent = ok ? '✓ Available' : '✗ Already taken';
        availEl.className   = `username-availability ${ok ? 'available' : 'taken'}`;
      }, 500);
    });
    document.getElementById('authSubmit').addEventListener('click', async () => {
      const email    = document.getElementById('authEmail').value.trim();
      const username = document.getElementById('authUsername').value.trim();
      const password = document.getElementById('authPassword').value.trim();
      const errEl    = document.getElementById('authError');
      if (!username || username.length < 3) { errEl.textContent = 'Username must be at least 3 characters.'; errEl.hidden = false; return; }
      try {
        await supabaseSignUp(email, password, username);
        closeUserAuthDialog();
        wireSignInNavBtn();
        renderDetail();
      } catch (err) { errEl.textContent = err.message; errEl.hidden = false; }
    });
    document.getElementById('authSwitch').addEventListener('click', () => openUserAuthDialog('signin'));
  }
  if (typeof authDialog.showModal === 'function') authDialog.showModal();
  else authDialog.setAttribute('open', '');
}

function closeUserAuthDialog() {
  if (!authDialog) return;
  if (typeof authDialog.close === 'function') authDialog.close();
  else authDialog.removeAttribute('open');
}

// ---------- Watch status ----------
const STATUS_LABELS = {
  watching:      'Watching',
  completed:     'Completed',
  plan_to_watch: 'Plan to Watch',
  on_hold:       'On Hold',
  dropped:       'Dropped'
};

async function renderWatchStatus(containerEl, collectionName) {
  if (!containerEl) return;
  const user   = await getCurrentUser();
  const status = user ? await getWatchStatus(collectionName) : null;

  containerEl.innerHTML = `
    <div class="watch-status-wrap">
      <select class="watch-status-select" id="watchStatusSelect" ${!user ? 'disabled title="Sign in to track"' : ''}>
        <option value="">— Add to list —</option>
        ${Object.entries(STATUS_LABELS).map(([val, label]) =>
          `<option value="${val}" ${status === val ? 'selected' : ''}>${label}</option>`
        ).join('')}
      </select>
    </div>
  `;

  if (user) {
    document.getElementById('watchStatusSelect')?.addEventListener('change', async e => {
      const val = e.target.value;
      if (val) await setWatchStatus(collectionName, val);
    });
  }
}

// ---------- Comments ----------
async function renderComments(containerEl, collectionName, episodeTitle) {
  if (!containerEl) return;
  containerEl.innerHTML = `<div class="comments-loading">Loading comments…</div>`;

  const [comments, user, profile] = await Promise.all([
    getComments(collectionName, episodeTitle),
    getCurrentUser(),
    getCurrentUser().then(u => u ? getCurrentProfile() : null)
  ]);

  const commentsHtml = comments.length
    ? comments.map(c => `
        <div class="comment" data-id="${escapeHtml(c.id)}">
          <div class="comment-avatar">
            ${c.avatar_url
              ? `<img src="${escapeHtml(c.avatar_url)}" alt="${escapeHtml(c.username)}">`
              : `<div class="comment-avatar-placeholder">${escapeHtml(c.username.charAt(0).toUpperCase())}</div>`}
          </div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-username">${escapeHtml(c.username)}</span>
              <span class="comment-date">${formatDate(c.created_at)}</span>
              ${user && c.user_id === user.id ? `<button class="comment-delete btn btn-small" data-id="${escapeHtml(c.id)}" type="button">Delete</button>` : ''}
            </div>
            <p class="comment-content">${escapeHtml(c.content)}</p>
          </div>
        </div>
      `).join('')
    : `<div class="comments-empty">No comments yet. Be the first!</div>`;

  const inputHtml = user
    ? `<div class="comment-input-wrap">
        <div class="comment-avatar">
          ${profile?.avatar_url
            ? `<img src="${escapeHtml(profile.avatar_url)}" alt="">`
            : `<div class="comment-avatar-placeholder">${escapeHtml((profile?.username || '?').charAt(0).toUpperCase())}</div>`}
        </div>
        <div class="comment-input-inner">
          <textarea id="commentInput" placeholder="Write a comment…" rows="2" maxlength="1000"></textarea>
          <button class="btn btn-solid btn-small" id="commentSubmit" type="button">Post</button>
        </div>
      </div>`
    : `<div class="comment-signin-prompt">
        <button class="btn btn-outline btn-small" id="commentSignInBtn" type="button">Sign in to comment</button>
      </div>`;

  containerEl.innerHTML = `
    <div class="comments-section">
      <h4 class="comments-heading">Comments <span class="episodes-count">${comments.length}</span></h4>
      ${inputHtml}
      <div class="comments-list">${commentsHtml}</div>
    </div>
  `;

  // Wire submit
  document.getElementById('commentSubmit')?.addEventListener('click', async () => {
    const input   = document.getElementById('commentInput');
    const content = input?.value?.trim();
    if (!content) return;
    const submitBtn = document.getElementById('commentSubmit');
    submitBtn.disabled = true;
    try {
      await postComment(collectionName, episodeTitle, content);
      await renderComments(containerEl, collectionName, episodeTitle);
    } catch (err) {
      alert(`Could not post comment: ${err.message}`);
      submitBtn.disabled = false;
    }
  });

  // Wire delete
  containerEl.querySelectorAll('.comment-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this comment?')) return;
      try {
        await deleteComment(btn.dataset.id);
        await renderComments(containerEl, collectionName, episodeTitle);
      } catch (err) { alert(`Could not delete: ${err.message}`); }
    });
  });

  // Wire sign in prompt
  document.getElementById('commentSignInBtn')?.addEventListener('click', () => openUserAuthDialog('signin'));
}

// ---------- Theme (dark by default) ----------
function applyTheme(light) {
  document.body.classList.toggle('light', light);
}

(function initTheme() {
  applyTheme(localStorage.getItem('the-index-theme') === 'light');
})();

// ---------- Bootstrap ----------
(async function init() {
  await coreInit();

  const showSlug = getShowSlugFromUrl();
  if (!showSlug) {
    detailMain.innerHTML = `
      <div class="detail-empty">
        <h2>No show specified</h2>
        <a href="index.html" class="btn btn-outline">Back to The Index</a>
      </div>`;
    wireAdmin();
    return;
  }

  const allGroups = groupVideos(AppState.videos);
  currentGroup    = allGroups.find(g => g.slug === showSlug);
  if (!currentGroup) {
    renderDetail();
    wireAdmin();
    return;
  }

  document.title = `${currentGroup.title} — Aurum`;
  renderDetail();
  renderRecommendations(allGroups);
  wireAdmin();

  // Fetch Jikan details in background, then re-render and auto-save cover
  fetchJikanDetails(currentGroup.title).then(async details => {
    if (!details) return;
    currentJikan = details;
    renderDetail();
    renderRecommendations(allGroups);

    // Auto-save cover and description to Supabase for episodes missing them
    if (isAdminUnlocked()) {
      const missing = currentGroup.videos.filter(v => v.id && (!v.coverUrl || !v.description));
      for (const video of missing) {
        const updates = { ...video };
        if (!video.coverUrl && details.image)    updates.coverUrl    = details.image;
        if (!video.description && details.synopsis) updates.description = details.synopsis;
        if (updates.coverUrl === video.coverUrl && updates.description === video.description) continue;
        try {
          const saved = await supabaseUpdate(video.id, updates);
          const idx   = AppState.baseVideos.findIndex(v => v.id === video.id);
          if (idx >= 0) AppState.baseVideos[idx] = saved;
          video.coverUrl    = saved.coverUrl;
          video.description = saved.description;
        } catch (err) {
          console.warn('Auto metadata save failed for', video.title, err);
        }
      }
      if (missing.length > 0) {
        syncVideos();
        renderDetail();
      }
    }
  });
})();
