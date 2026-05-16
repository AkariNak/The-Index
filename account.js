// ============================================================
// Aurum — account.js
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
const authDialog  = document.getElementById('authDialog');

const STATUS_LABELS = {
  watching:      'Watching',
  completed:     'Completed',
  plan_to_watch: 'Plan to Watch',
  on_hold:       'On Hold',
  dropped:       'Dropped'
};

let activeStatus   = 'watching';
let currentUser    = null;
let currentProfile = null;
let watchList      = [];

// ---------- Gate ----------
function renderGate() {
  accountMain.innerHTML = `
    <div class="account-gate">
      <h2>Your Account</h2>
      <p>Sign in to track your watch history, leave comments, and manage your profile.</p>
      <div class="account-gate-actions">
        <button class="btn btn-solid" id="gateSignInBtn" type="button">Sign In</button>
        <button class="btn btn-outline" id="gateSignUpBtn" type="button">Create Account</button>
      </div>
    </div>
  `;
  document.getElementById('gateSignInBtn').addEventListener('click', () => openAuthDialog('signin'));
  document.getElementById('gateSignUpBtn').addEventListener('click', () => openAuthDialog('signup'));
}

// ---------- Account ----------
async function renderAccount() {
  const avatarHtml = currentProfile?.avatar_url
    ? `<img class="profile-avatar" src="${escapeHtml(currentProfile.avatar_url)}" alt="Avatar">`
    : `<div class="profile-avatar-placeholder">${escapeHtml((currentProfile?.username || '?').charAt(0).toUpperCase())}</div>`;

  accountMain.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar-wrap">
        ${avatarHtml}
        <label class="profile-avatar-edit" title="Change avatar">✎<input type="file" id="avatarFileInput" accept="image/*"></label>
      </div>
      <div class="profile-info">
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

    <div class="watchlist-tabs" id="watchlistTabs">
      ${Object.entries(STATUS_LABELS).map(([key, label]) => {
        const c = watchList.filter(w => w.status === key).length;
        return `<button class="watchlist-tab ${key === activeStatus ? 'active' : ''}" data-status="${key}" type="button">
          ${label}<span class="watchlist-count">${c}</span>
        </button>`;
      }).join('')}
    </div>

    <div class="watchlist-grid" id="watchlistGrid"></div>

    <div class="account-signout">
      <button class="btn btn-outline btn-small danger" id="signOutBtn" type="button">Sign Out</button>
    </div>
  `;

  renderWatchlistGrid();
  wireAccountEvents();
}

function renderWatchlistGrid() {
  const grid    = document.getElementById('watchlistGrid');
  if (!grid) return;
  const entries = watchList.filter(w => w.status === activeStatus);
  const groups  = groupVideos(AppState.videos);

  if (!entries.length) { grid.innerHTML = `<div class="watchlist-empty">Nothing here yet.</div>`; return; }

  grid.innerHTML = entries.map(entry => {
    const group = groups.find(g => g.title === entry.collection);
    const cover = group?.firstCover;
    return `
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
    `;
  }).join('');
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
  const editBtn    = document.getElementById('editUsernameBtn');
  const editArea   = document.getElementById('usernameEditArea');
  const saveBtn    = document.getElementById('saveUsernameBtn');
  const cancelBtn  = document.getElementById('cancelUsernameBtn');
  const input      = document.getElementById('newUsernameInput');
  const availMsg   = document.getElementById('usernameAvailMsg');
  const statusMsg  = document.getElementById('profileStatusMsg');

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

  // Watch list tabs
  document.getElementById('watchlistTabs')?.querySelectorAll('.watchlist-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeStatus = tab.dataset.status;
      document.querySelectorAll('.watchlist-tab').forEach(t => t.classList.toggle('active', t === tab));
      renderWatchlistGrid();
    });
  });

  // Sign out
  document.getElementById('signOutBtn')?.addEventListener('click', async () => {
    await supabaseSignOut();
    window.location.href = 'index.html';
  });
}

// ---------- Auth dialog ----------
function openAuthDialog(mode) {
  const inner = document.getElementById('authDialogInner');
  if (!inner) return;
  const closeX = `<button type="button" class="dialog-close" id="authClose">×</button>`;

  if (mode === 'signin') {
    inner.innerHTML = `
      ${closeX}<h3>Sign In</h3>
      <input id="authEmail" type="email" placeholder="Email" autocomplete="username">
      <input id="authPassword" type="password" placeholder="Password" autocomplete="current-password">
      <p id="authError" class="admin-error" hidden></p>
      <div class="admin-actions">
        <button type="button" class="btn btn-outline btn-small" id="authSwitch">Create account</button>
        <button type="button" class="btn btn-solid btn-small" id="authSubmit">Sign In</button>
      </div>`;
    document.getElementById('authClose').addEventListener('click', closeAuthDialog);
    document.getElementById('authSwitch').addEventListener('click', () => openAuthDialog('signup'));
    document.getElementById('authSubmit').addEventListener('click', async () => {
      const errEl = document.getElementById('authError');
      try {
        await supabaseSignIn(document.getElementById('authEmail').value.trim(), document.getElementById('authPassword').value.trim());
        closeAuthDialog(); await init();
      } catch (err) { errEl.textContent = err.message; errEl.hidden = false; }
    });
  } else {
    inner.innerHTML = `
      ${closeX}<h3>Create Account</h3>
      <input id="authEmail" type="email" placeholder="Email" autocomplete="username">
      <input id="authUsername" type="text" placeholder="Username" maxlength="24">
      <input id="authPassword" type="password" placeholder="Password" autocomplete="new-password">
      <div id="authUsernameAvail" class="username-availability"></div>
      <p id="authError" class="admin-error" hidden></p>
      <div class="admin-actions">
        <button type="button" class="btn btn-outline btn-small" id="authSwitch">Sign in instead</button>
        <button type="button" class="btn btn-solid btn-small" id="authSubmit">Create Account</button>
      </div>`;
    document.getElementById('authClose').addEventListener('click', closeAuthDialog);
    document.getElementById('authSwitch').addEventListener('click', () => openAuthDialog('signin'));
    let timer = null;
    document.getElementById('authUsername').addEventListener('input', e => {
      clearTimeout(timer);
      const el = document.getElementById('authUsernameAvail');
      el.textContent = ''; el.className = 'username-availability';
      if (e.target.value.trim().length < 3) return;
      timer = setTimeout(async () => {
        const ok = await checkUsernameAvailable(e.target.value.trim());
        el.textContent = ok ? '✓ Available' : '✗ Already taken';
        el.className   = `username-availability ${ok ? 'available' : 'taken'}`;
      }, 500);
    });
    document.getElementById('authSubmit').addEventListener('click', async () => {
      const errEl    = document.getElementById('authError');
      const username = document.getElementById('authUsername').value.trim();
      if (username.length < 3) { errEl.textContent = 'Username must be at least 3 characters.'; errEl.hidden = false; return; }
      try {
        await supabaseSignUp(document.getElementById('authEmail').value.trim(), document.getElementById('authPassword').value.trim(), username);
        closeAuthDialog(); await init();
      } catch (err) { errEl.textContent = err.message; errEl.hidden = false; }
    });
  }

  if (typeof authDialog.showModal === 'function') authDialog.showModal();
  else authDialog.setAttribute('open', '');
}

function closeAuthDialog() {
  if (typeof authDialog?.close === 'function') authDialog.close();
  else authDialog?.removeAttribute('open');
}

// ---------- Bootstrap ----------
async function init() {
  await coreInit();
  currentUser    = await getCurrentUser();
  currentProfile = currentUser ? await getCurrentProfile() : null;
  if (!currentUser || !currentProfile) { renderGate(); return; }
  watchList = await getUserWatchList();
  await renderAccount();
}

init();
