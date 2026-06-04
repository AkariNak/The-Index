// ============================================================
// Onyx — font-switcher.js
// Font size and family switcher — loads on every page
// ============================================================
(function() {
  const FONTS = [
    { id: 'font-inter',    label: 'Sans' },
    { id: 'font-serif',    label: 'Serif' },
    { id: 'font-mono',     label: 'Mono' },
    { id: 'font-rounded',  label: 'Round' },
  ];
  const SIZE_KEY  = 'onyx-font-size';
  const FONT_KEY  = 'onyx-font-family';
  const BASE_SIZE = 16;

  let currentSize = parseInt(localStorage.getItem(SIZE_KEY) || BASE_SIZE, 10);
  let currentFont = localStorage.getItem(FONT_KEY) || 'font-inter';

  function applySize(size) {
    document.documentElement.style.fontSize = size + 'px';
    currentSize = size;
    localStorage.setItem(SIZE_KEY, size);
    if (sizeLabel) sizeLabel.textContent = size + 'px';
  }

  function applyFont(fontId) {
    FONTS.forEach(f => document.body.classList.remove(f.id));
    document.body.classList.add(fontId);
    currentFont = fontId;
    localStorage.setItem(FONT_KEY, fontId);
    if (fontLabel) fontLabel.textContent = FONTS.find(f => f.id === fontId)?.label || 'Sans';
  }

  // Build widget
  const style = document.createElement('style');
  style.textContent = `
    .font-switcher { display:flex; align-items:center; gap:4px; background:var(--paper-2); border:1px solid var(--line); border-radius:6px; padding:0 6px; height:36px; flex-shrink:0; }
    .font-switcher-btn { background:transparent; border:none; color:var(--ink-mute); font-size:15px; width:26px; height:28px; cursor:pointer; display:grid; place-items:center; border-radius:4px; transition:background .15s,color .15s; padding:0; line-height:1; font-family:var(--body); }
    .font-switcher-btn:hover { background:var(--paper-3); color:var(--ink); }
    .font-switcher-divider { width:1px; height:16px; background:var(--line); flex-shrink:0; }
    .font-switcher-label { font-family:var(--mono); font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-mute); padding:0 2px; user-select:none; min-width:26px; text-align:center; }
  `;
  document.head.appendChild(style);

  let sizeLabel, fontLabel;

  function injectWidget() {
    const right = document.querySelector('.topnav-right');
    if (!right) return;

    const wrap = document.createElement('div');
    wrap.className = 'font-switcher';
    wrap.setAttribute('aria-label', 'Font settings');
    wrap.title = 'Adjust font size and style';

    // Size controls
    const sizeDown = document.createElement('button');
    sizeDown.className = 'font-switcher-btn';
    sizeDown.textContent = 'A';
    sizeDown.style.fontSize = '11px';
    sizeDown.setAttribute('aria-label', 'Decrease font size');
    sizeDown.addEventListener('click', () => applySize(Math.max(12, currentSize - 1)));

    sizeLabel = document.createElement('span');
    sizeLabel.className = 'font-switcher-label';
    sizeLabel.textContent = currentSize + 'px';

    const sizeUp = document.createElement('button');
    sizeUp.className = 'font-switcher-btn';
    sizeUp.textContent = 'A';
    sizeUp.style.fontSize = '17px';
    sizeUp.setAttribute('aria-label', 'Increase font size');
    sizeUp.addEventListener('click', () => applySize(Math.min(24, currentSize + 1)));

    // Divider
    const div = document.createElement('div');
    div.className = 'font-switcher-divider';

    // Font cycle button
    const fontBtn = document.createElement('button');
    fontBtn.className = 'font-switcher-btn';
    fontBtn.textContent = 'F';
    fontBtn.setAttribute('aria-label', 'Change font family');
    fontBtn.addEventListener('click', () => {
      const idx = FONTS.findIndex(f => f.id === currentFont);
      const next = FONTS[(idx + 1) % FONTS.length];
      applyFont(next.id);
    });

    fontLabel = document.createElement('span');
    fontLabel.className = 'font-switcher-label';
    fontLabel.textContent = FONTS.find(f => f.id === currentFont)?.label || 'Sans';

    wrap.appendChild(sizeDown);
    wrap.appendChild(sizeLabel);
    wrap.appendChild(sizeUp);
    wrap.appendChild(div);
    wrap.appendChild(fontBtn);
    wrap.appendChild(fontLabel);

    // Insert before theme toggle
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) right.insertBefore(wrap, themeBtn);
    else right.appendChild(wrap);
  }

  // Apply saved settings immediately
  applySize(currentSize);
  applyFont(currentFont);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }
})();
