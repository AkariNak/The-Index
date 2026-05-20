// ============================================================
// Aurum — account.js
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

let activeTab      = 'watching';
let currentUser    = null;
let currentProfile = null;
let watchList      = [];
let userRatings    = [];

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

  if (activeTab === 'ratings') {
    renderRatingsTab(body);
    return;
  }

  const entries = watchList.filter(w => w.status === activeTab);
  const groups  = groupVideos(AppState.videos);

  if (!entries.length) { body.innerHTML = `<div class="watchlist-empty">Nothing here yet.</div>`; return; }

  body.innerHTML = `<div class="watchlist-grid">${entries.map(entry => {
    const group = groups.find(g => g.title === entry.collection);
    const cover = group?.firstCover;
    return `
      <div class="watchlist-card-wrap">
        <article class="poster-card">
          <a class="poster-clickable" href="detail.html?show=${encodeURIComponent(slug(entry.collection))}">
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

  // Wire remove buttons
  body.querySelectorAll('.wl-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      const collection = btn.dataset.collection;
      try {
        await setWatchStatus(collection, null);
        watchList = watchList.filter(w => w.collection !== collection);
        btn.closest('.watchlist-card-wrap')?.remove();
        const remaining = body.querySelectorAll('.watchlist-card-wrap');
        if (!remaining.length) body.innerHTML = `<div class="watchlist-empty">Nothing here yet.</div>`;
        // Update sidebar counts
        document.querySelectorAll('.account-nav-item[data-tab]').forEach(navBtn => {
          const tab = navBtn.dataset.tab;
          if (tab === 'ratings') return;
          const count = watchList.filter(w => w.status === tab).length;
          const badge = navBtn.querySelector('.account-nav-count');
          if (badge) badge.textContent = count;
        });
        // Update stats
        const stats = computeStats();
        document.querySelectorAll('.profile-stat').forEach((el, i) => {
          const vals = [stats.completed, stats.watching, stats.planToWatch, stats.rated, stats.avgRating];
          const valEl = el.querySelector('.profile-stat-value');
          if (valEl && vals[i] !== undefined) valEl.textContent = vals[i];
        });
      } catch (err) { console.warn('Remove failed:', err); }
    });
  });
}

function renderRatingsTab(body) {
  const groups = groupVideos(AppState.videos);
  if (!userRatings.length) { body.innerHTML = `<div class="watchlist-empty">No ratings yet.</div>`; return; }
  const sorted = [...userRatings].sort((a, b) => b.rating - a.rating);
  body.innerHTML = `<div class="ratings-list">${sorted.map(r => {
    const group = groups.find(g => g.title === r.collection);
    const cover = group?.firstCover;
    return `
      <div class="rating-row">
        <div class="rating-row-cover">
          ${cover ? `<img src="${escapeHtml(cover)}" alt="">` : `<div class="cover-placeholder" style="height:100%;font-size:18px">${escapeHtml(r.collection.charAt(0))}</div>`}
        </div>
        <a class="rating-row-title" href="detail.html?show=${encodeURIComponent(slug(r.collection))}">${escapeHtml(r.collection)}</a>
        <div class="rating-row-stars" title="${r.rating} / 5">${starsDisplay(Number(r.rating))} ${Number(r.rating).toFixed(1)}</div>
      </div>
    `;
  }).join('')}</div>`;
}

function wireAccountEvents() {
  // Avatar
  document.getElementById('avatarFileInput')?.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const msg = document.getElementById('profileStatusMsg');
    if (msg) msg.textContent = 'Uploading…';
    try {
      currentProfile.avatar_url = await uploadAvatar(file);
      if (msg) msg.textContent = 'Avatar updated!';
      await renderAccount();
    } catch (err) { if (msg) msg.textContent = `Upload failed: ${err.message}`; }
  });

  // Username edit
  const editBtn   = document.getElementById('editUsernameBtn');
  const editArea  = document.getElementById('usernameEditArea');
  const saveBtn   = document.getElementById('saveUsernameBtn');
  const cancelBtn = document.getElementById('cancelUsernameBtn');
  const input     = document.getElementById('newUsernameInput');
  const availMsg  = document.getElementById('usernameAvailMsg');
  const statusMsg = document.getElementById('profileStatusMsg');

  editBtn?.addEventListener('click',   () => { editArea.hidden = false; input?.focus(); });
  cancelBtn?.addEventListener('click', () => { editArea.hidden = true; if (input) input.value = ''; if (availMsg) availMsg.textContent = ''; });

  let checkTimer = null;
  input?.addEventListener('input', () => {
    clearTimeout(checkTimer);
    if (availMsg) { availMsg.textContent = ''; availMsg.className = 'username-availability'; }
    const val = input.value.trim();
    if (val.length < 3) return;
    checkTimer = setTimeout(async () => {
      const ok = await checkUsernameAvailable(val);
      if (availMsg) { availMsg.textContent = ok ? '✓ Available' : '✗ Already taken'; availMsg.className = `username-availability ${ok ? 'available' : 'taken'}`; }
    }, 500);
  });

  saveBtn?.addEventListener('click', async () => {
    const val = input?.value?.trim();
    if (!val || val.length < 3) return;
    saveBtn.disabled = true;
    try {
      await updateUsername(val);
      currentProfile.username = val;
      if (statusMsg) statusMsg.textContent = 'Username updated!';
      if (editArea) editArea.hidden = true;
      const display = document.getElementById('displayUsername');
      if (display) display.textContent = val;
    } catch (err) { if (statusMsg) statusMsg.textContent = err.message; }
    finally { saveBtn.disabled = false; }
  });

  // Nav tabs
  document.querySelectorAll('.account-nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll('.account-nav-item').forEach(b => b.classList.toggle('active', b === btn));
      renderContentBody();
    });
  });

  // Sign out
  document.getElementById('signOutBtn')?.addEventListener('click', async () => {
    await supabaseSignOut();
    currentUser = null; currentProfile = null; watchList = []; userRatings = [];
    renderGate();
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
    <input id="authPassword" type="password" placeholder="Password" autocomplete="new-password">
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

  // Username availability check for signup
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
  currentUser = await getCurrentUser();
  if (!currentUser) { renderGate(); return; }
  [currentProfile, watchList, userRatings] = await Promise.all([
    getCurrentProfile(),
    getUserWatchList(),
    getSupabase().from('ratings').select('collection, rating').eq('user_id', currentUser.id).then(({ data }) => data || [])
  ]);
  // Safety — if profile row doesn't exist yet create a blank one
  if (!currentProfile) currentProfile = { username: currentUser.email?.split('@')[0] || 'User', avatar_url: null };
  await renderAccount();
}

bootAccount();
