// ============================================================
// The Index — Shared core
// Used by both index.html (grid) and detail.html (show page)
// ============================================================

// ---------- Constants ----------
const LOCAL_STORAGE_KEY = 'the-index-collections-local-videos';
const TAGS_OVERRIDE_KEY = 'the-index-tags-override';
const PROGRESS_KEY = 'the-index-episode-progress';
const ADMIN_SESSION_KEY = 'the-index-admin-unlocked';
const ADMIN_PASSWORD_HASH = '7d4557bc9cae7ddf417642d6b024076e680c1cb0aa6c21942ac619c58b20c05e';

// ---------- State (shared module-style globals) ----------
window.AppState = window.AppState || {
  baseVideos: [],
  localVideos: [],
  sessionVideos: [],
  videos: [],
  tagsOverride: {},      // { collectionSlug: { add: [...], remove: [...] } }
  progress: {},          // { collectionSlug: { lastEpisodeIdx: number, lastWatched: iso } }
  jikanCache: {},        // { collectionSlug: { tags, synopsis, year, image, episodes, type } }
};

// ---------- Utilities ----------
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

function stripExtension(name) {
  return String(name || '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
  return { title: name, collection, episode, season: animeMeta.season, type: animeMeta.type };
}

function normalizeVideo(video) {
  const title = video.title || 'Untitled';
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

function isPublicDownload(video) {
  return video.downloadUrl
    && video.downloadUrl !== '#'
    && !video.temporary
    && !video.downloadUrl.startsWith('blob:');
}

// ---------- Persistence ----------
function saveLocalVideos() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(AppState.localVideos));
  } catch (e) { console.warn('localStorage save failed:', e); }
}

function loadLocalVideos() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    AppState.localVideos = Array.isArray(saved) ? saved.map(normalizeVideo) : [];
  } catch { AppState.localVideos = []; }
}

function saveTagsOverride() {
  try { localStorage.setItem(TAGS_OVERRIDE_KEY, JSON.stringify(AppState.tagsOverride)); }
  catch (e) { console.warn('tag save failed:', e); }
}

function loadTagsOverride() {
  try {
    AppState.tagsOverride = JSON.parse(localStorage.getItem(TAGS_OVERRIDE_KEY) || '{}');
  } catch { AppState.tagsOverride = {}; }
}

function saveProgress() {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(AppState.progress)); }
  catch (e) { console.warn('progress save failed:', e); }
}

function loadProgress() {
  try {
    AppState.progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch { AppState.progress = {}; }
}

function markEpisodeWatched(collectionName, videoTitle) {
  const k = slug(collectionName);
  AppState.progress[k] = {
    lastEpisodeTitle: videoTitle,
    lastWatched: new Date().toISOString()
  };
  saveProgress();
}

function getLastWatched(collectionName) {
  return AppState.progress[slug(collectionName)] || null;
}

// ---------- Sync videos array ----------
function syncVideos() {
  AppState.videos = [...AppState.baseVideos, ...AppState.localVideos, ...AppState.sessionVideos]
    .sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
}

async function loadBaseVideos() {
  try {
    const res = await fetch('./videos.json');
    if (!res.ok) throw new Error(`videos.json: ${res.status}`);
    const data = await res.json();
    AppState.baseVideos = Array.isArray(data) ? data.map(normalizeVideo) : [];
  } catch (err) {
    console.warn('Could not load videos.json:', err);
    AppState.baseVideos = [];
  }
}

// ---------- Grouping ----------
function groupVideos(videoList) {
  const map = new Map();
  videoList.forEach(video => {
    const key = slug(video.collection) || 'unsorted';
    if (!map.has(key)) {
      map.set(key, {
        slug: key,
        title: video.collection || 'Unsorted',
        category: video.category,
        videos: [],
        firstCover: video.coverUrl || ''
      });
    }
    const group = map.get(key);
    group.videos.push(video);
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

// ---------- Admin gate ----------
async function sha256Hex(text) {
  const encoded = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isAdminUnlocked() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

function setAdminUnlocked(value) {
  if (value) sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
  else sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

// ---------- Jikan API (anime metadata) ----------
const JIKAN_BASE = 'https://api.jikan.moe/v4/anime';
let lastJikanCall = 0;

async function jikanRequest(url) {
  const sinceLast = Date.now() - lastJikanCall;
  if (sinceLast < 400) await new Promise(r => setTimeout(r, 400 - sinceLast));
  lastJikanCall = Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  return res.json();
}

async function searchJikan(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const data = await jikanRequest(`${JIKAN_BASE}?q=${encodeURIComponent(query)}&limit=8&sfw=true`);
    return (data.data || []).map(item => ({
      malId: item.mal_id,
      title: item.title,
      year: item.year,
      type: item.type,
      image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || ''
    })).filter(r => r.image);
  } catch (err) {
    console.warn('Jikan search failed:', err);
    return [];
  }
}

async function fetchJikanDetails(query) {
  // Use first search result as the canonical entry
  if (!query) return null;
  const cacheKey = slug(query);
  if (AppState.jikanCache[cacheKey]) return AppState.jikanCache[cacheKey];

  try {
    const search = await jikanRequest(`${JIKAN_BASE}?q=${encodeURIComponent(query)}&limit=1&sfw=true`);
    const first = search.data && search.data[0];
    if (!first) return null;
    const details = {
      malId: first.mal_id,
      title: first.title,
      synopsis: first.synopsis || '',
      year: first.year,
      type: first.type,
      episodes: first.episodes,
      score: first.score,
      image: first.images?.jpg?.large_image_url || '',
      tags: (first.genres || []).concat(first.themes || []).concat(first.demographics || [])
        .map(g => g.name).filter(Boolean)
    };
    AppState.jikanCache[cacheKey] = details;
    return details;
  } catch (err) {
    console.warn('Jikan details failed:', err);
    return null;
  }
}

// ---------- Tags (merged Jikan + admin overrides) ----------
function getTagsForCollection(collectionName, jikanTags = []) {
  const k = slug(collectionName);
  const override = AppState.tagsOverride[k] || { add: [], remove: [] };
  const removed = new Set(override.remove.map(t => t.toLowerCase()));
  const base = jikanTags.filter(t => !removed.has(t.toLowerCase()));
  const customs = override.add.filter(t => !base.some(b => b.toLowerCase() === t.toLowerCase()));
  return [...base, ...customs];
}

function addCustomTag(collectionName, tag) {
  const k = slug(collectionName);
  if (!AppState.tagsOverride[k]) AppState.tagsOverride[k] = { add: [], remove: [] };
  const entry = AppState.tagsOverride[k];
  // Un-remove if it was removed
  entry.remove = entry.remove.filter(t => t.toLowerCase() !== tag.toLowerCase());
  if (!entry.add.some(t => t.toLowerCase() === tag.toLowerCase())) {
    entry.add.push(tag);
  }
  saveTagsOverride();
}

function removeTag(collectionName, tag) {
  const k = slug(collectionName);
  if (!AppState.tagsOverride[k]) AppState.tagsOverride[k] = { add: [], remove: [] };
  const entry = AppState.tagsOverride[k];
  // Remove from custom adds
  entry.add = entry.add.filter(t => t.toLowerCase() !== tag.toLowerCase());
  // Add to remove list
  if (!entry.remove.some(t => t.toLowerCase() === tag.toLowerCase())) {
    entry.remove.push(tag);
  }
  saveTagsOverride();
}

// ---------- Recommendations ----------
function getRecommendationsForCollection(collectionName, currentCategory, allGroups, currentTags = []) {
  const lowerTags = currentTags.map(t => t.toLowerCase());
  const k = slug(collectionName);

  return allGroups
    .filter(g => g.slug !== k)
    .map(g => {
      let score = 0;
      // Same category +1
      if (g.category === currentCategory) score += 1;
      // Tag overlap +2 per tag
      const jikan = AppState.jikanCache[g.slug];
      const otherTags = getTagsForCollection(g.title, jikan?.tags || []).map(t => t.toLowerCase());
      const overlap = otherTags.filter(t => lowerTags.includes(t)).length;
      score += overlap * 2;
      return { group: g, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.group);
}

// ---------- Theme (light / dark) ----------
const THEME_KEY = 'the-index-theme';

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY);
}

function getEffectiveTheme() {
  const stored = getStoredTheme();
  if (stored === 'light' || stored === 'dark') return stored;
  // Auto-detect OS preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
  } else {
    document.body.removeAttribute('data-theme');
  }
}

function toggleTheme() {
  const current = getEffectiveTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function initTheme() {
  applyTheme(getEffectiveTheme());

  // Listen for OS preference changes — only follow them if user hasn't explicitly set a theme
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (!getStoredTheme()) applyTheme(getEffectiveTheme());
    });
  }
}

function wireThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', toggleTheme);
}

// ---------- Init helper (shared bootstrap) ----------
async function coreInit() {
  initTheme();
  loadLocalVideos();
  loadTagsOverride();
  loadProgress();
  await loadBaseVideos();
  syncVideos();
}
