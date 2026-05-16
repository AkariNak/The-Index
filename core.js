// ============================================================
// The Index — Shared core
// Used by both index.html (grid) and detail.html (show page)
// ============================================================

// ---------- Supabase config ----------
const SUPABASE_URL = 'https://eosnuxttjchckprpymnw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QSDQxkMRbxn1M4m5L5sB6w_auxSAZVg';

// supabase client is loaded from CDN in the HTML files and available as window.supabase
// We init lazily on first use so both pages work without ordering concerns.
let _sb = null;
function getSupabase() {
  if (_sb) return _sb;
  if (!window.supabase) throw new Error('Supabase CDN not loaded');
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  return _sb;
}

// ---------- Constants ----------
const LOCAL_STORAGE_KEY = 'the-index-collections-local-videos';
const TAGS_OVERRIDE_KEY  = 'the-index-tags-override';
const PROGRESS_KEY       = 'the-index-episode-progress';

// ---------- State ----------
window.AppState = window.AppState || {
  baseVideos:    [],
  localVideos:   [],
  sessionVideos: [],
  videos:        [],
  tagsOverride:  {},   // { collectionSlug: { add: [...], remove: [...] } }
  progress:      {},   // { collectionSlug: { lastEpisodeTitle, lastWatched } }
  jikanCache:    {},   // { collectionSlug: { tags, synopsis, year, image, episodes, type } }
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
  const seasonMatch  = title.match(/S(\d{1,2})/i);
  const episodeMatch = title.match(/E(\d{1,3})/i);
  const typeMatch    = title.match(/\b(Movie|OVA|Special|ONA)\b/i);
  return {
    season:  seasonMatch  ? parseInt(seasonMatch[1],  10) : 1,
    episode: episodeMatch ? parseInt(episodeMatch[1], 10) : 0,
    type:    typeMatch    ? typeMatch[1]                  : 'Episode'
  };
}

function parseEpisodeInfo(rawName) {
  const name      = stripExtension(rawName);
  let episode     = '';
  let collection  = name;
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
    episode = match.length >= 4
      ? `${Number(match[2])}.${String(match[3]).padStart(2, '0')}`
      : String(match[match.length - 1]).padStart(2, '0');
    break;
  }
  collection = collection || name;
  return { title: name, collection, episode, season: animeMeta.season, type: animeMeta.type };
}

function normalizeVideo(video) {
  const title  = video.title || 'Untitled';
  const parsed = video.collection ? null : parseEpisodeInfo(title);
  return {
    // Preserve the Supabase row id so edits/deletes can reference it
    id:          video.id          || null,
    title,
    description: video.description || '',
    collection:  video.collection  || video.show || video.series || (parsed && parsed.collection) || 'Unsorted',
    episode:     video.episode     || (parsed && parsed.episode) || '',
    category:    video.category    || 'Other',
    // Supabase columns use snake_case; accept both forms
    fileType:    video.fileType    || video.file_type  || video.format || 'MP4',
    fileSize:    video.fileSize    || video.file_size  || video.size   || '—',
    dateAdded:   video.dateAdded   || video.date_added || video.created_at || todayIso(),
    downloadUrl: video.downloadUrl || video.download_url || video.video_url || video.url || '#',
    coverUrl:    video.coverUrl    || video.cover_url    || '',
    temporary:   Boolean(video.temporary),
    season:      video.season || (parsed && parsed.season) || 1,
    type:        video.type   || (parsed && parsed.type)   || 'Episode',
    sources:     video.sources || null
  };
}

function isPublicDownload(video) {
  return video.downloadUrl
    && video.downloadUrl !== '#'
    && !video.temporary
    && !video.downloadUrl.startsWith('blob:');
}

// ---------- Persistence (local extras & prefs — not the main video list) ----------
function saveLocalVideos() {
  try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(AppState.localVideos)); }
  catch (e) { console.warn('localStorage save failed:', e); }
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

function markEpisodeWatched(collectionName, videoTitle, timestamp = 0) {
  const k = slug(collectionName);
  AppState.progress[k] = {
    lastEpisodeTitle: videoTitle,
    lastWatched: new Date().toISOString(),
    timestamp
  };
  saveProgress();
}

function saveTimestamp(collectionName, videoTitle, timestamp) {
  const k = slug(collectionName);
  const existing = AppState.progress[k] || {};
  if (existing.lastEpisodeTitle !== videoTitle) return;
  existing.timestamp = timestamp;
  AppState.progress[k] = existing;
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

// ---------- Supabase: load videos (public SELECT) ----------
async function loadBaseVideos() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('videos')
      .select('*')
      .order('date_added', { ascending: false });
    if (error) throw error;
    AppState.baseVideos = Array.isArray(data) ? data.map(normalizeVideo) : [];
  } catch (err) {
    console.warn('Could not load videos from Supabase:', err);
    AppState.baseVideos = [];
  }
}

// ---------- Supabase: auth ----------
async function supabaseSignIn(email, password) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

async function supabaseSignOut() {
  const sb = getSupabase();
  await sb.auth.signOut();
}

async function getSession() {
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  return data?.session || null;
}

// Synchronous check — uses the cached session state Supabase keeps in memory/localStorage.
// Call getSession() (async) when you need a guaranteed-fresh check.
function isAdminUnlocked() {
  // supabase-js stores the session in localStorage under a key prefixed with 'sb-'
  // We do a quick check of its in-memory state via the internal store when possible,
  // otherwise fall back to checking localStorage directly.
  try {
    const sb = getSupabase();
    // supabase-js v2 exposes _sessionData synchronously via internal property; if not
    // available we fall through to the localStorage approach.
    const raw = localStorage.getItem(`sb-${SUPABASE_URL.replace('https://', '').split('.')[0]}-auth-token`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Boolean(parsed?.access_token);
    }
    return false;
  } catch {
    return false;
  }
}

// ---------- Supabase: CRUD (requires authenticated session) ----------

// Map our camelCase fields back to Supabase snake_case column names
function toSupabaseRow(video) {
  return {
    title:        video.title,
    description:  video.description  || '',
    collection:   video.collection,
    episode:      video.episode      || '',
    category:     video.category     || 'Other',
    file_type:    video.fileType     || 'MP4',
    file_size:    video.fileSize     || '—',
    date_added:   video.dateAdded    || todayIso(),
    download_url: video.downloadUrl  || '#',
    cover_url:    video.coverUrl     || '',
    temporary:    video.temporary    || false,
    season:       video.season       || 1,
    type:         video.type         || 'Episode',
    sources:      video.sources      || null
  };
}

async function supabaseInsert(videoData) {
  const sb = getSupabase();
  const row = toSupabaseRow(videoData);
  const { data, error } = await sb.from('videos').insert(row).select().single();
  if (error) throw error;
  return normalizeVideo(data);
}

async function supabaseUpdate(id, videoData) {
  if (!id) throw new Error('supabaseUpdate: no id provided');
  const sb = getSupabase();
  const row = toSupabaseRow(videoData);
  const { data, error } = await sb.from('videos').update(row).eq('id', id).select().single();
  if (error) throw error;
  return normalizeVideo(data);
}

async function supabaseDelete(id) {
  if (!id) throw new Error('supabaseDelete: no id provided');
  const sb = getSupabase();
  const { error } = await sb.from('videos').delete().eq('id', id);
  if (error) throw error;
}

async function supabaseDeleteCollection(collectionName) {
  if (!collectionName) throw new Error('supabaseDeleteCollection: no name provided');
  const sb = getSupabase();
  const { error } = await sb.from('videos').delete().eq('collection', collectionName);
  if (error) throw error;
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
      year:  item.year,
      type:  item.type,
      image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || ''
    })).filter(r => r.image);
  } catch (err) {
    console.warn('Jikan search failed:', err);
    return [];
  }
}

async function fetchJikanDetails(query) {
  if (!query) return null;
  const cacheKey = slug(query);
  if (AppState.jikanCache[cacheKey]) return AppState.jikanCache[cacheKey];

  try {
    const search = await jikanRequest(`${JIKAN_BASE}?q=${encodeURIComponent(query)}&limit=1&sfw=true`);
    const first  = search.data && search.data[0];
    if (!first) return null;
    const details = {
      malId:    first.mal_id,
      title:    first.title_english || first.title,
      synopsis: first.synopsis || '',
      year:     first.year,
      type:     first.type,
      episodes: first.episodes,
      score:    first.score,
      image:    first.images?.jpg?.large_image_url || '',
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

// ---------- AniList API (banner images) ----------
const ANILIST_BASE = 'https://graphql.anilist.co';

async function fetchAniListBanner(query) {
  if (!query) return null;
  const cacheKey = `anilist-${slug(query)}`;
  if (AppState.jikanCache[cacheKey]) return AppState.jikanCache[cacheKey];

  const gql = `
    query ($search: String) {
      Media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        bannerImage
        coverImage { extraLarge color }
        title { romaji english }
      }
    }
  `;
  try {
    const res  = await fetch(ANILIST_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: gql, variables: { search: query } })
    });
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    const json   = await res.json();
    const media  = json?.data?.Media;
    if (!media) return null;
    const result = {
      banner:     media.bannerImage || null,
      cover:      media.coverImage?.extraLarge || null,
      accentColor: media.coverImage?.color || null
    };
    AppState.jikanCache[cacheKey] = result;
    return result;
  } catch (err) {
    console.warn('AniList banner fetch failed:', err);
    return null;
  }
}

// ---------- Tags (merged Jikan + admin overrides) ----------
function getTagsForCollection(collectionName, jikanTags = []) {
  const k        = slug(collectionName);
  const override = AppState.tagsOverride[k] || { add: [], remove: [] };
  const removed  = new Set(override.remove.map(t => t.toLowerCase()));
  const base     = jikanTags.filter(t => !removed.has(t.toLowerCase()));
  const customs  = override.add.filter(t => !base.some(b => b.toLowerCase() === t.toLowerCase()));
  return [...base, ...customs];
}

function addCustomTag(collectionName, tag) {
  const k = slug(collectionName);
  if (!AppState.tagsOverride[k]) AppState.tagsOverride[k] = { add: [], remove: [] };
  const entry = AppState.tagsOverride[k];
  entry.remove = entry.remove.filter(t => t.toLowerCase() !== tag.toLowerCase());
  if (!entry.add.some(t => t.toLowerCase() === tag.toLowerCase())) entry.add.push(tag);
  saveTagsOverride();
}

function removeTag(collectionName, tag) {
  const k = slug(collectionName);
  if (!AppState.tagsOverride[k]) AppState.tagsOverride[k] = { add: [], remove: [] };
  const entry = AppState.tagsOverride[k];
  entry.add    = entry.add.filter(t => t.toLowerCase() !== tag.toLowerCase());
  if (!entry.remove.some(t => t.toLowerCase() === tag.toLowerCase())) entry.remove.push(tag);
  saveTagsOverride();
}

// ---------- Recommendations ----------
function getRecommendationsForCollection(collectionName, currentCategory, allGroups, currentTags = []) {
  const lowerTags = currentTags.map(t => t.toLowerCase());
  const k         = slug(collectionName);
  return allGroups
    .filter(g => g.slug !== k)
    .map(g => {
      let score = 0;
      if (g.category === currentCategory) score += 1;
      const jikan     = AppState.jikanCache[g.slug];
      const otherTags = getTagsForCollection(g.title, jikan?.tags || []).map(t => t.toLowerCase());
      score += otherTags.filter(t => lowerTags.includes(t)).length * 2;
      return { group: g, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.group);
}

// ---------- Init helper (shared bootstrap) ----------
async function coreInit() {
  loadLocalVideos();
  loadTagsOverride();
  loadProgress();
  await loadBaseVideos();
  syncVideos();
}
