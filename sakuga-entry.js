// ============================================================
// Onyx — Sakuga entry points
// ------------------------------------------------------------
// Save as sakuga-entry.js in your repo root and add to the pages
// that should link to Sakuga (at minimum index.html), after core.js:
//
//   <script src="sakuga-entry.js"></script>
//
// Does two things:
//   1. Adds an "Originals" link to the top nav on every page.
//   2. On the home page, inserts a row of recent Sakuga works so
//      people find it without going looking.
//
// Self-contained. Remove the script tag to revert.
// ============================================================

(function sakugaEntry() {

  // Where Sakuga lives, relative to the Onyx root.
  const SAKUGA_PATH = 'sakuga/';

  // How many works to show in the home row.
  const ROW_LIMIT = 10;


  // ---- 1. nav link ----------------------------------------------------
  function injectNavLink() {
    const right = document.querySelector('.topnav-right');
    if (!right || document.getElementById('sakugaNavLink')) return;

    // Abyss is a separate surface; leave its nav alone.
    if (document.documentElement.classList.contains('abyss-theme')) return;
    if (sessionStorage.getItem('fromAbyss') === '1') return;

    const a = document.createElement('a');
    a.id = 'sakugaNavLink';
    a.href = SAKUGA_PATH;
    a.className = 'btn btn-outline btn-small';
    a.textContent = 'Originals';
    a.title = 'Indie and creator-made animation';

    // Sits before Submit if that link is present, otherwise before
    // the theme toggle.
    const anchor = right.querySelector('#submitNavLink')
                || right.querySelector('#themeToggle')
                || null;
    right.insertBefore(a, anchor);
  }


  // ---- 2. home page row -----------------------------------------------
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
  ));

  function runtime(secs) {
    if (!secs) return '';
    const m = Math.floor(secs / 60), s = secs % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}`
                 : `0:${String(s).padStart(2, '0')}`;
  }

  function cardHtml(w) {
    const creator = (w.meta && w.meta.creator) || '';
    const rt = runtime(w.meta && w.meta.runtime);
    return `
      <article class="poster-card">
        <a class="poster-clickable" href="${esc(SAKUGA_PATH)}">
          <div class="poster-cover">
            ${w.cover_url
              ? `<img src="${esc(w.cover_url)}" alt="" loading="lazy">`
              : `<div class="cover-placeholder">${esc((w.title || '?').charAt(0).toUpperCase())}</div>`}
            <div class="poster-overlay"><span class="poster-play-icon">&#9654;</span></div>
            ${rt ? `<span class="poster-ep-badge">${esc(rt)}</span>` : ''}
          </div>
          <div class="poster-info">
            <div class="poster-cat">ORIGINAL</div>
            <h3 class="poster-title">${esc(w.title || 'Untitled')}</h3>
            ${creator ? `<div class="poster-rating-count">by ${esc(creator)}</div>` : ''}
          </div>
        </a>
      </article>`;
  }

  async function injectRow() {
    // Home page only. Bail if the page has no content sections.
    const anchor = document.querySelector('.recently-added-section')
                || document.querySelector('.genre-row')
                || document.querySelector('.collections');
    if (!anchor) return;
    if (document.getElementById('sakugaRow')) return;

    let works = [];
    try {
      // core.js filters category='Original' out of AppState, so this
      // needs its own query.
      const { data, error } = await getSupabase()
        .from('videos')
        .select('*')
        .eq('category', 'Original')
        .or('void.eq.false,void.is.null')
        .order('date_added', { ascending: false })
        .limit(ROW_LIMIT);
      if (error) throw error;
      works = data || [];
    } catch (e) {
      console.warn('[Sakuga] could not load originals:', e.message);
      return;
    }

    const section = document.createElement('section');
    section.id = 'sakugaRow';
    section.className = 'genre-row';

    // With nothing published yet, show a single invitation card rather
    // than an empty row.
    const body = works.length
      ? `<div class="genre-row-scroll">${works.map(cardHtml).join('')}</div>`
      : `<div class="empty" style="padding:32px">
           Nothing published yet. If you make animation, this is where it goes.
         </div>`;

    section.innerHTML = `
      <div class="genre-row-header">
        <h2 class="genre-row-title">Onyx Originals</h2>
        <a class="genre-view-all" href="${esc(SAKUGA_PATH)}">Browse Sakuga</a>
      </div>
      ${body}
    `;

    anchor.parentNode.insertBefore(section, anchor.nextSibling);
  }


  // ---- boot -----------------------------------------------------------
  // The nav exists immediately; the content sections are rendered by
  // index.js after its fetch resolves, so poll briefly for those.
  function boot() {
    injectNavLink();

    let tries = 0;
    (function wait() {
      const ready = document.querySelector('.recently-added-section')
                 || document.querySelector('.genre-row')
                 || document.querySelector('.collections');
      if (ready) { injectRow(); return; }
      if (++tries > 30) return;
      setTimeout(wait, 200);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
