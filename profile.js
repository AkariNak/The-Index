// ============================================================
// Onyx — profile.js
// Public, read-only view of another user's profile.
// Mirrors account.js but strips: email, username edit, avatar edit,
// sign-out, and the remove buttons. Reads a target user by ?u=<username>
// or ?id=<user_id>.
// ============================================================

// ---------- Theme ----------
(function() {
  document.body.classList.toggle('light', localStorage.getItem('aurum-theme') === 'light');
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.textContent = document.body.classList.contains('light') ? '☀' : '☾';
    btn.addEventListener('click', () => {
      const nowLight = !document.body.classList.contains('light');
      document.body.classList.toggle('light', nowLight);
      localStorage.setItem('aurum-theme', nowLight ? 'light' : 'dark');
      btn.textContent = nowLight ? '☀' : '☾';
    });
  }
})();

const accountMain = document.getElementById('accountMain');

const STATUS_LABELS = {
  watching:      'Watching',
  completed:     'Completed',
  plan_to_watch: 'Plan to Watch',
  on_hold:       'On Hold',
  dropped:       'Dropped'
};

const ACHIEVEMENT_DISPLAY = [
  { key: 'first_watch',   label: 'First Watch',    desc: 'Watch your first episode',        icon: '▶' },
  { key: 'binge_mode',    label: 'Binge Mode',     desc: 'Watch 15 episodes in one day',    icon: '×15' },
  { key: 'completionist', label: 'Completionist',  desc: 'Complete 5 shows',                icon: '✓' },
  { key: 'century',       label: 'Century',        desc: 'Watch 100 episodes total',        icon: '100' },
  { key: 'loyal_fan',     label: 'Loyal Fan',      desc: 'Rate 10 shows',                   icon: '★' },
  { key: 'explorer',      label: 'Explorer',       desc: 'Add 5 shows to your list',        icon: '◈' },
  { key: 'night_owl',     label: 'Night Owl',      desc: 'Watch between 1am and 5am',       icon: '◑' },
  { key: 'speed_runner',  label: 'Speed Runner',   desc: 'Complete a show in under 3 days', icon: '⚡' },
  { key: 'critic',        label: 'Critic',         desc: 'Rate every show you complete',    icon: '✎' },
];

let activeTab        = 'watching';
let targetUserId     = null;
let targetProfile    = null;
let watchList        = [];
let userRatings      = [];
let userAchievements = [];
let _abyssUnlocked   = false;      // may this viewer click through to abyss shows?
window._allGroups    = [];

// ---------- Target from URL ----------
function getTargetParams() {
  const p = new URLSearchParams(window.location.search);
  return { username: p.get('u'), id: p.get('id') };
}

// ---------- Abyss-visited check ----------
// A viewer may click abyss shows only if they've been past the gate. We treat
// two things as proof: fromAbyss set this session, OR the viewer has any abyss
// show in their OWN watch history (which required going through the gate).
async function computeAbyssUnlocked() {
  if (sessionStorage.getItem('fromAbyss') === '1') return true;
  if (localStorage.getItem('onyx-abyss-visited') === '1') return true;
  try {
    const viewer = await getCurrentUser();
    if (!viewer) return false;
    // Any of the viewer's own watch rows pointing at an abyss (void) show.
    const { data } = await getSupabase()
      .from('watch_status')
      .select('collection')
      .eq('user_id', viewer.id);
    if (!data?.length) return false;
    const abyssTitles = new Set(
      window._allGroups.filter(g => g.videos?.some(v => v.void)).map(g => slug(g.title))
    );
    return data.some(r => abyssTitles.has(slug(r.collection)));
  } catch { return false; }
}

// ---------- Stats ----------
function computeStats() {
  const completed   = watchList.filter(w => w.status === 'completed').length;
  const watching    = watchList.filter(w => w.status === 'watching').length;
  const planToWatch = watchList.filter(w => w.status === 'plan_to_watch').length;
  const rated       = userRatings.length;
  const avgRating   = rated
    ? (userRatings.reduce((s, r) => s + Number(r.rating), 0) / rated).toFixed(1)
    : '—';
  return { completed, watching, planToWatch, rated, avgRating };
}

function starsDisplay(rating) {
  const full  = Math.floor(rating);
  const half  = (rating % 1) >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function findGroup(collection) {
  const slugged = slug(collection);
  return window._allGroups.find(g => slug(g.title) === slugged);
}

function isAbyssCollection(collection) {
  const group = findGroup(collection);
  return !!group?.videos?.some(v => v.void);
}

// Returns { href, clickable }. Abyss shows are only clickable if unlocked.
function detailLink(collection) {
  const abyss = isAbyssCollection(collection);
  if (abyss && !_abyssUnlocked) return { href: null, clickable: false, abyss: true };
  const page = abyss ? 'home.html' : 'detail.html';
  return { href: `${page}?show=${encodeURIComponent(slug(collection))}`, clickable: true, abyss };
}

// ---------- Render ----------
function renderNotFound(msg) {
  accountMain.innerHTML = `
    <div class="account-gate">
      <h2>Profile not found</h2>
      <p>${escapeHtml(msg || "This user doesn't exist or has no public profile.")}</p>
      <div class="account-gate-actions">
        <a class="btn btn-solid" href="index.html">Back to Onyx</a>
      </div>
    </div>`;
}

function renderProfile() {
  const stats = computeStats();
  const avatarHtml = targetProfile?.avatar_url
    ? `<img class="profile-avatar" src="${escapeHtml(targetProfile.avatar_url)}" alt="Avatar">`
    : `<div class="profile-avatar-placeholder">${escapeHtml((targetProfile?.username || '?').charAt(0).toUpperCase())}</div>`;

  const joined = targetProfile?.created_at
    ? new Date(targetProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  accountMain.innerHTML = `
    <div class="profile-banner"><div class="profile-banner-accent"></div></div>
    <div class="profile-card">
      <div class="profile-top">
        <div class="profile-avatar-wrap">
          ${avatarHtml}
        </div>
        <div class="profile-identity">
          <div class="profile-username">${escapeHtml(targetProfile?.username || 'User')}</div>
          ${joined ? `<div class="profile-email">Joined ${escapeHtml(joined)}</div>` : ''}
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat"><span class="profile-stat-value">${stats.completed}</span><span class="profile-stat-label">Completed</span></div>
        <div class="profile-stat"><span class="profile-stat-value">${stats.watching}</span><span class="profile-stat-label">Watching</span></div>
        <div class="profile-stat"><span class="profile-stat-value">${stats.planToWatch}</span><span class="profile-stat-label">Plan to Watch</span></div>
        <div class="profile-stat"><span class="profile-stat-value">${stats.rated}</span><span class="profile-stat-label">Rated</span></div>
        <div class="profile-stat"><span class="profile-stat-value">${stats.avgRating}</span><span class="profile-stat-label">Avg Rating</span></div>
      </div>
    </div>

    <div class="account-body">
      <nav class="account-sidebar-nav">
        ${Object.entries(STATUS_LABELS).map(([key, label]) => {
          const c = watchList.filter(w => w.status === key).length;
          return `<button class="account-nav-item ${key === activeTab ? 'active' : ''}" data-tab="${key}" type="button">
            ${label}<span class="account-nav-count">${c}</span>
          </button>`;
        }).join('')}
        <button class="account-nav-item ${activeTab === 'ratings' ? 'active' : ''}" data-tab="ratings" type="button">
          Ratings<span class="account-nav-count">${userRatings.length}</span>
        </button>
        <button class="account-nav-item ${activeTab === 'achievements' ? 'active' : ''}" data-tab="achievements" type="button">
          Achievements<span class="account-nav-count">${userAchievements.length}</span>
        </button>
      </nav>

      <div class="account-content">
        <div class="account-content-title" id="contentTitle">${activeTab === 'ratings' ? 'Ratings' : STATUS_LABELS[activeTab] || activeTab}</div>
        <div id="accountContentBody"></div>
      </div>
    </div>
  `;

  renderContentBody();
  wireProfileEvents();
}

function renderContentBody() {
  const body  = document.getElementById('accountContentBody');
  const title = document.getElementById('contentTitle');
  if (!body) return;
  if (title) title.textContent = activeTab === 'ratings' ? 'Ratings' : (STATUS_LABELS[activeTab] || activeTab);

  if (activeTab === 'ratings') { renderRatingsTab(body); return; }
  if (activeTab === 'achievements') { renderAchievementsTab(body); return; }

  const entries = watchList.filter(w => w.status === activeTab);
  if (!entries.length) { body.innerHTML = `<div class="watchlist-empty">Nothing here yet.</div>`; return; }

  body.innerHTML = `<div class="watchlist-grid">${entries.map(entry => {
    const group = findGroup(entry.collection);
    const cover = group?.firstCover;
    const { href, clickable, abyss } = detailLink(entry.collection);
    const coverInner = `
      <div class="poster-cover">
        ${cover ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(entry.collection)}" loading="lazy">` : `<div class="cover-placeholder">${escapeHtml(entry.collection.charAt(0).toUpperCase())}</div>`}
        ${clickable ? '<div class="poster-overlay"><span class="poster-play-icon">▶</span></div>' : (abyss ? '<div class="poster-overlay poster-locked"><span class="poster-play-icon">🔒</span></div>' : '')}
      </div>
      <div class="poster-info">
        <div class="poster-cat">${escapeHtml(STATUS_LABELS[entry.status] || entry.status)}</div>
        <h3 class="poster-title">${escapeHtml(entry.collection)}</h3>
      </div>`;
    const card = clickable
      ? `<a class="poster-clickable" href="${escapeHtml(href)}">${coverInner}</a>`
      : `<div class="poster-clickable poster-nolink" title="${abyss ? 'Restricted — visit the Abyss to view' : ''}">${coverInner}</div>`;
    return `<div class="watchlist-card-wrap"><article class="poster-card">${card}</article></div>`;
  }).join('')}</div>`;
}

function renderAchievementsTab(body) {
  const unlocked = new Set(userAchievements.map(a => a.achievement_key));
  body.innerHTML = `
    <div class="achievements-grid">
      ${ACHIEVEMENT_DISPLAY.map(a => {
        const isUnlocked = unlocked.has(a.key);
        const unlockedAt = userAchievements.find(u => u.achievement_key === a.key)?.unlocked_at;
        const date = unlockedAt ? new Date(unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        return `
          <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-card-icon">${a.icon}</div>
            <div class="achievement-card-info">
              <div class="achievement-card-name">${escapeHtml(a.label)}</div>
              <div class="achievement-card-desc">${escapeHtml(a.desc)}</div>
              ${isUnlocked && date ? `<div class="achievement-card-date">${date}</div>` : ''}
            </div>
            ${isUnlocked ? '<div class="achievement-card-check">✓</div>' : '<div class="achievement-card-lock">🔒</div>'}
          </div>`;
      }).join('')}
    </div>`;
}

function renderRatingsTab(body) {
  if (!userRatings.length) { body.innerHTML = `<div class="watchlist-empty">No ratings yet.</div>`; return; }
  const sorted = [...userRatings].sort((a, b) => b.rating - a.rating);
  body.innerHTML = `<div class="ratings-list">${sorted.map(r => {
    const group = findGroup(r.collection);
    const cover = group?.firstCover;
    const { href, clickable } = detailLink(r.collection);
    const titleEl = clickable
      ? `<a class="rating-row-title" href="${escapeHtml(href)}">${escapeHtml(r.collection)}</a>`
      : `<span class="rating-row-title rating-row-nolink">${escapeHtml(r.collection)}</span>`;
    return `
      <div class="rating-row">
        <div class="rating-row-cover">
          ${cover ? `<img src="${escapeHtml(cover)}" alt="">` : `<div class="cover-placeholder" style="height:100%;font-size:18px">${escapeHtml(r.collection.charAt(0))}</div>`}
        </div>
        ${titleEl}
        <div class="rating-row-stars" title="${r.rating} / 5">${starsDisplay(Number(r.rating))} ${Number(r.rating).toFixed(1)}</div>
      </div>`;
  }).join('')}</div>`;
}

function wireProfileEvents() {
  accountMain.addEventListener('click', e => {
    const target = e.target.closest('.account-nav-item');
    if (target?.dataset.tab) {
      activeTab = target.dataset.tab;
      document.querySelectorAll('.account-nav-item').forEach(b => b.classList.toggle('active', b === target));
      renderContentBody();
    }
  });
}

// ---------- Nav auth (viewer's own state) ----------
function wireNavAuth() {
  const signInBtn   = document.getElementById('signInNavBtn');
  const accountLink = document.getElementById('accountLink');
  getCurrentUser().then(user => {
    if (user) {
      if (signInBtn) signInBtn.style.display = 'none';
      if (accountLink) accountLink.hidden = false;
    } else {
      if (signInBtn) { signInBtn.style.display = ''; signInBtn.onclick = () => window.location.href = 'account.html'; }
      if (accountLink) accountLink.hidden = true;
    }
  });
}

// ---------- Boot ----------
async function bootProfile() {
  await coreInit();
  initGlobalSearch();
  wireNavAuth();

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = '© ' + new Date().getFullYear();

  const { username, id } = getTargetParams();
  if (!username && !id) { renderNotFound('No user specified.'); return; }

  // Resolve the target profile row.
  try {
    let q = getSupabase().from('user_profiles').select('id, username, avatar_url, created_at');
    q = id ? q.eq('id', id) : q.ilike('username', username);
    const { data: profile } = await q.maybeSingle();
    if (!profile) { renderNotFound(); return; }
    targetProfile = profile;
    targetUserId  = profile.id;
    document.title = `${profile.username} — Onyx`;
  } catch (e) {
    renderNotFound('Could not load this profile.');
    return;
  }

  // Load all videos (incl. void) for covers/links, then the target's public data.
  try {
    let allVids = [], from = 0; const pageSize = 1000;
    while (true) {
      const { data, error } = await getSupabase().from('videos').select('*').range(from, from + pageSize - 1);
      if (error || !data?.length) break;
      allVids = allVids.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    window._allGroups = groupVideos(allVids.map(normalizeVideo));
  } catch {
    window._allGroups = groupVideos(AppState.videos);
  }

  _abyssUnlocked = await computeAbyssUnlocked();

  const sb = getSupabase();
  const [wl, ratings, achievements] = await Promise.all([
    sb.from('watch_status').select('collection, status').eq('user_id', targetUserId).then(({ data }) => data || []),
    sb.from('ratings').select('collection, rating').eq('user_id', targetUserId).then(({ data }) => data || []),
    sb.from('achievements').select('achievement_key, unlocked_at').eq('user_id', targetUserId).then(({ data }) => data || [])
  ]);
  watchList        = wl;
  userRatings      = ratings;
  userAchievements = achievements;

  renderProfile();
}

bootProfile();
