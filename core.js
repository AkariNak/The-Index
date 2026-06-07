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
    sources:     video.sources || null,
    createdAt:   video.created_at || null,
    language:    video.language || null,
    void:        Boolean(video.void)
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

function markEpisodeWatched(collectionName, videoTitle, timestamp = 0, episodeNumber = 0) {
  const k = slug(collectionName);
  const existing = AppState.progress[k];
  const existingEp = existing?.episodeNumber || 0;
  // Always update local if same or higher episode
  if (episodeNumber >= existingEp) {
    AppState.progress[k] = {
      lastEpisodeTitle: videoTitle,
      lastWatched:      new Date().toISOString(),
      timestamp,
      episodeNumber
    };
    saveProgress();
  }
  // Always sync to Supabase so other devices get the update
  getCurrentUser().then(user => {
    if (!user) return;
    getSupabase().from('watch_progress').upsert({
      user_id: user.id,
      collection: collectionName,
      last_episode_title: videoTitle,
      timestamp: timestamp,
      episode_number: episodeNumber,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,collection' }).then(({ error }) => {
      if (error) console.warn('watch_progress mark failed:', error.message);
    });
  });
}

function saveTimestamp(collectionName, videoTitle, timestamp) {
  const k        = slug(collectionName);
  const existing = AppState.progress[k] || {};
  if (existing.lastEpisodeTitle !== videoTitle) return;
  existing.timestamp = timestamp;
  AppState.progress[k] = existing;
  saveProgress();
  // Also sync to Supabase if signed in
  getCurrentUser().then(user => {
    if (!user) return;
    getSupabase().from('watch_progress').upsert({
      user_id: user.id,
      collection: collectionName,
      last_episode_title: videoTitle,
      timestamp: timestamp,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,collection' }).then(({ error }) => {
      if (error) console.warn('watch_progress save failed:', error.message);
    });
  });
}

function getLastWatched(collectionName) {
  return AppState.progress[slug(collectionName)] || null;
}

async function getLastWatchedRemote(collectionName) {
  const user = await getCurrentUser();
  if (!user) return getLastWatched(collectionName);
  try {
    const { data } = await getSupabase()
      .from('watch_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('collection', collectionName)
      .single();
    if (data) {
      // Merge into local state
      const k = slug(collectionName);
      AppState.progress[k] = {
        lastEpisodeTitle: data.last_episode_title,
        timestamp: data.timestamp
      };
      saveProgress();
      return AppState.progress[k];
    }
  } catch {}
  return getLastWatched(collectionName);
}

async function loadAllProgressFromSupabase() {
  const user = await getCurrentUser();
  if (!user) return;
  try {
    const { data, error } = await getSupabase()
      .from('watch_progress')
      .select('*')
      .eq('user_id', user.id);
    if (error || !data) return; // Table may not exist yet - fail silently
    for (const row of data) {
      const k = slug(row.collection);
      if (!AppState.progress[k] || row.timestamp > (AppState.progress[k].timestamp || 0)) {
        AppState.progress[k] = {
          lastEpisodeTitle: row.last_episode_title,
          timestamp: row.timestamp
        };
      }
    }
    saveProgress();
  } catch (e) {
    console.warn('watch_progress sync failed - run the SQL to create the table:', e.message);
  }
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
    let allData = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await sb
        .from('videos')
        .select('*')
        .or('void.eq.false,void.is.null')
        .order('date_added', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allData = allData.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    AppState.baseVideos = allData.map(normalizeVideo);
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
  if (status === null) {
    await getSupabase().from('watch_status').delete().eq('user_id', user.id).eq('collection', collectionName);
    try { await getSupabase().from('watch_progress').delete().eq('user_id', user.id).eq('collection', collectionName); } catch {}
    const k = slug(collectionName);
    delete AppState.progress[k];
    saveProgress();
    return;
  }
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

async function fetchJikanDetailsExact(query) {
  if (!query) return null;
  const cacheKey = slug(query) + '-exact';
  if (AppState.jikanCache[cacheKey]) return AppState.jikanCache[cacheKey];
  try {
    const search = await jikanRequest(`${JIKAN_BASE}?q=${encodeURIComponent(query)}&limit=5&sfw=true`);
    const results = search.data || [];
    if (!results.length) return null;

    // Try to find a result whose title contains the season number
    const seasonMatch = query.match(/season\s*(\d+)/i);
    const seasonNum   = seasonMatch ? seasonMatch[1] : null;
    let best = results[0];
    if (seasonNum) {
      const specific = results.find(r => {
        const t = (r.title_english || r.title || '').toLowerCase();
        return t.includes(`season ${seasonNum}`) || t.includes(`${seasonNum}nd season`) || t.includes(`${seasonNum}rd season`) || t.includes(`${seasonNum}th season`) || (r.season && String(r.season) === seasonNum);
      });
      if (specific) best = specific;
    }

    const details = {
      malId: best.mal_id, title: best.title_english || best.title,
      synopsis: best.synopsis || '', year: best.year, type: best.type,
      episodes: best.episodes, score: best.score,
      image: best.images?.jpg?.large_image_url || '',
      tags: (best.genres || []).concat(best.themes || []).concat(best.demographics || [])
        .map(g => g.name).filter(Boolean)
    };
    AppState.jikanCache[cacheKey] = details;
    saveJikanCache();
    return details;
  } catch (err) { return null; }
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

// ---------- Tag weights ----------
const DEMOGRAPHIC_TAGS = new Set(['shounen', 'seinen', 'shoujo', 'josei', 'kids']);

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
};

function tagWeight(tag) {
  return TAG_WEIGHTS[tag.toLowerCase()] ?? 1;
}

function filterTags(tags) {
  return tags.filter(t => !DEMOGRAPHIC_TAGS.has(t.toLowerCase()));
}

// ---------- Recommendations ----------
function getRecommendationsForCollection(collectionName, currentCategory, allGroups, currentTags = []) {
  const filtered  = filterTags(currentTags);
  const lowerTags = filtered.map(t => t.toLowerCase());
  const k         = slug(collectionName);

  const scored = allGroups
    .filter(g => g.slug !== k)
    .map(g => {
      const jikan     = AppState.jikanCache[slug(g.title)];
      const otherTags = filterTags(getTagsForCollection(g.title, jikan?.tags || [])).map(t => t.toLowerCase());
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

// ---------- Achievements ----------
const ACHIEVEMENTS = {
  first_watch:   { key: 'first_watch',   label: 'First Watch',    desc: 'Watch your first episode',                icon: '▶', color: '#c9963a' },
  binge_mode:    { key: 'binge_mode',    label: 'Binge Mode',     desc: 'Watch 15 episodes in one day',            icon: '×15', color: '#e05252' },
  completionist: { key: 'completionist', label: 'Completionist',  desc: 'Complete 5 shows',                        icon: '✓', color: '#52c07a' },
  century:       { key: 'century',       label: 'Century',        desc: 'Watch 100 episodes total',                icon: '100', color: '#c9963a' },
  loyal_fan:     { key: 'loyal_fan',     label: 'Loyal Fan',      desc: 'Rate 10 shows',                           icon: '★', color: '#e8c97a' },
  explorer:      { key: 'explorer',      label: 'Explorer',       desc: 'Add 5 different shows to your list',      icon: '◈', color: '#52a0c0' },
  night_owl:     { key: 'night_owl',     label: 'Night Owl',      desc: 'Watch an episode between 1am and 5am',    icon: '◑', color: '#7a52c0' },
  speed_runner:  { key: 'speed_runner',  label: 'Speed Runner',   desc: 'Complete a show in under 3 days',         icon: '⚡', color: '#c0a052' },
  critic:        { key: 'critic',        label: 'Critic',         desc: 'Rate every show you complete',            icon: '✎', color: '#52c0a0' },
};

async function getUnlockedAchievements() {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await getSupabase()
    .from('user_achievements')
    .select('achievement_key, unlocked_at')
    .eq('user_id', user.id);
  return data || [];
}

async function unlockAchievement(key) {
  const user = await getCurrentUser();
  if (!user || !ACHIEVEMENTS[key]) return false;
  const { error } = await getSupabase()
    .from('user_achievements')
    .insert({ user_id: user.id, achievement_key: key })
    .select();
  if (error) return false; // already unlocked = unique constraint
  showAchievementToast(ACHIEVEMENTS[key]);
  return true;
}

function showAchievementToast(achievement) {
  const existing = document.getElementById('achievementToast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'achievementToast';
  toast.className = 'achievement-toast';
  toast.innerHTML = `
    <div class="achievement-toast-icon" style="color:${achievement.color}">${achievement.icon}</div>
    <div class="achievement-toast-info">
      <div class="achievement-toast-label">Achievement Unlocked</div>
      <div class="achievement-toast-name">${escapeHtml(achievement.label)}</div>
      <div class="achievement-toast-desc">${escapeHtml(achievement.desc)}</div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('achievement-toast-show'), 50);
  setTimeout(() => {
    toast.classList.remove('achievement-toast-show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

async function checkAchievements(context = {}) {
  const user = await getCurrentUser();
  if (!user) return;
  const unlocked = new Set((await getUnlockedAchievements()).map(a => a.achievement_key));

  // First Watch
  if (!unlocked.has('first_watch') && context.episodeWatched) {
    await unlockAchievement('first_watch');
  }

  // Night Owl
  if (!unlocked.has('night_owl') && context.episodeWatched) {
    const hour = new Date().getHours();
    if (hour >= 1 && hour < 5) await unlockAchievement('night_owl');
  }

  // Binge Mode — 15 eps in one day (tracked in localStorage)
  if (!unlocked.has('binge_mode') && context.episodeWatched) {
    const today = new Date().toDateString();
    const bingeKey = `aurum-binge-${user.id}`;
    let binge = {};
    try { binge = JSON.parse(localStorage.getItem(bingeKey) || '{}'); } catch {}
    if (binge.date !== today) binge = { date: today, count: 0 };
    binge.count++;
    localStorage.setItem(bingeKey, JSON.stringify(binge));
    if (binge.count >= 15) await unlockAchievement('binge_mode');
  }

  // Century — 100 episodes total
  if (!unlocked.has('century') && context.totalWatched >= 100) {
    await unlockAchievement('century');
  }

  // Completionist — 5 completed shows
  if (!unlocked.has('completionist') && context.completedCount >= 5) {
    await unlockAchievement('completionist');
  }

  // Loyal Fan — rated 10 shows
  if (!unlocked.has('loyal_fan') && context.ratingCount >= 10) {
    await unlockAchievement('loyal_fan');
  }

  // Explorer — 5 shows on list
  if (!unlocked.has('explorer') && context.watchListCount >= 5) {
    await unlockAchievement('explorer');
  }

  // Speed Runner — complete a show in under 3 days
  if (!unlocked.has('speed_runner') && context.completedFast) {
    await unlockAchievement('speed_runner');
  }

  // Critic — rated all completed shows
  if (!unlocked.has('critic') && context.ratedAllCompleted && context.completedCount > 0) {
    await unlockAchievement('critic');
  }
}

// ---------- Site settings (global, stored in Supabase) ----------
const _settingsCache = {};

async function getSiteSetting(key) {
  if (_settingsCache[key] !== undefined) return _settingsCache[key];
  const { data } = await getSupabase().from('site_settings').select('value').eq('key', key).maybeSingle();
  const val = data?.value ?? null;
  _settingsCache[key] = val;
  return val;
}

async function setSiteSetting(key, value) {
  _settingsCache[key] = value;
  await getSupabase().from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
}

// Cover overrides: { slug: coverUrl }
async function getCoverOverrides() {
  return (await getSiteSetting('cover_overrides')) || {};
}
async function setCoverOverride(slug, url) {
  const overrides = await getCoverOverrides();
  overrides[slug] = url;
  _settingsCache['cover_overrides'] = overrides;
  await setSiteSetting('cover_overrides', overrides);
}

// Season order: { seriesBase: [slug, slug, ...] }
async function getSeasonOrder() {
  return (await getSiteSetting('season_order')) || {};
}
async function setSeasonOrder(seriesBase, slugArray) {
  const order = await getSeasonOrder();
  order[seriesBase] = slugArray;
  _settingsCache['season_order'] = order;
  await setSiteSetting('season_order', order);
}

// Genre overrides: { slug: ['Action', 'Fantasy'] }
async function getGenreOverrides() {
  return (await getSiteSetting('genre_overrides')) || {};
}
async function setGenreOverride(slug, genres) {
  const overrides = await getGenreOverrides();
  if (!genres || !genres.length) delete overrides[slug];
  else overrides[slug] = genres;
  _settingsCache['genre_overrides'] = overrides;
  await setSiteSetting('genre_overrides', overrides);
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
  // Check loyal fan achievement
  const { data } = await sb.from('ratings').select('id').eq('user_id', user.id);
  checkAchievements({ ratingCount: data?.length || 0 });
}

// ---------- Slideshow order ----------
const HERO_ORDER_KEY = 'aurum-hero-order';
let _heroOrder = {};

function loadHeroOrder() {
  // Use in-memory cache (populated from Supabase) with localStorage fallback
  if (Object.keys(_heroOrder).length) return _heroOrder;
  try { return JSON.parse(localStorage.getItem(HERO_ORDER_KEY) || '{}'); }
  catch { return {}; }
}

async function saveHeroOrder(order) {
  _heroOrder = order;
  localStorage.setItem(HERO_ORDER_KEY, JSON.stringify(order));
  await setSiteSetting('hero_slideshow_order', order);
}

async function loadHeroOrderFromSupabase() {
  try {
    const order = (await getSiteSetting('hero_slideshow_order')) || {};
    _heroOrder = order;
    localStorage.setItem(HERO_ORDER_KEY, JSON.stringify(order));
  } catch (e) {
    console.warn('Could not load hero order from Supabase:', e);
  }
}

function applyHeroOrder(groups) {
  const order = loadHeroOrder();
  const ranked   = groups.filter(g => order[g.slug] != null).sort((a, b) => order[a.slug] - order[b.slug]);
  const unranked = groups.filter(g => order[g.slug] == null);
  return [...ranked, ...unranked];
}

// ---------- Global search overlay ----------
function initGlobalSearch() {
  const btn     = document.getElementById('globalSearchBtn');
  const overlay = document.getElementById('globalSearchOverlay');
  const input   = document.getElementById('globalSearchInput');
  const close   = document.getElementById('globalSearchClose');
  const results = document.getElementById('globalSearchResults');
  if (!btn || !overlay) return;

  function openSearch() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => input?.focus(), 50);
  }

  function closeSearch() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (input) input.value = '';
    if (results) results.innerHTML = '';
  }

  btn.addEventListener('click', openSearch);
  close?.addEventListener('click', closeSearch);
  overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeSearch(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) closeSearch();
    if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && overlay.hidden) {
      e.preventDefault();
      openSearch();
    }
  });

  input?.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q || q.length < 2) { results.innerHTML = ''; return; }

    const groups  = groupVideos(AppState.videos);
    const matches = groups.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.category?.toLowerCase().includes(q)
    ).slice(0, 10);

    if (!matches.length) {
      results.innerHTML = `<div class="global-search-empty">No results for "${escapeHtml(input.value)}"</div>`;
      return;
    }

    results.innerHTML = matches.map(g => `
      <a class="global-search-result" href="detail.html?show=${encodeURIComponent(g.slug)}">
        <div class="global-search-result-cover">
          ${g.firstCover ? `<img src="${escapeHtml(g.firstCover)}" alt="">` : `<div class="cover-placeholder" style="height:100%;font-size:16px">${escapeHtml(g.title.charAt(0))}</div>`}
        </div>
        <div class="global-search-result-info">
          <div class="global-search-result-title">${escapeHtml(g.title)}</div>
          <div class="global-search-result-meta">${escapeHtml((g.category || 'Show').toUpperCase())} · ${g.videos.length} ${g.videos.length === 1 ? 'ep' : 'eps'}</div>
        </div>
        <span class="global-search-result-arrow">→</span>
      </a>
    `).join('');
  });
}


// ---------- Progress sync (polling) ----------
let _progressPollTimer = null;

async function startProgressSync() {
  stopProgressSync();
  const user = await getCurrentUser();
  if (!user) return;

  async function poll() {
    try {
      const { data, error } = await getSupabase()
        .from('watch_progress')
        .select('*')
        .eq('user_id', user.id);
      if (error || !data) return;
      let changed = false;
      for (const row of data) {
        const k = slug(row.collection);
        const local = AppState.progress[k];
        const remoteEp = row.episode_number || 0;
        const localEp  = local?.episodeNumber || 0;
        const remoteTime = new Date(row.updated_at || 0).getTime();
        const localTime  = new Date(local?.lastWatched || 0).getTime();
        if (!local || remoteEp > localEp || (remoteEp === localEp && remoteTime > localTime)) {
          let episodeTitle = row.last_episode_title;
          if (remoteEp > 0) {
            const match = AppState.videos.find(v =>
              slug(v.collection) === k &&
              parseFloat(String(v.episode || '0').replace(/[^0-9.]/g, '')) === remoteEp
            );
            if (match) episodeTitle = match.title;
          }
          AppState.progress[k] = {
            lastEpisodeTitle: episodeTitle,
            timestamp:        row.timestamp || 0,
            episodeNumber:    remoteEp,
            lastWatched:      row.updated_at
          };
          changed = true;
        }
      }
      if (changed) {
        saveProgress();
        if (typeof renderContinueWatching === 'function') renderContinueWatching();
      }
    } catch {}
  }

  await poll();
  _progressPollTimer = setInterval(poll, 30000);
}

function stopProgressSync() {
  if (_progressPollTimer) { clearInterval(_progressPollTimer); _progressPollTimer = null; }
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
