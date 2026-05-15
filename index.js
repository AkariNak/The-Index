// ============================================================
// index.html — poster grid + add-video form
// Depends on core.js
// ============================================================

// ---------- DOM refs ----------
const collectionGrid    = document.getElementById('collectionGrid');
const archiveList       = document.getElementById('archiveList');
const search            = document.getElementById('search');
const filters           = document.getElementById('filters');
const count             = document.getElementById('count');
const publicCount       = document.getElementById('publicCount');
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

const titleInput       = document.getElementById('titleInput');
const collectionInput  = document.getElementById('collectionInput');
const episodeInput     = document.getElementById('episodeInput');
const categoryInput    = document.getElementById('categoryInput');
const fileTypeInput    = document.getElementById('fileTypeInput');
const fileSizeInput    = document.getElementById('fileSizeInput');
const descriptionInput = document.getElementById('descriptionInput');
const hostedUrlInput   = document.getElementById('hostedUrlInput');

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

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = '© ' + new Date().getFullYear();

// ---------- Local state ----------
let activeCategory  = 'all';
let activeTab       = 'collections';
let selectedVideoUrl  = '';
let selectedCoverUrl  = '';
let generatedFrames   = [];

// ---------- Theme (dark by default) ----------
const THEME_KEY = 'the-index-theme';

function applyTheme(light) {
  document.body.classList.toggle('light', light);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = light ? '☀' : '☾';
}

function wireThemeToggle() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved === 'light');
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const nowLight = !document.body.classList.contains('light');
      applyTheme(nowLight);
      localStorage.setItem(THEME_KEY, nowLight ? 'light' : 'dark');
    });
  }
}

// ---------- Filter / render ----------
function getFilteredVideos() {
  const query = (search?.value || '').trim().toLowerCase();
  return AppState.videos.filter(video => {
    const matchesCategory = activeCategory === 'all' ||
      video.category.toLowerCase() === activeCategory.toLowerCase();
    if (!matchesCategory) return false;
    if (!query) return true;
    return [video.title, video.description, video.collection, video.category, video.fileType]
      .join(' ').toLowerCase().includes(query);
  });
}

function buildFilters() {
  if (!filters) return;
  const categories = ['all', ...new Set(AppState.videos.map(v => v.category).filter(Boolean))];
  filters.innerHTML = categories.map(c =>
    `<button class="chip ${c === activeCategory ? 'active' : ''}" data-category="${escapeHtml(c)}" type="button">${c === 'all' ? 'All' : escapeHtml(c)}</button>`
  ).join('');
  filters.querySelectorAll('.chip').forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      filters.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === button));
      render();
    });
  });
}

function posterCardHtml(group) {
  const cover = group.firstCover
    ? `<img src="${escapeHtml(group.firstCover)}" alt="${escapeHtml(group.title)} cover" loading="lazy">`
    : `<div class="cover-placeholder">${escapeHtml(group.title.charAt(0).toUpperCase())}</div>`;

  const epCount = group.videos.length;

  return `
    <article class="poster-card" data-collection="${escapeHtml(group.title)}">
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
  const filtered        = getFilteredVideos();
  const publicDownloads = filtered.filter(isPublicDownload).length;

  if (count)       count.textContent       = `SHOWING ${filtered.length} ${filtered.length === 1 ? 'ENTRY' : 'ENTRIES'}`;
  if (publicCount) publicCount.textContent = `${publicDownloads} PUBLIC DOWNLOADS`;

  const groups = groupVideos(filtered);
  if (!groups.length) {
    collectionGrid.innerHTML = '<div class="empty">Nothing here yet. Add a video to get started.</div>';
  } else {
    collectionGrid.innerHTML = `<div class="poster-grid">${groups.map(posterCardHtml).join('')}</div>`;
  }

  if (archiveList) {
    archiveList.innerHTML = filtered.map(v => `
      <li class="archive-row">
        <span class="archive-row-title">${escapeHtml(v.title)}</span>
        <span class="archive-row-meta">${escapeHtml(v.collection)} · ${escapeHtml(v.fileType)} · ${escapeHtml(v.fileSize)} · ${escapeHtml(formatDate(v.dateAdded))}</span>
      </li>
    `).join('');
  }
}

function refreshArchive() {
  syncVideos();
  buildFilters();
  render();
  const groups = groupVideos(AppState.videos);
  buildHero(groups);
}

// ---------- Frame picker ----------
async function generateCoverFrames(videoUrl) {
  if (!videoUrl || !framePicker) return;
  framePicker.classList.add('visible');
  frameGrid.innerHTML = '<div class="file-note">Generating frames…</div>';
  generatedFrames = [];

  const video = document.createElement('video');
  video.src = videoUrl; video.muted = true; video.playsInline = true; video.preload = 'metadata';

  function loadMeta() {
    return new Promise((res, rej) => {
      video.addEventListener('loadedmetadata', () => res(), { once: true });
      video.addEventListener('error', () => rej(new Error('Could not load video.')), { once: true });
    });
  }
  function seek(t) {
    return new Promise((res, rej) => {
      video.addEventListener('seeked', () => res(), { once: true });
      video.addEventListener('error', () => rej(new Error('Seek failed.')), { once: true });
      video.currentTime = Math.min(Math.max(t, 0), Math.max(video.duration - 0.1, 0));
    });
  }
  try {
    await loadMeta();
    const dur    = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const points = [0.12, 0.25, 0.4, 0.55, 0.72].map(p => Math.max(0.15, dur * p));
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d', { willReadFrequently: true });
    const sw     = video.videoWidth  || 1280;
    const sh     = video.videoHeight || 720;
    canvas.width  = 640;
    canvas.height = Math.round(640 * sh / sw);
    for (const t of points) {
      await seek(t);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      generatedFrames.push({ url: canvas.toDataURL('image/jpeg', 0.78), time: t });
    }
    renderFrameOptions();
  } catch (err) {
    frameGrid.innerHTML = `<div class="file-note">${escapeHtml(err.message)}</div>`;
  } finally {
    video.removeAttribute('src'); video.load();
  }
}

function renderFrameOptions() {
  if (!generatedFrames.length) { frameGrid.innerHTML = '<div class="file-note">No frames.</div>'; return; }
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

function handleVideoFileSelect(file) {
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
}

function handleCoverFileSelect(file) {
  if (!file) return;
  if (selectedCoverUrl?.startsWith('blob:')) URL.revokeObjectURL(selectedCoverUrl);
  selectedCoverUrl = URL.createObjectURL(file);
  if (selectedCoverText) selectedCoverText.textContent = `${file.name} · ${formatBytes(file.size)}`;
}

function findDuplicates(newVideo) {
  const existing = [...AppState.baseVideos, ...AppState.localVideos, ...AppState.sessionVideos];
  const reasons  = [];
  const titleMatch = existing.find(v => v.title.trim().toLowerCase() === newVideo.title.trim().toLowerCase());
  if (titleMatch) reasons.push(`exact title "${titleMatch.title}"`);
  if (newVideo.episode) {
    const epMatch = existing.find(v =>
      v.collection.trim().toLowerCase() === newVideo.collection.trim().toLowerCase() &&
      String(v.episode).trim() === String(newVideo.episode).trim()
    );
    if (epMatch && epMatch !== titleMatch) reasons.push(`episode ${epMatch.episode} of "${epMatch.collection}"`);
  }
  if (newVideo.downloadUrl && newVideo.downloadUrl !== '#' && !newVideo.downloadUrl.startsWith('blob:')) {
    const urlMatch = existing.find(v => v.downloadUrl === newVideo.downloadUrl);
    if (urlMatch && urlMatch !== titleMatch) reasons.push(`same hosted URL as "${urlMatch.title}"`);
  }
  return reasons;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const title = titleInput?.value?.trim();
  if (!title) { if (formStatus) formStatus.textContent = 'A title is required.'; return; }

  const hostedUrl   = hostedUrlInput?.value?.trim();
  const downloadUrl = hostedUrl || selectedVideoUrl || '#';
  const isTemporary = !hostedUrl && Boolean(selectedVideoUrl);

  const newVideo = normalizeVideo({
    title,
    description:  descriptionInput?.value?.trim() || '',
    collection:   collectionInput?.value?.trim()  || '',
    episode:      episodeInput?.value?.trim()      || '',
    category:     categoryInput?.value?.trim()     || 'Other',
    fileType:     fileTypeInput?.value?.trim()     || 'MP4',
    fileSize:     fileSizeInput?.value?.trim()     || '—',
    dateAdded:    todayIso(),
    downloadUrl,
    coverUrl:     selectedCoverUrl || '',
    temporary:    isTemporary
  });

  const dupes = findDuplicates(newVideo);
  if (dupes.length && !confirm(`Possible duplicate:\n\n• ${dupes.join('\n• ')}\n\nAdd anyway?`)) {
    if (formStatus) formStatus.textContent = 'Add cancelled.';
    return;
  }

  if (isTemporary) {
    AppState.sessionVideos.push(newVideo);
    if (formStatus) formStatus.textContent = 'Added as a device preview. Provide a hosted URL to publish it.';
  } else if (isAdminUnlocked()) {
    try {
      if (formStatus) formStatus.textContent = 'Saving…';
      const saved = await supabaseInsert(newVideo);
      AppState.baseVideos.unshift(saved);
      if (formStatus) formStatus.textContent = 'Saved to Supabase.';
    } catch (err) {
      console.error('Insert failed:', err);
      if (formStatus) formStatus.textContent = `Save failed: ${err.message}`;
      return;
    }
  } else {
    AppState.localVideos.push(newVideo);
    saveLocalVideos();
    if (formStatus) formStatus.textContent = 'Saved locally (log in as admin to publish).';
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

function handleExportJson() {
  const exportable = [...AppState.baseVideos, ...AppState.localVideos].map(v => {
    const o = { ...v };
    if (o.downloadUrl?.startsWith('blob:')) o.downloadUrl = '';
    if (o.coverUrl?.startsWith('blob:') || o.coverUrl?.startsWith('data:')) o.coverUrl = '';
    return o;
  });
  const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'videos.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function handleClearLocal() {
  if (!confirm('Clear all locally added videos? This only removes entries saved to this browser, not Supabase.')) return;
  AppState.localVideos = [];
  saveLocalVideos();
  refreshArchive();
  if (formStatus) formStatus.textContent = 'Local library cleared.';
}

// ---------- Cover search ----------
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function bestSearchQuery(title, collection) {
  if (collection && collection.trim()) return collection.trim();
  if (!title) return '';
  return title
    .replace(/\s+S\d{1,2}\s*E\d{1,3}.*$/i, '')
    .replace(/\s+\d{1,2}x\d{1,3}.*$/i, '')
    .replace(/\s+(episode|ep)\s*\d+.*$/i, '')
    .replace(/\s+-\s*\d+.*$/, '')
    .trim();
}

async function runCoverSearch(query) {
  if (!query) { if (coverSearchPanel) coverSearchPanel.hidden = true; return; }
  if (coverSearchPanel) coverSearchPanel.hidden = false;
  if (coverSearchStatus) coverSearchStatus.textContent = `Searching for "${query}"…`;
  if (coverSearchResults) coverSearchResults.innerHTML = '';
  const results = await searchJikan(query);
  if (!results.length) {
    if (coverSearchStatus) coverSearchStatus.textContent = `No results for "${query}".`;
    return;
  }
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
        if (selectedCoverText) selectedCoverText.textContent = `Cover set: "${r.title}"`;
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
    updateAdminUi();
  } catch (err) {
    if (adminError) { adminError.textContent = err.message || 'Sign-in failed.'; adminError.hidden = false; }
    if (adminPasswordInput) { adminPasswordInput.value = ''; adminPasswordInput.focus(); }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function handleAdminSignOut() {
  await supabaseSignOut();
  updateAdminUi();
}

// ---------- Tabs ----------
function wireTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      if (activeTab === 'download-index') {
        if (collectionGrid)     collectionGrid.style.display     = 'none';
        if (downloadIndexPanel) { downloadIndexPanel.style.display = 'block'; downloadIndexPanel.setAttribute('open', ''); }
      } else {
        if (collectionGrid)     collectionGrid.style.display     = '';
        if (downloadIndexPanel) downloadIndexPanel.style.display  = '';
      }
    });
  });
}

// ---------- Wire everything ----------
function wireAll() {
  if (search) search.addEventListener('input', render);

  if (chooseVideoButton && videoFileInput) {
    chooseVideoButton.addEventListener('click', () => videoFileInput.click());
    videoFileInput.addEventListener('change', e => handleVideoFileSelect(e.target.files?.[0]));
  }
  if (chooseCoverButton && coverFileInput) {
    chooseCoverButton.addEventListener('click', () => coverFileInput.click());
    coverFileInput.addEventListener('change', e => handleCoverFileSelect(e.target.files?.[0]));
  }
  if (regenerateFramesButton) {
    regenerateFramesButton.addEventListener('click', () => { if (selectedVideoUrl) generateCoverFrames(selectedVideoUrl); });
  }
  if (addVideoForm)     addVideoForm.addEventListener('submit', handleFormSubmit);
  if (exportJsonButton) exportJsonButton.addEventListener('click', handleExportJson);
  if (clearLocalButton) clearLocalButton.addEventListener('click', handleClearLocal);

  updateAdminUi();
  if (adminLoginButton) {
    adminLoginButton.addEventListener('click', () => {
      if (isAdminUnlocked()) handleAdminSignOut();
      else openAdminDialog();
    });
  }
  if (adminCancelButton) adminCancelButton.addEventListener('click', closeAdminDialog);
  if (adminLoginForm)    adminLoginForm.addEventListener('submit', handleAdminSubmit);

  if (findCoverButton) {
    findCoverButton.addEventListener('click', () => {
      runCoverSearch(bestSearchQuery(titleInput?.value || '', collectionInput?.value || ''));
    });
  }
  const debounced = debounce(() => {
    const q = bestSearchQuery(titleInput?.value || '', collectionInput?.value || '');
    if (q.length >= 3) runCoverSearch(q);
  }, 800);
  if (titleInput)      titleInput.addEventListener('input', debounced);
  if (collectionInput) collectionInput.addEventListener('input', debounced);

  wireTabs();
}

// ---------- Hero slideshow ----------
let heroIndex = 0;
let heroTimer = null;
const HERO_INTERVAL = 6000;

const BANNER_OVERRIDE_KEY = 'the-index-banner-overrides';
function loadBannerOverrides() {
  try { return JSON.parse(localStorage.getItem(BANNER_OVERRIDE_KEY) || '{}'); }
  catch { return {}; }
}
function saveBannerOverride(collSlug, url) {
  const o = loadBannerOverrides(); o[collSlug] = url;
  localStorage.setItem(BANNER_OVERRIDE_KEY, JSON.stringify(o));
}

function buildHero(groups) {
  const section  = document.getElementById('heroSlideshow');
  const slidesEl = document.getElementById('heroSlides');
  const dotsEl   = document.getElementById('heroDots');
  if (!section || !slidesEl || !dotsEl) return;

  const featured = groups.filter(g => g.firstCover).slice(0, 6);
  if (!featured.length) { section.hidden = true; return; }

  section.hidden = false;
  heroIndex = 0;
  stopHeroTimer();

  const overrides = loadBannerOverrides();

  function renderSlide(idx) {
    const g         = featured[idx];
    const bannerUrl = overrides[g.slug] || g.firstCover;
    const desc      = g.videos[0]?.description || '';
    const adminBtns = isAdminUnlocked() ? `
      <button class="hero-banner-override btn btn-small" data-slug="${escapeHtml(g.slug)}" type="button">Set Banner</button>
      <button class="hero-delete-show btn btn-small danger" data-collection="${escapeHtml(g.title)}" type="button">Delete Show</button>
    ` : '';

    slidesEl.innerHTML = `
      <div class="hero-slide" data-slug="${escapeHtml(g.slug)}" style="opacity:1">
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
      </div>
    `;

    // Wire admin buttons for this slide
    slidesEl.querySelector('.hero-banner-override')?.addEventListener('click', () => {
      const url = prompt('Enter a banner image URL (wide crop, ~1900×500):');
      if (!url) return;
      saveBannerOverride(g.slug, url.trim());
      slidesEl.querySelector('.hero-slide-bg').style.backgroundImage = `url('${escapeHtml(url.trim())}')`;
    });
    slidesEl.querySelector('.hero-delete-show')?.addEventListener('click', async () => {
      if (!confirm(`Delete ALL videos in "${g.title}" from Supabase? This cannot be undone.`)) return;
      try {
        await supabaseDeleteCollection(g.title);
        AppState.baseVideos = AppState.baseVideos.filter(v => v.collection !== g.title);
        refreshArchive();
      } catch (err) { alert(`Delete failed: ${err.message}`); }
    });

    // Fetch AniList banner in background if no override
    if (!overrides[g.slug]) {
      fetchAniListBanner(g.title).then(result => {
        if (!result?.banner) return;
        const bg = slidesEl.querySelector('.hero-slide-bg');
        if (bg && heroIndex === idx) bg.style.backgroundImage = `url('${escapeHtml(result.banner)}')`;
      });
    }
  }

  function goToSlide(idx) {
    heroIndex = idx;
    dotsEl.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === idx));

    // Fade out, swap content, fade in
    const slide = slidesEl.querySelector('.hero-slide');
    if (!slide) { renderSlide(idx); return; }
    slide.style.transition = 'opacity 0.35s ease';
    slide.style.opacity    = '0';
    setTimeout(() => {
      renderSlide(idx);
      const newSlide = slidesEl.querySelector('.hero-slide');
      if (newSlide) {
        newSlide.style.transition = 'opacity 0.35s ease';
        newSlide.style.opacity    = '0';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { newSlide.style.opacity = '1'; });
        });
      }
    }, 350);
  }

  // Build dots
  dotsEl.innerHTML = featured.map((_, i) =>
    `<button class="hero-dot ${i === 0 ? 'active' : ''}" data-i="${i}" type="button"></button>`
  ).join('');
  dotsEl.querySelectorAll('.hero-dot').forEach(dot => {
    dot.addEventListener('click', () => { stopHeroTimer(); goToSlide(Number(dot.dataset.i)); startHeroTimer(); });
  });

  document.getElementById('heroPrev')?.addEventListener('click', () => {
    stopHeroTimer();
    goToSlide((heroIndex - 1 + featured.length) % featured.length);
    startHeroTimer();
  });
  document.getElementById('heroNext')?.addEventListener('click', () => {
    stopHeroTimer();
    goToSlide((heroIndex + 1) % featured.length);
    startHeroTimer();
  });

  // Render first slide
  renderSlide(0);

  function startHeroTimer() {
    stopHeroTimer();
    heroTimer = setInterval(() => goToSlide((heroIndex + 1) % featured.length), HERO_INTERVAL);
  }
  startHeroTimer();
}

function stopHeroTimer() {
  if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }
}

// ---------- Bootstrap ----------
(async function init() {
  wireThemeToggle();
  await coreInit();
  buildFilters();
  render();
  const groups = groupVideos(AppState.videos);
  buildHero(groups);
  wireAll();
})();
