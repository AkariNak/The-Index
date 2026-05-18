// ============================================================
// Aurum — core.js
// Shared by all pages. Depends on Supabase CDN.
// ============================================================

// ---------- Supabase ----------
const SUPABASE_URL     = 'https://eosnuxttjchckprpymnw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QSDQxkMRbxn1M4m5L5sB6w_auxSAZVg';

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
const LOCAL_STORAGE_KEY = 'aurum-local-videos';
const TAGS_OVERRIDE_KEY = 'aurum-tags-override';
const PROGRESS_KEY      = 'aurum-episode-progress';
const THEME_KEY         = 'aurum-theme';

// ---------- State ----------
window.AppState = window.AppState || {
  baseVideos:    [],
  localVideos:   [],
  sessionVideos: [],
  videos:        [],
  tagsOverride:  {},
  progress:      {},
  jikanCache:    {},
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
  return String(name || '').replace(/\.[^/.]+$/, '').replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
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
  const patterns  = [
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
  return { title: name, collection: collection || name, episode, season: animeMeta.season, type: animeMeta.type };
}

function normalizeVideo(video) {
  const title  = video.title || 'Untitled';
  const parsed = video.collection ? null : parseEpisodeInfo(title);
  return {
    id:          video.id          || null,
    title,
    description: video.description || '',
    collection:  video.collection  || video.show || video.series || parsed?.collection || 'Unsorted',
    episode:     video.episode     || parsed?.episode || '',
    category:    video.category    || 'Other',
    fileType:    video.fileType    || video.file_type  || video.format || 'MP4',
    fileSize:    video.fileSize    || video.file_size  || video.size   || '—',
    dateAdded:   video.dateAdded   || video.date_added || video.created_at || todayIso(),
    downloadUrl: video.downloadUrl || video.download_url || video.video_url || video.url || '#',
    coverUrl:    video.coverUrl    || video.cover_url    || '',
    temporary:   Boolean(video.temporary),
    season:      video.season || parsed?.season || 1,
    type:        video.type   || parsed?.type   || 'Episode',
    sources:     video.sources || null
  };
}

function isPublicDownload(video) {
  return video.downloadUrl && video.downloadUrl !== '#'
    && !video.temporary && !video.downloadUrl.startsWith('blob:');
}

// ---------- Persistence ----------
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
  try { AppState.tagsOverride = JSON.parse(localStorage.getItem(TAGS_OVERRIDE_KEY) || '{}'); }
  catch { AppState.tagsOverride = {}; }
}

function saveProgress() {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(AppState.progress)); }
  catch (e) { console.warn('progress save failed:', e); }
}

function loadProgress() {
  try { AppState.progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); }
  catch { AppState.progress = {}; }
}

function markEpisodeWatched(collectionName, videoTitle, timestamp = 0) {
  const k = slug(collectionName);
  AppState.progress[k] = {
    lastEpisodeTitle: videoTitle,
    lastWatched:      new Date().toISOString(),
    timestamp
  };
  saveProgress();
}

function saveTimestamp(collectionName, videoTitle, timestamp) {
  const k       = slug(collectionName);
  const existing = AppState.progress[k] || {};
  if (existing.lastEpisodeTitle !== videoTitle) return;
  existing.timestamp = timestamp;
  AppState.progress[k] = existing;
  saveProgress();
}

function getLastWatched(collectionName) {
  return AppState.progress[slug(collectionName)] || null;
}

// ---------- Sync ----------
function syncVideos() {
  AppState.videos = [...AppState.baseVideos, ...AppState.localVideos, ...AppState.sessionVideos]
    .sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
}

// ---------- Supabase: load videos ----------
async function loadBaseVideos() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('videos').select('*').order('date_added', { ascending: false });
    if (error) throw error;
    AppState.baseVideos = Array.isArray(data) ? data.map(normalizeVideo) : [];
  } catch (err) {
    console.warn('Could not load videos:', err);
    AppState.baseVideos = [];
  }
}

// ---------- Supabase: auth ----------
async function supabaseSignIn(email, password) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

async function supabaseSignOut() {
  await getSupabase().auth.signOut();
}

async function getSession() {
  const { data } = await getSupabase().auth.getSession();
  return data?.session || null;
}

// Async — always accurate
async function isAdminUnlockedAsync() {
  const session = await getSession();
  return Boolean(session);
}

// Sync — reads Supabase's localStorage cache; use for rendering only, not for gating writes
function isAdminUnlocked() {
  try {
    const keys = Object.keys(localStorage);
    const sbKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!sbKey) return false;
    const parsed = JSON.parse(localStorage.getItem(sbKey) || '{}');
    return Boolean(parsed?.access_token);
  } catch { return false; }
}

// ---------- Supabase: current user ----------
async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await getSupabase().from('user_profiles').select('*').eq('id', user.id).single();
  return data || null;
}

// ---------- Supabase: sign up ----------
async function supabaseSignUp(email, password, username) {
  const sb = getSupabase();

  // Check username availability first
  const { data: existing } = await sb.from('user_profiles').select('id').eq('username', username).maybeSingle();
  if (existing) throw new Error('Username is already taken.');

  // Sign up — the database trigger will auto-create the profile
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Sign up failed — please try again.');

  // Sign in to get an active session
  const { error: signInError } = await sb.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error('Account created. Please sign in.');

  // Brief pause to let the session fully establish
  await new Promise(r => setTimeout(r, 500));

  // Update the auto-created profile with the chosen username
  const { error: updateError } = await sb.from('user_profiles')
    .update({ username })
    .eq('id', data.user.id);
  if (updateError) throw new Error(`Could not set username: ${updateError.message}`);

  return data;
}

async function checkUsernameAvailable(username) {
  if (!username || username.length < 3) return false;
  const { data } = await getSupabase().from('user_profiles').select('id').eq('username', username).maybeSingle();
  return !data;
}

// ---------- Supabase: avatar upload ----------
async function uploadAvatar(file) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not signed in.');
  const compressed = await compressImage(file, 50);
  const path       = `${user.id}/avatar.jpg`;
  const sb         = getSupabase();
  const { error }  = await sb.storage.from('avatars').upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;
  const { data: urlData } = sb.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
  await sb.from('user_profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
  return avatarUrl;
}

function compressImage(file, targetKB) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas  = document.createElement('canvas');
      const maxDim  = 256;
      const scale   = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      let lo = 0.1, hi = 0.95, quality = 0.8;
      for (let i = 0; i < 8; i++) {
        const mid    = (lo + hi) / 2;
        const dataUrl = canvas.toDataURL('image/jpeg', mid);
        const kb     = Math.round((dataUrl.length * 3) / 4 / 1024);
        if (kb > targetKB) hi = mid; else { lo = mid; quality = mid; }
      }
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/jpeg', quality);
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
}

async function updateUsername(newUsername) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not signed in.');
  const available = await checkUsernameAvailable(newUsername);
  if (!available) throw new Error('Username is already taken.');
  const { error } = await getSupabase().from('user_profiles').update({ username: newUsername }).eq('id', user.id);
  if (error) throw error;
}

// ---------- Supabase: watch status ----------
async function getWatchStatus(collectionName) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await getSupabase()
    .from('watch_status').select('status')
    .eq('user_id', user.id).eq('collection', collectionName).maybeSingle();
  return data?.status || null;
}

async function setWatchStatus(collectionName, status) {
  const user = await getCurrentUser();
  if (!user) return;
  await getSupabase().from('watch_status').upsert({
    user_id: user.id, collection: collectionName, status,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,collection' });
}

async function getUserWatchList() {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await getSupabase()
    .from('watch_status').select('*').eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  return data || [];
}

// ---------- Supabase: comments ----------
async function getComments(collectionName, episodeTitle) {
  const { data, error } = await getSupabase()
    .from('comments').select('*')
    .eq('collection', collectionName).eq('episode_title', episodeTitle)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function postComment(collectionName, episodeTitle, content) {
  const user    = await getCurrentUser();
  if (!user) throw new Error('Not signed in.');
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('No profile found.');
  const { data, error } = await getSupabase().from('comments').insert({
    user_id: user.id, username: profile.username, avatar_url: profile.avatar_url || null,
    collection: collectionName, episode_title: episodeTitle, content: content.trim()
  }).select().single();
  if (error) throw error;
  return data;
}

async function deleteComment(commentId) {
  const { error } = await getSupabase().from('comments').delete().eq('id', commentId);
  if (error) throw error;
}

// ---------- Supabase: CRUD ----------
function toSupabaseRow(video) {
  return {
    title: video.title, description: video.description || '',
    collection: video.collection, episode: video.episode || '',
    category: video.category || 'Other', file_type: video.fileType || 'MP4',
    file_size: video.fileSize || '—', date_added: video.dateAdded || todayIso(),
    download_url: video.downloadUrl || '#', cover_url: video.coverUrl || '',
    temporary: video.temporary || false, season: video.season || 1,
    type: video.type || 'Episode', sources: video.sources || null
  };
}

async function supabaseInsert(videoData) {
  const { data, error } = await getSupabase().from('videos').insert(toSupabaseRow(videoData)).select().single();
  if (error) throw error;
  return normalizeVideo(data);
}

async function supabaseUpdate(id, videoData) {
  if (!id) throw new Error('supabaseUpdate: no id');
  const { data, error } = await getSupabase().from('videos').update(toSupabaseRow(videoData)).eq('id', id).select().single();
  if (error) throw error;
  return normalizeVideo(data);
}

async function supabaseDelete(id) {
  if (!id) throw new Error('supabaseDelete: no id');
  const { error } = await getSupabase().from('videos').delete().eq('id', id);
  if (error) throw error;
}

async function supabaseDeleteCollection(collectionName) {
  const { error } = await getSupabase().from('videos').delete().eq('collection', collectionName);
  if (error) throw error;
}

// ---------- Grouping ----------
function groupVideos(videoList) {
  const map = new Map();
  videoList.forEach(video => {
    const key = slug(video.collection) || 'unsorted';
    if (!map.has(key)) {
      map.set(key, { slug: key, title: video.collection || 'Unsorted', category: video.category, videos: [], firstCover: video.coverUrl || '' });
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

// ---------- Jikan ----------
const JIKAN_BASE = 'https://api.jikan.moe/v4/anime';
let lastJikanCall = 0;

const JIKAN_CACHE_KEY = 'aurum-jikan-cache';

function loadJikanCache() {
  try {
    const saved = JSON.parse(localStorage.getItem(JIKAN_CACHE_KEY) || '{}');
    Object.assign(AppState.jikanCache, saved);
  } catch {}
}

function saveJikanCache() {
  try { localStorage.setItem(JIKAN_CACHE_KEY, JSON.stringify(AppState.jikanCache)); }
  catch {}
}

async function jikanRequest(url) {
  const wait = Date.now() - lastJikanCall;
  if (wait < 500) await new Promise(r => setTimeout(r, 500 - wait));
  lastJikanCall = Date.now();

  let attempts = 0;
  while (attempts < 3) {
    const res = await fetch(url);
    if (res.status === 429) {
      attempts++;
      await new Promise(r => setTimeout(r, 2000 * attempts));
      continue;
    }
    if (!res.ok) throw new Error(`Jikan ${res.status}`);
    return res.json();
  }
  throw new Error('Jikan 429 — too many requests');
}

async function searchJikan(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const data = await jikanRequest(`${JIKAN_BASE}?q=${encodeURIComponent(query)}&limit=8&sfw=true`);
    return (data.data || []).map(item => ({
      malId: item.mal_id, title: item.title_english || item.title, year: item.year,
      type: item.type, image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || ''
    })).filter(r => r.image);
  } catch (err) { console.warn('Jikan search failed:', err); return []; }
}

async function fetchJikanDetails(query) {
  if (!query) return null;
  const cacheKey = slug(query);
  if (AppState.jikanCache[cacheKey]) return AppState.jikanCache[cacheKey];
  try {
    const search = await jikanRequest(`${JIKAN_BASE}?q=${encodeURIComponent(query)}&limit=1&sfw=true`);
    const first  = search.data?.[0];
    if (!first) return null;
    const details = {
      malId: first.mal_id, title: first.title_english || first.title,
      synopsis: first.synopsis || '', year: first.year, type: first.type,
      episodes: first.episodes, score: first.score,
      image: first.images?.jpg?.large_image_url || '',
      tags: (first.genres || []).concat(first.themes || []).concat(first.demographics || [])
        .map(g => g.name).filter(Boolean)
    };
    AppState.jikanCache[cacheKey] = details;
    saveJikanCache(); // persist so next page load skips the fetch
    return details;
  } catch (err) { console.warn('Jikan details failed:', err); return null; }
}

// ---------- AniList ----------
const ANILIST_BASE = 'https://graphql.anilist.co';

async function fetchAniListBanner(query) {
  if (!query) return null;
  const cacheKey = `anilist-${slug(query)}`;
  if (AppState.jikanCache[cacheKey]) return AppState.jikanCache[cacheKey];
  const gql = `query ($s: String) { Media(search: $s, type: ANIME, sort: SEARCH_MATCH) { bannerImage coverImage { extraLarge color } title { romaji english } } }`;
  try {
    const res  = await fetch(ANILIST_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: gql, variables: { s: query } })
    });
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    const json  = await res.json();
    const media = json?.data?.Media;
    if (!media) return null;
    const result = { banner: media.bannerImage || null, cover: media.coverImage?.extraLarge || null, accentColor: media.coverImage?.color || null };
    AppState.jikanCache[cacheKey] = result;
    return result;
  } catch (err) { console.warn('AniList failed:', err); return null; }
}

// ---------- Tags ----------
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
// ---------- Tag weights ----------
const TAG_WEIGHTS = {
  // Core genres — 4 pts
  'action': 4, 'romance': 4, 'drama': 4, 'horror': 4, 'comedy': 4,
  'mystery': 4, 'sci-fi': 4, 'fantasy': 4, 'slice of life': 4,
  // Thematic — 3 pts
  'psychological': 3, 'supernatural': 3, 'thriller': 3, 'adventure': 3,
  'sports': 3, 'isekai': 3, 'military': 3, 'tragedy': 3, 'survival': 3,
  'gore': 3, 'violence': 3,
  // Setting / tone — 2 pts
  'school': 2, 'historical': 2, 'mecha': 2, 'music': 2, 'magic': 2,
  'super power': 2, 'martial arts': 2, 'demons': 2, 'vampires': 2,
  'time travel': 2, 'space': 2,
  // Demographic — 1 pt
  'shounen': 1, 'seinen': 1, 'shoujo': 1, 'josei': 1,
};

function tagWeight(tag) {
  return TAG_WEIGHTS[tag.toLowerCase()] ?? 1;
}

// ---------- Recommendations ----------
function getRecommendationsForCollection(collectionName, currentCategory, allGroups, currentTags = []) {
  const lowerTags = currentTags.map(t => t.toLowerCase());
  const k         = slug(collectionName);

  const scored = allGroups
    .filter(g => g.slug !== k)
    .map(g => {
      const jikan     = AppState.jikanCache[slug(g.title)];
      const otherTags = getTagsForCollection(g.title, jikan?.tags || []).map(t => t.toLowerCase());
      // Sum weights of overlapping tags
      const tagScore  = otherTags
        .filter(t => lowerTags.includes(t))
        .reduce((sum, t) => sum + tagWeight(t), 0);
      const samecat   = g.category === currentCategory ? 2 : 0;
      return { group: g, score: tagScore + samecat };
    })
    .sort((a, b) => b.score - a.score);

  const withTags = scored.filter(x => x.score > 0);
  const results  = withTags.length >= 3 ? withTags : scored;
  return results.slice(0, 8).map(x => x.group);
}

// ---------- Community ratings ----------
async function getRatingForCollection(collectionName) {
  const sb = getSupabase();
  const { data } = await sb
    .from('ratings')
    .select('rating')
    .eq('collection', collectionName);
  if (!data || !data.length) return { average: 0, count: 0 };
  const avg = data.reduce((sum, r) => sum + Number(r.rating), 0) / data.length;
  return { average: Math.round(avg * 2) / 2, count: data.length };
}

async function getUserRating(collectionName) {
  const user = await getCurrentUser();
  if (!user) return null;
  const sb = getSupabase();
  const { data } = await sb
    .from('ratings')
    .select('rating')
    .eq('user_id', user.id)
    .eq('collection', collectionName)
    .maybeSingle();
  return data ? Number(data.rating) : null;
}

async function setUserRating(collectionName, rating) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not signed in.');
  const sb = getSupabase();
  await sb.from('ratings').upsert({
    user_id: user.id,
    collection: collectionName,
    rating
  }, { onConflict: 'user_id,collection' });
}

// ---------- Slideshow order ----------
const HERO_ORDER_KEY = 'aurum-hero-order'; // { slug: rank (1-6) }

function loadHeroOrder() {
  try { return JSON.parse(localStorage.getItem(HERO_ORDER_KEY) || '{}'); }
  catch { return {}; }
}

function saveHeroOrder(order) {
  localStorage.setItem(HERO_ORDER_KEY, JSON.stringify(order));
}

function applyHeroOrder(groups) {
  const order = loadHeroOrder();
  const ranked   = groups.filter(g => order[g.slug] != null).sort((a, b) => order[a.slug] - order[b.slug]);
  const unranked = groups.filter(g => order[g.slug] == null);
  return [...ranked, ...unranked];
}

// ---------- Init ----------
async function coreInit() {
  loadLocalVideos();
  loadTagsOverride();
  loadProgress();
  loadJikanCache();
  await loadBaseVideos();
  syncVideos();
}
