// ============================================================
// Onyx — account.js
// ============================================================

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
const authDialog  = document.getElementById('authDialog');

const STATUS_LABELS = {
  watching:      'Watching',
  completed:     'Completed',
  plan_to_watch: 'Plan to Watch',
  on_hold:       'On Hold',
  dropped:       'Dropped'
};

const ACHIEVEMENT_DISPLAY = [
  { key: 'first_watch',   label: 'First Watch',    desc: 'Watch your first episode',             icon: '▶' },
  { key: 'binge_mode',    label: 'Binge Mode',     desc: 'Watch 15 episodes in one day',         icon: '×15' },
  { key: 'completionist', label: 'Completionist',  desc: 'Complete 5 shows',                     icon: '✓' },
  { key: 'century',       label: 'Century',        desc: 'Watch 100 episodes total',             icon: '100' },
  { key: 'loyal_fan',     label: 'Loyal Fan',      desc: 'Rate 10 shows',                        icon: '★' },
  { key: 'explorer',      label: 'Explorer',       desc: 'Add 5 shows to your list',             icon: '◈' },
  { key: 'night_owl',     label: 'Night Owl',      desc: 'Watch between 1am and 5am',            icon: '◑' },
  { key: 'speed_runner',  label: 'Speed Runner',   desc: 'Complete a show in under 3 days',      icon: '⚡' },
  { key: 'critic',        label: 'Critic',         desc: 'Rate every show you complete',         icon: '✎' },
];

let activeTab        = 'watching';
let currentUser      = null;
let currentProfile   = null;
let watchList        = [];
let userRatings      = [];
let userAchievements = [];
window.window._allGroups    = []; // includes void/abyss shows — global for debugging

// ---------- Gate ----------
function renderGate() {
  accountMain.innerHTML = `
    <div class="account-gate">
      <h2>Your Account</h2>
      <p>Sign in to track your watch history, rate shows, and manage your profile.</p>
      <div class="account-gate-actions">
        <button class="btn btn-solid" id="gateSignInBtn" type="button">Sign In</button>
        <button class="btn btn-outline" id="gateSignUpBtn" type="button">Create Account</button>
      </div>
    </div>
  `;
  document.getElementById('gateSignInBtn').addEventListener('click', () => openAuthDialog('signin'));
  document.getElementById('gateSignUpBtn').addEventListener('click', () => openAuthDialog('signup'));
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

// Find a group by collection name across ALL shows including abyss
function findGroup(collection) {
  return window._allGroups.find(g => g.title === collection);
}

// Get the correct detail page link — abyss shows go to home.html (abyss detail)
function detailLink(collection) {
  const group = findGroup(collection);
  const isAbyss = group?.videos?.some(v => v.void);
  const page = isAbyss ? 'home.html' : 'detail.html';
  return `${page}?show=${encodeURIComponent(slug(collection))}`;
}

// ---------- Render account ----------
async function renderAccount() {
  const stats = computeStats();
  const avatarHtml = currentProfile?.avatar_url
    ? `<img class="profile-avatar" src="${escapeHtml(currentProfile.avatar_url)}" alt="Avatar">`
    : `<div class="profile-avatar-placeholder">${escapeHtml((currentProfile?.username || '?').charAt(0).toUpperCase())}</div>`;

  accountMain.innerHTML = `
    <div class="profile-banner"><div class="profile-banner-accent"></div></div>
    <div class="profile-card">
      <div class="profile-top">
        <div class="profile-avatar-wrap">
          ${avatarHtml}
          <label class="profile-avatar-edit" title="Change avatar">✎<input type="file" id="avatarFileInput" accept="image/*"></label>
        </div>
        <div class="profile-identity">
          <div class="profile-username" id="displayUsername">${escapeHtml(currentProfile?.username || '')}</div>
          <div class="profile-email">${escapeHtml(currentUser?.email || '')}</div>
          <div class="profile-actions">
            <button class="btn btn-outline btn-small" id="editUsernameBtn" type="button">Change Username</button>
          </div>
          <div id="usernameEditArea" hidden>
            <div class="username-edit-row">
              <input type="text" id="newUsernameInput" placeholder="New username" maxlength="24">
              <button class="btn btn-solid btn-small" id="saveUsernameBtn" type="button">Save</button>
              <button class="btn btn-outline btn-small" id="cancelUsernameBtn" type="button">Cancel</button>
            </div>
            <div class="username-availability" id="usernameAvailMsg"></div>
          </div>
          <div class="profile-status-msg" id="profileStatusMsg"></div>
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat">
          <span class="profile-stat-value">${stats.completed}</span>
          <span class="profile-stat-label">Completed</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat-value">${stats.watching}</span>
          <span class="profile-stat-label">Watching</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat-value">${stats.planToWatch}</span>
          <span class="profile-stat-label">Plan to Watch</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat-value">${stats.rated}</span>
          <span class="profile-stat-label">Rated</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat-value">${stats.avgRating}</span>
          <span class="profile-stat-label">Avg Rating</span>
        </div>
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
        <div class="account-content-title" id="contentTitle">${activeTab === 'ratings' ? 'My Ratings' : STATUS_LABELS[activeTab] || activeTab}</div>
        <div id="accountContentBody"></div>
      </div>
    </div>

    <div class="account-signout">
      <button class="btn btn-outline btn-small danger" id="signOutBtn" type="button">Sign Out</button>
    </div>
  `;

  renderContentBody();
  wireAccountEvents();
}

function renderContentBody() {
  const body   = document.getElementById('accountContentBody');
  const title  = document.getElementById('contentTitle');
  if (!body) return;
  if (title) title.textContent = activeTab === 'ratings' ? 'My Ratings' : (STATUS_LABELS[activeTab] || activeTab);

  if (activeTab === 'ratings') { renderRatingsTab(body); return; }
  if (activeTab === 'achievements') { renderAchievementsTab(body); return; }

  const entries = watchList.filter(w => w.status === activeTab);
  if (!entries.length) { body.innerHTML = `<div class="watchlist-empty">Nothing here yet.</div>`; return; }

  body.innerHTML = `<div class="watchlist-grid">${entries.map(entry => {
    const group = findGroup(entry.collection);
    const cover = group?.firstCover;
    const link  = detailLink(entry.collection);
    return `
      <div class="watchlist-card-wrap">
        <article class="poster-card">
          <a class="poster-clickable" href="${escapeHtml(link)}">
            <div class="poster-cover">
              ${cover ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(entry.collection)}" loading="lazy">` : `<div class="cover-placeholder">${escapeHtml(entry.collection.charAt(0).toUpperCase())}</div>`}
              <div class="poster-overlay"><span class="poster-play-icon">▶</span></div>
            </div>
            <div class="poster-info">
              <div class="poster-cat">${escapeHtml(STATUS_LABELS[entry.status] || entry.status)}</div>
              <h3 class="poster-title">${escapeHtml(entry.collection)}</h3>
            </div>
          </a>
        </article>
        <button class="wl-remove" data-collection="${escapeHtml(entry.collection)}" type="button" title="Remove">✕</button>
      </div>
    `;
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
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderRatingsTab(body) {
  if (!userRatings.length) { body.innerHTML = `<div class="watchlist-empty">No ratings yet.</div>`; return; }
  const sorted = [...userRatings].sort((a, b) => b.rating - a.rating);
  body.innerHTML = `<div class="ratings-list">${sorted.map(r => {
    const group = findGroup(r.collection);
    const cover = group?.firstCover;
    const link  = detailLink(r.collection);
    return `
      <div class="rating-row">
        <div class="rating-row-cover">
          ${cover ? `<img src="${escapeHtml(cover)}" alt="">` : `<div class="cover-placeholder" style="height:100%;font-size:18px">${escapeHtml(r.collection.charAt(0))}</div>`}
        </div>
        <a class="rating-row-title" href="${escapeHtml(link)}">${escapeHtml(r.collection)}</a>
        <div class="rating-row-stars" title="${r.rating} / 5">${starsDisplay(Number(r.rating))} ${Number(r.rating).toFixed(1)}</div>
      </div>
    `;
  }).join('')}</div>`;
}

function wireAccountEvents() {
  accountMain.addEventListener('click', async e => {
    const target = e.target;
    if (target.closest('.profile-avatar-edit')) return;

    if (target.id === 'editUsernameBtn') {
      document.getElementById('usernameEditArea').hidden = false;
      document.getElementById('newUsernameInput')?.focus();
    }

    if (target.id === 'cancelUsernameBtn') {
      document.getElementById('usernameEditArea').hidden = true;
      const input = document.getElementById('newUsernameInput');
      if (input) input.value = '';
      const avail = document.getElementById('usernameAvailMsg');
      if (avail) avail.textContent = '';
    }

    if (target.id === 'saveUsernameBtn') {
      const input   = document.getElementById('newUsernameInput');
      const val     = input?.value?.trim();
      const statusMsg = document.getElementById('profileStatusMsg');
      if (!val || val.length < 3) return;
      target.disabled = true;
      try {
        await updateUsername(val);
        currentProfile.username = val;
        if (statusMsg) statusMsg.textContent = 'Username updated!';
        document.getElementById('usernameEditArea').hidden = true;
        const display = document.getElementById('displayUsername');
        if (display) display.textContent = val;
      } catch (err) {
        if (statusMsg) statusMsg.textContent = err.message;
      } finally { target.disabled = false; }
    }

    if (target.id === 'signOutBtn') {
      await supabaseSignOut();
      currentUser = null; currentProfile = null; watchList = []; userRatings = [];
      renderGate();
    }

    if (target.dataset.tab) {
      activeTab = target.dataset.tab;
      document.querySelectorAll('.account-nav-item').forEach(b => b.classList.toggle('active', b === target));
      renderContentBody();
    }

    if (target.classList.contains('wl-remove')) {
      const collection = target.dataset.collection;
      try {
        await setWatchStatus(collection, null);
        watchList = watchList.filter(w => w.collection !== collection);
        target.closest('.watchlist-card-wrap')?.remove();
        const body = document.getElementById('accountContentBody');
        if (body && !body.querySelector('.watchlist-card-wrap')) {
          body.innerHTML = `<div class="watchlist-empty">Nothing here yet.</div>`;
        }
        document.querySelectorAll('.account-nav-item[data-tab]').forEach(navBtn => {
          const tab = navBtn.dataset.tab;
          if (tab === 'ratings') return;
          const count = watchList.filter(w => w.status === tab).length;
          const badge = navBtn.querySelector('.account-nav-count');
          if (badge) badge.textContent = count;
        });
        const stats = computeStats();
        document.querySelectorAll('.profile-stat').forEach((el, i) => {
          const vals = [stats.completed, stats.watching, stats.planToWatch, stats.rated, stats.avgRating];
          const valEl = el.querySelector('.profile-stat-value');
          if (valEl && vals[i] !== undefined) valEl.textContent = vals[i];
        });
      } catch (err) { console.warn('Remove failed:', err); }
    }
  }, { once: false });

  accountMain.addEventListener('change', async e => {
    if (e.target.id !== 'avatarFileInput') return;
    const file = e.target.files?.[0];
    if (!file) return;
    const msg = document.getElementById('profileStatusMsg');
    if (msg) msg.textContent = 'Uploading…';
    try {
      currentProfile.avatar_url = await uploadAvatar(file);
      if (msg) msg.textContent = 'Avatar updated!';
      const wrap = document.querySelector('.profile-avatar-wrap');
      if (wrap) {
        const existing = wrap.querySelector('.profile-avatar, .profile-avatar-placeholder');
        if (existing) {
          const img = document.createElement('img');
          img.className = 'profile-avatar';
          img.src = currentProfile.avatar_url;
          img.alt = 'Avatar';
          existing.replaceWith(img);
        }
      }
    } catch (err) {
      if (msg) msg.textContent = `Upload failed: ${err.message}`;
    }
  });

  accountMain.addEventListener('input', async e => {
    if (e.target.id !== 'newUsernameInput') return;
    const avail = document.getElementById('usernameAvailMsg');
    if (!avail) return;
    avail.textContent = ''; avail.className = 'username-availability';
    const val = e.target.value.trim();
    if (val.length < 3) return;
    clearTimeout(accountMain._checkTimer);
    accountMain._checkTimer = setTimeout(async () => {
      const ok = await checkUsernameAvailable(val);
      avail.textContent = ok ? '✓ Available' : '✗ Already taken';
      avail.className = `username-availability ${ok ? 'available' : 'taken'}`;
    }, 500);
  });
}

// ---------- Auth dialog ----------
function openAuthDialog(mode) {
  const inner = document.getElementById('authDialogInner');
  if (!inner) return;
  inner.innerHTML = mode === 'signin' ? signInFormHtml() : signUpFormHtml();
  if (typeof authDialog.showModal === 'function') authDialog.showModal();
  else authDialog.setAttribute('open', '');
  wireAuthDialog(mode);
}

function closeAuthDialog() {
  if (typeof authDialog?.close === 'function') authDialog.close();
  else authDialog?.removeAttribute('open');
}

function signInFormHtml() {
  return `
    <h3>Sign In</h3>
    <input id="authEmail" type="email" placeholder="Email" autocomplete="username">
    <input id="authPassword" type="password" placeholder="Password" autocomplete="current-password">
    <p id="authError" class="admin-error" hidden></p>
    <div class="admin-actions">
      <button type="button" id="authCancel" class="btn btn-outline btn-small">Cancel</button>
      <button type="button" id="authSubmit" class="btn btn-solid btn-small">Sign In</button>
    </div>
    <p style="text-align:center;margin-top:12px;font-size:12px;color:var(--ink-mute)">
      No account? <button type="button" id="switchToSignUp" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:12px;padding:0">Create one</button>
    </p>
  `;
}

function signUpFormHtml() {
  return `
    <h3>Create Account</h3>
    <input id="authUsername" type="text" placeholder="Username" maxlength="24">
    <div class="username-availability" id="authUsernameAvail"></div>
    <input id="authEmail" type="email" placeholder="Email" autocomplete="username">
    <input id="authPassword" type="password" placeholder="Password" autocomplete="current-password">
    <p id="authError" class="admin-error" hidden></p>
    <div class="admin-actions">
      <button type="button" id="authCancel" class="btn btn-outline btn-small">Cancel</button>
      <button type="button" id="authSubmit" class="btn btn-solid btn-small">Create Account</button>
    </div>
    <p style="text-align:center;margin-top:12px;font-size:12px;color:var(--ink-mute)">
      Have an account? <button type="button" id="switchToSignIn" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:12px;padding:0">Sign in</button>
    </p>
  `;
}

function wireAuthDialog(mode) {
  document.getElementById('authCancel')?.addEventListener('click', closeAuthDialog);
  document.getElementById('switchToSignUp')?.addEventListener('click', () => { closeAuthDialog(); openAuthDialog('signup'); });
  document.getElementById('switchToSignIn')?.addEventListener('click', () => { closeAuthDialog(); openAuthDialog('signin'); });

  let checkTimer = null;
  document.getElementById('authUsername')?.addEventListener('input', e => {
    clearTimeout(checkTimer);
    const avail = document.getElementById('authUsernameAvail');
    if (!avail) return;
    avail.textContent = ''; avail.className = 'username-availability';
    const val = e.target.value.trim();
    if (val.length < 3) return;
    checkTimer = setTimeout(async () => {
      const ok = await checkUsernameAvailable(val);
      avail.textContent = ok ? '✓ Available' : '✗ Already taken';
      avail.className = `username-availability ${ok ? 'available' : 'taken'}`;
    }, 500);
  });

  document.getElementById('authSubmit')?.addEventListener('click', async () => {
    const email    = document.getElementById('authEmail')?.value?.trim() || '';
    const password = document.getElementById('authPassword')?.value?.trim() || '';
    const errorEl  = document.getElementById('authError');
    const submitBtn = document.getElementById('authSubmit');
    if (!email || !password) return;
    if (submitBtn) submitBtn.disabled = true;
    if (errorEl) errorEl.hidden = true;
    try {
      if (mode === 'signin') {
        await supabaseSignIn(email, password);
      } else {
        const username = document.getElementById('authUsername')?.value?.trim() || '';
        if (!username || username.length < 3) { throw new Error('Username must be at least 3 characters.'); }
        await supabaseSignUp(email, password, username);
      }
      closeAuthDialog();
      await bootAccount();
    } catch (err) {
      if (errorEl) { errorEl.textContent = err.message || 'Something went wrong.'; errorEl.hidden = false; }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// ---------- Boot ----------
async function bootAccount() {
  await coreInit();
  initGlobalSearch();

  // Load ALL videos including void/abyss for cover and link lookups
  try {
    const { data: allVids } = await getSupabase().from('videos').select('*');
    const allVideos = (allVids || []).map(normalizeVideo);
    window._allGroups = groupVideos(allVideos);
  } catch (e) {
    // Fallback to non-void only
    window._allGroups = groupVideos(AppState.videos);
  }

  currentUser = await getCurrentUser();
  if (!currentUser) { renderGate(); return; }
  [currentProfile, watchList, userRatings, userAchievements] = await Promise.all([
    getCurrentProfile(),
    getUserWatchList(),
    getSupabase().from('ratings').select('collection, rating').eq('user_id', currentUser.id).then(({ data }) => data || []),
    getUnlockedAchievements()
  ]);
  if (!currentProfile) currentProfile = { username: currentUser.email?.split('@')[0] || 'User', avatar_url: null };
  await renderAccount();
}

bootAccount();
