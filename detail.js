// ============================================================
// detail.html — single show page
// ============================================================

const detailMain = document.getElementById('detailMain');
const recommendationsSection = document.getElementById('recommendationsSection');
const recsGrid = document.getElementById('recsGrid');
const playerDialog = document.getElementById('playerDialog');
const playerVideo = document.getElementById('playerVideo');
const playerTitle = document.getElementById('playerTitle');
const closePlayerButton = document.getElementById('closePlayer');

// Admin
const adminDialog = document.getElementById('adminDialog');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginButton = document.getElementById('adminLoginButton');
const adminCancelButton = document.getElementById('adminCancelButton');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminError = document.getElementById('adminError');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = '© ' + new Date().getFullYear();

// ---------- Local state ----------
let currentGroup = null;
let currentJikan = null;
let episodeFilter = '';
let activeSeason = null; // null = all seasons

// ---------- URL handling ----------
function getShowSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('show');
}

// ---------- Render ----------
function renderDetail() {
  if (!currentGroup) {
    detailMain.innerHTML = `
      <div class="detail-empty">
        <h2>Show not found</h2>
        <p>This collection doesn't exist or has been removed.</p>
        <a href="index.html" class="btn btn-outline">Back to The Index</a>
      </div>
    `;
    return;
  }

  const g = currentGroup;
  const cover = g.firstCover
    ? `<img src="${escapeHtml(g.firstCover)}" alt="${escapeHtml(g.title)} cover">`
    : `<div class="cover-placeholder">${escapeHtml(g.title.charAt(0).toUpperCase())}</div>`;

  // Build tag list (merged Jikan + custom)
  const tags = getTagsForCollection(g.title, currentJikan?.tags || []);
  const tagsHtml = tags.length
    ? tags.map(t => `
        <span class="tag">
          ${escapeHtml(t)}
          ${isAdminUnlocked() ? `<button class="tag-remove" type="button" data-tag="${escapeHtml(t)}" title="Remove tag">×</button>` : ''}
        </span>
      `).join('')
    : '<span class="tag-empty">No tags yet</span>';

  const adminAddTag = isAdminUnlocked()
    ? `<div class="tag-add"><input id="newTagInput" type="text" placeholder="Add tag…" maxlength="40"><button id="addTagButton" type="button" class="btn btn-outline btn-small">Add</button></div>`
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
        </div>
      `;
    }
  }

  // Group episodes by season
  const seasons = {};
  g.videos.forEach(v => {
    const s = v.season || 1;
    if (!seasons[s]) seasons[s] = [];
    seasons[s].push(v);
  });
  const seasonKeys = Object.keys(seasons).sort((a, b) => Number(a) - Number(b));

  const seasonTabsHtml = seasonKeys.length > 1
    ? `
      <div class="season-tabs">
        <button class="season-tab ${activeSeason === null ? 'active' : ''}" data-season="all" type="button">All</button>
        ${seasonKeys.map(s => `<button class="season-tab ${String(activeSeason) === s ? 'active' : ''}" data-season="${s}" type="button">Season ${s}</button>`).join('')}
      </div>
    `
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

  // Jikan metadata (year, episode count, score, synopsis)
  const meta = [];
  if (currentJikan?.year) meta.push(`${currentJikan.year}`);
  if (currentJikan?.type) meta.push(currentJikan.type);
  if (currentJikan?.episodes) meta.push(`${currentJikan.episodes} eps`);
  if (currentJikan?.score) meta.push(`★ ${currentJikan.score}`);

  detailMain.innerHTML = `
    <div class="detail-hero">
      <div class="detail-cover">${cover}</div>
      <div class="detail-info">
        <div class="detail-cat">${escapeHtml((g.category || 'Other').toUpperCase())}</div>
        <h1 class="detail-title">${escapeHtml(g.title)}</h1>
        ${meta.length ? `<div class="detail-meta">${meta.map(m => `<span>${escapeHtml(m)}</span>`).join('<span class="dot">·</span>')}</div>` : ''}
        ${currentJikan?.synopsis ? `<p class="detail-synopsis">${escapeHtml(currentJikan.synopsis)}</p>` : ''}
        <div class="tag-list">${tagsHtml}</div>
        ${adminAddTag}
      </div>
    </div>

    ${continueBanner}

    <section class="episodes-section">
      <div class="episodes-head">
        <h2>Episodes <span class="episodes-count">${displayedEps.length}</span></h2>
        <input id="episodeSearch" type="search" placeholder="Filter episodes…" value="${escapeHtml(episodeFilter)}">
      </div>
      ${seasonTabsHtml}
      <div class="episode-list">
        ${displayedEps.length ? displayedEps.map(episodeRowHtml).join('') : '<div class="empty">No episodes match.</div>'}
      </div>
    </section>
  `;

  wireDetailEvents();
}

function episodeRowHtml(video) {
  const ep = video.episode || '—';
  const idx = AppState.videos.indexOf(video);
  const adminControls = isAdminUnlocked() ? `
    <button class="btn btn-outline btn-small edit-btn" type="button">Edit</button>
    <button class="btn btn-outline btn-small delete-btn" type="button">Delete</button>
  ` : '';
  return `
    <div class="episode-row" data-idx="${idx}">
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
      // Lightweight re-render of episodes only would be nicer but full re-render is fine here
      renderDetail();
      // Restore focus + cursor position
      const newInput = document.getElementById('episodeSearch');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(episodeFilter.length, episodeFilter.length);
      }
    });
  }

  // Season tabs
  document.querySelectorAll('.season-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = btn.dataset.season;
      activeSeason = s === 'all' ? null : s;
      renderDetail();
    });
  });

  // Play
  document.querySelectorAll('.episode-row .play-btn').forEach(btn => {
    const row = btn.closest('.episode-row');
    const idx = Number(row.dataset.idx);
    const video = AppState.videos[idx];
    if (video) btn.addEventListener('click', () => openPlayer(video));
  });

  // Edit (admin)
  document.querySelectorAll('.episode-row .edit-btn').forEach(btn => {
    const row = btn.closest('.episode-row');
    const idx = Number(row.dataset.idx);
    const video = AppState.videos[idx];
    if (video) btn.addEventListener('click', () => simpleEditPrompt(video));
  });

  // Delete (admin)
  document.querySelectorAll('.episode-row .delete-btn').forEach(btn => {
    const row = btn.closest('.episode-row');
    const idx = Number(row.dataset.idx);
    const video = AppState.videos[idx];
    if (video) btn.addEventListener('click', () => simpleDelete(video));
  });

  // Continue
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
  const addTagBtn = document.getElementById('addTagButton');
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
}

// ---------- Player ----------
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
  if (source === 'base') return AppState.baseVideos;
  if (source === 'local') return AppState.localVideos;
  return AppState.sessionVideos;
}

function simpleEditPrompt(video) {
  // Use prompts as a minimal-effort editor on the detail page.
  // The grid-page form remains the full editor.
  const newTitle = prompt('Title:', video.title);
  if (newTitle === null) return;
  const newCover = prompt('Cover URL (leave blank to keep):', video.coverUrl || '');
  if (newCover === null) return;
  const newHosted = prompt('Hosted URL (leave blank to keep):', video.downloadUrl && !video.downloadUrl.startsWith('blob:') ? video.downloadUrl : '');
  if (newHosted === null) return;

  const t = locateVideo(video);
  if (!t) return;
  const arr = getSourceArray(t.source);
  const updated = normalizeVideo({
    ...video,
    title: newTitle || video.title,
    coverUrl: newCover || video.coverUrl,
    downloadUrl: newHosted || video.downloadUrl,
    temporary: newHosted ? false : video.temporary
  });
  arr[t.index] = updated;
  if (t.source === 'local') saveLocalVideos();
  syncVideos();
  // Refresh current group reference
  const groups = groupVideos(AppState.videos);
  currentGroup = groups.find(g => g.slug === currentGroup.slug) || currentGroup;
  renderDetail();
  if (t.source === 'base') {
    alert('Edited a videos.json entry. Export and replace the file to make this permanent for everyone.');
  }
}

function simpleDelete(video) {
  const t = locateVideo(video);
  if (!t) return;
  if (!confirm(`Delete "${video.title}"?${t.source === 'base' ? ' (Export videos.json afterward to make permanent.)' : ''}`)) return;
  const arr = getSourceArray(t.source);
  arr.splice(t.index, 1);
  if (t.source === 'local') saveLocalVideos();
  syncVideos();
  const groups = groupVideos(AppState.videos);
  currentGroup = groups.find(g => g.slug === currentGroup.slug);
  if (!currentGroup) {
    // Last episode deleted — go back to index
    window.location.href = 'index.html';
    return;
  }
  renderDetail();
  renderRecommendations(groups);
}

function openPlayer(video) {
  if (!playerDialog || !playerVideo) return;
  const url = video.downloadUrl;
  if (!url || url === '#' || url.includes('example.com')) {
    alert(`"${video.title}" has no real video URL.`);
    return;
  }
  if (url.startsWith('blob:') && video.temporary) {
    alert(`"${video.title}" was added as a device preview previously. Browser preview URLs don't survive a page reload.`);
    return;
  }
  playerVideo.src = url;
  playerTitle.textContent = video.title;
  const onError = () => { alert(`Could not load "${video.title}".`); closePlayer(); };
  playerVideo.addEventListener('error', onError, { once: true });
  if (typeof playerDialog.showModal === 'function') playerDialog.showModal();
  else playerDialog.setAttribute('open', '');
  playerVideo.play().catch(() => {});

  markEpisodeProgress(video);
}

function markEpisodeProgress(video) {
  if (!currentGroup) return;
  markEpisodeWatched(currentGroup.title, video.title);
}

function closePlayer() {
  if (!playerDialog || !playerVideo) return;
  playerVideo.pause();
  playerVideo.removeAttribute('src');
  playerVideo.load();
  if (typeof playerDialog.close === 'function') playerDialog.close();
  else playerDialog.removeAttribute('open');
}

// ---------- Recommendations ----------
function renderRecommendations(allGroups) {
  if (!currentGroup) return;
  const tags = getTagsForCollection(currentGroup.title, currentJikan?.tags || []);
  const recs = getRecommendationsForCollection(currentGroup.title, currentGroup.category, allGroups, tags);
  if (!recs.length) { recommendationsSection.hidden = true; return; }
  recommendationsSection.hidden = false;
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

// ---------- Admin ----------
function refreshAdminUi() {
  if (adminLoginButton) adminLoginButton.textContent = isAdminUnlocked() ? 'Lock' : 'Admin';
  renderDetail();
}
function openAdminDialog() {
  if (!adminDialog) return;
  if (adminError) adminError.hidden = true;
  if (adminPasswordInput) adminPasswordInput.value = '';
  if (typeof adminDialog.showModal === 'function') adminDialog.showModal();
  else adminDialog.setAttribute('open', '');
  if (adminPasswordInput) adminPasswordInput.focus();
}
function closeAdminDialog() {
  if (typeof adminDialog.close === 'function') adminDialog.close();
  else adminDialog.removeAttribute('open');
}
async function handleAdminSubmit(event) {
  event.preventDefault();
  const hash = await sha256Hex(adminPasswordInput?.value || '');
  if (hash === ADMIN_PASSWORD_HASH) {
    setAdminUnlocked(true);
    closeAdminDialog();
    refreshAdminUi();
  } else {
    if (adminError) adminError.hidden = false;
    if (adminPasswordInput) { adminPasswordInput.value = ''; adminPasswordInput.focus(); }
  }
}

function wireAdmin() {
  refreshAdminUi();
  if (adminLoginButton) {
    adminLoginButton.addEventListener('click', () => {
      if (isAdminUnlocked()) { setAdminUnlocked(false); refreshAdminUi(); }
      else openAdminDialog();
    });
  }
  if (adminCancelButton) adminCancelButton.addEventListener('click', closeAdminDialog);
  if (adminLoginForm) adminLoginForm.addEventListener('submit', handleAdminSubmit);
  if (closePlayerButton) closePlayerButton.addEventListener('click', closePlayer);
  if (playerVideo) {
    playerVideo.addEventListener('contextmenu', e => e.preventDefault());
    playerVideo.setAttribute('controlsList', 'nodownload noremoteplayback');
  }

  wireFogControl();
}

// ---------- Fog color picker ----------
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

  // Convert hex to rgba helpers for two intensity layers
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0,2), 16);
  const g = parseInt(hex.substring(2,4), 16);
  const b = parseInt(hex.substring(4,6), 16);

  // Outer glow (around the player) — solid color, medium intensity
  dialog.style.setProperty('--fog-color', `rgba(${r},${g},${b},0.45)`);
  // Inner backdrop ambient — softer, larger radius
  dialog.style.setProperty('--fog-glow', `rgba(${r},${g},${b},0.18)`);

  swatch.classList.add('active');
  swatch.style.setProperty('--fog-swatch-color', color);
  swatch.style.setProperty('--fog-swatch-show', 'block');
}

function wireFogControl() {
  const input = document.getElementById('fogInput');
  const offBtn = document.getElementById('fogOffButton');

  // Restore last-used fog color
  const saved = localStorage.getItem(FOG_KEY);
  if (saved && saved !== 'off') {
    if (input) input.value = saved;
    applyFog(saved);
  }

  if (input) {
    input.addEventListener('input', e => {
      const c = e.target.value;
      applyFog(c);
      localStorage.setItem(FOG_KEY, c);
    });
  }
  if (offBtn) {
    offBtn.addEventListener('click', () => {
      applyFog('off');
      localStorage.setItem(FOG_KEY, 'off');
    });
  }
}

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
  currentGroup = allGroups.find(g => g.slug === showSlug);
  if (!currentGroup) {
    renderDetail(); // shows "not found"
    wireAdmin();
    return;
  }

  // Update document title
  document.title = `${currentGroup.title} — The Index`;

  // Initial render with what we have
  renderDetail();
  renderRecommendations(allGroups);
  wireAdmin();

  // Fetch Jikan details in background, then re-render
  fetchJikanDetails(currentGroup.title).then(details => {
    if (details) {
      currentJikan = details;
      renderDetail();
      renderRecommendations(allGroups);
    }
  });
})();
