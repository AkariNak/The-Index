// ============================================================
// Onyx — feedback.js
// Feedback button in nav, modal, anonymous submissions
// ============================================================
(function () {
  const CATEGORIES = [
    { value: 'bug',           label: '🐛 Bug Report' },
    { value: 'missing_anime', label: '📺 Missing Anime' },
    { value: 'not_loading',   label: '⚠️ Video Not Loading' },
    { value: 'new_anime',     label: '✨ New Anime Request' },
    { value: 'other',         label: '💬 Other' },
  ];

  const style = document.createElement('style');
  style.textContent = `
    .fb-nav-btn {
      background: transparent;
      border: 1px solid var(--line, #2A3050);
      color: var(--ink-soft, #A0AABF);
      font-family: var(--mono, monospace);
      font-size: 9px;
      letter-spacing: .14em;
      text-transform: uppercase;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: border-color .15s, color .15s;
      white-space: nowrap;
    }
    .fb-nav-btn:hover { border-color: var(--accent, #3B82F6); color: var(--accent, #3B82F6); }
    .fb-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(4px);
      z-index: 9991;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      opacity: 0; pointer-events: none;
      transition: opacity .2s;
    }
    .fb-overlay.open { opacity: 1; pointer-events: all; }
    .fb-modal {
      background: var(--paper-2, #161B27);
      border: 1px solid var(--line, #2A3050);
      border-radius: 12px;
      padding: 28px;
      width: 100%; max-width: 480px;
      display: flex; flex-direction: column; gap: 16px;
      transform: translateY(12px);
      transition: transform .2s;
      position: relative;
    }
    .fb-overlay.open .fb-modal { transform: translateY(0); }
    .fb-modal h3 { font-family: var(--display, sans-serif); font-size: 18px; font-weight: 700; color: var(--ink, #F8F8F8); margin: 0; }
    .fb-modal p { font-size: 13px; color: var(--ink-soft, #A0AABF); margin: -8px 0 0; line-height: 1.5; }
    .fb-label { font-family: var(--mono, monospace); font-size: 9px; letter-spacing: .18em; text-transform: uppercase; color: var(--ink-soft, #A0AABF); display: block; margin-bottom: 6px; }
    .fb-cats { display: flex; flex-wrap: wrap; gap: 8px; }
    .fb-cat-btn {
      background: var(--paper-3, #1E2435);
      border: 1px solid var(--line, #2A3050);
      color: var(--ink-soft, #A0AABF);
      font-family: var(--mono, monospace);
      font-size: 10px; letter-spacing: .1em;
      padding: 7px 12px; border-radius: 6px;
      cursor: pointer; transition: all .15s;
    }
    .fb-cat-btn:hover { border-color: var(--accent, #3B82F6); color: var(--accent, #3B82F6); }
    .fb-cat-btn.selected { background: var(--accent, #3B82F6); border-color: var(--accent, #3B82F6); color: #fff; }
    .fb-textarea {
      width: 100%;
      background: var(--paper-3, #1E2435);
      border: 1px solid var(--line, #2A3050);
      color: var(--ink, #F8F8F8);
      font-family: var(--body, sans-serif);
      font-size: 14px; border-radius: 8px;
      padding: 10px 12px; resize: vertical; min-height: 100px;
      line-height: 1.5; outline: none; box-sizing: border-box;
      transition: border-color .15s;
    }
    .fb-textarea:focus { border-color: var(--accent, #3B82F6); }
    .fb-textarea::placeholder { color: var(--ink-mute, #5A6480); }
    .fb-message-wrap { display: none; flex-direction: column; gap: 6px; }
    .fb-message-wrap.visible { display: flex; }
    .fb-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .fb-cancel {
      background: transparent; border: 1px solid var(--line, #2A3050);
      color: var(--ink-soft, #A0AABF);
      font-family: var(--mono, monospace); font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
      padding: 9px 18px; border-radius: 6px; cursor: pointer; transition: all .15s;
    }
    .fb-cancel:hover { border-color: var(--accent, #3B82F6); color: var(--accent, #3B82F6); }
    .fb-submit {
      background: var(--accent, #3B82F6); border: none; color: #fff;
      font-family: var(--mono, monospace); font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
      padding: 9px 22px; border-radius: 6px; cursor: pointer; font-weight: 600;
      transition: background .15s, opacity .15s;
    }
    .fb-submit:hover { background: var(--accent-dark, #2563EB); }
    .fb-submit:disabled { opacity: .5; cursor: not-allowed; }
    .fb-status { font-family: var(--mono, monospace); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; text-align: center; padding: 8px 0 0; min-height: 20px; }
    .fb-status.success { color: #5cb85c; }
    .fb-status.error { color: #e05252; }
    .fb-close { position: absolute; top: 12px; right: 14px; background: transparent; border: none; color: var(--ink-mute, #5A6480); font-size: 20px; cursor: pointer; padding: 4px 6px; border-radius: 4px; transition: color .15s; }
    .fb-close:hover { color: var(--ink, #F8F8F8); }
  `;
  document.head.appendChild(style);

  // Add button to nav topnav-right
  function injectNavBtn() {
    const right = document.querySelector('.topnav-right');
    if (!right) return;
    const btn = document.createElement('button');
    btn.className = 'fb-nav-btn';
    btn.id = 'fbNavBtn';
    btn.setAttribute('aria-label', 'Send feedback');
    btn.textContent = '✉ Feedback';
    // Insert before the first child
    right.insertBefore(btn, right.firstChild);
    btn.addEventListener('click', openModal);
  }

  // Build modal
  const overlay = document.createElement('div');
  overlay.className = 'fb-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'fbModalTitle');
  overlay.innerHTML = `
    <div class="fb-modal">
      <button class="fb-close" id="fbClose" aria-label="Close">×</button>
      <h3 id="fbModalTitle">Send Feedback</h3>
      <p>Report a bug, missing anime, or request something new. No account needed.</p>
      <div>
        <label class="fb-label">What's this about?</label>
        <div class="fb-cats" id="fbCats">
          ${CATEGORIES.map(c => `<button class="fb-cat-btn" data-value="${c.value}">${c.label}</button>`).join('')}
        </div>
      </div>
      <div class="fb-message-wrap" id="fbMessageWrap">
        <label class="fb-label" for="fbMessage">Details</label>
        <textarea class="fb-textarea" id="fbMessage" placeholder="Describe the issue or your request…" maxlength="1000"></textarea>
      </div>
      <div class="fb-actions">
        <button class="fb-cancel" id="fbCancel">Cancel</button>
        <button class="fb-submit" id="fbSubmit" disabled>Submit</button>
      </div>
      <div class="fb-status" id="fbStatus"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  let selectedCategory = null;

  function openModal() {
    overlay.classList.add('open');
    document.getElementById('fbStatus').textContent = '';
    document.getElementById('fbStatus').className = 'fb-status';
    document.getElementById('fbMessage').value = '';
    document.getElementById('fbMessageWrap').classList.remove('visible');
    document.getElementById('fbSubmit').disabled = true;
    selectedCategory = null;
    document.querySelectorAll('.fb-cat-btn').forEach(b => b.classList.remove('selected'));
  }

  function closeModal() { overlay.classList.remove('open'); }

  document.getElementById('fbClose').addEventListener('click', closeModal);
  document.getElementById('fbCancel').addEventListener('click', closeModal);
  overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });

  document.getElementById('fbCats').addEventListener('click', e => {
    const btn = e.target.closest('.fb-cat-btn');
    if (!btn) return;
    document.querySelectorAll('.fb-cat-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedCategory = btn.dataset.value;
    document.getElementById('fbMessageWrap').classList.add('visible');
    document.getElementById('fbSubmit').disabled = false;
    document.getElementById('fbMessage').focus();
  });

  document.getElementById('fbSubmit').addEventListener('click', async () => {
    const message = document.getElementById('fbMessage').value.trim();
    const statusEl = document.getElementById('fbStatus');
    const submitBtn = document.getElementById('fbSubmit');
    if (!message) { statusEl.textContent = 'Please enter a message.'; statusEl.className = 'fb-status error'; return; }
    submitBtn.disabled = true;
    statusEl.textContent = 'Submitting…';
    statusEl.className = 'fb-status';
    try {
      const sb = (typeof getSupabase === 'function') ? getSupabase() : window.supabase?.createClient(
        'https://eosnuxttjchckprpymnw.supabase.co',
        'sb_publishable_QSDQxkMRbxn1M4m5L5sB6w_auxSAZVg'
      );
      const { error } = await sb.from('feedback').insert({ category: selectedCategory, message });
      if (error) throw error;
      statusEl.textContent = '✓ Submitted — thank you!';
      statusEl.className = 'fb-status success';
      document.getElementById('fbMessage').value = '';
      setTimeout(closeModal, 1800);
    } catch (err) {
      statusEl.textContent = 'Something went wrong. Try again.';
      statusEl.className = 'fb-status error';
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNavBtn);
  } else {
    injectNavBtn();
  }
})();
