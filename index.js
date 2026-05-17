// ============================================================
// Aurum — index.js
// ============================================================

// ---------- Theme (runs immediately before anything renders) ----------
(function() {
  document.body.classList.toggle('light', localStorage.getItem('aurum-theme') === 'light');
})();

// ---------- DOM refs ----------
const collectionGrid    = document.getElementById('collectionGrid');
const archiveList       = document.getElementById('archiveList');
const search            = document.getElementById('search');
const filters           = document.getElementById('filters');
const count             = document.getElementById('count');
const addVideoForm      = document.getElementById('addVideoForm');
const exportJsonButton  = document.getElementById('exportJsonButton');
const clearLocalButton  = document.getElementById('clearLocalButton');
const formStatus        = document.getElementById('formStatus');
const videoFileInput    = document.getElementById('videoFileInput');
const coverFileInput    = document.getElementById('coverFileInput');
const chooseVideoButton = document.getElementById('chooseVideoButton');
const chooseCoverButton = document.getElementById('chooseCoverButton');
const selectedFileText  = document.getElementById('selectedFileText');
const selectedCoverText = document.getElementById('selectedCoverText');
const autoGroupText     = document.getElementById('autoGroupText');
const framePicker       = document.getElementById('framePicker');
const frameGrid         = document.getElementById('frameGrid');
const regenerateFramesButton = document.getElementById('regenerateFramesButton');
const downloadIndexPanel     = document.getElementById('downloadIndexPanel');
const skeletonGrid           = document.getElementById('skeletonGrid');
const adminPanel         = document.getElementById('adminPanel');
const adminDialog        = document.getElementById('adminDialog');
const adminLoginForm     = document.getElementById('adminLoginForm');
const adminLoginButton   = document.getElementById('adminLoginButton');
const adminCancelButton  = document.getElementById('adminCancelButton');
const adminEmailInput    = document.getElementById('adminEmailInput');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminError         = document.getElementById('adminError');
const findCoverButton    = document.getElementById('findCoverButton');
const coverSearchPanel   = document.getElementById('coverSearchPanel');
const coverSearchStatus  = document.getElementById('coverSearchStatus');
const coverSearchResults = document.getElementById('coverSearchResults');
const titleInput       = document.getElementById('titleInput');
const collectionInput  = document.getElementById('collectionInput');
const episodeInput     = document.getElementById('episodeInput');
const categoryInput    = document.getElementById('categoryInput');
const fileTypeInput    = document.getElementById('fileTypeInput');
const fileSizeInput    = document.getElementById('fileSizeInput');
const descriptionInput = document.getElementById('descriptionInput');
const hostedUrlInput   = document.getElementById('hostedUrlInput');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = '© ' + new Date().getFullYear();

// ---------- State ----------
let activeCategory   = 'all';
let selectedVideoUrl = '';
let selectedCoverUrl = '';
let generatedFrames  = [];

// ---------- Skeleton loading ----------
function showSkeleton() {
  if (!skeletonGrid) return;
  skeletonGrid.innerHTML = Array(12).fill(0).map(() => `
    <div class="poster-card">
      <div class="skeleton skeleton-poster"></div>
      <div style="padding:0 2px;margin-top:10px">
        <div class="skeleton skeleton-line skeleton-line-short" style="width:40%;height:9px;margin-bottom:6px"></div>
        <div class="skeleton skeleton-line" style="height:13px;margin-bottom:4px"></div>
        <div class="skeleton skeleton-line skeleton-line-short" style="height:9px;width:55%"></div>
      </div>
    </div>
  `).join('');
}

function hideSkeleton() {
  if (skeletonGrid) skeletonGrid.innerHTML = '';
}

// ---------- Filter / render ----------
function getFilteredVideos() {
  const query = (search?.value || '').trim().toLowerCase();
  return AppState.videos.filter(video => {
    const matchesCategory = activeCategory === 'all' ||
      video.category.toLowerCase() === activeCategory.toLowerCase();
    if (!matchesCategory) return false;
    if (!query) return true;
    return [video.title, video.description, video.collection, video.category]
      .join(' ').toLowerCase().includes(query);
  });
}

function buildFilters() {
  if (!filters) return;
  const categories = ['all', ...new Set(AppState.videos.map(v => v.category).filter(Boolean))];
  filters.innerHTML = categories.map(c =>
    `<button class="chip ${c === activeCategory ? 'active' : ''}" data-category="${escapeHtml(c)}" type="button">${c === 'all' ? 'All' : escapeHtml(c)}</button>`
  ).join('');
  filters.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      filters.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === btn));
      render();
    });
  });
}

function posterCardHtml(group) {
  const cover = group.firstCover
    ? `<img src="${escapeHtml(group.firstCover)}" alt="${escapeHtml(group.title)}" loading="lazy">`
    : `<div class="cover-placeholder">${escapeHtml(group.title.charAt(0).toUpperCase())}</div>`;
  const epCount = group.videos.length;
  return `
    <article class="poster-card">
      <a class="poster-clickable" href="detail.html?show=${encodeURIComponent(group.slug)}">
        <div class="poster-cover">
          ${cover}
          <div class="poster-overlay"><span class="poster-play-icon">▶</span></div>
          <span class="poster-ep-badge">${epCount} ${epCount === 1 ? 'episode' : 'episodes'}</span>
        </div>
        <div class="poster-info">
          <div class="poster-cat">${escapeHtml((group.category || 'Other').toUpperCase())}</div>
          <h3 class="poster-title">${escapeHtml(group.title)}</h3>
        </div>
      </a>
    </article>
  `;
}

function render() {
  if (!collectionGrid) return;
  hideSkeleton();
  const filtered = getFilteredVideos();
  const groups   = groupVideos(filtered);

  const showCount = groups.length;
  const epCount   = filtered.length;
  if (count) count.textContent = `${showCount} ${showCount === 1 ? 'SHOW' : 'SHOWS'} · ${epCount} ${epCount === 1 ? 'EPISODE' : 'EPISODES'}`;

  if (archiveList) {
    archiveList.innerHTML = filtered.map(v => `
      <li class="archive-row">
        <span class="archive-row-title">${escapeHtml(v.title)}</span>
        <span class="archive-row-meta">${escapeHtml(v.collection)} · ${escapeHtml(v.fileType)} · ${escapeHtml(v.fileSize)} · ${escapeHtml(formatDate(v.dateAdded))}</span>
      </li>
    `).join('');
  }

  if (!groups.length) {
    collectionGrid.innerHTML = '<div class="empty">Nothing here yet.</div>';
    return;
  }
  collectionGrid.innerHTML = `<div class="poster-grid">${groups.map(posterCardHtml).join('')}</div>`;
}

function refreshArchive() {
  syncVideos();
  buildFilters();
  render();
  rebuildHero();
}

// ---------- Frame picker ----------
async function generateCoverFrames(videoUrl) {
  if (!videoUrl || !framePicker) return;
  framePicker.classList.add('visible');
  frameGrid.innerHTML = '<div class="file-note">Generating frames…</div>';
  generatedFrames = [];
  const video = document.createElement('video');
  video.src = videoUrl; video.muted = true; video.playsInline = true; video.preload = 'metadata';
  try {
    await new Promise((res, rej) => {
      video.addEventListener('loadedmetadata', res, { once: true });
      video.addEventListener('error', rej, { once: true });
    });
    const dur    = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const points = [0.12, 0.25, 0.4, 0.55, 0.72].map(p => Math.max(0.15, dur * p));
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width  = 640;
    canvas.height = Math.round(640 * (video.videoHeight || 720) / (video.videoWidth || 1280));
    for (const t of points) {
      await new Promise((res, rej) => {
        video.addEventListener('seeked', res, { once: true });
        video.addEventListener('error', rej, { once: true });
        video.currentTime = Math.min(Math.max(t, 0), Math.max(video.duration - 0.1, 0));
      });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      generatedFrames.push({ url: canvas.toDataURL('image/jpeg', 0.78), time: t });
    }
    renderFrameOptions();
  } catch (err) {
    frameGrid.innerHTML = `<div class="file-note">Could not generate frames.</div>`;
  } finally {
    video.removeAttribute('src'); video.load();
  }
}

function renderFrameOptions() {
  if (!generatedFrames.length) return;
  if (!selectedCoverUrl || selectedCoverUrl.startsWith('blob:')) {
    selectedCoverUrl = generatedFrames[Math.min(1, generatedFrames.length - 1)].url;
  }
  frameGrid.innerHTML = generatedFrames.map((f, i) => `
    <button class="frame-option ${f.url === selectedCoverUrl ? 'active' : ''}" type="button" data-i="${i}">
      <img src="${f.url}" alt="frame ${i + 1}">
    </button>`).join('');
  frameGrid.querySelectorAll('.frame-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCoverUrl = generatedFrames[Number(btn.dataset.i)].url;
      frameGrid.querySelectorAll('.frame-option').forEach(o => o.classList.toggle('active', o === btn));
    });
  });
}

// ---------- Form ----------
async function handleFormSubmit(e) {
  e.preventDefault();
  const title = titleInput?.value?.trim();
  if (!title) { if (formStatus) formStatus.textContent = 'A title is required.'; return; }
  const hostedUrl   = hostedUrlInput?.value?.trim();
  const downloadUrl = hostedUrl || selectedVideoUrl || '#';
  const isTemporary = !hostedUrl && Boolean(selectedVideoUrl);
  const newVideo = normalizeVideo({
    title, description: descriptionInput?.value?.trim() || '',
    collection: collectionInput?.value?.trim() || '', episode: episodeInput?.value?.trim() || '',
    category: categoryInput?.value?.trim() || 'Other', fileType: fileTypeInput?.value?.trim() || 'MP4',
    fileSize: fileSizeInput?.value?.trim() || '—', dateAdded: todayIso(),
    downloadUrl, coverUrl: selectedCoverUrl || '', temporary: isTemporary
  });
  if (isTemporary) {
    AppState.sessionVideos.push(newVideo);
    if (formStatus) formStatus.textContent = 'Added as device preview. Add a hosted URL to publish.';
  } else if (isAdminUnlocked()) {
    try {
      if (formStatus) formStatus.textContent = 'Saving…';
      const saved = await supabaseInsert(newVideo);
      AppState.baseVideos.unshift(saved);
      if (formStatus) formStatus.textContent = 'Saved.';
    } catch (err) {
      if (formStatus) formStatus.textContent = `Save failed: ${err.message}`;
      return;
    }
  } else {
    AppState.localVideos.push(newVideo);
    saveLocalVideos();
    if (formStatus) formStatus.textContent = 'Saved locally. Sign in as admin to publish.';
  }
  resetForm();
  refreshArchive();
}

function resetForm() {
  if (addVideoForm) addVideoForm.reset();
  if (selectedVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(selectedVideoUrl);
  selectedVideoUrl = ''; selectedCoverUrl = '';
  if (selectedFileText)  selectedFileText.textContent  = 'No file selected.';
  if (selectedCoverText) selectedCoverText.textContent = 'No cover selected.';
  if (autoGroupText)     autoGroupText.textContent     = 'Auto-grouping watches for names like Show Name S01E02.';
  if (coverSearchPanel)  coverSearchPanel.hidden        = true;
  if (framePicker)       framePicker.classList.remove('visible');
  generatedFrames = [];
}

// ---------- Cover search ----------
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function bestSearchQuery(title, collection) {
  if (collection?.trim()) return collection.trim();
  return (title || '').replace(/\s+S\d{1,2}\s*E\d{1,3}.*$/i, '').replace(/\s+(episode|ep)\s*\d+.*$/i, '').trim();
}

async function runCoverSearch(query) {
  if (!query) { if (coverSearchPanel) coverSearchPanel.hidden = true; return; }
  if (coverSearchPanel) coverSearchPanel.hidden = false;
  if (coverSearchStatus) coverSearchStatus.textContent = `Searching "${query}"…`;
  if (coverSearchResults) coverSearchResults.innerHTML = '';
  const results = await searchJikan(query);
  if (!results.length) { if (coverSearchStatus) coverSearchStatus.textContent = `No results for "${query}".`; return; }
  if (coverSearchStatus) coverSearchStatus.textContent = `Pick a cover for "${query}"`;
  if (coverSearchResults) {
    coverSearchResults.innerHTML = results.map((r, i) => `
      <button type="button" class="cover-search-result" data-i="${i}">
        <img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.title)}" loading="lazy">
        <span class="cover-search-result-title">${escapeHtml(r.title)}${r.year ? ' · ' + r.year : ''}</span>
      </button>`).join('');
    coverSearchResults.querySelectorAll('.cover-search-result').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = results[Number(btn.dataset.i)];
        selectedCoverUrl = r.image;
        if (selectedCoverText) selectedCoverText.textContent = `Cover: "${r.title}"`;
        coverSearchResults.querySelectorAll('.cover-search-result').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
  }
}

// ---------- Admin ----------
function updateAdminUi() {
  const unlocked = isAdminUnlocked();
  if (adminPanel)       adminPanel.hidden           = !unlocked;
  if (adminLoginButton) adminLoginButton.textContent = unlocked ? 'Sign Out' : 'Admin';
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
    updateAdminUi();
  } catch (err) {
    if (adminError) { adminError.textContent = err.message || 'Sign-in failed.'; adminError.hidden = false; }
    if (adminPasswordInput) { adminPasswordInput.value = ''; adminPasswordInput.focus(); }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// ---------- Theme toggle ----------
function wireThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.textContent = document.body.classList.contains('light') ? '☀' : '☾';
  btn.addEventListener('click', () => {
    const nowLight = !document.body.classList.contains('light');
    document.body.classList.toggle('light', nowLight);
    localStorage.setItem('aurum-theme', nowLight ? 'light' : 'dark');
    btn.textContent = nowLight ? '☀' : '☾';
  });
}

// ---------- Tabs ----------
function wireTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      const isDownload = tab.dataset.tab === 'download-index';
      if (collectionGrid)     collectionGrid.style.display     = isDownload ? 'none' : '';
      if (downloadIndexPanel) { downloadIndexPanel.style.display = isDownload ? 'block' : ''; if (isDownload) downloadIndexPanel.setAttribute('open', ''); }
    });
  });
}

// ---------- Hero slideshow (single-slide swap approach) ----------
let heroIndex   = 0;
let heroTimer   = null;
let heroFeature = [];
const HERO_INTERVAL    = 6000;
const BANNER_OVERRIDE_KEY = 'aurum-banner-overrides';

function loadBannerOverrides() {
  try { return JSON.parse(localStorage.getItem(BANNER_OVERRIDE_KEY) || '{}'); } catch { return {}; }
}
function saveBannerOverride(s, url) {
  const o = loadBannerOverrides(); o[s] = url; localStorage.setItem(BANNER_OVERRIDE_KEY, JSON.stringify(o));
}

function renderHeroSlideInto(el, idx) {
  const g         = heroFeature[idx];
  const overrides = loadBannerOverrides();
  const bannerUrl = overrides[g.slug] || g.firstCover;
  const desc      = g.videos[0]?.description || '';
  const adminBtns = isAdminUnlocked() ? `
    <button class="hero-banner-override" data-slug="${escapeHtml(g.slug)}" type="button">Set Banner</button>
    <button class="hero-delete-show danger" data-collection="${escapeHtml(g.title)}" type="button">Delete Show</button>
  ` : '';

  el.className    = 'hero-slide';
  el.dataset.slug = g.slug;
  el.innerHTML    = `
    <div class="hero-slide-bg" style="background-image:url('${escapeHtml(bannerUrl)}')"></div>
    <div class="hero-slide-gradient"></div>
    <div class="hero-slide-content">
      <img class="hero-slide-poster" src="${escapeHtml(g.firstCover)}" alt="${escapeHtml(g.title)}">
      <div class="hero-slide-info">
        <div class="hero-slide-cat">${escapeHtml((g.category || 'Other').toUpperCase())}</div>
        <h2 class="hero-slide-title">${escapeHtml(g.title)}</h2>
        ${desc ? `<p class="hero-slide-desc">${escapeHtml(desc)}</p>` : ''}
        <div class="hero-slide-actions">
          <a class="hero-slide-link" href="detail.html?show=${encodeURIComponent(g.slug)}">▶ Watch Now</a>
          ${adminBtns}
        </div>
      </div>
    </div>
  `;

  el.querySelector('.hero-banner-override')?.addEventListener('click', () => {
    const url = prompt('Enter banner image URL (wide, ~1900×500):');
    if (!url) return;
    saveBannerOverride(g.slug, url.trim());
    el.querySelector('.hero-slide-bg').style.backgroundImage = `url('${escapeHtml(url.trim())}')`;
  });
  el.querySelector('.hero-delete-show')?.addEventListener('click', async () => {
    if (!confirm(`Delete ALL videos in "${g.title}"? Cannot be undone.`)) return;
    try {
      await supabaseDeleteCollection(g.title);
      AppState.baseVideos = AppState.baseVideos.filter(v => v.collection !== g.title);
      refreshArchive();
    } catch (err) { alert(`Delete failed: ${err.message}`); }
  });

  if (!overrides[g.slug]) {
    fetchAniListBanner(g.title).then(result => {
      if (!result?.banner) return;
      const bg = el.querySelector('.hero-slide-bg');
      if (bg && heroIndex === idx) bg.style.backgroundImage = `url('${escapeHtml(result.banner)}')`;
    });
  }
}

function renderHeroSlide(idx) {
  const slidesEl = document.getElementById('heroSlides');
  if (!slidesEl) return;
  slidesEl.innerHTML = '';
  const slide = document.createElement('div');
  renderHeroSlideInto(slide, idx);
  slidesEl.appendChild(slide);
  document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

let _sliding = false;

function goToSlide(idx, direction) {
  if (_sliding || idx === heroIndex) return;
  const slidesEl = document.getElementById('heroSlides');
  if (!slidesEl) return;

  // Default direction: forward = left-to-right, backward = right-to-left
  if (direction === undefined) direction = idx > heroIndex ? 1 : -1;

  const fromSlide = slidesEl.querySelector('.hero-slide');
  heroIndex = idx;
  document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === idx));

  if (!fromSlide) { renderHeroSlide(idx); return; }

  // Build incoming slide off-screen
  const incoming = document.createElement('div');
  incoming.style.cssText = `position:absolute;inset:0;transform:translateX(${direction > 0 ? '100%' : '-100%'});will-change:transform;`;
  slidesEl.appendChild(incoming);
  renderHeroSlideInto(incoming, idx);

  _sliding = true;
  const DURATION = 520;
  const start    = performance.now();

  function step(now) {
    const p    = Math.min((now - start) / DURATION, 1);
    const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p; // ease-in-out
    fromSlide.style.transform = `translateX(${-direction * ease * 100}%)`;
    incoming.style.transform  = `translateX(${direction * (1 - ease) * 100}%)`;
    if (p < 1) { requestAnimationFrame(step); return; }
    // Done — replace from with incoming
    fromSlide.remove();
    incoming.style.transform = '';
    incoming.style.position  = '';
    incoming.style.cssText   = '';
    _sliding = false;
  }
  requestAnimationFrame(step);
}

function startHeroTimer() {
  stopHeroTimer();
  heroTimer = setInterval(() => goToSlide((heroIndex + 1) % heroFeature.length), HERO_INTERVAL);
}

function stopHeroTimer() {
  if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }
}

// Called once on init. Wires prev/next/dot buttons once only.
function buildHero(groups) {
  const section  = document.getElementById('heroSlideshow');
  const dotsEl   = document.getElementById('heroDots');
  if (!section || !dotsEl) return;

  heroFeature = groups.filter(g => g.firstCover).slice(0, 6);
  if (!heroFeature.length) { section.hidden = true; return; }
  section.hidden = false;
  heroIndex = 0;

  dotsEl.innerHTML = heroFeature.map((_, i) =>
    `<button class="hero-dot ${i === 0 ? 'active' : ''}" data-i="${i}" type="button"></button>`
  ).join('');

  dotsEl.querySelectorAll('.hero-dot').forEach(dot => {
    dot.addEventListener('click', () => { stopHeroTimer(); goToSlide(Number(dot.dataset.i)); startHeroTimer(); });
  });

  document.getElementById('heroPrev')?.addEventListener('click', () => {
    stopHeroTimer(); goToSlide((heroIndex - 1 + heroFeature.length) % heroFeature.length, -1); startHeroTimer();
  });
  document.getElementById('heroNext')?.addEventListener('click', () => {
    stopHeroTimer(); goToSlide((heroIndex + 1) % heroFeature.length, 1); startHeroTimer();
  });

  renderHeroSlide(0);
  startHeroTimer();
}

// Called on refreshArchive — updates featured list and re-renders current slide without re-wiring buttons
function rebuildHero() {
  const groups = groupVideos(AppState.videos);
  heroFeature  = groups.filter(g => g.firstCover).slice(0, 6);
  if (!heroFeature.length) {
    const section = document.getElementById('heroSlideshow');
    if (section) section.hidden = true;
    return;
  }
  heroIndex = Math.min(heroIndex, heroFeature.length - 1);
  renderHeroSlide(heroIndex);
}

// ---------- Nav: sign in / account ----------
function wireNavAuth() {
  const signInBtn   = document.getElementById('signInNavBtn');
  const accountLink = document.getElementById('accountLink');
  getCurrentUser().then(user => {
    if (user) {
      if (signInBtn)   signInBtn.style.display = 'none';
      if (accountLink) accountLink.hidden = false;
    } else {
      if (signInBtn)   { signInBtn.style.display = ''; signInBtn.addEventListener('click', () => window.location.href = 'account.html'); }
      if (accountLink) accountLink.hidden = true;
    }
  });
}

// ---------- Wire everything ----------
// ---------- Jikan episode name lookup ----------
const episodeCache = {}; // { malId: [{ mal_id, title, title_romanji }] }

async function fetchEpisodeList(malId) {
  if (episodeCache[malId]) return episodeCache[malId];
  const episodes = [];
  let page = 1;
  try {
    while (true) {
      const wait = Date.now() - (window._lastJikan || 0);
      if (wait < 400) await new Promise(r => setTimeout(r, 400 - wait));
      window._lastJikan = Date.now();
      const res  = await fetch(`https://api.jikan.moe/v4/anime/${malId}/episodes?page=${page}`);
      if (!res.ok) break;
      const data = await res.json();
      const items = data.data || [];
      episodes.push(...items);
      if (!data.pagination?.has_next_page) break;
      page++;
    }
  } catch (err) { console.warn('Episode fetch failed:', err); }
  episodeCache[malId] = episodes;
  return episodes;
}

async function autoFillEpisodeTitle() {
  const col = collectionInput?.value?.trim();
  const ep  = episodeInput?.value?.trim();
  if (!col || !ep) return;

  const epNum = parseInt(ep, 10);
  if (Number.isNaN(epNum) || epNum < 1) return;

  // Find the MAL id from the Jikan cache
  const cacheKey = col.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const cached   = AppState.jikanCache[cacheKey];
  let malId      = cached?.malId;

  if (!malId) {
    // Search for it
    try {
      const wait = Date.now() - (window._lastJikan || 0);
      if (wait < 400) await new Promise(r => setTimeout(r, 400 - wait));
      window._lastJikan = Date.now();
      const res  = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(col)}&limit=1&sfw=true`);
      const data = await res.json();
      malId = data.data?.[0]?.mal_id;
      if (malId && data.data?.[0]) {
        AppState.jikanCache[cacheKey] = {
          malId,
          title: data.data[0].title_english || data.data[0].title
        };
      }
    } catch (err) { console.warn('MAL search failed:', err); return; }
  }

  if (!malId) return;

  const episodes = await fetchEpisodeList(malId);
  const match    = episodes.find(e => e.mal_id === epNum);
  if (!match) return;

  const epTitle = match.title || match.title_romanji || '';
  if (!epTitle) return;

  // Set title as "Collection - Episode Name"
  if (titleInput) titleInput.value = `${col} - ${epTitle}`;
}

// ---------- Auto-fill form from URL ----------
async function autoFillFromUrl(url) {
  if (!url || !url.startsWith('http')) return;

  // Extract filename from URL
  let filename = '';
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    filename = decodeURIComponent(parts[parts.length - 1] || '');
  } catch { return; }

  if (!filename) return;

  // Detect format from extension
  const ext = filename.split('.').pop()?.toUpperCase() || 'MP4';
  if (fileTypeInput && !fileTypeInput.value) fileTypeInput.value = ext;

  // Detect category from extension
  const videoExts = ['MP4', 'MKV', 'AVI', 'MOV', 'WEBM', 'M4V', 'TS', 'OGV'];
  if (categoryInput && !categoryInput.value) {
    categoryInput.value = videoExts.includes(ext) ? 'Shows' : 'Other';
  }

  // Parse episode info from filename
  const parsed = parseEpisodeInfo(filename);

  if (collectionInput && !collectionInput.value && parsed.collection) {
    collectionInput.value = parsed.collection;
  }
  if (episodeInput && !episodeInput.value && parsed.episode) {
    // Store clean episode number (strip season prefix like "1.01" → "1")
    const epStr = String(parsed.episode);
    episodeInput.value = epStr.includes('.') ? String(parseInt(epStr.split('.')[1], 10)) : epStr;
  }

  // Try to fill title from Jikan using collection + episode
  if (collectionInput?.value && episodeInput?.value) {
    await autoFillEpisodeTitle();
  } else if (collectionInput?.value && titleInput && !titleInput.value) {
    titleInput.value = `${collectionInput.value} - `;
  }

  if (formStatus) formStatus.textContent = `Parsed: ${parsed.collection}${parsed.episode ? ` EP ${episodeInput?.value}` : ''}`;
}

function wireAll() {
  if (search) search.addEventListener('input', render);

  if (chooseVideoButton && videoFileInput) {
    chooseVideoButton.addEventListener('click', () => videoFileInput.click());
    videoFileInput.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (selectedVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(selectedVideoUrl);
      selectedVideoUrl = URL.createObjectURL(file);
      if (selectedFileText) selectedFileText.textContent = `${file.name} · ${formatBytes(file.size)}`;
      const parsed = parseEpisodeInfo(file.name);
      if (titleInput      && !titleInput.value)      titleInput.value      = parsed.title;
      if (collectionInput && !collectionInput.value)  collectionInput.value = parsed.collection;
      if (episodeInput    && !episodeInput.value)      episodeInput.value    = parsed.episode;
      if (fileSizeInput   && !fileSizeInput.value)     fileSizeInput.value   = formatBytes(file.size);
      if (fileTypeInput   && !fileTypeInput.value)     fileTypeInput.value   = (file.name.split('.').pop() || 'MP4').toUpperCase();
      if (autoGroupText) autoGroupText.textContent = `Auto-grouped under "${parsed.collection}".`;
      generateCoverFrames(selectedVideoUrl);
    });
  }

  if (chooseCoverButton && coverFileInput) {
    chooseCoverButton.addEventListener('click', () => coverFileInput.click());
    coverFileInput.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (selectedCoverUrl?.startsWith('blob:')) URL.revokeObjectURL(selectedCoverUrl);
      selectedCoverUrl = URL.createObjectURL(file);
      if (selectedCoverText) selectedCoverText.textContent = `${file.name}`;
    });
  }

  if (regenerateFramesButton) regenerateFramesButton.addEventListener('click', () => { if (selectedVideoUrl) generateCoverFrames(selectedVideoUrl); });
  if (addVideoForm)     addVideoForm.addEventListener('submit', handleFormSubmit);
  if (exportJsonButton) exportJsonButton.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify([...AppState.baseVideos, ...AppState.localVideos], null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'videos.json' });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 0);
  });
  if (clearLocalButton) clearLocalButton.addEventListener('click', () => {
    if (!confirm('Clear all locally added videos?')) return;
    AppState.localVideos = []; saveLocalVideos(); refreshArchive();
    if (formStatus) formStatus.textContent = 'Local library cleared.';
  });

  updateAdminUi();
  if (adminLoginButton) {
    adminLoginButton.addEventListener('click', () => {
      if (isAdminUnlocked()) { supabaseSignOut().then(updateAdminUi); }
      else openAdminDialog();
    });
  }
  if (adminCancelButton) adminCancelButton.addEventListener('click', closeAdminDialog);
  if (adminLoginForm)    adminLoginForm.addEventListener('submit', handleAdminSubmit);

  if (findCoverButton) findCoverButton.addEventListener('click', () => runCoverSearch(bestSearchQuery(titleInput?.value || '', collectionInput?.value || '')));
  const debounced = debounce(() => { const q = bestSearchQuery(titleInput?.value || '', collectionInput?.value || ''); if (q.length >= 3) runCoverSearch(q); }, 800);
  if (titleInput)      titleInput.addEventListener('input', debounced);
  if (collectionInput) {
    collectionInput.addEventListener('input', () => {
      debounced();
      const col = collectionInput.value.trim();
      if (!col) return;
      const prefix  = `${col} - `;
      const current = titleInput?.value || '';
      if (!current || /^.+ - /.test(current)) {
        const episodePart = current.replace(/^.+ - /, '');
        if (titleInput) titleInput.value = prefix + (episodePart === current ? '' : episodePart);
      }
      // Re-run episode lookup if episode number already filled
      if (episodeInput?.value?.trim()) autoFillEpisodeTitle();
    });
  }

  // Auto-fill from URL paste
  if (hostedUrlInput) {
    hostedUrlInput.addEventListener('input', () => autoFillFromUrl(hostedUrlInput.value.trim()));
    hostedUrlInput.addEventListener('paste', e => {
      // paste event fires before input value updates, so read from clipboard
      const pasted = (e.clipboardData || window.clipboardData)?.getData('text')?.trim();
      if (pasted) setTimeout(() => autoFillFromUrl(pasted), 0);
    });
  }

  // Auto-fill title from Jikan when episode number is entered
  if (episodeInput) {
    episodeInput.addEventListener('change', () => autoFillEpisodeTitle());
    episodeInput.addEventListener('blur',   () => autoFillEpisodeTitle());
  }

  wireThemeToggle();
  wireTabs();
}

// ---------- Bootstrap ----------
(async function init() {
  showSkeleton();
  await coreInit();
  hideSkeleton();
  buildFilters();
  render();
  buildHero(groupVideos(AppState.videos));
  wireAll();
  wireNavAuth();
})();
