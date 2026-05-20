// ============================================================
// Aurum — index.js
// ============================================================

// ---------- Theme ----------
(function() {
  document.body.classList.toggle('light', localStorage.getItem('aurum-theme') === 'light');
})();

// ---------- DOM refs ----------
const collectionGrid  = document.getElementById('collectionGrid');
const archiveList     = document.getElementById('archiveList');
const search          = document.getElementById('search');
const filters         = document.getElementById('filters');
const genreFilters    = document.getElementById('genreFilters');
const genreFiltersWrap = document.getElementById('genreFiltersWrap');
const recentlyAddedSection = document.getElementById('recentlyAdded');
const recentlyAddedGrid    = document.getElementById('recentlyAddedGrid');
const count           = document.getElementById('count');
const adminPanel      = document.getElementById('adminPanel');
const adminDialog     = document.getElementById('adminDialog');
const adminLoginForm  = document.getElementById('adminLoginForm');
const adminLoginButton  = document.getElementById('adminLoginButton');
const adminCancelButton = document.getElementById('adminCancelButton');
const adminEmailInput   = document.getElementById('adminEmailInput');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminError        = document.getElementById('adminError');
const formStatus        = document.getElementById('formStatus');
const skeletonGrid      = document.getElementById('skeletonGrid');
const downloadIndexPanel = document.getElementById('downloadIndexPanel');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = '© ' + new Date().getFullYear();

// ---------- State ----------
let activeCategory = 'all';
let activeGenre    = 'all';
let _ratingCache   = {}; // { collectionSlug: { average, count } }

// ---------- Skeleton ----------
function showSkeleton() {
  if (!skeletonGrid) return;
  skeletonGrid.innerHTML = Array(12).fill(0).map(() => `
    <div class="poster-card">
      <div class="skeleton skeleton-poster"></div>
      <div style="padding:0 2px;margin-top:10px">
        <div class="skeleton skeleton-line" style="width:40%;height:9px;margin-bottom:6px"></div>
        <div class="skeleton skeleton-line" style="height:13px;margin-bottom:4px"></div>
        <div class="skeleton skeleton-line" style="height:9px;width:55%"></div>
      </div>
    </div>
  `).join('');
}
function hideSkeleton() { if (skeletonGrid) skeletonGrid.innerHTML = ''; }

// ---------- Star rating display ----------
function starsHtml(rating, count) {
  if (!rating || !count) return '';
  const full  = Math.floor(rating);
  const half  = (rating % 1) >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  const stars = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  return `<div class="poster-rating" title="${rating} / 5 (${count} ${count === 1 ? 'rating' : 'ratings'})">${stars} <span class="poster-rating-count">${rating.toFixed(1)}</span></div>`;
}

// ---------- Filter / render ----------
// ---------- Genre definitions ----------
const GENRE_FILTERS = [
  'Action', 'Adventure', 'Action & Adventure', 'Romance', 'Drama',
  'Comedy', 'Fantasy', 'Sci-Fi', 'Horror', 'Mystery',
  'Psychological', 'Supernatural', 'Slice of Life', 'Isekai', 'Thriller'
];

const GENRE_TAG_MAP = {
  'Action':            ['action'],
  'Adventure':         ['adventure'],
  'Action & Adventure':['action','adventure'],
  'Romance':           ['romance'],
  'Drama':             ['drama'],
  'Comedy':            ['comedy'],
  'Fantasy':           ['fantasy'],
  'Sci-Fi':            ['sci-fi'],
  'Horror':            ['horror'],
  'Mystery':           ['mystery'],
  'Psychological':     ['psychological'],
  'Supernatural':      ['supernatural'],
  'Slice of Life':     ['slice of life'],
  'Isekai':            ['isekai'],
  'Thriller':          ['thriller'],
};

function getFilteredVideos() {
  const query = (search?.value || '').trim().toLowerCase();
  return AppState.videos.filter(video => {
    const matchCat = activeCategory === 'all' || video.category.toLowerCase() === activeCategory.toLowerCase();
    if (!matchCat) return false;

    // Genre filter — only filter out if we have tag data and it doesn't match
    if (activeGenre !== 'all') {
      const needed = GENRE_TAG_MAP[activeGenre] || [];
      const jikan  = AppState.jikanCache[slug(video.collection)];
      const raw    = jikan?.tags;
      // If no cache data yet, include the show (we don't know its tags)
      if (raw && raw.length > 0) {
        const DEMO = new Set(['shounen','seinen','shoujo','josei','kids']);
        const tags = raw.filter(t => !DEMO.has(t.toLowerCase())).map(t => t.toLowerCase());
        const match = needed.length === 1
          ? tags.includes(needed[0])
          : needed.every(n => tags.includes(n));
        if (!match) return false;
      }
    }

    if (!query) return true;
    return [video.title, video.description, video.collection, video.category].join(' ').toLowerCase().includes(query);
  });
}

function buildGenreFilters() {
  if (!genreFilters) return;
  genreFilters.innerHTML = GENRE_FILTERS.map(g =>
    `<button class="genre-chip ${g === activeGenre ? 'active' : ''}" data-genre="${escapeHtml(g)}" type="button">${escapeHtml(g)}</button>`
  ).join('');
  genreFilters.querySelectorAll('.genre-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeGenre = btn.dataset.genre === activeGenre ? 'all' : btn.dataset.genre;
      genreFilters.querySelectorAll('.genre-chip').forEach(c => c.classList.toggle('active', c.dataset.genre === activeGenre));
      render();
    });
  });
}

// ---------- Recently added ----------
function renderRecentlyAdded() {
  if (!recentlyAddedSection || !recentlyAddedGrid) return;
  const groups = groupVideos(AppState.videos);
  // Sort by most recent date_added across any episode in the group
  const sorted = [...groups].sort((a, b) => {
    const aDate = Math.max(...a.videos.map(v => new Date(v.dateAdded || 0).getTime()));
    const bDate = Math.max(...b.videos.map(v => new Date(v.dateAdded || 0).getTime()));
    return bDate - aDate;
  }).slice(0, 8);

  if (!sorted.length) { recentlyAddedSection.hidden = true; return; }
  recentlyAddedSection.hidden = false;
  recentlyAddedGrid.innerHTML = sorted.map(group => {
    const cover = group.firstCover
      ? `<img src="${escapeHtml(group.firstCover)}" alt="${escapeHtml(group.title)}" loading="lazy">`
      : `<div class="cover-placeholder">${escapeHtml(group.title.charAt(0))}</div>`;
    return `
      <a class="recent-card" href="detail.html?show=${encodeURIComponent(group.slug)}">
        <div class="recent-cover">${cover}</div>
        <div class="recent-title">${escapeHtml(group.title)}</div>
        <div class="recent-cat">${escapeHtml((group.category || 'Other').toUpperCase())}</div>
      </a>
    `;
  }).join('');
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
  const epCount  = group.videos.length;
  const ratingData = _ratingCache[group.slug];
  const ratingEl   = ratingData ? starsHtml(ratingData.average, ratingData.count) : '';
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
          ${ratingEl}
        </div>
      </a>
    </article>
  `;
}

function render() {
  if (!collectionGrid) return;
  hideSkeleton();
  const filtered = getFilteredVideos();
  const groups   = applyHeroOrder(groupVideos(filtered));
  const showCount = groups.length;
  const epCount   = filtered.length;
  if (count) count.textContent = `${showCount} ${showCount === 1 ? 'SHOW' : 'SHOWS'} · ${epCount} ${epCount === 1 ? 'EPISODE' : 'EPISODES'}`;
  if (!groups.length) { collectionGrid.innerHTML = '<div class="empty">Nothing here yet.</div>'; return; }
  collectionGrid.innerHTML = `<div class="poster-grid">${groups.map(posterCardHtml).join('')}</div>`;
  if (archiveList) {
    archiveList.innerHTML = filtered.map(v => `
      <li class="archive-row">
        <span class="archive-row-title">${escapeHtml(v.title)}</span>
        <span class="archive-row-meta">${escapeHtml(v.collection)} · ${escapeHtml(v.fileType)} · ${escapeHtml(formatDate(v.dateAdded))}</span>
      </li>`).join('');
  }
}

function refreshArchive() {
  syncVideos();
  buildFilters();
  buildGenreFilters();
  render();
  renderRecentlyAdded();
  rebuildHero();
}

// ---------- Load ratings for all groups in background ----------
async function loadRatings(groups) {
  for (const g of groups) {
    try {
      const data = await getRatingForCollection(g.title);
      if (data.count > 0) {
        _ratingCache[g.slug] = data;
        // Re-render that card with rating
        const card = collectionGrid?.querySelector(`[data-slug="${g.slug}"]`);
        if (card) card.outerHTML = posterCardHtml(g);
        else render(); // fallback full re-render
      }
    } catch { /* silent */ }
  }
}

// ---------- Episode name fixer ----------
const EP_GENERIC_RE = /^.+ - Episode \d+(\.\d+)?$/i;

function isGenericTitle(title) {
  return EP_GENERIC_RE.test(title.trim());
}

let _epFixerQueue = []; // { video, newTitle }

async function epFixerScan() {
  const status  = document.getElementById('epFixerStatus');
  const preview = document.getElementById('epFixerPreview');
  const runBtn  = document.getElementById('epFixerRunBtn');
  if (status)  status.textContent = 'Scanning…';
  if (preview) { preview.hidden = true; preview.innerHTML = ''; }
  if (runBtn)  runBtn.hidden = true;
  _epFixerQueue = [];

  const generic = AppState.baseVideos.filter(v => isGenericTitle(v.title));
  if (!generic.length) {
    if (status) status.textContent = 'No generic episode titles found — everything looks good!';
    return;
  }

  if (status) status.textContent = `Found ${generic.length} generic titles. Fetching episode names from MAL…`;

  // Group by collection so we only fetch each show once
  const byCollection = {};
  for (const v of generic) {
    if (!byCollection[v.collection]) byCollection[v.collection] = [];
    byCollection[v.collection].push(v);
  }

  for (const [collection, videos] of Object.entries(byCollection)) {
    try {
      // Get MAL ID first
      const search = await jikanRequest(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(collection)}&limit=1&sfw=true`);
      const malId  = search.data?.[0]?.mal_id;
      if (!malId) continue;

      // Fetch episodes list from Jikan
      await new Promise(r => setTimeout(r, 500));
      const epData = await jikanRequest(`https://api.jikan.moe/v4/anime/${malId}/episodes`);
      const epList = epData.data || [];

      for (const v of videos) {
        const epNum = parseFloat(String(v.episode));
        const match = epList.find(e => e.mal_id === epNum || e.mal_id === Math.floor(epNum));
        if (!match || !match.title) continue;
        const newTitle = `${v.collection} - ${match.title}`;
        _epFixerQueue.push({ video: v, newTitle });
      }
      await new Promise(r => setTimeout(r, 600));
    } catch { /* silent, try next show */ }
  }

  if (!_epFixerQueue.length) {
    if (status) status.textContent = `Found ${generic.length} generic titles but Jikan had no episode names for them. Try visiting each show's detail page first to cache their MAL data.`;
    return;
  }

  // Show preview
  if (preview) {
    preview.hidden = false;
    preview.innerHTML = `
      <div class="ep-fixer-count">${_epFixerQueue.length} of ${generic.length} episodes matched</div>
      <div class="ep-fixer-list">
        ${_epFixerQueue.slice(0, 20).map(({ video, newTitle }) => `
          <div class="ep-fixer-row">
            <span class="ep-fixer-old">${escapeHtml(video.title)}</span>
            <span class="ep-fixer-arrow">→</span>
            <span class="ep-fixer-new">${escapeHtml(newTitle)}</span>
          </div>
        `).join('')}
        ${_epFixerQueue.length > 20 ? `<div class="ep-fixer-more">…and ${_epFixerQueue.length - 20} more</div>` : ''}
      </div>
    `;
  }

  if (runBtn)  runBtn.hidden = false;
  if (status)  status.textContent = `Ready to update ${_epFixerQueue.length} episode names.`;
}

async function epFixerRun() {
  const status = document.getElementById('epFixerStatus');
  const runBtn = document.getElementById('epFixerRunBtn');
  if (!_epFixerQueue.length) return;
  if (runBtn) runBtn.disabled = true;
  if (status) status.textContent = `Updating 0 / ${_epFixerQueue.length}…`;

  let done = 0;
  for (const { video, newTitle } of _epFixerQueue) {
    try {
      await supabaseUpdate(video.id, { ...video, title: newTitle });
      const idx = AppState.baseVideos.findIndex(v => v.id === video.id);
      if (idx >= 0) AppState.baseVideos[idx] = { ...AppState.baseVideos[idx], title: newTitle };
      done++;
      if (status) status.textContent = `Updating ${done} / ${_epFixerQueue.length}…`;
    } catch { /* silent */ }
  }

  syncVideos();
  render();
  _epFixerQueue = [];
  if (runBtn)  { runBtn.hidden = true; runBtn.disabled = false; }
  if (status)  status.textContent = `Done — updated ${done} episode names.`;
}
function buildSlideshowManager() {
  const manager = document.getElementById('slideshowManager');
  if (!manager) return;
  const groups = groupVideos(AppState.videos);
  const order  = loadHeroOrder();

  manager.innerHTML = `
    <div class="slideshow-manager-grid">
      ${groups.map(g => {
        const rank = order[g.slug] ?? '';
        return `
          <div class="slideshow-row">
            <div class="slideshow-row-cover">
              ${g.firstCover ? `<img src="${escapeHtml(g.firstCover)}" alt="">` : `<div class="cover-placeholder" style="font-size:20px">${escapeHtml(g.title.charAt(0))}</div>`}
            </div>
            <div class="slideshow-row-title">${escapeHtml(g.title)}</div>
            <input
              class="slideshow-rank-input"
              type="number"
              min="1" max="6"
              placeholder="—"
              value="${escapeHtml(String(rank))}"
              data-slug="${escapeHtml(g.slug)}"
              data-title="${escapeHtml(g.title)}"
            >
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function saveSlideshowOrder() {
  const inputs = document.querySelectorAll('.slideshow-rank-input');
  const order  = {};
  inputs.forEach(input => {
    const val = parseInt(input.value, 10);
    if (!Number.isNaN(val) && val >= 1 && val <= 6) {
      order[input.dataset.slug] = val;
    }
  });
  saveHeroOrder(order);
  if (formStatus) formStatus.textContent = 'Slideshow order saved.';
  rebuildHero();
}

// ---------- Admin auth ----------
function updateAdminUi() {
  const unlocked = isAdminUnlocked();
  if (adminPanel)       adminPanel.hidden           = !unlocked;
  if (adminLoginButton) adminLoginButton.textContent = unlocked ? 'Sign Out' : 'Admin';
  if (unlocked) buildSlideshowManager();
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
    updateAdminUi();
  } catch (err) {
    if (adminError) { adminError.textContent = err.message || 'Sign-in failed.'; adminError.hidden = false; }
    if (adminPasswordInput) { adminPasswordInput.value = ''; adminPasswordInput.focus(); }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// ---------- Bulk metadata sync ----------
async function bulkAutoSaveMetadata() {
  if (!isAdminUnlocked()) return;
  const groups  = groupVideos(AppState.videos);
  const missing = groups.filter(g => g.videos.some(v => v.id && (!v.coverUrl || !v.description)));
  if (!missing.length) { if (formStatus) formStatus.textContent = 'All covers already synced.'; return; }
  if (formStatus) formStatus.textContent = `Syncing ${missing.length} shows…`;

  // Track used cover URLs to prevent duplicates across seasons of the same show
  const usedCovers = new Set(
    groups.filter(g => g.firstCover).map(g => g.firstCover)
  );

  for (const group of missing) {
    try {
      // Try with full title first (includes "Season 2" etc for better MAL match)
      let details = await fetchJikanDetailsExact(group.title);
      // Fall back to base title if no result
      if (!details) details = await fetchJikanDetails(group.title);
      if (!details) continue;

      // If this cover is already used by another show, try AniList for a unique one
      let coverUrl = details.image;
      if (coverUrl && usedCovers.has(coverUrl)) {
        const anilist = await fetchAniListBanner(group.title);
        if (anilist?.cover && !usedCovers.has(anilist.cover)) {
          coverUrl = anilist.cover;
        } else {
          // Skip cover update to avoid duplication, only update description
          coverUrl = null;
        }
      }
      if (coverUrl) usedCovers.add(coverUrl);

      const toUpdate = group.videos.filter(v => v.id && (!v.coverUrl || !v.description));
      for (const video of toUpdate) {
        const updates = { ...video };
        if (!video.coverUrl    && coverUrl)          updates.coverUrl    = coverUrl;
        if (!video.description && details.synopsis)  updates.description = details.synopsis;
        if (updates.coverUrl === video.coverUrl && updates.description === video.description) continue;
        try {
          const saved = await supabaseUpdate(video.id, updates);
          const idx   = AppState.baseVideos.findIndex(v => v.id === video.id);
          if (idx >= 0) AppState.baseVideos[idx] = saved;
          video.coverUrl    = saved.coverUrl;
          video.description = saved.description;
        } catch (err) { console.warn('Cover save failed:', video.title, err); }
      }
      syncVideos(); render(); rebuildHero();
    } catch (err) { console.warn('Jikan failed:', group.title, err); }
  }
  if (formStatus) formStatus.textContent = 'Sync complete.';
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

// ---------- Hero slideshow ----------
let heroIndex   = 0;
let heroTimer   = null;
let heroFeature = [];
let _sliding    = false;
const HERO_INTERVAL       = 6000;
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
  const rData     = _ratingCache[g.slug];
  const ratingEl  = rData ? `<div class="hero-rating">${starsHtml(rData.average, rData.count)}</div>` : '';
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
        ${ratingEl}
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

function goToSlide(idx, direction) {
  if (_sliding || idx === heroIndex) return;
  const slidesEl = document.getElementById('heroSlides');
  if (!slidesEl) return;
  if (direction === undefined) direction = idx > heroIndex ? 1 : -1;
  const fromSlide = slidesEl.querySelector('.hero-slide');
  heroIndex = idx;
  document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  if (!fromSlide) { renderHeroSlide(idx); return; }
  const incoming = document.createElement('div');
  incoming.style.cssText = `position:absolute;inset:0;transform:translateX(${direction > 0 ? '100%' : '-100%'});will-change:transform;`;
  slidesEl.appendChild(incoming);
  renderHeroSlideInto(incoming, idx);
  _sliding = true;
  const DURATION = 520;
  const start    = performance.now();
  function step(now) {
    const p    = Math.min((now - start) / DURATION, 1);
    const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    fromSlide.style.transform = `translateX(${-direction * ease * 100}%)`;
    incoming.style.transform  = `translateX(${direction * (1 - ease) * 100}%)`;
    if (p < 1) { requestAnimationFrame(step); return; }
    fromSlide.remove();
    incoming.style.cssText = '';
    _sliding = false;
  }
  requestAnimationFrame(step);
}

function startHeroTimer() { stopHeroTimer(); heroTimer = setInterval(() => goToSlide((heroIndex + 1) % heroFeature.length), HERO_INTERVAL); }
function stopHeroTimer()  { if (heroTimer) { clearInterval(heroTimer); heroTimer = null; } }

function buildHero(groups) {
  const section  = document.getElementById('heroSlideshow');
  const dotsEl   = document.getElementById('heroDots');
  if (!section || !dotsEl) return;
  heroFeature = applyHeroOrder(groups).filter(g => g.firstCover).slice(0, 6);
  if (!heroFeature.length) { section.hidden = true; return; }
  section.hidden = false;
  heroIndex = 0;
  dotsEl.innerHTML = heroFeature.map((_, i) =>
    `<button class="hero-dot ${i === 0 ? 'active' : ''}" data-i="${i}" type="button"></button>`
  ).join('');
  dotsEl.querySelectorAll('.hero-dot').forEach(dot => {
    dot.addEventListener('click', () => { stopHeroTimer(); goToSlide(Number(dot.dataset.i)); startHeroTimer(); });
  });
  document.getElementById('heroPrev')?.addEventListener('click', () => { stopHeroTimer(); goToSlide((heroIndex - 1 + heroFeature.length) % heroFeature.length, -1); startHeroTimer(); });
  document.getElementById('heroNext')?.addEventListener('click', () => { stopHeroTimer(); goToSlide((heroIndex + 1) % heroFeature.length, 1); startHeroTimer(); });
  renderHeroSlide(0);
  startHeroTimer();
}

function rebuildHero() {
  const groups = groupVideos(AppState.videos);
  heroFeature  = applyHeroOrder(groups).filter(g => g.firstCover).slice(0, 6);
  if (!heroFeature.length) { const s = document.getElementById('heroSlideshow'); if (s) s.hidden = true; return; }
  heroIndex = Math.min(heroIndex, heroFeature.length - 1);
  renderHeroSlide(heroIndex);
}

// ---------- Nav auth ----------
function wireNavAuth() {
  const signInBtn   = document.getElementById('signInNavBtn');
  const accountLink = document.getElementById('accountLink');
  getCurrentUser().then(user => {
    if (user) { if (signInBtn) signInBtn.style.display = 'none'; if (accountLink) accountLink.hidden = false; }
    else { if (signInBtn) { signInBtn.style.display = ''; signInBtn.onclick = () => window.location.href = 'account.html'; } if (accountLink) accountLink.hidden = true; }
  });
}

// ---------- Wire ----------
function wireAll() {
  if (search) search.addEventListener('input', render);

  // Mobile search toggle
  const mobileSearchBtn  = document.getElementById('mobileSearchBtn');
  const mobileSearchBar  = document.getElementById('mobileSearchBar');
  const mobileSearchInput = document.getElementById('mobileSearch');
  const mobileSearchClose = document.getElementById('mobileSearchClose');
  if (mobileSearchBtn && mobileSearchBar) {
    mobileSearchBtn.addEventListener('click', () => {
      mobileSearchBar.hidden = false;
      mobileSearchInput?.focus();
    });
    mobileSearchClose?.addEventListener('click', () => {
      mobileSearchBar.hidden = true;
      if (mobileSearchInput) { mobileSearchInput.value = ''; render(); }
    });
    mobileSearchInput?.addEventListener('input', () => {
      if (search) search.value = mobileSearchInput.value;
      render();
    });
  }

  updateAdminUi();
  if (adminLoginButton) {
    adminLoginButton.addEventListener('click', () => {
      if (isAdminUnlocked()) { supabaseSignOut().then(updateAdminUi); }
      else openAdminDialog();
    });
  }
  if (adminCancelButton) adminCancelButton.addEventListener('click', closeAdminDialog);
  if (adminLoginForm)    adminLoginForm.addEventListener('submit', handleAdminSubmit);

  document.getElementById('epFixerScanBtn')?.addEventListener('click', epFixerScan);
  document.getElementById('epFixerRunBtn')?.addEventListener('click', epFixerRun);

  document.getElementById('saveSlideshowBtn')?.addEventListener('click', saveSlideshowOrder);

  const syncMetaButton = document.getElementById('syncMetaButton');
  if (syncMetaButton) {
    syncMetaButton.addEventListener('click', async () => {
      syncMetaButton.disabled = true;
      syncMetaButton.textContent = 'Syncing…';
      await bulkAutoSaveMetadata();
      syncMetaButton.disabled = false;
      syncMetaButton.textContent = 'Sync All Covers';
    });
  }

  wireTabs();
  wireThemeToggle();
}

// ---------- Bootstrap ----------
(async function init() {
  showSkeleton();
  await coreInit();
  hideSkeleton();
  buildFilters();
  buildGenreFilters();
  render();
  renderRecentlyAdded();
  buildHero(groupVideos(AppState.videos));
  wireAll();
  wireNavAuth();

  // Load ratings in background
  const groups = groupVideos(AppState.videos);
  loadRatings(groups);

  // Fetch Jikan tags for all shows in background so genre filter works
  (async () => {
    const seenBase = new Set();
    for (const g of groups) {
      const base = g.title.replace(/\s+season\s+\d+/i,'').replace(/\s+part\s+\d+/i,'').replace(/\s+S\d+$/i,'').trim();
      if (seenBase.has(base)) continue;
      seenBase.add(base);
      if (AppState.jikanCache[slug(g.title)]) continue; // already cached
      try {
        await fetchJikanDetails(g.title);
        await new Promise(r => setTimeout(r, 600));
      } catch { /* silent */ }
    }
    // Re-render with full tag data
    render();
  })();
})();
