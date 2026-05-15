// ============================================================
// player.html — embedded video player page
// Depends on core.js
// ============================================================

// ---------- Theme (persist across pages) ----------
(function initTheme() {
  const saved       = localStorage.getItem('the-index-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark', saved ? saved === 'dark' : prefersDark);
})();

// ---------- DOM refs ----------
const playerVideoEl    = document.getElementById('playerVideo');
const playerTitleEl    = document.getElementById('playerTitle');
const playerDescEl     = document.getElementById('playerDesc');
const playerEpMetaEl   = document.getElementById('playerEpMeta');
const episodeSidebar   = document.getElementById('episodeSidebar');
const showTitleEl      = document.getElementById('showTitle');
const showMetaEl       = document.getElementById('showMeta');
const showSynopsisEl   = document.getElementById('showSynopsis');
const tagListEl        = document.getElementById('tagList');
const recsGrid         = document.getElementById('recsGrid');
const recsSection      = document.getElementById('recsSection');
const backLink         = document.getElementById('backLink');
const yearEl           = document.getElementById('year');

if (yearEl) yearEl.textContent = '© ' + new Date().getFullYear();

// ---------- Local state ----------
let currentGroup  = null;
let currentVideo  = null;
let currentJikan  = null;

// ---------- URL params ----------
function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    show: p.get('show'),
    ep:   p.get('ep')
  };
}

// ---------- Load and play video ----------
function loadVideo(video) {
  if (!video) return;

  const url = video.downloadUrl;
  if (!url || url === '#') {
    if (playerVideoEl) {
      playerVideoEl.removeAttribute('src');
      playerVideoEl.load();
    }
    if (playerTitleEl) playerTitleEl.textContent = video.title + ' — no video URL';
    return;
  }

  currentVideo = video;

  if (playerVideoEl) {
    playerVideoEl.src = url;
    playerVideoEl.load();
    playerVideoEl.play().catch(() => {});
  }

  if (playerTitleEl) playerTitleEl.textContent = video.title;

  if (playerDescEl) {
    playerDescEl.textContent = video.description || '';
    playerDescEl.hidden = !video.description;
  }

  if (playerEpMetaEl) {
    const parts = [];
    if (video.episode) parts.push(`EP ${video.episode}`);
    if (video.fileType && video.fileType !== '—') parts.push(video.fileType);
    if (video.fileSize && video.fileSize !== '—') parts.push(video.fileSize);
    if (video.dateAdded) parts.push(formatDate(video.dateAdded));
    playerEpMetaEl.textContent = parts.join(' · ');
  }

  if (currentGroup) markEpisodeWatched(currentGroup.title, video.title, 0);

  // Restore saved timestamp
  const progress = getLastWatched(currentGroup?.title);
  if (progress && progress.lastEpisodeTitle === video.title && progress.timestamp > 5) {
    playerVideoEl.addEventListener('loadedmetadata', () => {
      playerVideoEl.currentTime = progress.timestamp;
    }, { once: true });
  }

  // Update URL without reloading
  if (currentGroup) {
    const epIdx  = currentGroup.videos.indexOf(video);
    const newUrl = `player.html?show=${encodeURIComponent(currentGroup.slug)}&ep=${epIdx}`;
    history.replaceState(null, '', newUrl);
  }

  // Highlight active episode in sidebar
  if (episodeSidebar) {
    episodeSidebar.querySelectorAll('.sidebar-ep').forEach(row => {
      row.classList.toggle('active', row.dataset.title === video.title);
    });
    const activeRow = episodeSidebar.querySelector('.sidebar-ep.active');
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// ---------- Render episode sidebar ----------
function renderSidebar(group) {
  if (!episodeSidebar || !group) return;

  episodeSidebar.innerHTML = group.videos.map(video => {
    const isActive = currentVideo && video.title === currentVideo.title;
    const ep = video.episode || '—';
    return `
      <button
        class="sidebar-ep ${isActive ? 'active' : ''}"
        data-title="${escapeHtml(video.title)}"
        type="button"
      >
        <span class="sidebar-ep-num">EP ${escapeHtml(ep)}</span>
        <span class="sidebar-ep-title">${escapeHtml(video.title)}</span>
      </button>
    `;
  }).join('');

  episodeSidebar.querySelectorAll('.sidebar-ep').forEach(btn => {
    btn.addEventListener('click', () => {
      const video = group.videos.find(v => v.title === btn.dataset.title);
      if (video) loadVideo(video);
    });
  });
}

// ---------- Render show info ----------
function renderShowInfo(group, jikan) {
  if (backLink) backLink.href = `detail.html?show=${encodeURIComponent(group.slug)}`;

  if (showTitleEl) showTitleEl.textContent = group.title;

  if (showMetaEl) {
    const parts = [];
    if (jikan?.year)     parts.push(jikan.year);
    if (jikan?.type)     parts.push(jikan.type);
    if (jikan?.episodes) parts.push(`${jikan.episodes} eps`);
    if (jikan?.score)    parts.push(`★ ${jikan.score}`);
    showMetaEl.textContent = parts.join(' · ');
    showMetaEl.hidden = !parts.length;
  }

  if (showSynopsisEl) {
    showSynopsisEl.textContent = jikan?.synopsis || '';
    showSynopsisEl.hidden = !jikan?.synopsis;
  }

  if (tagListEl) {
    const tags = getTagsForCollection(group.title, jikan?.tags || []);
    tagListEl.innerHTML = tags.length
      ? tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
      : '';
    tagListEl.hidden = !tags.length;
  }
}

// ---------- Render recommendations ----------
function renderRecommendations(allGroups) {
  if (!recsGrid || !recsSection || !currentGroup) return;

  const tags = getTagsForCollection(currentGroup.title, currentJikan?.tags || []);
  const recs  = getRecommendationsForCollection(
    currentGroup.title, currentGroup.category, allGroups, tags
  );

  if (!recs.length) { recsSection.hidden = true; return; }

  recsSection.hidden = false;
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
          <div class="poster-count">${g.videos.length} ${g.videos.length === 1 ? 'episode' : 'episodes'}</div>
        </div>
      </a>
    </article>
  `).join('');
}

// ---------- Auto-advance + timestamp saving ----------
let _timestampInterval = null;

function startTimestampSaving() {
  stopTimestampSaving();
  _timestampInterval = setInterval(() => {
    if (!playerVideoEl || !currentVideo || !currentGroup) return;
    if (playerVideoEl.paused || playerVideoEl.ended) return;
    saveTimestamp(currentGroup.title, currentVideo.title, Math.floor(playerVideoEl.currentTime));
  }, 5000);
}

function stopTimestampSaving() {
  if (_timestampInterval) { clearInterval(_timestampInterval); _timestampInterval = null; }
}

function wireAutoAdvance(group) {
  if (!playerVideoEl || !group) return;
  playerVideoEl.addEventListener('play',  startTimestampSaving);
  playerVideoEl.addEventListener('pause', stopTimestampSaving);
  playerVideoEl.addEventListener('ended', () => {
    stopTimestampSaving();
    if (!currentVideo) return;
    const idx  = group.videos.indexOf(currentVideo);
    const next = group.videos[idx + 1];
    if (next) loadVideo(next);
  });
}

// ---------- Bootstrap ----------
(async function init() {
  await coreInit();

  const { show: showSlug, ep: epParam } = getParams();

  if (!showSlug) {
    if (playerTitleEl) playerTitleEl.textContent = 'No show specified.';
    return;
  }

  const allGroups = groupVideos(AppState.videos);
  currentGroup    = allGroups.find(g => g.slug === showSlug);

  if (!currentGroup || !currentGroup.videos.length) {
    if (playerTitleEl) playerTitleEl.textContent = 'Show not found.';
    return;
  }

  document.title = `${currentGroup.title} — The Index`;

  // Determine starting episode: ep= param → last watched → first
  let startVideo = null;
  const epIdx    = parseInt(epParam, 10);
  if (!Number.isNaN(epIdx) && currentGroup.videos[epIdx]) {
    startVideo = currentGroup.videos[epIdx];
  } else {
    const progress = getLastWatched(currentGroup.title);
    if (progress) startVideo = currentGroup.videos.find(v => v.title === progress.lastEpisodeTitle);
    if (!startVideo) startVideo = currentGroup.videos[0];
  }

  renderShowInfo(currentGroup, null);
  loadVideo(startVideo);
  renderSidebar(currentGroup);
  wireAutoAdvance(currentGroup);

  // Fetch Jikan in background and update info
  fetchJikanDetails(currentGroup.title).then(details => {
    if (details) {
      currentJikan = details;
      renderShowInfo(currentGroup, currentJikan);
      renderRecommendations(allGroups);
    }
  });
})();
