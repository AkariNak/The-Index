// ============================================================
// player.html — embedded video player page
// Depends on core.js
// ============================================================

// ---------- Theme (dark by default) ----------
(function initTheme() {
  document.body.classList.toggle('light', localStorage.getItem('the-index-theme') === 'light');
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

// ---------- URL params ----------
function getParams() {
  const p = new URLSearchParams(window.location.search);
  return { show: p.get('show'), ep: p.get('ep') };
}

// ---------- Timestamp saving ----------
function startTimestampSaving() {
  stopTimestampSaving();
  _tsInterval = setInterval(() => {
    if (!playerVideoEl || !currentVideo || !currentGroup) return;
    if (playerVideoEl.paused || playerVideoEl.ended || playerVideoEl.currentTime < 5) return;
    saveTimestamp(currentGroup.title, currentVideo.title, Math.floor(playerVideoEl.currentTime));
  }, 4000);
}

function stopTimestampSaving() {
  if (_tsInterval) { clearInterval(_tsInterval); _tsInterval = null; }
}

// ---------- Load and play video ----------
function loadVideo(video) {
  if (!video) return;

  stopTimestampSaving();

  const url = video.downloadUrl;
  if (!url || url === '#') {
    if (playerVideoEl) { playerVideoEl.removeAttribute('src'); playerVideoEl.load(); }
    if (playerTitleEl) playerTitleEl.textContent = video.title + ' — no video URL';
    return;
  }

  // Read saved timestamp BEFORE anything else changes state
  const savedProgress  = getLastWatched(currentGroup?.title);
  const savedTimestamp = (
    savedProgress &&
    savedProgress.lastEpisodeTitle === video.title &&
    typeof savedProgress.timestamp === 'number' &&
    savedProgress.timestamp > 5
  ) ? savedProgress.timestamp : 0;

  currentVideo = video;

  // Set src and load — do NOT call play() yet, wait for loadedmetadata
  playerVideoEl.src = url;
  playerVideoEl.load();

  playerVideoEl.addEventListener('loadedmetadata', () => {
    if (savedTimestamp > 0 && savedTimestamp < playerVideoEl.duration - 5) {
      playerVideoEl.currentTime = savedTimestamp;
    }
    playerVideoEl.play().catch(() => {});
    startTimestampSaving();
  }, { once: true });

  // Mark watched, preserving the timestamp we just read
  if (currentGroup) {
    markEpisodeWatched(currentGroup.title, video.title, savedTimestamp);
    // Auto-set watch status to Watching for logged-in users
    getCurrentUser().then(user => {
      if (user) getWatchStatus(currentGroup.title).then(status => {
        if (!status) setWatchStatus(currentGroup.title, 'watching');
      });
    });
  }

  // Update UI
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
    playerEpMetaEl.textContent = parts.join(' · ');
  }

  // Update URL
  if (currentGroup) {
    const epIdx = currentGroup.videos.indexOf(video);
    history.replaceState(null, '', `player.html?show=${encodeURIComponent(currentGroup.slug)}&ep=${epIdx}`);
  }

  // Highlight sidebar
  highlightSidebarEp(video);

  // Load comments for this episode
  const commentsContainer = document.getElementById('commentsContainer');
  if (commentsContainer && currentGroup) {
    renderPlayerComments(commentsContainer, currentGroup.title, video.title);
  }
}

// ---------- Player comments ----------
async function renderPlayerComments(container, collectionName, episodeTitle) {
  container.innerHTML = `<div class="comments-loading">Loading comments…</div>`;

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
              ${user && c.user_id === user.id
                ? `<button class="comment-delete btn btn-small" data-id="${escapeHtml(c.id)}" type="button">Delete</button>`
                : ''}
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

  container.innerHTML = `
    <div class="comments-section">
      <h4 class="comments-heading">Comments <span class="episodes-count">${comments.length}</span></h4>
      ${inputHtml}
      <div class="comments-list">${commentsHtml}</div>
    </div>
  `;

  document.getElementById('commentSubmit')?.addEventListener('click', async () => {
    const input   = document.getElementById('commentInput');
    const content = input?.value?.trim();
    if (!content) return;
    const btn = document.getElementById('commentSubmit');
    btn.disabled = true;
    try {
      await postComment(collectionName, episodeTitle, content);
      renderPlayerComments(container, collectionName, episodeTitle);
    } catch (err) {
      alert(`Could not post: ${err.message}`);
      btn.disabled = false;
    }
  });

  container.querySelectorAll('.comment-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this comment?')) return;
      try {
        await deleteComment(btn.dataset.id);
        renderPlayerComments(container, collectionName, episodeTitle);
      } catch (err) { alert(`Could not delete: ${err.message}`); }
    });
  });

  document.getElementById('commentSignInBtn')?.addEventListener('click', () => {
    window.location.href = `account.html`;
  });
}

// ---------- Sidebar highlight ----------
function highlightSidebarEp(video) {
  if (!episodeSidebar) return;
  episodeSidebar.querySelectorAll('.sidebar-ep, .ep-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.title === video.title);
  });
  const active = episodeSidebar.querySelector('.active');
  if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ---------- Episode sidebar ----------
// 12 or fewer: full rows. More than 12: compact numbered pill grid like HiAnime.
function renderSidebar(group) {
  if (!episodeSidebar || !group) return;

  const useGrid = group.videos.length > 12;

  if (useGrid) {
    const progress = getLastWatched(group.title);
    episodeSidebar.innerHTML = `<div class="ep-grid">${
      group.videos.map((video, i) => {
        const ep      = video.episode || String(i + 1);
        const isActive = currentVideo && video.title === currentVideo.title;
        const isWatched = progress && progress.lastEpisodeTitle === video.title;
        return `<button
          class="ep-pill${isActive ? ' active' : ''}${isWatched && !isActive ? ' watched' : ''}"
          data-title="${escapeHtml(video.title)}"
          type="button"
          title="${escapeHtml(video.title)}"
        >${escapeHtml(ep)}</button>`;
      }).join('')
    }</div>`;
  } else {
    episodeSidebar.innerHTML = group.videos.map(video => {
      const isActive = currentVideo && video.title === currentVideo.title;
      const ep       = video.episode || '—';
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

// ---------- Show info ----------
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

// ---------- Recommendations (shared tags only, sorted by overlap count) ----------
function renderRecommendations(allGroups) {
  if (!recsGrid || !recsSection || !currentGroup) return;

  const currentTags = getTagsForCollection(currentGroup.title, currentJikan?.tags || [])
    .map(t => t.toLowerCase());

  if (!currentTags.length) { recsSection.hidden = true; return; }

  const recs = allGroups
    .filter(g => g.slug !== currentGroup.slug)
    .map(g => {
      const jikan     = AppState.jikanCache[g.slug];
      const otherTags = getTagsForCollection(g.title, jikan?.tags || []).map(t => t.toLowerCase());
      const overlap   = otherTags.filter(t => currentTags.includes(t)).length;
      return { group: g, overlap };
    })
    .filter(x => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 8)
    .map(x => x.group);

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

// ---------- Fog / cinema mode ----------
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
  if (input)  input.addEventListener('input',  e => { applyFog(e.target.value); localStorage.setItem(FOG_KEY, e.target.value); });
  if (offBtn) offBtn.addEventListener('click', () => { applyFog('off'); localStorage.setItem(FOG_KEY, 'off'); });
}

// ---------- Auto-advance ----------
function wireAutoAdvance(group) {
  if (!playerVideoEl || !group) return;
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

  renderShowInfo(currentGroup, null);
  renderSidebar(currentGroup);
  wireAutoAdvance(currentGroup);
  wireFog();
  loadVideo(startVideo);

  fetchJikanDetails(currentGroup.title).then(details => {
    if (details) {
      currentJikan = details;
      renderShowInfo(currentGroup, currentJikan);
      renderRecommendations(allGroups);
    }
  });
})();
