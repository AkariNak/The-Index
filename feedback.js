// ============================================================
// Onyx — feedback.js
// Floating feedback button + modal, works on every page
// Depends on: Supabase client already loaded (core.js or inline)
// ============================================================

(function () {
  const CATEGORIES = [
    { value: 'bug',           label: '🐛 Bug Report' },
    { value: 'missing_anime', label: '📺 Missing Anime' },
    { value: 'not_loading',   label: '⚠️ Video Not Loading' },
    { value: 'new_anime',     label: '✨ New Anime Request' },
    { value: 'other',         label: '💬 Other' },
  ];

  // ---------- Inject styles ----------
  const style = document.createElement('style');
  style.textContent = `
    .fb-btn {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 9990;
      background: var(--accent, #3B82F6);
      color: #fff;
      border: none;
      border-radius: 999px;
      padding: 10px 18px;
      font-family: var(--mono, monospace);
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(59,130,246,0.35);
      transition: transform 0.15s, box-shadow 0.15s;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .fb-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(59,130,246,0.45); }

    .fb-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(4px);
      z-index: 9991;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    }
    .fb-overlay.open { opacity: 1; pointer-events: all; }

    .fb-modal {
      background: var(--paper-2, #161B27);
      border: 1px solid var(--line, #2A3050);
      border-radius: 12px;
      padding: 28px;
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transform: translateY(12px);
      transition: transform 0.2s;
      position: relative;
    }
    .fb-overlay.open .fb-modal { transform: translateY(0); }

    .fb-modal h3 {
      font-family: var(--display, sans-serif);
      font-size: 18px;
      font-weight: 700;
      color: var(--ink, #F8F8F8);
      margin: 0;
      letter-spacing: 0.03em;
    }
    .fb-modal p {
      font-family: var(--body, sans-serif);
      font-size: 13px;
      color: var(--ink-soft, #A0AABF);
      margin: -8px 0 0;
      line-height: 1.5;
    }
    .fb-label {
      font-family: var(--mono, monospace);
      font-size: 9px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ink-soft, #A0AABF);
      display: block;
      margin-bottom: 6px;
    }
    .fb-select, .fb-textarea {
      width: 100%;
      background: var(--paper-3, #1E2435);
      border: 1px solid var(--line, #2A3050);
      color: var(--ink, #F8F8F8);
      font-family: var(--body, sans-serif);
      font-size: 14px;
      border-radius: 8px;
      outline: none;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }
    .fb-select { padding: 10px 12px; cursor: pointer; }
    .fb-textarea { padding: 10px 12px; resize: vertical; min-height: 100px; line-height: 1.5; }
    .fb-select:focus, .fb-textarea:focus { border-color: var(--accent, #3B82F6); }
    .fb-textarea::placeholder { color: var(--ink-mute, #5A6480); }

    .fb-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .fb-cancel {
      background: transparent;
      border: 1px solid var(--line, #2A3050);
      color: var(--ink-soft, #A0AABF);
      font-family: var(--mono, monospace);
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 9px 18px;
      border-radius: 6px;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
    }
    .fb-cancel:hover { border-color: var(--accent, #3B82F6); color: var(--accent, #3B82F6); }
    .fb-submit {
      background: var(--accent, #3B82F6);
      border: none;
      color: #fff;
      font-family: var(--mono, monospace);
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 9px 22px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.15s, opacity 0.15s;
    }
    .fb-submit:hover { background: var(--accent-dark, #2563EB); }
    .fb-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .fb-status {
      font-family: var(--mono, monospace);
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-align: center;
      padding: 8px 0 0;
      min-height: 20px;
    }
    .fb-status.success { color: #5cb85c; }
    .fb-status.error   { color: #e05252; }

    .fb-close {
      position: absolute;
      top: 12px; right: 14px;
      background: transparent;
      border: none;
      color: var(--ink-mute, #5A6480);
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
      padding: 4px 6px;
      border-radius: 4px;
      transition: color 0.15s;
    }
    .fb-close:hover { color: var(--ink, #F8F8F8); }

    @media (max-width: 600px) {
      .fb-btn { bottom: 16px; left: 16px; padding: 9px 14px; font-size: 10px; }
    }
  `;
  document.head.appendChild(style);

  // ---------- Build DOM ----------
  const btn = document.createElement('button');
  btn.className = 'fb-btn';
  btn.setAttribute('aria-label', 'Send feedback');
  btn.innerHTML = '✉ Feedback';

  const overlay = document.createElement('div');
  overlay.className = 'fb-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'fbModalTitle');

  overlay.innerHTML = `
    <div class="fb-modal">
      <button class="fb-close" id="fbClose" aria-label="Close">×</button>
      <h3 id="fbModalTitle">Send Feedback</h3>
      <p>Report a bug, missing anime, video not loading, or request something new.</p>
      <div>
        <label class="fb-label" for="fbCategory">Category</label>
        <select class="fb-select" id="fbCategory">
          ${CATEGORIES.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="fb-label" for="fbMessage">Message</label>
        <textarea class="fb-textarea" id="fbMessage" placeholder="Describe the issue or your request…" maxlength="1000"></textarea>
      </div>
      <div class="fb-actions">
        <button class="fb-cancel" id="fbCancel">Cancel</button>
        <button class="fb-submit" id="fbSubmit">Submit</button>
      </div>
      <div class="fb-status" id="fbStatus"></div>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(overlay);

  // ---------- Wire ----------
  function openModal() {
    overlay.classList.add('open');
    document.getElementById('fbMessage').focus();
    document.getElementById('fbStatus').textContent = '';
    document.getElementById('fbStatus').className = 'fb-status';
    document.getElementById('fbMessage').value = '';
  }

  function closeModal() {
    overlay.classList.remove('open');
  }

  btn.addEventListener('click', openModal);
  document.getElementById('fbClose').addEventListener('click', closeModal);
  document.getElementById('fbCancel').addEventListener('click', closeModal);
  overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });

  document.getElementById('fbSubmit').addEventListener('click', async () => {
    const category = document.getElementById('fbCategory').value;
    const message  = document.getElementById('fbMessage').value.trim();
    const statusEl = document.getElementById('fbStatus');
    const submitBtn = document.getElementById('fbSubmit');

    if (!message) {
      statusEl.textContent = 'Please enter a message.';
      statusEl.className = 'fb-status error';
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = 'Submitting…';
    statusEl.className = 'fb-status';

    try {
      const sb = (typeof getSupabase === 'function') ? getSupabase() : window.supabase?.createClient(
        'https://eosnuxttjchckprpymnw.supabase.co',
        'sb_publishable_QSDQxkMRbxn1M4m5L5sB6w_auxSAZVg'
      );
      const { error } = await sb.from('feedback').insert({ category, message });
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
})();
