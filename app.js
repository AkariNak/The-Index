// ============================================================
// The Index — Personal Anime Archive
// ============================================================

// DOM Elements
const collectionGrid = document.getElementById('collectionGrid');
const archiveList = document.getElementById('archiveList');
const search = document.getElementById('search');
const filters = document.getElementById('filters');
const count = document.getElementById('count');
const publicCount = document.getElementById('publicCount');
const playerDialog = document.getElementById('playerDialog');
const playerVideo = document.getElementById('playerVideo');
const playerTitle = document.getElementById('playerTitle');
const closePlayerButton = document.getElementById('closePlayer');
const addVideoForm = document.getElementById('addVideoForm');
const exportJsonButton = document.getElementById('exportJsonButton');
const clearLocalButton = document.getElementById('clearLocalButton');
const formStatus = document.getElementById('formStatus');
const videoFileInput = document.getElementById('videoFileInput');
const coverFileInput = document.getElementById('coverFileInput');
const chooseVideoButton = document.getElementById('chooseVideoButton');
const chooseCoverButton = document.getElementById('chooseCoverButton');
const selectedFileText = document.getElementById('selectedFileText');
const selectedCoverText = document.getElementById('selectedCoverText');
const autoGroupText = document.getElementById('autoGroupText');
const framePicker = document.getElementById('framePicker');
const frameGrid = document.getElementById('frameGrid');
const regenerateFramesButton = document.getElementById('regenerateFramesButton');
const recommendationsPanel = document.getElementById('recommendationsPanel');
const downloadIndexPanel = document.getElementById('downloadIndexPanel');

// Form inputs
const titleInput = document.getElementById('titleInput');
const collectionInput = document.getElementById('collectionInput');
const episodeInput = document.getElementById('episodeInput');
const categoryInput = document.getElementById('categoryInput');
const fileTypeInput = document.getElementById('fileTypeInput');
const fileSizeInput = document.getElementById('fileSizeInput');
const descriptionInput = document.getElementById('descriptionInput');
const hostedUrlInput = document.getElementById('hostedUrlInput');

// Constants
const LOCAL_STORAGE_KEY = 'the-index-collections-local-videos';
const ADMIN_SESSION_KEY = 'the-index-admin-unlocked';
// SHA-256 hash of the admin password. The password itself is NOT in this file.
// To change the password, run this in any terminal:
//   echo -n "your-new-password" | shasum -a 256
// then paste the resulting hex string here.
const ADMIN_PASSWORD_HASH = '7d4557bc9cae7ddf417642d6b024076e680c1cb0aa6c21942ac619c58b20c05e';
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = '© ' + new Date().getFullYear();

// Admin DOM refs
const adminPanel = document.getElementById('adminPanel');
const adminDialog = document.getElementById('adminDialog');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginButton = document.getElementById('adminLoginButton');
const adminCancelButton = document.getElementById('adminCancelButton');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminError = document.getElementById('adminError');

// Edit dialog refs
const editDialog = document.getElementById('editDialog');
const editForm = document.getElementById('editForm');
const editCancelButton = document.getElementById('editCancelButton');
const editSourceNote = document.getElementById('editSourceNote');
const editTitle = document.getElementById('editTitle');
const editCollection = document.getElementById('editCollection');
const editEpisode = document.getElementById('editEpisode');
const editCategory = document.getElementById('editCategory');
const editFileType = document.getElementById('editFileType');
const editFileSize = document.getElementById('editFileSize');
const editDescription = document.getElementById('editDescription');
const editHostedUrl = document.getElementById('editHostedUrl');
const editCoverUrl = document.getElementById('editCoverUrl');
const editCoverFile = document.getElementById('editCoverFile');
const editCoverFileButton = document.getElementById('editCoverFileButton');
const editCoverPreview = document.getElementById('editCoverPreview');

// Cover dialog refs
const coverDialog = document.getElementById('coverDialog');
const coverForm = document.getElementById('coverForm');
const coverDialogTitle = document.getElementById('coverDialogTitle');
const coverUrlInput = document.getElementById('coverUrlInput');
const coverFileBulkInput = document.getElementById('coverFileBulkInput');
const coverFileBulkButton = document.getElementById('coverFileBulkButton');
const coverBulkPreview = document.getElementById('coverBulkPreview');
const coverCancelButton = document.getElementById('coverCancelButton');

// Edit state
let currentEditTarget = null; // { source: 'base'|'local'|'session', index: number }
let editCoverDataUrl = '';
let coverBulkDataUrl = '';
let coverBulkCollection = '';

// Cover search DOM refs
const findCoverButton = document.getElementById('findCoverButton');
const coverSearchPanel = document.getElementById('coverSearchPanel');
const coverSearchStatus = document.getElementById('coverSearchStatus');
const coverSearchResults = document.getElementById('coverSearchResults');

const editFindCoverButton = document.getElementById('editFindCoverButton');
const editCoverSearchPanel = document.getElementById('editCoverSearchPanel');
const editCoverSearchStatus = document.getElementById('editCoverSearchStatus');
const editCoverSearchResults = document.getElementById('editCoverSearchResults');

const bulkFindCoverButton = document.getElementById('bulkFindCoverButton');
const bulkCoverSearchPanel = document.getElementById('bulkCoverSearchPanel');
const bulkCoverSearchStatus = document.getElementById('bulkCoverSearchStatus');
const bulkCoverSearchResults = document.getElementById('bulkCoverSearchResults');

// State
let baseVideos = [];
let localVideos = [];
let sessionVideos = [];
let videos = [];
let activeCategory = 'all';
let activeTab = 'collections';
let selectedVideoUrl = '';
let selectedCoverUrl = '';
let generatedFrames = [];
let currentVideoSources = {};

// ============================================================
// Admin gate (client-side only — not real security)
// ============================================================

async function sha256Hex(text) {
  const encoded = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function isAdminUnlocked() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

function unlockAdmin() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
  if (adminPanel) adminPanel.hidden = false;
  if (adminLoginButton) adminLoginButton.textContent = 'Lock';
  render();
}

function lockAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  if (adminPanel) adminPanel.hidden = true;
  if (adminLoginButton) adminLoginButton.textContent = 'Admin';
  render();
}

function openAdminDialog() {
  if (!adminDialog) return;
  if (adminError) adminError.hidden = true;
  if (adminPasswordInput) adminPasswordInput.value = '';
  if (typeof adminDialog.showModal === 'function') {
    adminDialog.showModal();
  } else {
    adminDialog.setAttribute('open', '');
  }
  if (adminPasswordInput) adminPasswordInput.focus();
}

function closeAdminDialog() {
  if (!adminDialog) return;
  if (typeof adminDialog.close === 'function') {
    adminDialog.close();
  } else {
    adminDialog.removeAttribute('open');
  }
}

async function handleAdminSubmit(event) {
  event.preventDefault();
  const entered = adminPasswordInput?.value || '';
  const enteredHash = await sha256Hex(entered);
  if (enteredHash === ADMIN_PASSWORD_HASH) {
    unlockAdmin();
    closeAdminDialog();
  } else {
    if (adminError) adminError.hidden = false;
    if (adminPasswordInput) {
      adminPasswordInput.value = '';
      adminPasswordInput.focus();
    }
  }
}

function wireAdminGate() {
  if (isAdminUnlocked()) {
    unlockAdmin();
  }
  if (adminLoginButton) {
    adminLoginButton.addEventListener('click', () => {
      if (isAdminUnlocked()) {
        lockAdmin();
      } else {
        openAdminDialog();
      }
    });
  }
  if (adminCancelButton) {
    adminCancelButton.addEventListener('click', closeAdminDialog);
  }
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', handleAdminSubmit);
  }
}

// ============================================================
// Edit / delete / cover-change
// ============================================================

// Find a video and tell us which array it lives in.
function locateVideo(video) {
  let i = baseVideos.findIndex(v => v === video);
  if (i >= 0) return { source: 'base', index: i };
  i = localVideos.findIndex(v => v === video);
  if (i >= 0) return { source: 'local', index: i };
  i = sessionVideos.findIndex(v => v === video);
  if (i >= 0) return { source: 'session', index: i };
  return null;
}

function getSourceArray(source) {
  if (source === 'base') return baseVideos;
  if (source === 'local') return localVideos;
  return sessionVideos;
}

function openEditDialog(video) {
  const target = locateVideo(video);
  if (!target) return;
  currentEditTarget = target;
  editCoverDataUrl = '';

  if (editTitle) editTitle.value = video.title || '';
  if (editCollection) editCollection.value = video.collection || '';
  if (editEpisode) editEpisode.value = video.episode || '';
  if (editCategory) editCategory.value = video.category || 'Other';
  if (editFileType) editFileType.value = video.fileType || '';
  if (editFileSize) editFileSize.value = video.fileSize || '';
  if (editDescription) editDescription.value = video.description || '';
  if (editHostedUrl) editHostedUrl.value = video.downloadUrl && !video.downloadUrl.startsWith('blob:') && video.downloadUrl !== '#' ? video.downloadUrl : '';
  if (editCoverUrl) editCoverUrl.value = video.coverUrl && !video.coverUrl.startsWith('blob:') && !video.coverUrl.startsWith('data:') ? video.coverUrl : '';
  if (editCoverPreview) editCoverPreview.textContent = 'No new cover chosen.';

  if (editSourceNote) {
    if (target.source === 'base') {
      editSourceNote.textContent = 'This entry came from videos.json. Changes only stick if you Export videos.json and replace the file in your project.';
    } else if (target.source === 'local') {
      editSourceNote.textContent = 'This entry lives in your browser. Changes save automatically and persist across reloads.';
    } else {
      editSourceNote.textContent = 'This entry is a temporary session preview. Changes are lost on reload.';
    }
  }

  if (typeof editDialog.showModal === 'function') editDialog.showModal();
  else editDialog.setAttribute('open', '');
}

function closeEditDialog() {
  currentEditTarget = null;
  editCoverDataUrl = '';
  if (editCoverSearchPanel) editCoverSearchPanel.hidden = true;
  if (editCoverSearchResults) editCoverSearchResults.innerHTML = '';
  if (typeof editDialog.close === 'function') editDialog.close();
  else editDialog.removeAttribute('open');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

async function handleEditCoverFile(file) {
  if (!file) return;
  try {
    editCoverDataUrl = await readFileAsDataUrl(file);
    if (editCoverPreview) editCoverPreview.textContent = `New cover ready: ${file.name}`;
  } catch (err) {
    if (editCoverPreview) editCoverPreview.textContent = err.message;
  }
}

function handleEditSubmit(event) {
  event.preventDefault();
  if (!currentEditTarget) return;

  const arr = getSourceArray(currentEditTarget.source);
  const original = arr[currentEditTarget.index];
  if (!original) return;

  // Cover priority: uploaded file > URL field > existing cover
  let cover = original.coverUrl;
  if (editCoverDataUrl) cover = editCoverDataUrl;
  else if (editCoverUrl?.value?.trim()) cover = editCoverUrl.value.trim();

  // Hosted URL — if user provides one, swap it in. If they clear it, keep the old.
  const newHosted = editHostedUrl?.value?.trim();
  const newDownloadUrl = newHosted || original.downloadUrl;
  const newTemporary = newHosted ? false : original.temporary;

  const updated = normalizeVideo({
    ...original,
    title: editTitle?.value?.trim() || original.title,
    collection: editCollection?.value?.trim() || original.collection,
    episode: editEpisode?.value?.trim() || '',
    category: editCategory?.value?.trim() || original.category,
    fileType: editFileType?.value?.trim() || original.fileType,
    fileSize: editFileSize?.value?.trim() || original.fileSize,
    description: editDescription?.value?.trim() || '',
    downloadUrl: newDownloadUrl,
    coverUrl: cover,
    temporary: newTemporary
  });

  arr[currentEditTarget.index] = updated;
  if (currentEditTarget.source === 'local') saveLocalVideos();

  closeEditDialog();
  refreshArchive();
}

function handleDelete(video) {
  const target = locateVideo(video);
  if (!target) return;
  const arr = getSourceArray(target.source);
  const item = arr[target.index];
  const sourceLabel = target.source === 'base' ? ' (videos.json entry — export afterwards to make permanent)' : '';
  if (!confirm(`Delete "${item.title}"?${sourceLabel}`)) return;

  arr.splice(target.index, 1);
  if (target.source === 'local') saveLocalVideos();
  refreshArchive();
}

function openCoverDialog(collectionName) {
  coverBulkCollection = collectionName;
  coverBulkDataUrl = '';
  if (coverDialogTitle) coverDialogTitle.textContent = `Change cover for "${collectionName}"`;
  if (coverUrlInput) coverUrlInput.value = '';
  if (coverBulkPreview) coverBulkPreview.textContent = 'No new cover chosen.';
  if (typeof coverDialog.showModal === 'function') coverDialog.showModal();
  else coverDialog.setAttribute('open', '');
}

function closeCoverDialog() {
  coverBulkCollection = '';
  coverBulkDataUrl = '';
  if (bulkCoverSearchPanel) bulkCoverSearchPanel.hidden = true;
  if (bulkCoverSearchResults) bulkCoverSearchResults.innerHTML = '';
  if (typeof coverDialog.close === 'function') coverDialog.close();
  else coverDialog.removeAttribute('open');
}

async function handleCoverBulkFile(file) {
  if (!file) return;
  try {
    coverBulkDataUrl = await readFileAsDataUrl(file);
    if (coverBulkPreview) coverBulkPreview.textContent = `New cover ready: ${file.name}`;
  } catch (err) {
    if (coverBulkPreview) coverBulkPreview.textContent = err.message;
  }
}

function handleCoverSubmit(event) {
  event.preventDefault();
  const newCover = coverBulkDataUrl || coverUrlInput?.value?.trim();
  if (!newCover) {
    alert('Provide either an image file or a cover URL.');
    return;
  }
  if (!coverBulkCollection) return;

  const target = coverBulkCollection.trim().toLowerCase();
  const arrays = [
    { source: 'base', arr: baseVideos },
    { source: 'local', arr: localVideos },
    { source: 'session', arr: sessionVideos }
  ];
  let touchedLocal = false;
  let touchedBase = false;

  arrays.forEach(({ source, arr }) => {
    arr.forEach((v, i) => {
      if ((v.collection || '').trim().toLowerCase() === target) {
        arr[i] = { ...v, coverUrl: newCover };
        if (source === 'local') touchedLocal = true;
        if (source === 'base') touchedBase = true;
      }
    });
  });

  if (touchedLocal) saveLocalVideos();
  closeCoverDialog();
  refreshArchive();

  if (touchedBase) {
    alert('Updated. Note: some entries are from videos.json — Export videos.json and replace the file to make changes permanent for everyone.');
  }
}

function wireEditAndCover() {
  if (editForm) editForm.addEventListener('submit', handleEditSubmit);
  if (editCancelButton) editCancelButton.addEventListener('click', closeEditDialog);
  if (editCoverFileButton && editCoverFile) {
    editCoverFileButton.addEventListener('click', () => editCoverFile.click());
    editCoverFile.addEventListener('change', e => handleEditCoverFile(e.target.files?.[0]));
  }

  if (coverForm) coverForm.addEventListener('submit', handleCoverSubmit);
  if (coverCancelButton) coverCancelButton.addEventListener('click', closeCoverDialog);
  if (coverFileBulkButton && coverFileBulkInput) {
    coverFileBulkButton.addEventListener('click', () => coverFileBulkInput.click());
    coverFileBulkInput.addEventListener('change', e => handleCoverBulkFile(e.target.files?.[0]));
  }

  // Edit dialog: find cover online
  const pickEditCover = (result) => {
    if (editCoverUrl) editCoverUrl.value = result.image;
    editCoverDataUrl = ''; // URL takes priority over file
    if (editCoverPreview) editCoverPreview.textContent = `Cover set: "${result.title}"`;
  };
  if (editFindCoverButton) {
    editFindCoverButton.addEventListener('click', () => {
      const query = bestSearchQuery(editTitle?.value || '', editCollection?.value || '');
      runCoverSearch(query, editCoverSearchPanel, editCoverSearchStatus, editCoverSearchResults, pickEditCover);
    });
  }
  const debouncedEditSearch = debounce(() => {
    const query = bestSearchQuery(editTitle?.value || '', editCollection?.value || '');
    if (query.length >= 3) {
      runCoverSearch(query, editCoverSearchPanel, editCoverSearchStatus, editCoverSearchResults, pickEditCover);
    }
  }, 800);
  if (editTitle) editTitle.addEventListener('input', debouncedEditSearch);
  if (editCollection) editCollection.addEventListener('input', debouncedEditSearch);

  // Bulk cover dialog: find cover online
  const pickBulkCover = (result) => {
    if (coverUrlInput) coverUrlInput.value = result.image;
    coverBulkDataUrl = '';
    if (coverBulkPreview) coverBulkPreview.textContent = `Cover set: "${result.title}"`;
  };
  if (bulkFindCoverButton) {
    bulkFindCoverButton.addEventListener('click', () => {
      runCoverSearch(coverBulkCollection, bulkCoverSearchPanel, bulkCoverSearchStatus, bulkCoverSearchResults, pickBulkCover);
    });
  }
}

// ============================================================
// Jikan API — anime cover search
// ============================================================

const JIKAN_BASE = 'https://api.jikan.moe/v4/anime';
const JIKAN_CACHE = new Map();
let lastJikanCall = 0;

async function searchJikan(query) {
  if (!query || query.trim().length < 2) return [];

  const key = query.trim().toLowerCase();
  if (JIKAN_CACHE.has(key)) return JIKAN_CACHE.get(key);

  // Respect Jikan's rate limit: ~3 requests/sec
  const sinceLast = Date.now() - lastJikanCall;
  if (sinceLast < 400) await new Promise(r => setTimeout(r, 400 - sinceLast));
  lastJikanCall = Date.now();

  const url = `${JIKAN_BASE}?q=${encodeURIComponent(query)}&limit=8&sfw=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Jikan ${res.status}`);
    const data = await res.json();
    const results = (data.data || []).map(item => ({
      title: item.title,
      year: item.year,
      type: item.type,
      image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || ''
    })).filter(r => r.image);
    JIKAN_CACHE.set(key, results);
    return results;
  } catch (err) {
    console.warn('Jikan search failed:', err);
    return [];
  }
}

// Search title field uses this; collection title also a fallback.
function bestSearchQuery(title, collection) {
  // Strip episode markers from title so "Lain S01E06" searches as "Lain"
  if (collection && collection.trim()) return collection.trim();
  if (!title) return '';
  return title
    .replace(/\s+S\d{1,2}\s*E\d{1,3}.*$/i, '')
    .replace(/\s+\d{1,2}x\d{1,3}.*$/i, '')
    .replace(/\s+(episode|ep)\s*\d+.*$/i, '')
    .replace(/\s+-\s*\d+.*$/, '')
    .trim();
}

function renderCoverSearchResults(panel, resultsContainer, results, onPick) {
  if (!results.length) {
    resultsContainer.innerHTML = '<div class="file-note">No results found.</div>';
    return;
  }
  resultsContainer.innerHTML = results.map((r, i) => `
    <button type="button" class="cover-search-result" data-i="${i}" title="${escapeHtml(r.title)}">
      <img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.title)}" loading="lazy">
      <span class="cover-search-result-title">${escapeHtml(r.title)}${r.year ? ' · ' + r.year : ''}</span>
    </button>
  `).join('');
  resultsContainer.querySelectorAll('.cover-search-result').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = results[Number(btn.dataset.i)];
      resultsContainer.querySelectorAll('.cover-search-result').forEach(b => b.classList.toggle('active', b === btn));
      onPick(r);
    });
  });
}

// Debounce helper
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

async function runCoverSearch(query, panel, statusEl, resultsEl, onPick) {
  if (!query) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  statusEl.textContent = `Searching for "${query}"…`;
  resultsEl.innerHTML = '';
  const results = await searchJikan(query);
  if (!results.length) {
    statusEl.textContent = `No results for "${query}".`;
    resultsEl.innerHTML = '';
    return;
  }
  statusEl.textContent = `Pick a cover for "${query}"`;
  renderCoverSearchResults(panel, resultsEl, results, onPick);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${units[i]}`;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function secondsToLabel(seconds) {
  const total = Math.max(0, Math.round(seconds || 0));
  const minutes = Math.floor(total / 60);
  const remaining = String(total % 60).padStart(2, '0');
  return `${minutes}:${remaining}`;
}

function stripExtension(name) {
  return String(name || '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// Metadata parsing
// ============================================================

function parseAnimeMetadata(title) {
  const seasonMatch = title.match(/S(\d{1,2})/i);
  const episodeMatch = title.match(/E(\d{1,3})/i);
  const typeMatch = title.match(/\b(Movie|OVA|Special|ONA)\b/i);
  return {
    season: seasonMatch ? parseInt(seasonMatch[1], 10) : 1,
    episode: episodeMatch ? parseInt(episodeMatch[1], 10) : 0,
    type: typeMatch ? typeMatch[1] : 'Episode'
  };
}

function parseEpisodeInfo(rawName) {
  const name = stripExtension(rawName);
  let episode = '';
  let collection = name;
  const animeMeta = parseAnimeMetadata(name);

  const patterns = [
    /^(.*?)\s+[sS](\d{1,2})\s*[eE](\d{1,3})(?:\s+.*)?$/,
    /^(.*?)\s+(\d{1,2})x(\d{1,3})(?:\s+.*)?$/i,
    /^(.*?)\s+(?:episode|ep)\s*(\d{1,3})(?:\s+.*)?$/i,
    /^(.*?)\s+-\s*(\d{1,3})(?:\s+.*)?$/,
    /^(.*?)\s+(\d{1,3})(?:\s+.*)?$/
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (!match) continue;
    collection = match[1].trim();
    if (match.length >= 4) {
      episode = `${Number(match[2])}.${String(match[3]).padStart(2, '0')}`;
    } else {
      episode = String(match[match.length - 1]).padStart(2, '0');
    }
    break;
  }

  collection = collection || name;
  return {
    title: name,
    collection,
    episode,
    season: animeMeta.season,
    type: animeMeta.type
  };
}

// ============================================================
// Frame generation
// ============================================================

function seekVideo(video, time) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
    const onSeeked = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('Could not read that frame.')); };
    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.currentTime = Math.min(Math.max(time, 0), Math.max(video.duration - 0.1, 0));
  });
}

function loadVideoMetadata(video) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
    };
    const onLoaded = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('Could not load video metadata.')); };
    video.addEventListener('loadedmetadata', onLoaded, { once: true });
    video.addEventListener('error', onError, { once: true });
  });
}

async function generateCoverFrames(videoUrl) {
  if (!videoUrl || !framePicker) return;
  framePicker.classList.add('visible');
  frameGrid.innerHTML = '<div class="file-note">Generating frames…</div>';
  generatedFrames = [];

  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';

  try {
    await loadVideoMetadata(video);
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const samplePoints = [0.12, 0.25, 0.4, 0.55, 0.72].map(p => Math.max(0.15, duration * p));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const sw = video.videoWidth || 1280;
    const sh = video.videoHeight || 720;
    const tw = 640;
    const th = Math.round(tw * sh / sw);
    canvas.width = tw;
    canvas.height = th;

    for (const time of samplePoints) {
      await seekVideo(video, time);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      generatedFrames.push({ url: canvas.toDataURL('image/jpeg', 0.78), time });
    }
    renderFrameOptions();
  } catch (error) {
    frameGrid.innerHTML = `<div class="file-note">${escapeHtml(error.message)} You can still choose a cover image manually.</div>`;
  } finally {
    video.removeAttribute('src');
    video.load();
  }
}

function renderFrameOptions() {
  if (!generatedFrames.length) {
    frameGrid.innerHTML = '<div class="file-note">No frames generated.</div>';
    return;
  }
  if (!selectedCoverUrl || selectedCoverUrl.startsWith('blob:')) {
    selectedCoverUrl = generatedFrames[Math.min(1, generatedFrames.length - 1)].url;
    if (selectedCoverText) selectedCoverText.textContent = 'Generated frame selected. You can choose another below.';
  }
  frameGrid.innerHTML = generatedFrames.map((frame, index) => `
    <button class="frame-option ${frame.url === selectedCoverUrl ? 'active' : ''}" type="button" data-index="${index}" aria-label="Use frame at ${secondsToLabel(frame.time)} as cover">
      <img src="${frame.url}" alt="Generated video frame ${index + 1}">
      <span class="frame-time">${secondsToLabel(frame.time)}</span>
    </button>`).join('');

  frameGrid.querySelectorAll('.frame-option').forEach(button => {
    button.addEventListener('click', () => {
      const frame = generatedFrames[Number(button.dataset.index)];
      selectedCoverUrl = frame.url;
      if (selectedCoverText) selectedCoverText.textContent = `Generated frame selected at ${secondsToLabel(frame.time)}.`;
      frameGrid.querySelectorAll('.frame-option').forEach(o => o.classList.toggle('active', o === button));
    });
  });
}

function resetFramePicker() {
  generatedFrames = [];
  if (frameGrid) frameGrid.innerHTML = '';
  if (framePicker) framePicker.classList.remove('visible');
}

// ============================================================
// Normalize / sync / persistence
// ============================================================

function normalizeVideo(video) {
  const title = video.title || 'Untitled';
  // Only parse from title if collection is missing — prevents re-parsing on every sync.
  const parsed = video.collection ? null : parseEpisodeInfo(title);
  return {
    title,
    description: video.description || '',
    collection: video.collection || video.show || video.series || (parsed && parsed.collection) || 'Unsorted',
    episode: video.episode || (parsed && parsed.episode) || '',
    category: video.category || 'Other',
    fileType: video.fileType || video.format || 'MP4',
    fileSize: video.fileSize || video.size || '—',
    dateAdded: video.dateAdded || video.created_at || todayIso(),
    downloadUrl: video.downloadUrl || video.video_url || video.url || '#',
    coverUrl: video.coverUrl || video.cover_url || '',
    temporary: Boolean(video.temporary),
    season: video.season || (parsed && parsed.season) || 1,
    type: video.type || (parsed && parsed.type) || 'Episode',
    sources: video.sources || null
  };
}

function syncVideos() {
  videos = [...baseVideos, ...localVideos, ...sessionVideos]
    .sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
}

function saveLocalVideos() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localVideos));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

function loadLocalVideos() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    localVideos = Array.isArray(saved) ? saved.map(normalizeVideo) : [];
  } catch {
    localVideos = [];
  }
}

// ============================================================
// Filtering / grouping
// ============================================================

function getFilteredVideos() {
  const query = (search?.value || '').trim().toLowerCase();
  return videos.filter(video => {
    const matchesCategory = activeCategory === 'all' || video.category.toLowerCase() === activeCategory.toLowerCase();
    if (!matchesCategory) return false;
    if (!query) return true;
    return [video.title, video.description, video.collection, video.category, video.fileType]
      .join(' ').toLowerCase().includes(query);
  });
}

function groupVideos(videoList) {
  const map = new Map();
  videoList.forEach(video => {
    const key = slug(video.collection) || 'unsorted';
    if (!map.has(key)) {
      map.set(key, {
        title: video.collection || 'Unsorted',
        category: video.category,
        videos: [],
        firstCover: video.coverUrl || ''
      });
    }
    const group = map.get(key);
    group.videos.push(video);
    // Pick the earliest non-empty cover as the group cover.
    if (!group.firstCover && video.coverUrl) group.firstCover = video.coverUrl;
  });
  return [...map.values()].map(group => {
    group.videos.sort((a, b) => {
      const an = parseFloat(String(a.episode).replace(/[^0-9.]/g, ''));
      const bn = parseFloat(String(b.episode).replace(/[^0-9.]/g, ''));
      if (!Number.isNaN(an) && !Number.isNaN(bn) && an !== bn) return an - bn;
      return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
    });
    return group;
  }).sort((a, b) => a.title.localeCompare(b.title));
}

function buildFilters() {
  if (!filters) return;
  const categories = ['all', ...new Set(videos.map(v => v.category).filter(Boolean))];
  filters.innerHTML = categories.map(c => `
    <button class="chip ${c === activeCategory ? 'active' : ''}" data-category="${escapeHtml(c)}" type="button">${c === 'all' ? 'All' : escapeHtml(c)}</button>
  `).join('');
  filters.querySelectorAll('.chip').forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      filters.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === button));
      render();
    });
  });
}

function isPublicDownload(video) {
  return video.downloadUrl
    && video.downloadUrl !== '#'
    && !video.temporary
    && !video.downloadUrl.startsWith('blob:');
}

// ============================================================
// Rendering — collection-grouped editorial layout
// ============================================================

function episodeRowHtml(video) {
  const ep = video.episode || '—';
  const previewNote = isPublicDownload(video) ? '' : '· LOCAL PREVIEW ONLY';
  // Use the array index from `videos` so we don't depend on title uniqueness
  const idx = videos.indexOf(video);
  const adminControls = isAdminUnlocked() ? `
    <button class="btn btn-outline btn-small edit-btn" type="button" title="Edit">Edit</button>
    <button class="btn btn-outline btn-small delete-btn" type="button" title="Delete">Delete</button>
  ` : '';
  return `
    <div class="episode-row" data-idx="${idx}">
      <div class="episode-num">
        <small>EP</small>
        ${escapeHtml(ep)}
      </div>
      <div class="episode-info">
        <h4 class="episode-title">${escapeHtml(video.title)}</h4>
        <div class="episode-meta">${escapeHtml(video.fileType)} · ${escapeHtml(video.fileSize)} · ${escapeHtml(formatDate(video.dateAdded))} ${previewNote}</div>
      </div>
      <div class="episode-actions">
        <button class="btn btn-outline btn-small play-btn" type="button">Play</button>
        ${adminControls}
      </div>
    </div>
  `;
}

function posterCardHtml(group, expanded) {
  const cover = group.firstCover
    ? `<img src="${escapeHtml(group.firstCover)}" alt="${escapeHtml(group.title)} cover" loading="lazy">`
    : `<div class="cover-placeholder">${escapeHtml(group.title.charAt(0).toUpperCase())}</div>`;
  const adminCoverOverlay = isAdminUnlocked() ? `
    <button class="cover-edit-btn" type="button" data-collection="${escapeHtml(group.title)}" title="Change cover">Change Cover</button>
  ` : '';
  return `
    <article class="poster-card ${expanded ? 'expanded' : ''}" data-collection="${escapeHtml(group.title)}">
      <button class="poster-clickable" type="button" data-collection="${escapeHtml(group.title)}">
        <div class="poster-cover">
          ${cover}
          <div class="poster-overlay">
            <span class="poster-play-icon">▶</span>
          </div>
        </div>
        <div class="poster-info">
          <div class="poster-cat">${escapeHtml((group.category || 'Other').toUpperCase())}</div>
          <h3 class="poster-title">${escapeHtml(group.title)}</h3>
          <div class="poster-count">${group.videos.length} ${group.videos.length === 1 ? 'entry' : 'entries'}</div>
        </div>
      </button>
      ${adminCoverOverlay}
    </article>
  `;
}

function expandedEpisodesHtml(group) {
  return `
    <section class="expanded-episodes" data-collection="${escapeHtml(group.title)}">
      <div class="expanded-head">
        <h2>${escapeHtml(group.title)}</h2>
        <button class="expanded-close" type="button" aria-label="Close">×</button>
      </div>
      <div class="episode-list">
        ${group.videos.map(episodeRowHtml).join('')}
      </div>
    </section>
  `;
}

// Track which collection is expanded
let expandedCollection = null;

function render() {
  if (!collectionGrid) return;
  const filtered = getFilteredVideos();
  const publicDownloads = filtered.filter(isPublicDownload).length;

  if (count) count.textContent = `SHOWING ${filtered.length} ${filtered.length === 1 ? 'ENTRY' : 'ENTRIES'}`;
  if (publicCount) publicCount.textContent = `${publicDownloads} PUBLIC DOWNLOADS`;

  const groups = groupVideos(filtered);

  if (!groups.length) {
    collectionGrid.innerHTML = '<div class="empty">Nothing here yet. Add a video below to get started.</div>';
  } else {
    // Render poster grid; if a collection is expanded, render its episodes right after that card.
    let html = '<div class="poster-grid">';
    let expandedGroup = null;
    groups.forEach(group => {
      const isExpanded = expandedCollection && slug(expandedCollection) === slug(group.title);
      if (isExpanded) expandedGroup = group;
      html += posterCardHtml(group, isExpanded);
    });
    html += '</div>';
    if (expandedGroup) {
      html += expandedEpisodesHtml(expandedGroup);
    }
    collectionGrid.innerHTML = html;
  }

  if (archiveList) {
    archiveList.innerHTML = filtered.map(v => `
      <li class="archive-row">
        <span class="archive-row-title">${escapeHtml(v.title)}</span>
        <span class="archive-row-meta">${escapeHtml(v.collection)} · ${escapeHtml(v.fileType)} · ${escapeHtml(v.fileSize)} · ${escapeHtml(formatDate(v.dateAdded))}</span>
      </li>
    `).join('');
  }

  // Wire poster cards — clicking toggles which collection is expanded
  collectionGrid.querySelectorAll('.poster-clickable').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.collection;
      expandedCollection = (expandedCollection && slug(expandedCollection) === slug(name)) ? null : name;
      render();
      // Scroll to expanded section
      if (expandedCollection) {
        setTimeout(() => {
          const section = collectionGrid.querySelector('.expanded-episodes');
          if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    });
  });

  // Close button on expanded section
  const closeBtn = collectionGrid.querySelector('.expanded-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      expandedCollection = null;
      render();
    });
  }

  // Wire up episode controls (Play / Edit / Delete) inside the expanded section
  collectionGrid.querySelectorAll('.episode-row').forEach(row => {
    const idx = Number(row.dataset.idx);
    const video = videos[idx];
    const playBtn = row.querySelector('.play-btn');
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');
    if (playBtn && video) playBtn.addEventListener('click', () => openPlayer(video));
    if (editBtn && video) editBtn.addEventListener('click', () => openEditDialog(video));
    if (deleteBtn && video) deleteBtn.addEventListener('click', () => handleDelete(video));
  });

  // Wire cover change buttons (admin only)
  collectionGrid.querySelectorAll('.cover-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openCoverDialog(btn.dataset.collection);
    });
  });
}

function refreshArchive() {
  syncVideos();
  buildFilters();
  render();
}

// ============================================================
// Player + quality selector
// ============================================================

function ensureQualitySelector() {
  if (document.getElementById('qualitySelector')) return document.getElementById('qualitySelector');
  const playerBody = playerVideo?.parentElement;
  if (!playerBody) return null;

  const container = document.createElement('div');
  container.className = 'quality-bar';

  const label = document.createElement('label');
  label.textContent = 'Quality:';
  label.htmlFor = 'qualitySelector';

  const select = document.createElement('select');
  select.id = 'qualitySelector';

  container.appendChild(label);
  container.appendChild(select);
  playerBody.insertBefore(container, playerVideo);

  select.addEventListener('change', () => {
    const quality = select.value;
    const src = currentVideoSources[quality];
    if (!src) return;
    const time = playerVideo.currentTime;
    const wasPlaying = !playerVideo.paused;
    playerVideo.src = src;
    playerVideo.load();
    playerVideo.addEventListener('loadedmetadata', () => {
      playerVideo.currentTime = time;
      if (wasPlaying) playerVideo.play().catch(() => {});
    }, { once: true });
  });

  return select;
}

function populateQualitySelector(sources, defaultQuality) {
  const select = ensureQualitySelector();
  if (!select) return;
  const qualities = Object.keys(sources);
  if (!qualities.length || (qualities.length === 1 && qualities[0] === 'default')) {
    select.parentElement.style.display = 'none';
    return;
  }
  select.parentElement.style.display = 'flex';
  select.innerHTML = qualities.map(q => `<option value="${escapeHtml(q)}">${escapeHtml(q)}</option>`).join('');
  if (defaultQuality && sources[defaultQuality]) select.value = defaultQuality;
}

function openPlayer(video) {
  if (!playerDialog || !playerVideo) return;

  // Detect dead/missing URLs before trying to play
  const url = video.downloadUrl;
  const isBlob = url && url.startsWith('blob:');
  const isPlaceholder = url && (url === '#' || url.includes('example.com'));

  if (isPlaceholder) {
    alert(`"${video.title}" has no real video URL. This is placeholder data — replace videos.json with real entries, or paste a hosted URL when adding videos.`);
    return;
  }

  if (isBlob && video.temporary) {
    // Blob URLs only live for the session that created them.
    // If you reload the page, they're dead.
    alert(`"${video.title}" was added as a device preview in a previous session. Browser preview URLs don't survive a page reload. Re-add the file, or paste a hosted URL to make it permanent.`);
    return;
  }

  currentVideoSources = video.sources && Object.keys(video.sources).length
    ? video.sources
    : { default: video.downloadUrl };

  const qualityKeys = Object.keys(currentVideoSources);
  const preferred = qualityKeys.includes('720p') ? '720p' : qualityKeys[0];

  playerVideo.src = currentVideoSources[preferred];
  if (playerTitle) playerTitle.textContent = video.title;

  // Listen for load errors and show a useful message
  const onError = () => {
    alert(`Could not load "${video.title}". The video URL may be broken or the file format isn't supported. URL: ${playerVideo.src}`);
    closePlayer();
  };
  playerVideo.addEventListener('error', onError, { once: true });

  populateQualitySelector(currentVideoSources, preferred);
  renderRecommendations(video);

  if (typeof playerDialog.showModal === 'function') {
    playerDialog.showModal();
  } else {
    playerDialog.setAttribute('open', '');
  }
  playerVideo.play().catch(() => {});
}

function closePlayer() {
  if (!playerDialog || !playerVideo) return;
  playerVideo.pause();
  playerVideo.removeAttribute('src');
  playerVideo.load();
  if (typeof playerDialog.close === 'function') {
    playerDialog.close();
  } else {
    playerDialog.removeAttribute('open');
  }
}

// ============================================================
// Recommendations
// ============================================================

function getRecommendations(currentVideo) {
  return videos
    .filter(v =>
      v.title !== currentVideo.title &&
      (v.collection === currentVideo.collection || v.category === currentVideo.category)
    )
    .slice(0, 6);
}

function renderRecommendations(currentVideo) {
  if (!recommendationsPanel) return;
  const recs = getRecommendations(currentVideo);
  if (!recs.length) {
    recommendationsPanel.innerHTML = '';
    return;
  }
  recommendationsPanel.innerHTML = `
    <h4>You might also like</h4>
    <div class="rec-row">
      ${recs.map(r => `
        <button class="rec-card" type="button" data-title="${escapeHtml(r.title)}">
          ${r.coverUrl ? `<img src="${escapeHtml(r.coverUrl)}" alt="">` : '<div class="rec-placeholder"></div>'}
          <span>${escapeHtml(r.title)}</span>
        </button>
      `).join('')}
    </div>
  `;
  recommendationsPanel.querySelectorAll('.rec-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = videos.find(x => x.title === btn.dataset.title);
      if (v) openPlayer(v);
    });
  });
}

// ============================================================
// Add-video form
// ============================================================

function handleVideoFileSelect(file) {
  if (!file) return;
  if (selectedVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(selectedVideoUrl);
  selectedVideoUrl = URL.createObjectURL(file);
  if (selectedFileText) selectedFileText.textContent = `${file.name} · ${formatBytes(file.size)}`;

  const parsed = parseEpisodeInfo(file.name);
  if (titleInput && !titleInput.value) titleInput.value = parsed.title;
  if (collectionInput && !collectionInput.value) collectionInput.value = parsed.collection;
  if (episodeInput && !episodeInput.value) episodeInput.value = parsed.episode;
  if (fileSizeInput && !fileSizeInput.value) fileSizeInput.value = formatBytes(file.size);
  if (fileTypeInput && !fileTypeInput.value) {
    const ext = file.name.split('.').pop()?.toUpperCase() || 'MP4';
    fileTypeInput.value = ext;
  }
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
  const existing = [...baseVideos, ...localVideos, ...sessionVideos];
  const reasons = [];

  // Same exact title
  const titleMatch = existing.find(v =>
    v.title.trim().toLowerCase() === newVideo.title.trim().toLowerCase()
  );
  if (titleMatch) reasons.push(`exact title "${titleMatch.title}"`);

  // Same collection + same episode number (only if episode is set)
  if (newVideo.episode) {
    const epMatch = existing.find(v =>
      v.collection.trim().toLowerCase() === newVideo.collection.trim().toLowerCase() &&
      String(v.episode).trim() === String(newVideo.episode).trim()
    );
    if (epMatch && epMatch !== titleMatch) {
      reasons.push(`episode ${epMatch.episode} of "${epMatch.collection}"`);
    }
  }

  // Same hosted URL (only if it's a real URL, not blob/placeholder)
  if (newVideo.downloadUrl &&
      newVideo.downloadUrl !== '#' &&
      !newVideo.downloadUrl.startsWith('blob:')) {
    const urlMatch = existing.find(v => v.downloadUrl === newVideo.downloadUrl);
    if (urlMatch && urlMatch !== titleMatch) {
      reasons.push(`same hosted URL as "${urlMatch.title}"`);
    }
  }

  return reasons;
}

function handleFormSubmit(event) {
  event.preventDefault();
  const title = titleInput?.value?.trim();
  if (!title) {
    if (formStatus) formStatus.textContent = 'A title is required.';
    return;
  }

  const hostedUrl = hostedUrlInput?.value?.trim();
  const downloadUrl = hostedUrl || selectedVideoUrl || '#';
  const isTemporary = !hostedUrl && Boolean(selectedVideoUrl);

  const newVideo = normalizeVideo({
    title,
    description: descriptionInput?.value?.trim() || '',
    collection: collectionInput?.value?.trim() || '',
    episode: episodeInput?.value?.trim() || '',
    category: categoryInput?.value?.trim() || 'Other',
    fileType: fileTypeInput?.value?.trim() || 'MP4',
    fileSize: fileSizeInput?.value?.trim() || '—',
    dateAdded: todayIso(),
    downloadUrl,
    coverUrl: selectedCoverUrl || '',
    temporary: isTemporary
  });

  // Check for duplicates and warn if found
  const dupes = findDuplicates(newVideo);
  if (dupes.length) {
    const message = `Possible duplicate detected:\n\n• ${dupes.join('\n• ')}\n\nAdd anyway?`;
    if (!confirm(message)) {
      if (formStatus) formStatus.textContent = 'Add cancelled.';
      return;
    }
  }

  if (isTemporary) {
    sessionVideos.push(newVideo);
    if (formStatus) formStatus.textContent = 'Added as a device preview. Provide a hosted URL to make it permanent.';
  } else {
    localVideos.push(newVideo);
    saveLocalVideos();
    if (formStatus) formStatus.textContent = 'Saved to your archive.';
  }

  addVideoForm.reset();
  if (selectedVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(selectedVideoUrl);
  selectedVideoUrl = '';
  selectedCoverUrl = '';
  if (selectedFileText) selectedFileText.textContent = 'No file selected.';
  if (selectedCoverText) selectedCoverText.textContent = 'No cover selected. Choosing an image overrides the generated frame.';
  if (autoGroupText) autoGroupText.textContent = 'Auto-grouping watches for names like Show Name S01E02, Show Name Episode 2, or Show Name 1x02.';
  if (coverSearchPanel) coverSearchPanel.hidden = true;
  if (coverSearchResults) coverSearchResults.innerHTML = '';
  resetFramePicker();
  refreshArchive();
}

function handleExportJson() {
  const exportable = [...baseVideos, ...localVideos].map(v => {
    const out = { ...v };
    if (out.downloadUrl?.startsWith('blob:')) out.downloadUrl = '';
    if (out.coverUrl?.startsWith('blob:') || out.coverUrl?.startsWith('data:')) out.coverUrl = '';
    return out;
  });
  const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'videos.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function handleClearLocal() {
  if (!confirm('Clear all locally added videos? This cannot be undone.')) return;
  localVideos = [];
  saveLocalVideos();
  refreshArchive();
  if (formStatus) formStatus.textContent = 'Local library cleared.';
}

// ============================================================
// Tabs
// ============================================================

function wireTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      if (activeTab === 'download-index') {
        collectionGrid.style.display = 'none';
        if (downloadIndexPanel) {
          downloadIndexPanel.style.display = 'block';
          downloadIndexPanel.setAttribute('open', '');
        }
      } else {
        collectionGrid.style.display = 'flex';
        if (downloadIndexPanel) downloadIndexPanel.style.display = '';
      }
    });
  });
}

// ============================================================
// Event wiring
// ============================================================

function wireEvents() {
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
    regenerateFramesButton.addEventListener('click', () => {
      if (selectedVideoUrl) generateCoverFrames(selectedVideoUrl);
    });
  }
  if (addVideoForm) addVideoForm.addEventListener('submit', handleFormSubmit);
  if (exportJsonButton) exportJsonButton.addEventListener('click', handleExportJson);
  if (clearLocalButton) clearLocalButton.addEventListener('click', handleClearLocal);
  if (closePlayerButton) closePlayerButton.addEventListener('click', closePlayer);
  if (playerDialog) {
    playerDialog.addEventListener('close', () => {
      playerVideo.pause();
      playerVideo.removeAttribute('src');
      playerVideo.load();
    });
  }

  // Cover search — Add Video form
  const pickAddCover = (result) => {
    selectedCoverUrl = result.image;
    if (selectedCoverText) selectedCoverText.textContent = `Cover set: "${result.title}"`;
  };
  if (findCoverButton) {
    findCoverButton.addEventListener('click', () => {
      const query = bestSearchQuery(titleInput?.value || '', collectionInput?.value || '');
      runCoverSearch(query, coverSearchPanel, coverSearchStatus, coverSearchResults, pickAddCover);
    });
  }
  // Auto-search: debounce title input
  const debouncedAutoSearch = debounce(() => {
    const query = bestSearchQuery(titleInput?.value || '', collectionInput?.value || '');
    if (query.length >= 3) {
      runCoverSearch(query, coverSearchPanel, coverSearchStatus, coverSearchResults, pickAddCover);
    }
  }, 800);
  if (titleInput) titleInput.addEventListener('input', debouncedAutoSearch);
  if (collectionInput) collectionInput.addEventListener('input', debouncedAutoSearch);

  wireTabs();
}

// ============================================================
// Bootstrap
// ============================================================

async function loadBaseVideos() {
  try {
    const res = await fetch('./videos.json');
    if (!res.ok) throw new Error(`videos.json: ${res.status}`);
    const data = await res.json();
    baseVideos = Array.isArray(data) ? data.map(normalizeVideo) : [];
  } catch (err) {
    console.warn('Could not load videos.json:', err);
    baseVideos = [];
  }
}

async function init() {
  loadLocalVideos();
  await loadBaseVideos();
  syncVideos();
  buildFilters();
  render();
  wireEvents();
  wireAdminGate();
  wireEditAndCover();

  // Discourage casual video downloading
  if (playerVideo) {
    playerVideo.addEventListener('contextmenu', e => e.preventDefault());
    playerVideo.setAttribute('controlsList', 'nodownload noremoteplayback');
    playerVideo.setAttribute('disablePictureInPicture', '');
  }
}

init();