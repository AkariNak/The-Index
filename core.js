<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Recall</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;500&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet"/>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' rx='14' fill='%23c8a87a'/%3E%3Crect x='10' y='10' width='52' height='52' rx='8' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='1.5'/%3E%3Ctext x='36' y='50' text-anchor='middle' font-family='Georgia,serif' font-size='34' font-weight='600' fill='white'%3ER%3C/text%3E%3C/svg%3E"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root[data-x]{--r:0} /* placeholder */

/* ── THEMES ── */
html{overflow-x:hidden;width:100%;font-size:16px}
html[data-size="sm"]{font-size:14px}
html[data-size="md"]{font-size:16px}
html[data-size="lg"]{font-size:19px}
html[data-size="xl"]{font-size:23px}body{font-family:'DM Mono',monospace;min-height:100vh;transition:background .2s,color .2s;overflow-x:hidden;width:100%;position:relative}
body.dark {--bg:#0e0e12;--sf:#16161c;--sf2:#1e1e28;--sf3:#26263a;--bd:rgba(255,255,255,.08);--bd2:rgba(255,255,255,.15);--tx:#f0eee8;--mu:#888894;--su:#55555f;--acc:#c8a87a;--acc-bg:rgba(200,168,122,.1);--acc-bd:rgba(200,168,122,.28);background:var(--bg);color:var(--tx)}
body.light{--bg:#f4f2ed;--sf:#fff;--sf2:#ebe8e2;--sf3:#dedad2;--bd:rgba(0,0,0,.08);--bd2:rgba(0,0,0,.16);--tx:#1c1a16;--mu:#6a6760;--su:#a09d96;--acc:#8c5e20;--acc-bg:rgba(140,94,32,.08);--acc-bd:rgba(140,94,32,.28);background:var(--bg);color:var(--tx)}
.surface{background:var(--sf)}
.t-muted{color:var(--mu)}
.t-subtle{color:var(--su)}

::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--sf3);border-radius:3px}

/* ── HEADER ── */
#hdr{padding:1rem 1rem .85rem;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;flex-wrap:nowrap;gap:.5rem;position:sticky;top:0;z-index:100;background:var(--bg);transition:background .2s;min-width:0;max-width:100%;box-sizing:border-box}
.logo-kr{font-family:'Noto Sans KR',sans-serif;font-weight:700;font-size:.78rem;color:var(--acc);letter-spacing:.15em;display:block}
.logo-en{font-family:'DM Serif Display',serif;font-size:1.7rem;line-height:1;display:block}
.logo-sub{font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;margin-top:3px;display:block;color:var(--su)}
.hdr-r{display:flex;align-items:center;gap:.75rem;flex-wrap:nowrap;flex-shrink:0}

/* Language switcher */
.lang-wrap{position:relative}
.lang-btn{font-family:'DM Mono',monospace;font-size:.72rem;padding:5px 11px;border-radius:6px;border:1px solid var(--bd2);background:var(--sf2);color:var(--tx);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;letter-spacing:.03em}
.lang-btn:hover{border-color:var(--acc);color:var(--acc)}
.lang-chev{font-size:.55rem;opacity:.5}
.lang-menu{display:none;position:fixed;border-radius:8px;overflow:hidden;min-width:170px;z-index:9999;background:var(--sf2);border:1px solid var(--bd2);box-shadow:0 8px 28px rgba(0,0,0,.35)}
.lang-menu.open{display:block}
.lang-option{display:flex;align-items:center;gap:9px;padding:9px 14px;cursor:pointer;font-family:'DM Mono',monospace;font-size:.74rem;color:var(--tx);transition:background .12s}
.lang-option:hover{background:var(--sf3)}
.lang-option.active{color:var(--acc)}
.lang-script{margin-left:auto;font-size:.65rem;opacity:.55;font-family:'Noto Sans KR',sans-serif}

/* Theme btn */
#themeBtn{font-family:'DM Mono',monospace;font-size:.7rem;padding:5px 13px;border-radius:99px;border:1px solid var(--bd2);background:var(--sf2);color:var(--mu);cursor:pointer;transition:all .2s;letter-spacing:.04em}
#themeBtn:hover{border-color:var(--acc);color:var(--acc)}

/* Deck badge */




/* ── TABS ── */
#tabBar{display:flex;gap:0;border-bottom:1px solid var(--bd);background:var(--bg);position:sticky;top:85px;z-index:90;padding:0 1rem;transition:background .2s;width:100%;box-sizing:border-box;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}#tabBar::-webkit-scrollbar{display:none}
.tab-btn{font-family:'DM Mono',monospace;font-size:.75rem;padding:.7rem 1.1rem;border:none;background:none;color:var(--mu);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;letter-spacing:.04em}
.tab-btn:hover{color:var(--tx)}
.tab-btn.active{color:var(--acc);border-bottom-color:var(--acc)}
#fontBtn{font-family:'DM Mono',monospace;font-size:.8rem;padding:.7rem 1rem;border:none;background:none;color:var(--mu);cursor:pointer;transition:color .15s;letter-spacing:.04em;white-space:nowrap;flex-shrink:0;line-height:1}
#fontBtn:hover{color:var(--acc)}

/* ── CONTROLS ── */
.ctrl{padding:.85rem 2rem;border-bottom:1px solid var(--bd);background:var(--bg);transition:background .2s;width:100%;box-sizing:border-box}
.ctrl-row{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:6px}
.ctrl-row:last-child{margin-bottom:0}
.ctrl-label{font-size:.68rem;color:var(--mu);white-space:nowrap}
.ctrl-row2{margin-top:2px}
input[type="text"]{background:var(--sf);border:1px solid var(--bd2);border-radius:6px;color:var(--tx);font-family:'DM Mono',monospace;font-size:.78rem;padding:7px 13px;width:260px;max-width:100%;outline:none;transition:border-color .2s}
input[type="text"]:focus{border-color:var(--acc)}
input[type="text"]::placeholder{color:var(--su)}

/* ── BUTTONS ── */
.gbtn,.ubtn,.abtn{font-family:'DM Mono',monospace;border:1px solid var(--bd2);background:var(--sf);color:var(--mu);cursor:pointer;transition:all .15s;letter-spacing:.03em}
.gbtn{font-size:.75rem;padding:5px 12px;border-radius:99px}
.ubtn{font-size:.75rem;padding:5px 11px;border-radius:6px}
.abtn{font-size:.8rem;padding:7px 15px;border-radius:6px;color:var(--tx)}
.gbtn:hover,.ubtn:hover,.abtn:hover{border-color:var(--acc);color:var(--acc)}
.gbtn:active,.ubtn:active,.abtn:active{transform:scale(.97)}
.gbtn.on{background:var(--acc);border-color:var(--acc);color:var(--bg);font-weight:500}
.abtn.accent{background:var(--acc);border-color:var(--acc);color:var(--bg);font-weight:500}
.abtn.accent:hover{opacity:.85;color:var(--bg)}
.abtn.danger{color:#c87a7a;border-color:rgba(200,122,122,.3);background:transparent}
.abtn.danger:hover{background:rgba(200,122,122,.08);border-color:#c87a7a}

/* ── WORD SECTIONS ── */
#wordSections{padding:1rem 2rem .5rem;display:flex;flex-direction:column;gap:7px;width:100%;box-sizing:border-box}
.sec{border:1px solid var(--bd);border-radius:10px;overflow:hidden;transition:border-color .15s}
.sec:hover{border-color:var(--bd2)}
.sec-hdr{display:flex;align-items:center;justify-content:space-between;padding:.8rem 1.2rem;cursor:pointer;background:var(--sf);transition:background .15s;user-select:none}
.sec-hdr:hover{background:var(--sf2)}
.sec-left{display:flex;align-items:center;gap:9px}
.sec-name{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;font-weight:500}
.sec-count{font-size:.62rem;padding:2px 8px;border-radius:99px;background:var(--sf2);border:1px solid var(--bd);color:var(--mu)}
.sec-sel{font-size:.62rem;padding:2px 8px;border-radius:99px;background:var(--acc-bg);border:1px solid var(--acc-bd);color:var(--acc)}
.sec-chev{font-size:.62rem;color:var(--su)}
.sec-body{flex-wrap:wrap;gap:6px;padding:.8rem 1.2rem 1rem;border-top:1px solid var(--bd);background:var(--bg);transition:background .2s}

/* ── WORD CHIPS ── */
@keyframes cin{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
.chip{display:flex;flex-direction:column;gap:2px;background:var(--sf);border:1px solid var(--bd);border-radius:6px;padding:7px 11px 8px;cursor:pointer;user-select:none;transition:background .12s,border-color .12s;animation:cin .14s ease both;position:relative}
.chip:hover{background:var(--sf2);border-color:var(--bd2)}
.chip.on{background:var(--acc-bg);border-width:1.5px}
.chip-kr{font-family:'Noto Sans KR',sans-serif;font-size:.98rem;font-weight:500;line-height:1.2}
.chip-ro{font-size:.7rem;color:var(--mu)}
.reg-badge{font-size:.55rem;padding:1px 6px;border-radius:99px;border:1px solid;letter-spacing:.05em;white-space:nowrap;align-self:flex-start}

/* ── DECK PANEL ── */
.deck-panel{border-top:1px solid var(--bd);padding:1.2rem 2rem 2rem;margin-top:.5rem;width:100%;box-sizing:border-box}
.deck-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem}
.deck-title{font-family:'DM Serif Display',serif;font-size:1.05rem}
.deck-acts{display:flex;gap:7px}
.deck-switcher{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:.85rem}
.dbtn{font-family:'DM Mono',monospace;font-size:.68rem;padding:5px 11px 5px 8px;border-radius:99px;border:1px solid var(--bd2);background:var(--sf);color:var(--mu);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;letter-spacing:.03em}
.dbtn.dactive{border-color:var(--dc);color:var(--dc)}
.dbtn:hover{border-color:var(--acc);color:var(--acc)}
.ddot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dct{font-size:.6rem;opacity:.7}
#deckChips{display:flex;flex-wrap:wrap;gap:6px;min-height:28px}
.dchip{display:flex;align-items:center;gap:5px;border:1px solid;border-radius:99px;padding:3px 7px 3px 11px;font-size:.78rem;font-family:'Noto Sans KR',sans-serif;animation:cin .13s ease both}
.dchip-ro{font-family:'DM Mono',monospace;font-size:.58rem;color:var(--mu)}
.dchip-x{background:none;border:none;cursor:pointer;font-size:12px;padding:0 2px;color:var(--mu);transition:color .12s}
.dchip-x:hover{color:#c87a7a}
.empty-deck{font-size:.8rem;color:var(--su)}
.tab-body{padding:1.5rem 2rem;width:100%}
.sit-row{display:flex;flex-wrap:wrap;gap:7px;padding:.85rem 1rem .6rem;border-bottom:1px solid var(--bd);width:100%;box-sizing:border-box;align-items:center}
.sit-pill{font-family:"DM Mono",monospace;font-size:.8rem;padding:6px 14px;border-radius:99px;border:1px solid rgba(128,128,128,.2);background:var(--sf);color:var(--mu);cursor:pointer;transition:all .15s;letter-spacing:.02em;white-space:nowrap}
.sit-pill:hover{border-color:var(--sc);color:var(--sc)}
.sit-pill.sit-active{background:var(--sc);border-color:var(--sc);color:#fff;font-weight:500}
.filters-toggle{white-space:nowrap}
.sit-add-all{margin-left:auto;font-family:'DM Mono',monospace;font-size:.7rem;padding:6px 14px;border-radius:99px;border:1px solid var(--acc);background:none;color:var(--acc);cursor:pointer;transition:all .15s;white-space:nowrap;flex-shrink:0}
.sit-add-all:hover{background:var(--acc);color:var(--bg)}
#bottomSheet{background:var(--sf)}
.bs-deck-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;cursor:pointer;transition:background .12s;border:none;width:100%;text-align:left;font-family:'DM Mono',monospace;font-size:.82rem;color:var(--tx);background:none}
.bs-deck-row:hover,.bs-deck-row:active{background:var(--sf2)}
.bs-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
.bs-check{margin-left:auto;color:var(--acc);font-size:1rem}
.chip-dots{display:flex;align-items:center;gap:2px;flex-shrink:0}
.chip-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.filters-row{flex-wrap:wrap;gap:7px;padding-top:6px}
.exercise-card{background:var(--sf);border:1px solid var(--bd);border-radius:12px;padding:1.5rem;display:flex;flex-direction:column;gap:.85rem;margin-bottom:1rem}
.empty-msg{padding:2.5rem 0;text-align:center;font-size:.78rem;color:var(--su)}

/* ── STUDY MODAL ── */
#studyOverlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;align-items:center;justify-content:center;padding:1rem}
#studyOverlay.open{display:flex}
#studyModal{background:var(--sf);border:1px solid var(--bd2);border-radius:12px;width:100%;max-width:480px;padding:1.6rem;display:flex;flex-direction:column;gap:1rem;transition:background .2s}
#studyOverlay.open #studyModal{animation:cin .2s ease both}
.m-top{display:flex;align-items:center;justify-content:space-between;gap:.8rem}
.m-title{font-family:'DM Serif Display',serif;font-size:1.05rem}
.m-meta{font-size:.65rem;color:var(--mu);flex:1}
.m-close{background:none;border:none;cursor:pointer;font-size:1rem;padding:4px;color:var(--mu);transition:color .15s}
.m-close:hover{color:var(--tx)}
.card-hint{text-align:center;font-size:.6rem;color:var(--su);letter-spacing:.06em}
.card-scene{perspective:1200px;height:220px;cursor:pointer}
.fcard{width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform .48s cubic-bezier(.4,0,.2,1)}
.fcard.flip{transform:rotateY(180deg)}
.face{position:absolute;inset:0;backface-visibility:hidden;border-radius:10px;border:1px solid var(--bd2);background:var(--sf2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:1.75rem 1.25rem;text-align:center;transition:background .2s}
.face.back{transform:rotateY(180deg)}
.fc-kr{font-family:'Noto Sans KR',sans-serif;font-size:2.8rem;font-weight:700;line-height:1}
.fc-ro{font-size:.82rem;color:var(--mu)}
.fc-pos{font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:var(--su)}
.fc-reg{font-size:.6rem;letter-spacing:.08em}
.fc-meaning{font-family:'DM Serif Display',serif;font-size:1.35rem;line-height:1.2}
.fc-ex{font-size:.72rem;color:var(--mu);font-style:italic;line-height:1.55;margin-top:4px}
.speak-btn{position:absolute;top:10px;right:12px;background:none;border:none;cursor:pointer;font-size:.75rem;color:var(--mu);padding:4px;transition:color .15s}
.speak-btn:hover{color:var(--acc)}
.m-nav{display:flex;justify-content:center}
.m-reshuffle{text-align:center}

/* ── PRACTICE TAB ── */
.practice-score{display:flex;align-items:center;gap:8px;padding:.5rem 0 1rem;font-size:.75rem;color:var(--mu)}
.score-num{font-size:1.1rem;font-weight:500;color:var(--tx)}
.score-lbl{color:var(--su)}
/* exercise-card defined above */
.ex-meta{display:flex;align-items:center;gap:10px}
.ex-type{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;font-weight:500}
.ex-level{font-size:.65rem;color:var(--su);background:var(--sf2);border:1px solid var(--bd);border-radius:99px;padding:2px 8px}
.ex-english{font-family:'DM Serif Display',serif;font-size:1.2rem;line-height:1.3}
.ex-base{font-size:.72rem;color:var(--mu);font-style:italic}
.ex-prompt{font-size:1.05rem;line-height:1.6;padding:.75rem 1rem;background:var(--sf2);border-radius:8px;border:1px solid var(--bd)}
.blank{display:inline-block;min-width:60px;border-bottom:2px solid var(--acc);margin:0 4px;text-align:center}
.answer-fill{font-weight:500;border-bottom:2px solid currentColor;padding:0 4px}
.ex-answer-area{min-height:42px}
.build-slots{display:flex;flex-wrap:wrap;gap:6px;min-height:38px;padding:8px;background:var(--sf2);border:1px solid var(--bd);border-radius:8px;align-items:center}
.slot-hint{font-size:.7rem;color:var(--su)}
.placed-block{display:inline-flex;align-items:center;padding:5px 10px;background:var(--sf3);border-radius:6px;font-size:.85rem;cursor:pointer;border:1px solid var(--bd2);transition:background .1s}
.placed-block:hover{background:var(--sf);opacity:.8}
.ex-choices{display:flex;flex-wrap:wrap;gap:7px}
.choice-btn,.block-btn{font-family:'DM Mono',monospace;font-size:.85rem;padding:7px 14px;border-radius:8px;border:1px solid var(--bd2);background:var(--sf2);color:var(--tx);cursor:pointer;transition:all .15s}
.choice-btn:hover,.block-btn:hover{border-color:var(--acc);color:var(--acc)}
.choice-btn.correct{border-color:#7ac8a0;color:#7ac8a0;background:rgba(122,200,160,.1)}
.choice-btn.wrong{border-color:#c87a7a;color:#c87a7a;background:rgba(200,122,122,.1)}
.ex-feedback{border-radius:8px;padding:1rem;margin-top:.25rem}
.fb-correct{background:rgba(122,200,160,.08);border:1px solid rgba(122,200,160,.25)}
.fb-wrong  {background:rgba(200,122,122,.08);border:1px solid rgba(200,122,122,.25)}
.fb-result{font-size:.78rem;font-weight:500;margin-bottom:.4rem}
.fb-correct .fb-result{color:#7ac8a0}
.fb-wrong   .fb-result{color:#c87a7a}
.fb-explanation{font-size:.75rem;line-height:1.65;color:var(--mu)}

/* ── GRAMMAR TAB ── */
.grammar-card{border:1px solid var(--bd);border-radius:10px;overflow:hidden;transition:border-color .15s}
.grammar-card:hover{border-color:var(--bd2)}
.grammar-open{border-color:var(--acc)}
.grammar-hdr{display:flex;align-items:flex-start;justify-content:space-between;padding:.9rem 1.2rem;cursor:pointer;background:var(--sf);transition:background .15s}
.grammar-hdr:hover{background:var(--sf2)}
.grammar-left{display:flex;flex-direction:column;gap:3px;flex:1}
.grammar-level{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;font-weight:500}
.grammar-title{font-size:.9rem;font-weight:500;color:var(--tx)}
.grammar-short{font-size:.8rem;margin-top:1px}
.grammar-body{padding:1rem 1.2rem 1.2rem;border-top:1px solid var(--bd);background:var(--bg)}
.grammar-text{font-size:.78rem;line-height:1.75;color:var(--mu);white-space:pre-wrap;margin-bottom:1rem}
.grammar-example{background:var(--sf2);border:1px solid var(--bd);border-radius:8px;padding:.85rem 1rem;margin-bottom:.5rem}
.ex-label{font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.4rem}
.ex-pre{font-family:'DM Mono',monospace;font-size:.78rem;line-height:1.7;white-space:pre-wrap;color:var(--tx)}

/* ── RESPONSIVE ── */
@media(max-width:600px){
  #hdr{padding:.85rem .85rem .75rem}
  #tabBar,.ctrl,.deck-panel{padding-left:.75rem;padding-right:.75rem}
  #wordSections{padding:.75rem .75rem .5rem}
  input[type="text"]{width:100%}
  #tabBar{top:68px}
  .sit-row{padding:.6rem .75rem .5rem}
  .tab-body{padding:1rem .75rem}
  .logo-en{font-size:1.3rem !important}
  .logo svg{width:34px !important;height:34px !important}
}

</style>
</head>
<body class="dark">

<div id="hdr">
  <div class="logo" style="display:flex;align-items:center;gap:14px">
    <svg width="44" height="44" viewBox="0 0 72 72" style="flex-shrink:0" aria-hidden="true">
      <rect width="72" height="72" rx="14" fill="var(--acc)"/>
      <rect x="10" y="10" width="52" height="52" rx="8" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.5"/>
      <text x="36" y="50" text-anchor="middle" font-family="Georgia,serif" font-size="34" font-weight="600" fill="white">R</text>
    </svg>
    <div>
      <span class="logo-en" style="font-size:1.65rem">recall</span>
      <span class="logo-sub" id="logoScript" style="display:block;margin-top:1px">language flashcards</span>
    </div>
  </div>
  <div class="hdr-r">
    <div class="lang-wrap">
      <button class="lang-btn" id="langBtn" onclick="toggleLangMenu()">
        <span id="langFlag">🇰🇷</span>
        <span id="langLabel">Korean</span>
        <span class="lang-chev">▾</span>
      </button>

    </div>
    <button id="themeBtn" onclick="toggleTheme()">light mode</button>

  </div>
</div>

<div id="tabBar">
  <button class="tab-btn" data-tab="vocab"    onclick="switchTab('vocab')">vocabulary</button>
  <button class="tab-btn" data-tab="practice" onclick="switchTab('practice')">practice</button>
  <button class="tab-btn" data-tab="grammar"  onclick="switchTab('grammar')">grammar</button>
  <button id="fontBtn" onclick="cycleFontSize()" aria-label="change font size" style="margin-left:auto">text: large</button>
</div>

<div id="mainContent"></div>

<div id="studyOverlay" onclick="overlayClick(event)">
  <div id="studyModal">
    <div class="m-top">
      <span class="m-title">study mode</span>
      <span class="m-meta" id="mMeta"></span>
      <button class="m-close" onclick="closeStudy()">✕</button>
    </div>
    <div class="card-hint">tap card to flip · swipe or tap next →</div>
    <div class="card-scene" onclick="flipCard()">
      <div class="fcard" id="fcard">
        <div class="face front" id="cFront"></div>
        <div class="face back"  id="cBack"></div>
      </div>
    </div>
    <div class="m-nav">
      <button class="abtn accent" style="width:100%" onclick="nextCard()">next →</button>
    </div>
    <div class="m-reshuffle">
      <button class="abtn" onclick="reshuffleStudy()">↺ reshuffle</button>
    </div>
  </div>
</div>

<div id="bsOverlay" onclick="closeBs()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:500"></div>
<div id="bottomSheet" style="display:none;position:fixed;bottom:0;left:0;right:0;z-index:501;border-radius:18px 18px 0 0;padding:0 0 env(safe-area-inset-bottom,0);max-height:75vh;overflow-y:auto;transition:transform .25s cubic-bezier(.4,0,.2,1)">
  <div style="width:36px;height:4px;border-radius:99px;margin:10px auto 0;background:var(--bd2)"></div>
  <div id="bsWord" style="padding:14px 20px 4px;font-family:'Noto Sans KR',sans-serif;font-size:1.1rem;font-weight:500;color:var(--tx)"></div>
  <div id="bsMeaning" style="padding:0 20px 10px;font-size:.75rem;color:var(--mu)"></div>
  <div style="padding:0 12px 4px;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--su)">add to deck</div>
  <div id="bsDecks" style="padding:0 12px 8px;display:flex;flex-direction:column;gap:4px"></div>
  <div style="padding:4px 12px 16px;border-top:1px solid var(--bd);margin-top:4px">
    <button onclick="bsNewDeck()" style="width:100%;padding:12px;border-radius:10px;border:1px dashed var(--bd2);background:none;color:var(--acc);font-family:'DM Mono',monospace;font-size:.8rem;cursor:pointer;text-align:left">+ create new deck</button>
  </div>
</div>

<div class="lang-menu" id="langMenu">
  <div class="lang-option active" data-lang="korean" onclick="switchLang('korean')">
    <span>🇰🇷</span><span>Korean</span><span class="lang-script">한국어</span>
  </div>
  <div class="lang-option" data-lang="italian" onclick="switchLang('italian')">
    <span>🇮🇹</span><span>Italian</span><span class="lang-script">Italiano</span>
  </div>
  <div class="lang-option" data-lang="japanese" onclick="switchLang('japanese')">
    <span>🇯🇵</span><span>Japanese</span><span class="lang-script">日本語</span>
  </div>
</div>
<script>
// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════
// ── KOREAN WORD LIST ──────────────────────────────────────────────────────────
// register: 'formal' | 'casual' | 'neutral'
// pos: verb | noun | adjective | adverb | pronoun | particle | expression
// freq: 1-10 (10 = most essential)

const KOREAN_WORDS = [
  // ── Magnetic by ILLIT ──
  {kr:"눈",ro:"nun",meaning:"eye / eyes",example:"눈이 예뻐요 — your eyes are pretty",pos:"noun",freq:9,register:"neutral"},
  {kr:"빠져",ro:"ppajyeo",meaning:"falling into / drawn in",example:"나 빠져 — I'm falling for you",pos:"verb",freq:7,register:"casual"},
  {kr:"느껴",ro:"neukkyeo",meaning:"feeling / I feel",example:"뭔가 느껴 — I feel something",pos:"verb",freq:7,register:"casual"},
  {kr:"자꾸",ro:"jakku",meaning:"repeatedly / keeps happening",example:"자꾸 생각나 — keeps coming to mind",pos:"adverb",freq:7,register:"neutral"},
  {kr:"끌려",ro:"kkeullyeo",meaning:"being pulled / attracted",example:"네게 끌려 — being pulled toward you",pos:"verb",freq:6,register:"casual"},
  {kr:"설레",ro:"seolle",meaning:"heart fluttering / excited feeling",example:"설레는 기분 — a heart-fluttering feeling",pos:"verb",freq:6,register:"casual",sit:["dating"]},
  {kr:"떨려",ro:"tteollyeo",meaning:"trembling / heart racing",example:"심장이 떨려 — my heart is trembling",pos:"verb",freq:6,register:"casual",sit:["dating"]},
  {kr:"자석",ro:"jaseok",meaning:"magnet",example:"자석처럼 끌려 — pulled like a magnet",pos:"noun",freq:4,register:"neutral"},
  {kr:"순간",ro:"sungan",meaning:"moment / instant",example:"그 순간 — that moment",pos:"noun",freq:8,register:"neutral"},
  {kr:"가까이",ro:"gakkai",meaning:"close / near",example:"가까이 와 — come closer",pos:"adverb",freq:7,register:"neutral"},
  {kr:"바라봐",ro:"barabwa",meaning:"look at / gaze at",example:"나를 바라봐 — look at me",pos:"verb",freq:6,register:"casual"},
  {kr:"심장",ro:"simjang",meaning:"heart (organ) / heartbeat",example:"심장이 뛰어 — my heart is beating",pos:"noun",freq:6,register:"neutral"},
  {kr:"머릿속",ro:"meoritssok",meaning:"inside one's head / mind",example:"머릿속이 복잡해 — my head is a mess",pos:"noun",freq:5,register:"neutral"},
  {kr:"두근두근",ro:"dugeundugeun",meaning:"thump-thump (heartbeat sound)",example:"두근두근 떨려 — thump thump I'm trembling",pos:"expression",freq:4,register:"casual",sit:["dating"]},
  {kr:"뻔해",ro:"ppeonhae",meaning:"obvious / predictable",example:"너무 뻔해 — so obvious",pos:"adjective",freq:5,register:"casual"},
  {kr:"온통",ro:"ontong",meaning:"entirely / all over",example:"온통 너야 — it's all you",pos:"adverb",freq:5,register:"neutral"},
  {kr:"멈춰",ro:"meomchwo",meaning:"stop / halt",example:"멈춰 서 — stop right there",pos:"verb",freq:6,register:"casual"},
  {kr:"달라",ro:"dalla",meaning:"different / unlike",example:"뭔가 달라 — something's different",pos:"adjective",freq:7,register:"casual"},
  {kr:"그냥",ro:"geunyang",meaning:"just / simply / without reason",example:"그냥 좋아 — I just like it",pos:"adverb",freq:9,register:"casual"},
  {kr:"왠지",ro:"waenji",meaning:"for some reason / somehow",example:"왠지 좋아 — I like it for some reason",pos:"adverb",freq:7,register:"casual",sit:["dating"]},
  {kr:"처음",ro:"cheoeum",meaning:"first time / beginning",example:"처음 만났을 때 — when we first met",pos:"noun",freq:8,register:"neutral"},
  // ── Pronouns ──
  {kr:"나",ro:"na",meaning:"I / me",example:"나 배고파 — I'm hungry",pos:"pronoun",freq:10,register:"casual",sit:["meeting","dating"]},
  {kr:"저",ro:"jeo",meaning:"I / me (humble)",example:"저는 학생이에요 — I am a student",pos:"pronoun",freq:9,register:"formal",sit:["meeting"]},
  {kr:"너",ro:"neo",meaning:"you",example:"너 어디 가? — where are you going?",pos:"pronoun",freq:10,register:"casual",sit:["meeting","dating"]},
  {kr:"당신",ro:"dangsin",meaning:"you (written/formal)",example:"당신을 사랑해요 — I love you",pos:"pronoun",freq:6,register:"formal"},
  {kr:"우리",ro:"uri",meaning:"we / our",example:"우리 같이 가자 — let's go together",pos:"pronoun",freq:10,register:"neutral",sit:["meeting","dating"]},
  {kr:"그",ro:"geu",meaning:"he / that",example:"그 사람 — that person",pos:"pronoun",freq:8,register:"neutral"},
  {kr:"그녀",ro:"geunyeo",meaning:"she / her",example:"그녀는 예뻐 — she is pretty",pos:"pronoun",freq:7,register:"neutral"},
  {kr:"누구",ro:"nugu",meaning:"who",example:"누구야? — who is it?",pos:"pronoun",freq:9,register:"neutral"},
  {kr:"뭐",ro:"mwo",meaning:"what (casual)",example:"뭐 해? — what are you doing?",pos:"pronoun",freq:10,register:"casual"},
  {kr:"무엇",ro:"mueot",meaning:"what (formal)",example:"무엇을 원하세요? — what would you like?",pos:"pronoun",freq:8,register:"formal"},
  // ── Greetings & expressions ──
  {kr:"안녕하세요",ro:"annyeonghaseyo",meaning:"hello (standard polite)",example:"안녕하세요, 처음 뵙겠습니다 — hello, nice to meet you",pos:"expression",freq:10,register:"formal",sit:["meeting"]},
  {kr:"안녕",ro:"annyeong",meaning:"hi / bye (casual)",example:"안녕! 잘 지냈어? — hey! have you been well?",pos:"expression",freq:10,register:"casual",sit:["meeting"]},
  {kr:"감사합니다",ro:"gamsahamnida",meaning:"thank you (formal)",example:"도와주셔서 감사합니다 — thank you for your help",pos:"expression",freq:10,register:"formal",sit:["restaurant"]},
  {kr:"고마워",ro:"gomawo",meaning:"thanks (casual)",example:"고마워, 진짜 — thanks, seriously",pos:"expression",freq:9,register:"casual",sit:["food","shopping","meeting"]},
  {kr:"죄송합니다",ro:"joesonghamnida",meaning:"I'm sorry (formal)",example:"늦어서 죄송합니다 — I'm sorry for being late",pos:"expression",freq:9,register:"formal",sit:["emergency","meeting"]},
  {kr:"미안해",ro:"mianhae",meaning:"sorry (casual)",example:"미안해, 내 잘못이야 — sorry, it's my fault",pos:"expression",freq:9,register:"casual",sit:["meeting","dating"]},
  {kr:"괜찮아요",ro:"gwaenchanayo",meaning:"it's okay (polite)",example:"괜찮아요, 걱정 마세요 — it's okay, don't worry",pos:"expression",freq:9,register:"formal",sit:["meeting"]},
  {kr:"괜찮아",ro:"gwaenchana",meaning:"it's okay / I'm fine (casual)",example:"괜찮아? — are you okay?",pos:"expression",freq:9,register:"casual",sit:["meeting","dating"]},
  {kr:"맞아요",ro:"majayo",meaning:"that's right (polite)",example:"네, 맞아요 — yes, that's right",pos:"expression",freq:9,register:"formal"},
  {kr:"맞아",ro:"maja",meaning:"that's right (casual)",example:"맞아! 그거야 — that's right! that's it",pos:"expression",freq:9,register:"casual"},
  {kr:"알겠습니다",ro:"algesseumnida",meaning:"I understand (formal)",example:"네, 알겠습니다 — yes, I understand",pos:"expression",freq:8,register:"formal"},
  {kr:"알겠어",ro:"algeseo",meaning:"got it (casual)",example:"알겠어, 그렇게 할게 — got it, I'll do that",pos:"expression",freq:8,register:"casual"},
  {kr:"대박",ro:"daebak",meaning:"wow / amazing (slang)",example:"대박이야! — that's insane!",pos:"expression",freq:7,register:"casual",sit:["dating"]},
  {kr:"파이팅",ro:"paiting",meaning:"you can do it / fighting",example:"파이팅! 잘 할 수 있어 — you've got this!",pos:"expression",freq:7,register:"casual"},
  {kr:"잠깐만요",ro:"jamkkanmanyo",meaning:"just a moment (polite)",example:"잠깐만요, 확인해볼게요 — one moment, let me check",pos:"expression",freq:8,register:"formal"},
  {kr:"잠깐만",ro:"jamkkanman",meaning:"wait a sec (casual)",example:"잠깐만, 다시 봐봐 — hold on, look again",pos:"expression",freq:8,register:"casual"},
  {kr:"사랑해요",ro:"saranghaeyo",meaning:"I love you (polite)",example:"항상 사랑해요 — I always love you",pos:"expression",freq:9,register:"formal"},
  {kr:"사랑해",ro:"saranghae",meaning:"I love you (casual)",example:"사랑해, 알지? — I love you, you know that?",pos:"expression",freq:10,register:"casual",sit:["dating"]},
  {kr:"보고싶어요",ro:"bogosipeoyo",meaning:"I miss you (polite)",example:"많이 보고싶어요 — I miss you a lot",pos:"expression",freq:8,register:"formal"},
  {kr:"보고싶어",ro:"bogosipeo",meaning:"I miss you (casual)",example:"너무 보고싶어 — I miss you so much",pos:"expression",freq:8,register:"casual",sit:["dating"]},
  {kr:"잘 자요",ro:"jal jayo",meaning:"good night (polite)",example:"잘 자요, 좋은 꿈 꾸세요 — good night, sweet dreams",pos:"expression",freq:8,register:"formal"},
  {kr:"잘 자",ro:"jal ja",meaning:"good night (casual)",example:"잘 자, 내일 봐 — good night, see you tomorrow",pos:"expression",freq:8,register:"casual"},
  // ── Core verbs ──
  {kr:"가다",ro:"gada",meaning:"to go",example:"학교에 가다 — to go to school",pos:"verb",freq:10,register:"neutral",sit:["getting_around"]},
  {kr:"오다",ro:"oda",meaning:"to come",example:"집에 와 — come home",pos:"verb",freq:10,register:"neutral",sit:["getting_around"]},
  {kr:"먹다",ro:"meokda",meaning:"to eat",example:"밥 먹었어? — have you eaten?",pos:"verb",freq:10,register:"neutral",sit:["restaurant","food"]},
  {kr:"마시다",ro:"masida",meaning:"to drink",example:"물 마셔 — drink some water",pos:"verb",freq:9,register:"neutral",sit:["restaurant","food"]},
  {kr:"자다",ro:"jada",meaning:"to sleep",example:"일찍 자 — sleep early",pos:"verb",freq:9,register:"neutral"},
  {kr:"보다",ro:"boda",meaning:"to see / watch",example:"영화 봐 — watch a movie",pos:"verb",freq:10,register:"neutral"},
  {kr:"듣다",ro:"deutda",meaning:"to listen / hear",example:"음악 들어 — listen to music",pos:"verb",freq:9,register:"neutral"},
  {kr:"말하다",ro:"malhada",meaning:"to speak / say",example:"천천히 말해 — speak slowly",pos:"verb",freq:10,register:"neutral"},
  {kr:"알다",ro:"alda",meaning:"to know",example:"알아? — do you know?",pos:"verb",freq:10,register:"neutral",sit:["meeting","getting_around"]},
  {kr:"모르다",ro:"moreuda",meaning:"to not know",example:"몰라요 — I don't know",pos:"verb",freq:9,register:"neutral",sit:["emergency"]},
  {kr:"있다",ro:"itda",meaning:"to exist / have / be (location)",example:"집에 있어 — I'm at home",pos:"verb",freq:10,register:"neutral",sit:["airport","getting_around","food","shopping","meeting"]},
  {kr:"없다",ro:"eopda",meaning:"to not exist / not have",example:"돈이 없어 — I don't have money",pos:"verb",freq:10,register:"neutral",sit:["airport","getting_around","food","shopping"]},
  {kr:"좋아하다",ro:"joahada",meaning:"to like",example:"한국 음식 좋아해 — I like Korean food",pos:"verb",freq:10,register:"neutral",sit:["dating"]},
  {kr:"사랑하다",ro:"saranghada",meaning:"to love",example:"가족을 사랑해 — I love my family",pos:"verb",freq:9,register:"neutral",sit:["dating"]},
  {kr:"원하다",ro:"wonhada",meaning:"to want",example:"뭘 원해? — what do you want?",pos:"verb",freq:9,register:"neutral",sit:["restaurant","food"]},
  {kr:"생각하다",ro:"saenggakhada",meaning:"to think",example:"어떻게 생각해? — what do you think?",pos:"verb",freq:9,register:"neutral"},
  {kr:"만나다",ro:"mannada",meaning:"to meet",example:"내일 만나자 — let's meet tomorrow",pos:"verb",freq:9,register:"neutral",sit:["meeting"]},
  {kr:"기다리다",ro:"gidarida",meaning:"to wait",example:"여기서 기다려 — wait here",pos:"verb",freq:8,register:"neutral",sit:["dating"]},
  {kr:"공부하다",ro:"gongbuhada",meaning:"to study",example:"한국어 공부해 — I'm studying Korean",pos:"verb",freq:9,register:"neutral"},
  {kr:"일하다",ro:"ilhada",meaning:"to work",example:"오늘 많이 일했어 — I worked a lot today",pos:"verb",freq:9,register:"neutral"},
  {kr:"살다",ro:"salda",meaning:"to live",example:"서울에 살아 — I live in Seoul",pos:"verb",freq:9,register:"neutral"},
  {kr:"웃다",ro:"utda",meaning:"to smile / laugh",example:"웃어봐 — try smiling",pos:"verb",freq:8,register:"neutral",sit:["dating"]},
  {kr:"울다",ro:"ulda",meaning:"to cry",example:"울지 마 — don't cry",pos:"verb",freq:8,register:"neutral",sit:["dating"]},
  {kr:"주다",ro:"juda",meaning:"to give",example:"나한테 줘 — give it to me",pos:"verb",freq:9,register:"neutral",sit:["restaurant","food"]},
  {kr:"받다",ro:"batda",meaning:"to receive",example:"선물 받았어 — I received a gift",pos:"verb",freq:9,register:"neutral",sit:["food"]},
  {kr:"찾다",ro:"chatda",meaning:"to find / look for",example:"뭐 찾아? — what are you looking for?",pos:"verb",freq:8,register:"neutral",sit:["airport","getting_around"]},
  {kr:"시작하다",ro:"sijakhada",meaning:"to start",example:"시작하자 — let's start",pos:"verb",freq:8,register:"neutral"},
  {kr:"끝나다",ro:"kkeutnada",meaning:"to end / finish",example:"수업이 끝났어 — class is over",pos:"verb",freq:7,register:"neutral"},
  {kr:"도와주다",ro:"dowajuda",meaning:"to help",example:"도와줘서 고마워 — thanks for helping",pos:"verb",freq:8,register:"neutral",sit:["emergency"]},
  {kr:"이해하다",ro:"ihaehada",meaning:"to understand",example:"이해해? — do you understand?",pos:"verb",freq:8,register:"neutral",sit:["emergency"]},
  {kr:"좋다",ro:"jota",meaning:"to be good / to like",example:"이 노래 좋아 — I like this song",pos:"verb",freq:10,register:"neutral",sit:["meeting","dating"]},
  // ── Adjectives ──
  {kr:"예쁘다",ro:"yeppeuda",meaning:"pretty / beautiful",example:"너 진짜 예뻐 — you're really pretty",pos:"adjective",freq:9,register:"neutral",sit:["dating"]},
  {kr:"귀엽다",ro:"gwiyeopda",meaning:"cute",example:"너무 귀여워 — so cute",pos:"adjective",freq:8,register:"neutral",sit:["dating"]},
  {kr:"멋있다",ro:"meositda",meaning:"cool / stylish",example:"진짜 멋있어 — so cool",pos:"adjective",freq:8,register:"casual",sit:["dating"]},
  {kr:"크다",ro:"keuda",meaning:"big / tall",example:"키가 커 — you're tall",pos:"adjective",freq:10,register:"neutral",sit:["shopping"]},
  {kr:"작다",ro:"jakda",meaning:"small / short",example:"키가 작아 — you're short",pos:"adjective",freq:9,register:"neutral",sit:["shopping"]},
  {kr:"많다",ro:"manta",meaning:"many / a lot",example:"사람이 많아 — there are a lot of people",pos:"adjective",freq:10,register:"neutral",sit:["shopping"]},
  {kr:"어렵다",ro:"oryeopda",meaning:"difficult",example:"한국어 어려워 — Korean is difficult",pos:"adjective",freq:8,register:"neutral"},
  {kr:"쉽다",ro:"swipda",meaning:"easy",example:"이건 쉬워 — this is easy",pos:"adjective",freq:8,register:"neutral"},
  {kr:"재미있다",ro:"jaemiitda",meaning:"fun / interesting",example:"진짜 재미있어 — this is really fun",pos:"adjective",freq:8,register:"neutral"},
  {kr:"피곤하다",ro:"pigonhada",meaning:"tired",example:"너무 피곤해 — I'm so tired",pos:"adjective",freq:8,register:"neutral"},
  {kr:"배고프다",ro:"baegopeuda",meaning:"hungry",example:"배고파 죽겠어 — I'm starving",pos:"adjective",freq:8,register:"casual"},
  {kr:"행복하다",ro:"haengbokhada",meaning:"happy",example:"지금 행복해 — I'm happy right now",pos:"adjective",freq:8,register:"neutral"},
  {kr:"힘들다",ro:"himdeulda",meaning:"hard / exhausting",example:"오늘 진짜 힘들었어 — today was really tough",pos:"adjective",freq:8,register:"neutral"},
  {kr:"바쁘다",ro:"bappeuda",meaning:"busy",example:"요즘 너무 바빠 — I've been so busy lately",pos:"adjective",freq:8,register:"neutral"},
  {kr:"맛있다",ro:"masitda",meaning:"delicious",example:"진짜 맛있어 — it's so delicious",pos:"adjective",freq:9,register:"neutral",sit:["restaurant","food"]},
  {kr:"같다",ro:"gatda",meaning:"same / similar",example:"우리 취향이 같아 — we have the same taste",pos:"adjective",freq:9,register:"neutral"},
  {kr:"다르다",ro:"dareuda",meaning:"different",example:"생각이 달라 — our thoughts are different",pos:"adjective",freq:8,register:"neutral"},
  // ── Adverbs ──
  {kr:"너무",ro:"neomu",meaning:"so / too / very",example:"너무 좋아 — I love it so much",pos:"adverb",freq:10,register:"casual",sit:["dating"]},
  {kr:"정말",ro:"jeongmal",meaning:"really / truly",example:"정말이야? — is that true?",pos:"adverb",freq:10,register:"neutral",sit:["dating","meeting"]},
  {kr:"진짜",ro:"jinjja",meaning:"really / for real (slang)",example:"진짜? — for real?",pos:"adverb",freq:10,register:"casual",sit:["dating","meeting"]},
  {kr:"많이",ro:"mani",meaning:"a lot / very much",example:"많이 먹어 — eat a lot",pos:"adverb",freq:10,register:"neutral"},
  {kr:"빨리",ro:"ppalli",meaning:"quickly / hurry",example:"빨리 와 — come quickly",pos:"adverb",freq:9,register:"neutral",sit:["emergency","getting_around"]},
  {kr:"천천히",ro:"cheoncheonhi",meaning:"slowly",example:"천천히 말해줘 — please speak slowly",pos:"adverb",freq:8,register:"neutral",sit:["getting_around"]},
  {kr:"항상",ro:"hangsang",meaning:"always",example:"항상 고마워 — always thankful",pos:"adverb",freq:9,register:"neutral"},
  {kr:"가끔",ro:"gakkeum",meaning:"sometimes",example:"가끔 생각나 — I think of you sometimes",pos:"adverb",freq:8,register:"neutral"},
  {kr:"지금",ro:"jigeum",meaning:"now",example:"지금 어디야? — where are you now?",pos:"adverb",freq:10,register:"neutral",sit:["airport","getting_around"]},
  {kr:"왜",ro:"wae",meaning:"why",example:"왜 그래? — why are you like that?",pos:"adverb",freq:10,register:"neutral"},
  {kr:"어떻게",ro:"eotteoke",meaning:"how",example:"어떻게 해? — how do I do it?",pos:"adverb",freq:9,register:"neutral",sit:["airport","getting_around"]},
  {kr:"다시",ro:"dasi",meaning:"again",example:"다시 해봐 — try again",pos:"adverb",freq:9,register:"neutral"},
  {kr:"같이",ro:"gachi",meaning:"together",example:"같이 가자 — let's go together",pos:"adverb",freq:9,register:"casual",sit:["dating"]},
  {kr:"혼자",ro:"honja",meaning:"alone",example:"혼자 있고 싶어 — I want to be alone",pos:"adverb",freq:8,register:"neutral",sit:["dating"]},
  {kr:"아직",ro:"ajik",meaning:"still / not yet",example:"아직 몰라 — I don't know yet",pos:"adverb",freq:8,register:"neutral"},
  {kr:"계속",ro:"gyesok",meaning:"keep going / continuously",example:"계속 해봐 — keep trying",pos:"adverb",freq:8,register:"neutral"},
  {kr:"조금",ro:"jogeum",meaning:"a little",example:"조금만 더 — just a little more",pos:"adverb",freq:9,register:"neutral"},
  // ── Particles ──
  {kr:"은/는",ro:"eun/neun",meaning:"topic marker",example:"나는 학생이에요 — I am a student",pos:"particle",freq:10,register:"neutral"},
  {kr:"이/가",ro:"i/ga",meaning:"subject marker",example:"비가 와요 — rain is falling",pos:"particle",freq:10,register:"neutral"},
  {kr:"을/를",ro:"eul/reul",meaning:"object marker",example:"밥을 먹어요 — I eat rice",pos:"particle",freq:10,register:"neutral"},
  {kr:"에",ro:"e",meaning:"at / to (place/time)",example:"학교에 가요 — I go to school",pos:"particle",freq:10,register:"neutral"},
  {kr:"에서",ro:"eseo",meaning:"at / from (action location)",example:"집에서 공부해요 — I study at home",pos:"particle",freq:9,register:"neutral"},
  {kr:"도",ro:"do",meaning:"also / too",example:"저도 알아요 — I know too",pos:"particle",freq:10,register:"neutral"},
  {kr:"만",ro:"man",meaning:"only / just",example:"너만 바라봐 — I only look at you",pos:"particle",freq:9,register:"neutral"},
  {kr:"이랑/랑",ro:"irang/rang",meaning:"with / and (casual)",example:"친구랑 갔어 — I went with a friend",pos:"particle",freq:8,register:"casual"},
  {kr:"와/과",ro:"wa/gwa",meaning:"and / with (formal)",example:"부모님과 함께 — together with parents",pos:"particle",freq:8,register:"formal"},
  {kr:"한테",ro:"hante",meaning:"to / from a person",example:"친구한테 줬어 — I gave it to my friend",pos:"particle",freq:8,register:"casual"},
  {kr:"께",ro:"kke",meaning:"to / from a person (honorific)",example:"선생님께 드렸어요 — I gave it to the teacher",pos:"particle",freq:7,register:"formal"},
  {kr:"처럼",ro:"cheoreum",meaning:"like / resembling",example:"별처럼 빛나 — shining like a star",pos:"particle",freq:7,register:"neutral"},
  // ── Nouns — essential ──
  {kr:"사람",ro:"saram",meaning:"person / people",example:"좋은 사람이야 — they're a good person",pos:"noun",freq:10,register:"neutral",sit:["meeting"]},
  {kr:"이름",ro:"ireum",meaning:"name",example:"이름이 뭐야? — what's your name?",pos:"noun",freq:9,register:"neutral",sit:["meeting"]},
  {kr:"집",ro:"jip",meaning:"home / house",example:"집에 가고 싶어 — I want to go home",pos:"noun",freq:10,register:"neutral"},
  {kr:"학교",ro:"hakgyo",meaning:"school",example:"학교 어때? — how's school?",pos:"noun",freq:9,register:"neutral"},
  {kr:"친구",ro:"chingu",meaning:"friend",example:"친구들이랑 놀았어 — hung out with friends",pos:"noun",freq:10,register:"neutral",sit:["meeting","dating"]},
  {kr:"가족",ro:"gajok",meaning:"family",example:"가족이 최고야 — family is the best",pos:"noun",freq:9,register:"neutral"},
  {kr:"엄마",ro:"eomma",meaning:"mom",example:"엄마한테 물어봐 — ask mom",pos:"noun",freq:9,register:"casual"},
  {kr:"아빠",ro:"appa",meaning:"dad",example:"아빠 닮았어 — you look like your dad",pos:"noun",freq:9,register:"casual"},
  {kr:"시간",ro:"sigan",meaning:"time",example:"시간이 없어 — I don't have time",pos:"noun",freq:10,register:"neutral",sit:["airport","getting_around","food"]},
  {kr:"밥",ro:"bap",meaning:"rice / meal / food",example:"밥 먹었어? — have you eaten?",pos:"noun",freq:10,register:"casual",sit:["restaurant","food"]},
  {kr:"물",ro:"mul",meaning:"water",example:"물 한 잔 줘 — give me a glass of water",pos:"noun",freq:10,register:"neutral",sit:["restaurant","food"]},
  {kr:"음악",ro:"eumak",meaning:"music",example:"음악 들어? — are you listening to music?",pos:"noun",freq:9,register:"neutral",sit:["restaurant"]},
  {kr:"노래",ro:"norae",meaning:"song",example:"이 노래 뭐야? — what song is this?",pos:"noun",freq:9,register:"neutral",sit:["restaurant"]},
  {kr:"마음",ro:"maeum",meaning:"heart / feelings / mind",example:"마음이 따뜻해 — my heart feels warm",pos:"noun",freq:9,register:"neutral",sit:["dating"]},
  {kr:"사랑",ro:"sarang",meaning:"love",example:"사랑은 어려워 — love is difficult",pos:"noun",freq:10,register:"neutral",sit:["dating"]},
  {kr:"꿈",ro:"kkum",meaning:"dream",example:"꿈을 포기하지 마 — don't give up on your dream",pos:"noun",freq:7,register:"neutral",sit:["dating"]},
  {kr:"오늘",ro:"oneul",meaning:"today",example:"오늘 기분 어때? — how are you feeling today?",pos:"noun",freq:10,register:"neutral"},
  {kr:"내일",ro:"naeil",meaning:"tomorrow",example:"내일 봐 — see you tomorrow",pos:"noun",freq:9,register:"neutral"},
  {kr:"어제",ro:"eoje",meaning:"yesterday",example:"어제 뭐 했어? — what did you do yesterday?",pos:"noun",freq:9,register:"neutral"},
];

// ── ITALIAN WORD LIST ─────────────────────────────────────────────────────────
// register: 'formal' | 'casual' | 'neutral'
// ro field = pronunciation guide (stress in CAPS)

const ITALIAN_WORDS = [
  // ── Greetings & expressions ──
  {kr:"buongiorno",ro:"bwon-JOR-no",meaning:"good morning / good day (standard greeting)",example:"Buongiorno, come posso aiutarla? — Good morning, how can I help you?",pos:"expression",freq:10,register:"formal",sit:["meeting"]},
  {kr:"ciao",ro:"CHOW",meaning:"hi / bye (casual only)",example:"Ciao! Tutto bene? — Hey! Everything good?",pos:"expression",freq:10,register:"casual",sit:["meeting"]},
  {kr:"buonasera",ro:"bwo-na-SEH-ra",meaning:"good evening",example:"Buonasera, ho una prenotazione — Good evening, I have a reservation",pos:"expression",freq:9,register:"formal",sit:["meeting"]},
  {kr:"salve",ro:"SAL-veh",meaning:"hello (neutral, safe with strangers)",example:"Salve, mi chiamo Marco — Hello, my name is Marco",pos:"expression",freq:9,register:"neutral",sit:["meeting"]},
  {kr:"arrivederci",ro:"ar-ree-veh-DAIR-chee",meaning:"goodbye (formal)",example:"Arrivederci, a domani — Goodbye, see you tomorrow",pos:"expression",freq:9,register:"formal",sit:["meeting"]},
  {kr:"a presto",ro:"a PRES-to",meaning:"see you soon",example:"A presto! — See you soon!",pos:"expression",freq:8,register:"neutral",sit:["meeting"]},
  {kr:"per favore",ro:"pair fa-VO-reh",meaning:"please (polite request)",example:"Un caffè, per favore — A coffee, please",pos:"expression",freq:10,register:"formal",sit:["restaurant"]},
  {kr:"per piacere",ro:"pair pya-CHEH-reh",meaning:"please (slightly more emphatic)",example:"Parla più piano, per piacere — Please speak more slowly",pos:"expression",freq:9,register:"formal"},
  {kr:"grazie",ro:"GRAT-syeh",meaning:"thank you",example:"Grazie per tutto — Thank you for everything",pos:"expression",freq:10,register:"neutral",sit:["restaurant"]},
  {kr:"grazie mille",ro:"GRAT-syeh MEEL-leh",meaning:"thank you very much",example:"Grazie mille, sei gentilissimo — Thank you so much, you're very kind",pos:"expression",freq:9,register:"formal",sit:["airport","meeting"]},
  {kr:"prego",ro:"PREH-go",meaning:"you're welcome / please / go ahead",example:"Prego, si accomodi — Please, have a seat",pos:"expression",freq:10,register:"neutral",sit:["meeting"]},
  {kr:"mi dispiace",ro:"mee dis-PYA-cheh",meaning:"I'm sorry",example:"Mi dispiace per il ritardo — I'm sorry for the delay",pos:"expression",freq:9,register:"neutral",sit:["meeting","dating"]},
  {kr:"scusa",ro:"SKOO-za",meaning:"excuse me / sorry (casual)",example:"Scusa, puoi ripetere? — Sorry, can you repeat that?",pos:"expression",freq:9,register:"casual",sit:["airport","getting_around"]},
  {kr:"mi scusi",ro:"mee SKOO-zee",meaning:"excuse me (formal)",example:"Mi scusi, dov'è la stazione? — Excuse me, where is the station?",pos:"expression",freq:9,register:"formal",sit:["emergency"]},
  {kr:"non capisco",ro:"non ka-PEES-ko",meaning:"I don't understand",example:"Non capisco, può ripetere? — I don't understand, can you repeat?",pos:"expression",freq:9,register:"neutral",sit:["emergency"]},
  {kr:"non lo so",ro:"non lo SO",meaning:"I don't know",example:"Non lo so davvero — I really don't know",pos:"expression",freq:9,register:"neutral",sit:["airport","getting_around"]},
  {kr:"come si dice",ro:"KO-meh see DEE-cheh",meaning:"how do you say",example:"Come si dice 'hello' in italiano? — How do you say hello in Italian?",pos:"expression",freq:8,register:"neutral",sit:["airport"]},
  {kr:"esatto",ro:"eh-ZAT-to",meaning:"exactly / that's right",example:"Esatto! Hai capito bene — Exactly! You understood well",pos:"expression",freq:8,register:"neutral",sit:["meeting"]},
  {kr:"capisce?",ro:"ka-PEE-sheh",meaning:"do you understand? (formal)",example:"È chiaro? Capisce? — Is it clear? Do you understand?",pos:"expression",freq:8,register:"formal"},
  {kr:"capisci?",ro:"ka-PEE-shee",meaning:"do you understand? (casual)",example:"Capisci cosa intendo? — Do you understand what I mean?",pos:"expression",freq:8,register:"casual"},
  {kr:"dai",ro:"DYE",meaning:"come on / oh come on (interjection)",example:"Dai, non essere così — Come on, don't be like that",pos:"expression",freq:8,register:"casual"},
  {kr:"mamma mia",ro:"MAM-ma MEE-a",meaning:"oh my / goodness (exclamation)",example:"Mamma mia, che fila! — Oh my, what a line!",pos:"expression",freq:7,register:"casual"},
  {kr:"basta",ro:"BA-sta",meaning:"enough / that's enough",example:"Basta, non ne posso più — Enough, I can't take it anymore",pos:"expression",freq:8,register:"neutral",sit:["restaurant"]},
  {kr:"andiamo",ro:"an-DYA-mo",meaning:"let's go",example:"Andiamo, è già tardi — Let's go, it's already late",pos:"expression",freq:8,register:"neutral",sit:["airport","getting_around"]},
  {kr:"benvenuto",ro:"ben-veh-NOO-to",meaning:"welcome",example:"Benvenuto in Italia! — Welcome to Italy!",pos:"expression",freq:7,register:"neutral"},
  {kr:"buonanotte",ro:"bwo-na-NOT-teh",meaning:"good night",example:"Buonanotte, dormi bene — Good night, sleep well",pos:"expression",freq:8,register:"neutral"},
  {kr:"ti voglio bene",ro:"tee VOL-yo BEH-neh",meaning:"I love you (affection, family/friends)",example:"Ti voglio bene, mamma — I love you, mom",pos:"expression",freq:9,register:"casual",sit:["dating"]},
  {kr:"ti amo",ro:"tee A-mo",meaning:"I love you (romantic)",example:"Ti amo con tutto il cuore — I love you with all my heart",pos:"expression",freq:9,register:"casual",sit:["dating"]},
  {kr:"mi manchi",ro:"mee MAN-kee",meaning:"I miss you",example:"Mi manchi tanto — I miss you so much",pos:"expression",freq:8,register:"casual",sit:["dating"]},
  {kr:"in bocca al lupo",ro:"in BOK-ka al LOO-po",meaning:"good luck (literally: in the wolf's mouth)",example:"In bocca al lupo per l'esame! — Good luck on the exam!",pos:"expression",freq:7,register:"neutral"},
  // ── Pronouns ──
  {kr:"io",ro:"EE-o",meaning:"I / me",example:"Io non lo sapevo — I didn't know that",pos:"pronoun",freq:10,register:"neutral",sit:["meeting"]},
  {kr:"tu",ro:"TOO",meaning:"you (casual)",example:"Tu cosa fai? — What are you doing?",pos:"pronoun",freq:10,register:"casual",sit:["meeting"]},
  {kr:"lei",ro:"LAY",meaning:"she / you (formal)",example:"Lei è la professoressa? — Are you the professor?",pos:"pronoun",freq:9,register:"formal"},
  {kr:"lui",ro:"LOO-ee",meaning:"he / him",example:"Lui parla troppo — He talks too much",pos:"pronoun",freq:9,register:"neutral"},
  {kr:"noi",ro:"NOY",meaning:"we / us",example:"Noi andiamo al mare — We are going to the sea",pos:"pronoun",freq:9,register:"neutral"},
  {kr:"voi",ro:"VOY",meaning:"you all",example:"Voi venite alla festa? — Are you all coming to the party?",pos:"pronoun",freq:8,register:"neutral"},
  {kr:"loro",ro:"LO-ro",meaning:"they / them",example:"Loro non sanno ancora — They don't know yet",pos:"pronoun",freq:8,register:"neutral"},
  {kr:"chi",ro:"KEE",meaning:"who",example:"Chi ha detto questo? — Who said that?",pos:"pronoun",freq:9,register:"neutral",sit:["meeting"]},
  {kr:"cosa",ro:"KO-za",meaning:"what / thing",example:"Cosa vuoi fare? — What do you want to do?",pos:"pronoun",freq:10,register:"neutral"},
  {kr:"questo",ro:"KWES-to",meaning:"this",example:"Questo è mio — This is mine",pos:"pronoun",freq:9,register:"neutral"},
  {kr:"quello",ro:"KWEL-lo",meaning:"that",example:"Quello mi piace di più — I like that one more",pos:"pronoun",freq:8,register:"neutral"},
  // ── Core verbs ──
  {kr:"essere",ro:"ES-seh-reh",meaning:"to be",example:"Sono stanco — I am tired",pos:"verb",freq:10,register:"neutral"},
  {kr:"avere",ro:"a-VEH-reh",meaning:"to have",example:"Ho fame — I'm hungry",pos:"verb",freq:10,register:"neutral"},
  {kr:"fare",ro:"FA-reh",meaning:"to do / make",example:"Cosa fai? — What are you doing?",pos:"verb",freq:10,register:"neutral"},
  {kr:"andare",ro:"an-DA-reh",meaning:"to go",example:"Vado a casa — I'm going home",pos:"verb",freq:10,register:"neutral",sit:["getting_around"]},
  {kr:"venire",ro:"veh-NEE-reh",meaning:"to come",example:"Vieni con me — Come with me",pos:"verb",freq:10,register:"neutral",sit:["emergency"]},
  {kr:"volere",ro:"vo-LEH-reh",meaning:"to want",example:"Voglio imparare l'italiano — I want to learn Italian",pos:"verb",freq:10,register:"neutral",sit:["shopping"]},
  {kr:"potere",ro:"po-TEH-reh",meaning:"can / to be able to",example:"Puoi aiutarmi? — Can you help me?",pos:"verb",freq:10,register:"neutral"},
  {kr:"dovere",ro:"do-VEH-reh",meaning:"must / to have to",example:"Devo partire subito — I have to leave immediately",pos:"verb",freq:9,register:"neutral"},
  {kr:"sapere",ro:"sa-PEH-reh",meaning:"to know (facts)",example:"Sai parlare italiano? — Do you know how to speak Italian?",pos:"verb",freq:9,register:"neutral"},
  {kr:"conoscere",ro:"ko-NO-sheh-reh",meaning:"to know (people/places)",example:"Conosci Roma? — Do you know Rome?",pos:"verb",freq:8,register:"neutral"},
  {kr:"dire",ro:"DEE-reh",meaning:"to say / tell",example:"Cosa vuoi dire? — What do you mean?",pos:"verb",freq:10,register:"neutral"},
  {kr:"parlare",ro:"par-LA-reh",meaning:"to speak / talk",example:"Parla più lentamente — Speak more slowly",pos:"verb",freq:10,register:"neutral",sit:["meeting"]},
  {kr:"capire",ro:"ka-PEE-reh",meaning:"to understand",example:"Non capisco niente — I don't understand anything",pos:"verb",freq:9,register:"neutral",sit:["meeting","getting_around"]},
  {kr:"sentire",ro:"sen-TEE-reh",meaning:"to hear / feel / sense",example:"Senti questa canzone? — Do you hear this song?",pos:"verb",freq:8,register:"neutral"},
  {kr:"vedere",ro:"veh-DEH-reh",meaning:"to see / watch",example:"Ci vediamo domani — We'll see each other tomorrow",pos:"verb",freq:9,register:"neutral"},
  {kr:"guardare",ro:"gwar-DA-reh",meaning:"to look at / watch",example:"Guardiamo un film — Let's watch a film",pos:"verb",freq:8,register:"neutral"},
  {kr:"mangiare",ro:"man-JA-reh",meaning:"to eat",example:"Ho mangiato troppo — I ate too much",pos:"verb",freq:9,register:"neutral",sit:["restaurant"]},
  {kr:"bere",ro:"BEH-reh",meaning:"to drink",example:"Vuoi bere qualcosa? — Do you want to drink something?",pos:"verb",freq:9,register:"neutral",sit:["restaurant"]},
  {kr:"dormire",ro:"dor-MEE-reh",meaning:"to sleep",example:"Devo dormire — I need to sleep",pos:"verb",freq:9,register:"neutral"},
  {kr:"pensare",ro:"pen-SA-reh",meaning:"to think",example:"Cosa pensi di me? — What do you think of me?",pos:"verb",freq:9,register:"neutral"},
  {kr:"credere",ro:"KREH-deh-reh",meaning:"to believe",example:"Ci credo davvero — I really believe it",pos:"verb",freq:8,register:"neutral"},
  {kr:"amare",ro:"a-MA-reh",meaning:"to love",example:"Amo la musica italiana — I love Italian music",pos:"verb",freq:9,register:"neutral"},
  {kr:"piacere",ro:"pya-CHEH-reh",meaning:"to like / please",example:"Mi piace molto — I like it a lot",pos:"verb",freq:10,register:"neutral",sit:["dating"]},
  {kr:"aspettare",ro:"as-pet-TA-reh",meaning:"to wait",example:"Aspetta, arrivo subito — Wait, I'm coming right away",pos:"verb",freq:8,register:"neutral",sit:["emergency"]},
  {kr:"trovare",ro:"tro-VA-reh",meaning:"to find",example:"Non riesco a trovarlo — I can't find it",pos:"verb",freq:8,register:"neutral",sit:["shopping"]},
  {kr:"dare",ro:"DA-reh",meaning:"to give",example:"Dammi un attimo — Give me a moment",pos:"verb",freq:9,register:"neutral"},
  {kr:"prendere",ro:"PREN-deh-reh",meaning:"to take / get",example:"Prendo un caffè — I'll have a coffee",pos:"verb",freq:9,register:"neutral",sit:["restaurant"]},
  {kr:"uscire",ro:"oo-SHEE-reh",meaning:"to go out",example:"Usciamo stasera? — Shall we go out tonight?",pos:"verb",freq:8,register:"neutral"},
  {kr:"tornare",ro:"tor-NA-reh",meaning:"to return",example:"Torno fra un'ora — I'll be back in an hour",pos:"verb",freq:8,register:"neutral",sit:["getting_around"]},
  {kr:"vivere",ro:"VEE-veh-reh",meaning:"to live",example:"Vivo a Milano — I live in Milan",pos:"verb",freq:8,register:"neutral"},
  {kr:"lavorare",ro:"la-vo-RA-reh",meaning:"to work",example:"Lavoro troppo — I work too much",pos:"verb",freq:8,register:"neutral"},
  {kr:"studiare",ro:"stoo-DYA-reh",meaning:"to study",example:"Studio italiano ogni giorno — I study Italian every day",pos:"verb",freq:8,register:"neutral"},
  {kr:"chiamarsi",ro:"kya-MAR-see",meaning:"to be called / named",example:"Mi chiamo Sofia — My name is Sofia",pos:"verb",freq:9,register:"neutral",sit:["meeting"]},
  {kr:"capirsi",ro:"ka-PEER-see",meaning:"to understand each other",example:"Ci capiamo bene — We understand each other well",pos:"verb",freq:7,register:"neutral"},
  // ── Adjectives ──
  {kr:"bello",ro:"BEL-lo",meaning:"beautiful / nice",example:"Che posto bello! — What a beautiful place!",pos:"adjective",freq:10,register:"neutral",sit:["dating"]},
  {kr:"buono",ro:"BWO-no",meaning:"good / tasty / kind",example:"Sei una persona buona — You are a good person",pos:"adjective",freq:10,register:"neutral",sit:["restaurant"]},
  {kr:"grande",ro:"GRAN-deh",meaning:"big / great",example:"Hai fatto una cosa grande — You did something great",pos:"adjective",freq:9,register:"neutral",sit:["shopping"]},
  {kr:"piccolo",ro:"PEE-ko-lo",meaning:"small / little",example:"Un piccolo favore — A small favor",pos:"adjective",freq:9,register:"neutral",sit:["shopping"]},
  {kr:"nuovo",ro:"NWO-vo",meaning:"new",example:"Un nuovo inizio — A new beginning",pos:"adjective",freq:9,register:"neutral",sit:["shopping"]},
  {kr:"vecchio",ro:"VEK-kyo",meaning:"old",example:"Il mio vecchio quartiere — My old neighborhood",pos:"adjective",freq:8,register:"neutral"},
  {kr:"felice",ro:"feh-LEE-cheh",meaning:"happy",example:"Sono felice per te — I'm happy for you",pos:"adjective",freq:9,register:"neutral",sit:["dating"]},
  {kr:"triste",ro:"TREES-teh",meaning:"sad",example:"Perché sei così triste? — Why are you so sad?",pos:"adjective",freq:8,register:"neutral",sit:["dating"]},
  {kr:"stanco",ro:"STAN-ko",meaning:"tired",example:"Sono stanco morto — I'm dead tired",pos:"adjective",freq:8,register:"neutral"},
  {kr:"pronto",ro:"PRON-to",meaning:"ready",example:"Sei pronto per partire? — Are you ready to leave?",pos:"adjective",freq:9,register:"neutral"},
  {kr:"facile",ro:"FA-chee-leh",meaning:"easy",example:"Non è così facile — It's not that easy",pos:"adjective",freq:8,register:"neutral"},
  {kr:"difficile",ro:"dee-FEE-chee-leh",meaning:"difficult",example:"La grammatica è difficile — Grammar is difficult",pos:"adjective",freq:8,register:"neutral"},
  {kr:"vero",ro:"VEH-ro",meaning:"true / real",example:"È vero quello che dicono? — Is what they say true?",pos:"adjective",freq:9,register:"neutral"},
  {kr:"stesso",ro:"STES-so",meaning:"same",example:"Abbiamo lo stesso problema — We have the same problem",pos:"adjective",freq:8,register:"neutral"},
  {kr:"bravo",ro:"BRA-vo",meaning:"good / well done / skilled",example:"Sei molto bravo — You're very good",pos:"adjective",freq:9,register:"neutral"},
  {kr:"simpatico",ro:"seem-PA-tee-ko",meaning:"nice / likeable / funny",example:"È una persona simpatica — They're a likeable person",pos:"adjective",freq:8,register:"neutral",sit:["dating"]},
  {kr:"carino",ro:"ka-REE-no",meaning:"cute / nice / sweet",example:"Che idea carina! — What a cute idea!",pos:"adjective",freq:8,register:"casual",sit:["dating"]},
  {kr:"occupato",ro:"ok-koo-PA-to",meaning:"busy",example:"Sono molto occupato adesso — I'm very busy right now",pos:"adjective",freq:7,register:"neutral"},
  {kr:"libero",ro:"LEE-beh-ro",meaning:"free / available",example:"Sei libero domani? — Are you free tomorrow?",pos:"adjective",freq:8,register:"neutral"},
  // ── Adverbs ──
  {kr:"molto",ro:"MOL-to",meaning:"very / a lot",example:"Mi piace molto — I like it a lot",pos:"adverb",freq:10,register:"neutral"},
  {kr:"poco",ro:"PO-ko",meaning:"a little / not much",example:"Parlo poco italiano — I speak a little Italian",pos:"adverb",freq:9,register:"neutral"},
  {kr:"troppo",ro:"TROP-po",meaning:"too / too much",example:"È troppo caldo oggi — It's too hot today",pos:"adverb",freq:8,register:"neutral"},
  {kr:"abbastanza",ro:"ab-bas-TAN-tsa",meaning:"enough / quite / fairly",example:"È abbastanza buono — It's quite good",pos:"adverb",freq:8,register:"neutral"},
  {kr:"subito",ro:"SOO-bee-to",meaning:"right away / immediately",example:"Vengo subito — I'll be right there",pos:"adverb",freq:8,register:"neutral",sit:["emergency"]},
  {kr:"ancora",ro:"an-KO-ra",meaning:"still / yet / again",example:"Stai ancora qui? — Are you still here?",pos:"adverb",freq:8,register:"neutral",sit:["dating"]},
  {kr:"già",ro:"JA",meaning:"already",example:"L'ho già visto — I already saw it",pos:"adverb",freq:8,register:"neutral"},
  {kr:"sempre",ro:"SEM-preh",meaning:"always",example:"Ti penso sempre — I always think about you",pos:"adverb",freq:9,register:"neutral",sit:["dating"]},
  {kr:"mai",ro:"MY",meaning:"never / ever",example:"Non lo faccio mai — I never do that",pos:"adverb",freq:8,register:"neutral",sit:["dating"]},
  {kr:"forse",ro:"FOR-seh",meaning:"maybe / perhaps",example:"Forse vengo anch'io — Maybe I'll come too",pos:"adverb",freq:8,register:"neutral",sit:["dating"]},
  {kr:"insieme",ro:"in-SYEH-meh",meaning:"together",example:"Facciamolo insieme — Let's do it together",pos:"adverb",freq:8,register:"neutral",sit:["dating"]},
  {kr:"adesso",ro:"a-DES-so",meaning:"now",example:"Adesso capisco tutto — Now I understand everything",pos:"adverb",freq:9,register:"neutral",sit:["getting_around"]},
  {kr:"dopo",ro:"DO-po",meaning:"after / later",example:"A dopo! — See you later!",pos:"adverb",freq:9,register:"neutral",sit:["getting_around"]},
  {kr:"prima",ro:"PREE-ma",meaning:"before / first / earlier",example:"Prima di tutto, grazie — First of all, thank you",pos:"adverb",freq:8,register:"neutral",sit:["getting_around"]},
  {kr:"dove",ro:"DO-veh",meaning:"where",example:"Dove sei? — Where are you?",pos:"adverb",freq:10,register:"neutral",sit:["emergency"]},
  {kr:"quando",ro:"KWAN-do",meaning:"when",example:"Quando torni? — When are you coming back?",pos:"adverb",freq:9,register:"neutral",sit:["airport","getting_around"]},
  {kr:"come",ro:"KO-meh",meaning:"how / like / as",example:"Come stai? — How are you?",pos:"adverb",freq:10,register:"neutral",sit:["meeting"]},
  {kr:"perché",ro:"pair-KEH",meaning:"why / because",example:"Perché non vieni? — Why aren't you coming?",pos:"adverb",freq:9,register:"neutral"},
  {kr:"quanto",ro:"KWAN-to",meaning:"how much",example:"Quanto costa? — How much does it cost?",pos:"adverb",freq:9,register:"neutral",sit:["restaurant"]},
  {kr:"anche",ro:"AN-keh",meaning:"also / too / even",example:"Anch'io voglio venire — I want to come too",pos:"adverb",freq:9,register:"neutral"},
  {kr:"solo",ro:"SO-lo",meaning:"only / just / alone",example:"Solo un momento — Just a moment",pos:"adverb",freq:9,register:"neutral"},
  // ── Nouns ──
  {kr:"amore",ro:"a-MO-reh",meaning:"love",example:"L'amore è complicato — Love is complicated",pos:"noun",freq:10,register:"neutral",sit:["dating"]},
  {kr:"amico",ro:"a-MEE-ko",meaning:"friend (m)",example:"Il mio miglior amico — My best friend",pos:"noun",freq:10,register:"neutral"},
  {kr:"casa",ro:"KA-za",meaning:"home / house",example:"A casa mi sento bene — I feel good at home",pos:"noun",freq:10,register:"neutral"},
  {kr:"famiglia",ro:"fa-MEE-lya",meaning:"family",example:"La famiglia è tutto — Family is everything",pos:"noun",freq:9,register:"neutral"},
  {kr:"tempo",ro:"TEM-po",meaning:"time / weather",example:"Non ho tempo — I don't have time",pos:"noun",freq:10,register:"neutral"},
  {kr:"vita",ro:"VEE-ta",meaning:"life",example:"La vita è bella — Life is beautiful",pos:"noun",freq:9,register:"neutral"},
  {kr:"nome",ro:"NO-meh",meaning:"name",example:"Come ti chiami? — What's your name?",pos:"noun",freq:9,register:"neutral"},
  {kr:"acqua",ro:"AK-kwa",meaning:"water",example:"Un bicchiere d'acqua, per favore — A glass of water, please",pos:"noun",freq:10,register:"neutral",sit:["restaurant"]},
  {kr:"caffè",ro:"kaf-FEH",meaning:"coffee (espresso)",example:"Un caffè al volo — A quick coffee",pos:"noun",freq:9,register:"neutral",sit:["restaurant"]},
  {kr:"cibo",ro:"CHEE-bo",meaning:"food",example:"Il cibo italiano è fantastico — Italian food is fantastic",pos:"noun",freq:9,register:"neutral",sit:["restaurant"]},
  {kr:"cuore",ro:"KWO-reh",meaning:"heart",example:"Parla col cuore — Speak from the heart",pos:"noun",freq:9,register:"neutral",sit:["dating"]},
  {kr:"parola",ro:"pa-RO-la",meaning:"word",example:"Non trovo le parole — I can't find the words",pos:"noun",freq:8,register:"neutral"},
  {kr:"lingua",ro:"LEEN-gwa",meaning:"language / tongue",example:"Imparo la lingua italiana — I'm learning Italian",pos:"noun",freq:8,register:"neutral"},
  {kr:"musica",ro:"MOO-zee-ka",meaning:"music",example:"La musica mi calma — Music calms me",pos:"noun",freq:9,register:"neutral",sit:["dating"]},
  {kr:"canzone",ro:"kan-TSO-neh",meaning:"song",example:"Conosci questa canzone? — Do you know this song?",pos:"noun",freq:8,register:"neutral",sit:["dating"]},
  {kr:"città",ro:"cheet-TA",meaning:"city",example:"Che bella città! — What a beautiful city!",pos:"noun",freq:8,register:"neutral"},
  {kr:"ragazzo",ro:"ra-GAT-tso",meaning:"boy / guy / boyfriend",example:"Il mio ragazzo è gentile — My boyfriend is kind",pos:"noun",freq:9,register:"casual"},
  {kr:"ragazza",ro:"ra-GAT-tsa",meaning:"girl / girlfriend",example:"La mia ragazza studia medicina — My girlfriend studies medicine",pos:"noun",freq:9,register:"casual"},
  {kr:"bambino",ro:"bam-BEE-no",meaning:"child / baby",example:"Che bambino carino! — What a cute child!",pos:"noun",freq:8,register:"neutral"},
  {kr:"giorno",ro:"JOR-no",meaning:"day",example:"Buona giornata! — Have a good day!",pos:"noun",freq:10,register:"neutral"},
  {kr:"notte",ro:"NOT-teh",meaning:"night",example:"La notte è silenziosa — The night is quiet",pos:"noun",freq:9,register:"neutral"},
];

// ── KOREAN SENTENCE EXERCISES ─────────────────────────────────────────────────
// type: 'particle'   — choose the correct particle
//       'conjugate'  — choose the correct verb ending
//       'build'      — arrange blocks into correct sentence
//       'fill'       — fill the blank from context

const KOREAN_SENTENCES = [

  // ── PARTICLE exercises ──
  {
    type:'particle',
    english:'I go to school.',
    prompt:'나 학교 ___ 가요.',
    answer:'에',
    choices:['에','에서','을','이'],
    explanation:'"에" marks a destination or location. "에서" means "at" for actions happening there. Since we\'re going TO school, we use 에.',
    level:1
  },
  {
    type:'particle',
    english:'I study at the library.',
    prompt:'나는 도서관 ___ 공부해요.',
    answer:'에서',
    choices:['에','에서','를','도'],
    explanation:'"에서" marks where an action takes place. "에" marks direction/destination. Since studying happens AT the library, use 에서.',
    level:1
  },
  {
    type:'particle',
    english:'I eat rice.',
    prompt:'밥 ___ 먹어요.',
    answer:'을',
    choices:['을','이','에','도'],
    explanation:'"을/를" marks the object — what the action is done TO. 밥 ends in a consonant (ㅂ), so we use 을 not 를.',
    level:1
  },
  {
    type:'particle',
    english:'Rain is falling.',
    prompt:'비 ___ 와요.',
    answer:'가',
    choices:['가','는','을','에서'],
    explanation:'"이/가" marks the subject — who or what is doing the action. 비 ends in a vowel, so we use 가 not 이.',
    level:1
  },
  {
    type:'particle',
    english:'I like music too.',
    prompt:'나 ___ 음악을 좋아해요.',
    answer:'도',
    choices:['도','만','는','가'],
    explanation:'"도" means "also" or "too". It replaces 은/는 or 이/가 when you want to include yourself in something.',
    level:1
  },
  {
    type:'particle',
    english:'I only look at you.',
    prompt:'너 ___ 바라봐.',
    answer:'만',
    choices:['만','도','를','한테'],
    explanation:'"만" means "only". It attaches to the thing being limited — 너만 means "only you".',
    level:2
  },
  {
    type:'particle',
    english:'I gave it to my friend.',
    prompt:'친구 ___ 줬어.',
    answer:'한테',
    choices:['한테','에','에서','께'],
    explanation:'"한테" marks the recipient (casual). Use "께" with elders or people of higher status. "에" is for places, not people.',
    level:2
  },
  {
    type:'particle',
    english:'As for me, I\'m a student.',
    prompt:'나 ___ 학생이에요.',
    answer:'는',
    choices:['는','가','을','도'],
    explanation:'"은/는" marks the topic of the sentence. 나 ends in a vowel so we use 는. This sets "me" as what we\'re talking about.',
    level:1
  },
  {
    type:'particle',
    english:'I go with a friend.',
    prompt:'친구 ___ 가요.',
    answer:'랑',
    choices:['랑','한테','에','께'],
    explanation:'"이랑/랑" means "with" or "and" (casual). 친구 ends in a vowel so we use 랑. For formal writing use 와/과.',
    level:2
  },

  // ── CONJUGATION exercises ──
  {
    type:'conjugate',
    english:'I eat (polite present)',
    baseForm:'먹다',
    prompt:'나는 밥을 ___.',
    answer:'먹어요',
    choices:['먹어요','먹었어요','먹을 거예요','먹어'],
    explanation:'Polite present: remove 다, add 어요. Since 먹 has the vowel ㅓ, we use 어요 (not 아요).',
    level:1
  },
  {
    type:'conjugate',
    english:'I ate (polite past)',
    baseForm:'먹다',
    prompt:'어제 밥을 ___.',
    answer:'먹었어요',
    choices:['먹어요','먹었어요','먹을 거예요','먹었어'],
    explanation:'Polite past: add 었어요 after the stem. 먹 + 었어요 = 먹었어요.',
    level:2
  },
  {
    type:'conjugate',
    english:'I will eat (polite future)',
    baseForm:'먹다',
    prompt:'내일 밥을 ___.',
    answer:'먹을 거예요',
    choices:['먹어요','먹었어요','먹을 거예요','먹겠어요'],
    explanation:'Future intention: verb stem + 을 거예요. Since 먹 ends in ㄱ (consonant), use 을 거예요.',
    level:2
  },
  {
    type:'conjugate',
    english:'I go (casual present)',
    baseForm:'가다',
    prompt:'나 학교에 ___.',
    answer:'가',
    choices:['가','갔어','갈 거야','가요'],
    explanation:'Casual present: remove 다. 가다 → 가. (Short form, used with friends.)',
    level:1
  },
  {
    type:'conjugate',
    english:'I went (casual past)',
    baseForm:'가다',
    prompt:'어제 학교에 ___.',
    answer:'갔어',
    choices:['가','갔어','갈 거야','가요'],
    explanation:'Casual past: stem + 았어/었어. 가 has vowel ㅏ so use 았어 → 갔어 (contracted).',
    level:2
  },
  {
    type:'conjugate',
    english:'I will go (casual future)',
    baseForm:'가다',
    prompt:'내일 학교에 ___.',
    answer:'갈 거야',
    choices:['가','갔어','갈 거야','가겠어'],
    explanation:'Casual future: stem + ㄹ/을 거야. 가 ends in a vowel so add ㄹ → 갈 거야.',
    level:2
  },
  {
    type:'conjugate',
    english:'Don\'t cry (casual command)',
    baseForm:'울다',
    prompt:'___ 마.',
    answer:'울지',
    choices:['울지','울어','울었','울'],
    explanation:'Negative command: verb stem + 지 마. So 울다 → 울지 마 = don\'t cry.',
    level:3
  },
  {
    type:'conjugate',
    english:'Let\'s go together (casual suggestion)',
    baseForm:'가다',
    prompt:'같이 ___.',
    answer:'가자',
    choices:['가자','가요','갑시다','가'],
    explanation:'Casual suggestion "let\'s": stem + 자. 가자 = let\'s go. Formal equivalent is 갑시다.',
    level:2
  },

  // ── BUILD exercises ──
  {
    type:'build',
    english:'I like Korean food.',
    blocks:['나는','한국','음식을','좋아해요','음식','이','을'],
    answer:['나는','한국','음식을','좋아해요'],
    explanation:'Korean is SOV: Subject (나는) → Object (한국 음식을) → Verb (좋아해요). Notice how the verb always comes last.',
    level:1
  },
  {
    type:'build',
    english:'I study Korean at home every day.',
    blocks:['나는','집에서','매일','한국어를','공부해요','학교에','를'],
    answer:['나는','집에서','매일','한국어를','공부해요'],
    explanation:'Time words (매일) and place words (집에서) come before the object and verb. Subject → Place → Time → Object → Verb.',
    level:2
  },
  {
    type:'build',
    english:'My friend gave a gift to me.',
    blocks:['친구가','나한테','선물을','줬어','선물','을','에게'],
    answer:['친구가','나한테','선물을','줬어'],
    explanation:'Subject (친구가) → Recipient (나한테) → Object (선물을) → Verb (줬어). Recipients come before objects in Korean.',
    level:2
  },

  // ── FILL exercises ──
  {
    type:'fill',
    english:'___ do you know? (casual)',
    prompt:'___ 알아?',
    answer:'뭐',
    choices:['뭐','무엇을','누구','어디'],
    explanation:'"뭐" is the casual form of "what" — short for 무엇. In casual speech 뭐 is much more natural.',
    level:1
  },
  {
    type:'fill',
    english:'Why are you like that?',
    prompt:'___ 그래?',
    answer:'왜',
    choices:['왜','어떻게','언제','어디'],
    explanation:'"왜" = why. It never changes form and always comes near the start of the question.',
    level:1
  },
  {
    type:'fill',
    english:'Where are you going?',
    prompt:'___ 가?',
    answer:'어디',
    choices:['어디','언제','왜','어떻게'],
    explanation:'"어디" = where. Like 왜, it comes before the verb.',
    level:1
  },
];

// ── ITALIAN SENTENCE EXERCISES ────────────────────────────────────────────────

const ITALIAN_SENTENCES = [

  // ── CONJUGATION exercises ──
  {
    type:'conjugate',
    english:'I am tired. (essere — io)',
    baseForm:'essere',
    prompt:'Io ___ stanco.',
    answer:'sono',
    choices:['sono','sei','è','siamo'],
    explanation:'"Essere" (to be) is irregular. io=sono, tu=sei, lui/lei=è, noi=siamo, voi=siete, loro=sono.',
    level:1
  },
  {
    type:'conjugate',
    english:'You are very kind. (essere — tu)',
    baseForm:'essere',
    prompt:'Tu ___ molto gentile.',
    answer:'sei',
    choices:['sono','sei','è','siete'],
    explanation:'Tu form of essere = sei. Note: in Italian you often drop the pronoun since the verb ending shows who you mean.',
    level:1
  },
  {
    type:'conjugate',
    english:'She is Italian. (essere — lei)',
    baseForm:'essere',
    prompt:'Lei ___ italiana.',
    answer:'è',
    choices:['è','sei','sono','siamo'],
    explanation:'Lei (she/formal you) form of essere = è. Note the grave accent — without it, "e" means "and".',
    level:1
  },
  {
    type:'conjugate',
    english:'I have hunger. (= I\'m hungry) (avere — io)',
    baseForm:'avere',
    prompt:'Io ___ fame.',
    answer:'ho',
    choices:['ho','hai','ha','abbiamo'],
    explanation:'"Avere" (to have) is used for many states in Italian: ho fame (hungry), ho sete (thirsty), ho freddo (cold), ho caldo (hot).',
    level:1
  },
  {
    type:'conjugate',
    english:'Do you have time? (avere — tu)',
    baseForm:'avere',
    prompt:'Tu ___ tempo?',
    answer:'hai',
    choices:['ho','hai','ha','hanno'],
    explanation:'Tu form of avere = hai. The h is silent — these words only have h to distinguish them from other short words.',
    level:1
  },
  {
    type:'conjugate',
    english:'What are you doing? (fare — tu)',
    baseForm:'fare',
    prompt:'Cosa ___ ?',
    answer:'fai',
    choices:['faccio','fai','fa','fanno'],
    explanation:'"Fare" (to do/make) is irregular. io=faccio, tu=fai, lui/lei=fa, noi=facciamo, voi=fate, loro=fanno.',
    level:1
  },
  {
    type:'conjugate',
    english:'I\'m going home. (andare — io)',
    baseForm:'andare',
    prompt:'___ a casa.',
    answer:'Vado',
    choices:['Vado','Vai','Va','Andiamo'],
    explanation:'"Andare" is irregular. io=vado, tu=vai, lui/lei=va, noi=andiamo, voi=andate, loro=vanno.',
    level:1
  },
  {
    type:'conjugate',
    english:'We are going to eat. (andare — noi)',
    baseForm:'andare',
    prompt:'___ a mangiare.',
    answer:'Andiamo',
    choices:['Vado','Andate','Andiamo','Vanno'],
    explanation:'Noi form of andare = andiamo. This is also used for "let\'s go!" — Andiamo! is one of the most useful expressions.',
    level:1
  },
  {
    type:'conjugate',
    english:'I want a coffee. (volere — io)',
    baseForm:'volere',
    prompt:'___ un caffè.',
    answer:'Voglio',
    choices:['Voglio','Vuoi','Vuole','Vogliamo'],
    explanation:'"Volere" (to want) is irregular. io=voglio, tu=vuoi, lui/lei=vuole, noi=vogliamo, voi=volete, loro=vogliono.',
    level:1
  },
  {
    type:'conjugate',
    english:'Can you help me? (potere — tu)',
    baseForm:'potere',
    prompt:'___ aiutarmi?',
    answer:'Puoi',
    choices:['Posso','Puoi','Può','Possono'],
    explanation:'"Potere" (can/to be able to) is irregular. io=posso, tu=puoi, lui/lei=può, noi=possiamo.',
    level:2
  },
  {
    type:'conjugate',
    english:'I speak Italian. (parlare — io, -are verb)',
    baseForm:'parlare',
    prompt:'___ italiano.',
    answer:'Parlo',
    choices:['Parlo','Parli','Parla','Parliamo'],
    explanation:'-ARE verbs: io=-o, tu=-i, lui/lei=-a, noi=-iamo, voi=-ate, loro=-ano. parlare → parlo.',
    level:1
  },
  {
    type:'conjugate',
    english:'Do you understand? (capire — tu, -ire verb)',
    baseForm:'capire',
    prompt:'___ ?',
    answer:'Capisci',
    choices:['Capisco','Capisci','Capisce','Capiamo'],
    explanation:'-IRE verbs (isc type): insert -isc- for io/tu/lui/loro. capire → capisci (tu). io=capisco, tu=capisci, lui=capisce.',
    level:2
  },
  {
    type:'conjugate',
    english:'I ate. (mangiare — passato prossimo)',
    baseForm:'mangiare',
    prompt:'Ieri ___ la pizza.',
    answer:'ho mangiato',
    choices:['ho mangiato','ho mangito','sono mangiato','mangiavo'],
    explanation:'Past tense (passato prossimo): avere/essere + past participle. -ARE verbs: stem + ato. mangiare → mangiato. Most verbs use avere.',
    level:2
  },
  {
    type:'conjugate',
    english:'She arrived. (arrivare — passato prossimo with essere)',
    baseForm:'arrivare',
    prompt:'Lei ___ ieri.',
    answer:'è arrivata',
    choices:['ha arrivato','è arrivata','è arrivato','ha arrivata'],
    explanation:'Movement verbs use ESSERE not avere. With essere, the participle agrees with the subject: arrivato (m) / arrivata (f). Lei = female = arrivata.',
    level:3
  },

  // ── FILL exercises ──
  {
    type:'fill',
    english:'I like music. (piacere construction)',
    prompt:'___ piace la musica.',
    answer:'Mi',
    choices:['Mi','Ti','Gli','Ci'],
    explanation:'Piacere works backwards from English: "mi piace" = "it pleases me" = "I like it". Mi=to me, ti=to you, gli=to him, le=to her.',
    level:2
  },
  {
    type:'fill',
    english:'Do you like pizza? (piacere — tu)',
    prompt:'___ piace la pizza?',
    answer:'Ti',
    choices:['Ti','Mi','Gli','Vi'],
    explanation:'"Ti piace" = does it please you = do you like it. Ti is the indirect object pronoun for "you" (tu).',
    level:2
  },
  {
    type:'fill',
    english:'How are you? (casual)',
    prompt:'___ stai?',
    answer:'Come',
    choices:['Come','Dove','Quando','Perché'],
    explanation:'"Come stai?" = how are you (casual). "Come sta?" = how are you (formal). Come = how.',
    level:1
  },
  {
    type:'fill',
    english:'Where are you? (casual)',
    prompt:'___ sei?',
    answer:'Dove',
    choices:['Dove','Come','Quando','Chi'],
    explanation:'"Dove" = where. Dove sei? = where are you? (casual). Dove si trova? = where is it located? (formal)',
    level:1
  },
  {
    type:'fill',
    english:'I don\'t understand anything.',
    prompt:'Non capisco ___.',
    answer:'niente',
    choices:['niente','qualcosa','tutto','nessuno'],
    explanation:'Italian double negatives are correct: non...niente = nothing. "Non capisco niente" is standard, not "non capisco non niente".',
    level:2
  },

  // ── BUILD exercises ──
  {
    type:'build',
    english:'I eat a good pizza.',
    blocks:['Mangio','una','buona','pizza','buono','il'],
    answer:['Mangio','una','buona','pizza'],
    explanation:'Italian adjectives usually follow nouns BUT common adjectives like buono/bello/grande often come before. Buona agrees with pizza (feminine).',
    level:1
  },
  {
    type:'build',
    english:'I want to speak Italian well.',
    blocks:['Voglio','parlare','italiano','bene','l\'','buono'],
    answer:['Voglio','parlare','italiano','bene'],
    explanation:'After modal verbs (voglio, posso, devo) use the infinitive: voglio + parlare. Bene (well) is an adverb — it never changes form.',
    level:2
  },
  {
    type:'build',
    english:'Tomorrow I\'m going to Rome with a friend.',
    blocks:['Domani','vado','a Roma','con un amico','Roma','in'],
    answer:['Domani','vado','a Roma','con un amico'],
    explanation:'Time words (domani) come first. Cities use "a" (vado a Roma), countries use "in" (vado in Italia).',
    level:2
  },
];

// ── GRAMMAR DATA ──────────────────────────────────────────────────────────────

const GRAMMAR = {
  korean: [
    {
      title: 'Sentence order: SOV',
      short: 'The verb always goes last',
      body: 'English is SVO: "I eat rice." Korean is SOV: "I rice eat" (나는 밥을 먹어요). The verb ALWAYS comes at the end. This is the single most important structural rule in Korean — every sentence follows it, no exceptions.',
      example: '나는 학교에서 한국어를 공부해요.\nI [나는] + at school [학교에서] + Korean [한국어를] + study [공부해요].\n→ "I study Korean at school."',
      level: 1
    },
    {
      title: 'Particles: the backbone of Korean',
      short: 'Small tags that show each word\'s job',
      body: 'Korean doesn\'t rely on word order to show who does what — it uses particles attached to nouns.\n\n은/는 = topic marker ("as for...")\n이/가 = subject marker (who does the action)\n을/를 = object marker (what receives the action)\n에 = to / at (place or time)\n에서 = at (where an action happens)\n도 = also / too\n만 = only\n랑/이랑 = with / and (casual)\n와/과 = with / and (formal)',
      example: '나는 학교에서 밥을 먹어요.\n나(I) + 는(topic) + 학교(school) + 에서(at) + 밥(rice) + 을(object) + 먹어요(eat).',
      level: 1
    },
    {
      title: 'Formality: 반말 vs 존댓말',
      short: 'Korean has two main speech levels',
      body: 'Korean speakers switch registers constantly based on relationship, age, and situation.\n\n반말 (casual): close friends, younger people, song lyrics\n→ 먹어, 가, 좋아\n\n존댓말 (polite): strangers, elders, at work, meeting someone new\n→ 먹어요, 가요, 좋아요\n\nUsing casual speech with someone you just met is rude. When in doubt, add 요.',
      example: 'Casual (to a friend): 밥 먹어? — Have you eaten?\nPolite (to a stranger): 식사하셨어요? — Have you had a meal?',
      level: 1
    },
    {
      title: 'Verb endings: tense',
      short: 'Present, past, and future',
      body: 'Present polite: stem + 아요/어요\nPast polite: stem + 았어요/었어요\nFuture polite: stem + ㄹ/을 거예요\n\nVowel harmony rule:\nIf last vowel in stem is ㅏ or ㅗ → use 아요/았어요\nAll other vowels → use 어요/었어요',
      example: '가다 (go): 가요 / 갔어요 / 갈 거예요\n먹다 (eat): 먹어요 / 먹었어요 / 먹을 거예요\n오다 (come): 와요 / 왔어요 / 올 거예요',
      level: 2
    },
    {
      title: 'Negation',
      short: 'Two ways to say "not"',
      body: '안 + verb (short, casual):\n안 먹어요 = I\'m not eating\n\nVerb stem + 지 않아요 (longer, more formal):\n먹지 않아요 = I don\'t eat\n\nNegative command: verb stem + 지 마(요)\n먹지 마 = don\'t eat\n가지 마세요 = please don\'t go',
      example: '안 가요 = I\'m not going (casual)\n가지 않아요 = I\'m not going (formal)\n가지 마 = don\'t go (casual command)',
      level: 2
    },
    {
      title: 'Connecting clauses',
      short: '"And", "but", "because" in Korean',
      body: 'Korean connects clauses by changing the first verb ending, not with standalone conjunctions.\n\n"and then" (sequential): verb + 고\n"but": verb + 지만\n"because / so": verb + 아서/어서\n"in order to": verb + (으)러',
      example: '밥을 먹고 학교에 가요.\n→ I eat and then go to school.\n\n비가 와서 안 갔어요.\n→ Because it rained, I didn\'t go.',
      level: 3
    },
    {
      title: 'Honorifics',
      short: 'Speaking respectfully to elders',
      body: 'Add 시 to the verb stem when the subject is someone respected:\n가다 → 가세요 (you go / please go)\n먹다 → 드세요 (please eat)\n\nSpecial honorific vocabulary:\n먹다 → 드시다 (to eat)\n있다 → 계시다 (to be present)\n이름 → 성함 (name)',
      example: '선생님, 식사하셨어요?\n→ Teacher, have you had a meal?\n\n(Not: 밥 먹었어요? — too casual for a teacher)',
      level: 3
    },
  ],

  italian: [
    {
      title: 'Verb conjugation: the key to Italian',
      short: 'Endings change for every pronoun',
      body: 'Italian verbs change their ending to show who is doing the action. This is why Italians often drop the pronoun entirely — the ending already tells you.\n\n-ARE (parlare — to speak):\nparlo, parli, parla, parliamo, parlate, parlano\n\n-ERE (vedere — to see):\nvedo, vedi, vede, vediamo, vedete, vedono\n\n-IRE (dormire — to sleep):\ndormo, dormi, dorme, dormiamo, dormite, dormono\n\nMost important irregulars to memorize first: essere, avere, fare, andare, venire, volere, potere, dovere.',
      example: 'Parli italiano? → Do you speak Italian?\n(No "tu" needed — "parli" already means "you speak")',
      level: 1
    },
    {
      title: 'Essere vs Avere',
      short: 'Two verbs for "to be" and "to have"',
      body: 'ESSERE (to be) — for identity, nationality, personality, location of places:\nSono stanco = I am tired\nÈ italiana = She is Italian\n\nAVERE (to have) — for possession AND physical/emotional states:\nHo fame = I\'m hungry (lit: I have hunger)\nHo freddo = I\'m cold\nHo paura = I\'m scared\nHo 25 anni = I\'m 25 years old\n\nThis trips up English speakers because Italian uses "have" where English uses "be".',
      example: 'Sono stanco → I am tired (essere)\nHo sonno → I am sleepy (avere, lit: I have sleepiness)\nHo sete → I am thirsty (avere)',
      level: 1
    },
    {
      title: 'Adjective agreement',
      short: 'Adjectives match the noun\'s gender and number',
      body: 'In Italian, adjectives must agree in gender and number with the noun they describe.\n\n-o/-a/-i/-e pattern (most adjectives):\nun ragazzo bravo (a good boy)\nuna ragazza brava (a good girl)\ndue ragazzi bravi (two good boys)\ndue ragazze brave (two good girls)\n\n-e/-i pattern (adjectives ending in -e):\nun uomo felice / due uomini felici\nuna donna felice / due donne felici',
      example: 'bello / bella / belli / belle\nÈ un bel ragazzo. → He\'s a handsome guy.\nÈ una bella ragazza. → She\'s a beautiful girl.',
      level: 1
    },
    {
      title: 'Piacere: "I like" works backwards',
      short: 'The most confusing construction for English speakers',
      body: '"Mi piace" literally means "it is pleasing to me." The thing you like is the subject, not you.\n\nmi piace + singular noun or infinitive\nmi piacciono + plural nouns\n\nTo say who likes:\nmi = to me\nti = to you\ngli = to him\nle = to her\nci = to us\nvi = to you all',
      example: 'Ti piace la musica? → Do you like music?\nMi piacciono i film. → I like films.\nNon mi piace. → I don\'t like it.\nGli piace ballare. → He likes dancing.',
      level: 2
    },
    {
      title: 'Past tense: Passato Prossimo',
      short: 'The most common past tense',
      body: 'Formed with avere or essere + past participle.\n\nParticiples:\n-ARE → -ato (mangiare → mangiato)\n-ERE → -uto (avere → avuto)\n-IRE → -ito (dormire → dormito)\n\nMost verbs use AVERE. But motion and change-of-state verbs use ESSERE:\nandare, venire, arrivare, partire, nascere, morire, restare, diventare...\n\nWith ESSERE the participle agrees with the subject:\nSono andato (m) / Sono andata (f)',
      example: 'Ho mangiato → I ate (avere)\nSono andato → I went (essere, masculine)\nSiamo arrivati → We arrived (essere, plural)',
      level: 2
    },
    {
      title: 'Formality: tu vs Lei',
      short: 'When to be formal',
      body: 'TU (informal): friends, family, children, peers your age\n→ Come stai? / Parli italiano?\n\nLEI (formal): strangers, elders, in shops and offices\n→ Come sta? / Parla italiano?\nNote: Lei (formal you) uses the same verb form as lei (she).\n\nSALVE is the safe neutral greeting for strangers — neither as casual as ciao nor as stiff as buongiorno.\n\nCIAO is casual only. Don\'t say it to your professor or a shop owner you don\'t know.',
      example: 'To a friend: Ciao, come stai?\nTo a professor: Buongiorno, come sta?\nIn a shop: Mi scusi, quanto costa questo?',
      level: 1
    },
    {
      title: 'Articles: il, lo, la, i, gli, le',
      short: 'Every noun has a gender and needs an article',
      body: 'Masculine singular:\nil — before most consonants (il ragazzo)\nlo — before s+consonant, z, ps, gn (lo studente)\nl\' — before vowels (l\'amico)\n\nFeminine singular:\nla — before consonants (la ragazza)\nl\' — before vowels (l\'amica)\n\nPlural:\ni / gli (masculine)\nle (feminine)',
      example: 'il caffè → the coffee\nlo zaino → the backpack\nl\'amore → love\nla musica → the music\ngli amici → the friends',
      level: 1
    },
  ]
};

// ── GRAMMAR RENDERER ─────────────────────────────────────────────────────────

function renderGrammar(container) {
  const notes = (GRAMMAR[curLang]) || [];
  container.innerHTML = '';

  if (!notes || notes.length === 0) {
    container.innerHTML = '<div class="empty-msg">Grammar notes coming soon.</div>';
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'tab-body';
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

  const intro = document.createElement('div');
  intro.className = 't-muted';
  intro.style.cssText = 'font-size:.75rem;padding-bottom:.5rem;';
  intro.textContent = notes.length + ' grammar topics — click any card to expand';
  wrap.appendChild(intro);

  const levelColors = ['#7ac8a0','#c8a87a','#c87aa8'];
  const levelLabels = ['beginner','intermediate','advanced'];

  notes.forEach(function(note) {
    const card = document.createElement('div');
    card.className = 'grammar-card surface';

    const hdr = document.createElement('div');
    hdr.className = 'grammar-hdr';

    const left = document.createElement('div');
    left.className = 'grammar-left';

    const lvl = document.createElement('span');
    lvl.className = 'grammar-level';
    lvl.style.color = levelColors[(note.level||1)-1];
    lvl.textContent = levelLabels[(note.level||1)-1];

    const title = document.createElement('div');
    title.className = 'grammar-title';
    title.textContent = note.title;

    const shortEl = document.createElement('div');
    shortEl.className = 'grammar-short t-muted';
    shortEl.textContent = note.short;

    left.appendChild(lvl);
    left.appendChild(title);
    left.appendChild(shortEl);

    const chev = document.createElement('span');
    chev.className = 'sec-chev';
    chev.textContent = '▾';

    hdr.appendChild(left);
    hdr.appendChild(chev);

    const body = document.createElement('div');
    body.className = 'grammar-body';
    body.style.display = 'none';

    const bodyText = document.createElement('div');
    bodyText.className = 'grammar-text';
    bodyText.textContent = note.body;

    const exBox = document.createElement('div');
    exBox.className = 'grammar-example';
    exBox.innerHTML = '<div class="ex-label t-muted">example</div><pre class="ex-pre">' + note.example + '</pre>';

    const speakBtn = document.createElement('button');
    speakBtn.className = 'ubtn';
    speakBtn.style.marginTop = '8px';
    speakBtn.textContent = '▶ hear example';
    speakBtn.onclick = function() {
      var firstLine = note.example.split('\n')[0].split('→')[0].trim();
      speak(firstLine, curLang);
    };

    body.appendChild(bodyText);
    body.appendChild(exBox);
    body.appendChild(speakBtn);

    hdr.onclick = function() {
      var open = body.style.display === 'none';
      body.style.display = open ? 'block' : 'none';
      chev.textContent = open ? '▴' : '▾';
      card.classList.toggle('grammar-open', open);
    };

    card.appendChild(hdr);
    card.appendChild(body);
    wrap.appendChild(card);
  });

  container.appendChild(wrap);
}


// ═══════════════════════════════════════════════════════════════
// SHARED STATE & UTILITIES
// ═══════════════════════════════════════════════════════════════
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} }
function load(key, def) { try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; } catch(e) { return def; } }

const JAPANESE_WORDS = [

  // ══════════════════════════════════════════════
  //  HIRAGANA — character recognition
  // ══════════════════════════════════════════════
  {kr:"あ",ro:"a",meaning:"a (ah)",example:"あ！— Ah!",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"い",ro:"i",meaning:"i (ee)",example:"いいえ — no",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"う",ro:"u",meaning:"u (oo)",example:"うみ — sea",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"え",ro:"e",meaning:"e (eh)",example:"えき — train station",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"お",ro:"o",meaning:"o (oh)",example:"おかあさん — mother",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"か",ro:"ka",meaning:"ka",example:"かさ — umbrella",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"き",ro:"ki",meaning:"ki",example:"きた — north",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"く",ro:"ku",meaning:"ku",example:"くに — country",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"け",ro:"ke",meaning:"ke",example:"けむり — smoke",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"こ",ro:"ko",meaning:"ko",example:"こえ — voice",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"さ",ro:"sa",meaning:"sa",example:"さかな — fish",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"し",ro:"shi",meaning:"shi",example:"しろ — white",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"す",ro:"su",meaning:"su",example:"すし — sushi",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"せ",ro:"se",meaning:"se",example:"せんせい — teacher",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"そ",ro:"so",meaning:"so",example:"そら — sky",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"た",ro:"ta",meaning:"ta",example:"たべる — to eat",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ち",ro:"chi",meaning:"chi",example:"ちず — map",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"つ",ro:"tsu",meaning:"tsu",example:"つき — moon",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"て",ro:"te",meaning:"te",example:"てがみ — letter",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"と",ro:"to",meaning:"to",example:"とり — bird",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"な",ro:"na",meaning:"na",example:"なまえ — name",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"に",ro:"ni",meaning:"ni",example:"にわ — garden",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ぬ",ro:"nu",meaning:"nu",example:"ぬの — cloth",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ね",ro:"ne",meaning:"ne",example:"ねこ — cat",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"の",ro:"no",meaning:"no (possessive particle)",example:"わたしのほん — my book",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"は",ro:"ha/wa",meaning:"ha (or wa as topic particle)",example:"はな — flower / は = topic marker",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ひ",ro:"hi",meaning:"hi",example:"ひと — person",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ふ",ro:"fu",meaning:"fu",example:"ふゆ — winter",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"へ",ro:"he/e",meaning:"he (or e as direction particle)",example:"へや — room",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ほ",ro:"ho",meaning:"ho",example:"ほし — star",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ま",ro:"ma",meaning:"ma",example:"まち — town",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"み",ro:"mi",meaning:"mi",example:"みず — water",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"む",ro:"mu",meaning:"mu",example:"むし — insect",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"め",ro:"me",meaning:"me",example:"め — eye",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"も",ro:"mo",meaning:"mo (also/too particle)",example:"わたしも — me too",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"や",ro:"ya",meaning:"ya",example:"やま — mountain",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ゆ",ro:"yu",meaning:"yu",example:"ゆき — snow",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"よ",ro:"yo",meaning:"yo",example:"よる — night",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ら",ro:"ra",meaning:"ra",example:"らいねん — next year",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"り",ro:"ri",meaning:"ri",example:"りんご — apple",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"る",ro:"ru",meaning:"ru",example:"るす — away from home",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"れ",ro:"re",meaning:"re",example:"れいぞうこ — refrigerator",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ろ",ro:"ro",meaning:"ro",example:"ろうか — hallway",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"わ",ro:"wa",meaning:"wa",example:"わたし — I/me",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"を",ro:"wo/o",meaning:"wo (object particle)",example:"ほんをよむ — read a book",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ん",ro:"n",meaning:"n (nasal)",example:"パン — bread (ends in ん)",pos:"hiragana",freq:10,register:"neutral",script:"hiragana"},

  // ══════════════════════════════════════════════
  //  KATAKANA — character recognition
  // ══════════════════════════════════════════════
  {kr:"ア",ro:"a",meaning:"a",example:"アイスクリーム — ice cream",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"イ",ro:"i",meaning:"i",example:"インターネット — internet",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ウ",ro:"u",meaning:"u",example:"ウイルス — virus",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"エ",ro:"e",meaning:"e",example:"エレベーター — elevator",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"オ",ro:"o",meaning:"o",example:"オレンジ — orange",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"カ",ro:"ka",meaning:"ka",example:"カメラ — camera",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"キ",ro:"ki",meaning:"ki",example:"キッチン — kitchen",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ク",ro:"ku",meaning:"ku",example:"クラス — class",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ケ",ro:"ke",meaning:"ke",example:"ケーキ — cake",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"コ",ro:"ko",meaning:"ko",example:"コーヒー — coffee",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"サ",ro:"sa",meaning:"sa",example:"サッカー — soccer",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"シ",ro:"shi",meaning:"shi",example:"シャワー — shower",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ス",ro:"su",meaning:"su",example:"スポーツ — sports",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"セ",ro:"se",meaning:"se",example:"セーター — sweater",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ソ",ro:"so",meaning:"so",example:"ソファ — sofa",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"タ",ro:"ta",meaning:"ta",example:"タクシー — taxi",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"チ",ro:"chi",meaning:"chi",example:"チケット — ticket",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ツ",ro:"tsu",meaning:"tsu",example:"ツアー — tour",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"テ",ro:"te",meaning:"te",example:"テレビ — television",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ト",ro:"to",meaning:"to",example:"トイレ — toilet/bathroom",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ナ",ro:"na",meaning:"na",example:"ナイフ — knife",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ニ",ro:"ni",meaning:"ni",example:"ニュース — news",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ヌ",ro:"nu",meaning:"nu",example:"ヌードル — noodle",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ネ",ro:"ne",meaning:"ne",example:"ネクタイ — necktie",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ノ",ro:"no",meaning:"no",example:"ノート — notebook",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ハ",ro:"ha",meaning:"ha",example:"ハンバーガー — hamburger",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ヒ",ro:"hi",meaning:"hi",example:"ヒーター — heater",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"フ",ro:"fu",meaning:"fu",example:"フランス — France",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ヘ",ro:"he",meaning:"he",example:"ヘルメット — helmet",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ホ",ro:"ho",meaning:"ho",example:"ホテル — hotel",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"マ",ro:"ma",meaning:"ma",example:"マスク — mask",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ミ",ro:"mi",meaning:"mi",example:"ミルク — milk",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ム",ro:"mu",meaning:"mu",example:"ムービー — movie",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"メ",ro:"me",meaning:"me",example:"メニュー — menu",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"モ",ro:"mo",meaning:"mo",example:"モデル — model",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ヤ",ro:"ya",meaning:"ya",example:"ヤード — yard",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ユ",ro:"yu",meaning:"yu",example:"ユニフォーム — uniform",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ヨ",ro:"yo",meaning:"yo",example:"ヨーロッパ — Europe",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ラ",ro:"ra",meaning:"ra",example:"ラジオ — radio",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"リ",ro:"ri",meaning:"ri",example:"リモコン — remote control",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ル",ro:"ru",meaning:"ru",example:"ルール — rule",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"レ",ro:"re",meaning:"re",example:"レストラン — restaurant",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ロ",ro:"ro",meaning:"ro",example:"ロボット — robot",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ワ",ro:"wa",meaning:"wa",example:"ワイン — wine",pos:"katakana",freq:10,register:"neutral",script:"katakana"},
  {kr:"ヲ",ro:"wo",meaning:"wo",example:"(rare in katakana)",pos:"katakana",freq:8,register:"neutral",script:"katakana"},
  {kr:"ン",ro:"n",meaning:"n (nasal)",example:"パン — bread",pos:"katakana",freq:10,register:"neutral",script:"katakana"},

  // ══════════════════════════════════════════════
  //  VOCABULARY — expressions & greetings
  // ══════════════════════════════════════════════
  {kr:"こんにちは",ro:"konnichiwa",meaning:"hello / good afternoon",example:"こんにちは！ — Hello!",pos:"expression",freq:10,register:"formal",script:"hiragana",sit:["meeting","airport"]},
  {kr:"おはようございます",ro:"ohayou gozaimasu",meaning:"good morning (formal)",example:"おはようございます — Good morning",pos:"expression",freq:10,register:"formal",script:"hiragana",sit:["meeting"]},
  {kr:"おはよう",ro:"ohayou",meaning:"good morning (casual)",example:"おはよう！ — Morning!",pos:"expression",freq:9,register:"casual",script:"hiragana",sit:["meeting"]},
  {kr:"こんばんは",ro:"konbanwa",meaning:"good evening",example:"こんばんは — Good evening",pos:"expression",freq:9,register:"formal",script:"hiragana",sit:["meeting","restaurant"]},
  {kr:"さようなら",ro:"sayounara",meaning:"goodbye (formal/permanent)",example:"さようなら — Goodbye",pos:"expression",freq:9,register:"formal",script:"hiragana",sit:["meeting"]},
  {kr:"じゃあね",ro:"jaa ne",meaning:"see you / bye (casual)",example:"じゃあね！ — See ya!",pos:"expression",freq:9,register:"casual",script:"hiragana",sit:["meeting"]},
  {kr:"ありがとうございます",ro:"arigatou gozaimasu",meaning:"thank you (formal)",example:"ありがとうございます — Thank you very much",pos:"expression",freq:10,register:"formal",script:"hiragana",sit:["meeting","food","shopping","restaurant","airport"]},
  {kr:"ありがとう",ro:"arigatou",meaning:"thank you (casual)",example:"ありがとう！ — Thanks!",pos:"expression",freq:10,register:"casual",script:"hiragana",sit:["meeting","food","shopping"]},
  {kr:"すみません",ro:"sumimasen",meaning:"excuse me / I'm sorry",example:"すみません、どこですか？ — Excuse me, where is it?",pos:"expression",freq:10,register:"formal",script:"hiragana",sit:["meeting","airport","getting_around","shopping","restaurant"]},
  {kr:"ごめんなさい",ro:"gomen nasai",meaning:"I'm sorry (sincere apology)",example:"ごめんなさい — I'm so sorry",pos:"expression",freq:9,register:"neutral",script:"hiragana",sit:["meeting"]},
  {kr:"はい",ro:"hai",meaning:"yes",example:"はい、そうです — Yes, that's right",pos:"expression",freq:10,register:"neutral",script:"hiragana"},
  {kr:"いいえ",ro:"iie",meaning:"no",example:"いいえ、ちがいます — No, that's wrong",pos:"expression",freq:10,register:"neutral",script:"hiragana"},
  {kr:"そうです",ro:"sou desu",meaning:"that's right / yes it is",example:"そうです！ — That's right!",pos:"expression",freq:9,register:"formal",script:"hiragana"},
  {kr:"わかりました",ro:"wakarimashita",meaning:"I understand / got it",example:"わかりました — Understood",pos:"expression",freq:9,register:"formal",script:"hiragana",sit:["meeting","airport"]},
  {kr:"わかりません",ro:"wakarimasen",meaning:"I don't understand",example:"すみません、わかりません — Sorry, I don't understand",pos:"expression",freq:9,register:"formal",script:"hiragana",sit:["meeting","airport","getting_around"]},
  {kr:"いただきます",ro:"itadakimasu",meaning:"let's eat (said before meals)",example:"いただきます！ — Let's eat!",pos:"expression",freq:9,register:"neutral",script:"hiragana",sit:["food","restaurant"]},
  {kr:"ごちそうさまでした",ro:"gochisousama deshita",meaning:"thank you for the meal",example:"ごちそうさまでした — That was delicious",pos:"expression",freq:8,register:"neutral",script:"hiragana",sit:["food","restaurant"]},
  {kr:"おねがいします",ro:"onegai shimasu",meaning:"please (request)",example:"みずをおねがいします — Water please",pos:"expression",freq:10,register:"formal",script:"hiragana",sit:["food","restaurant","shopping","airport"]},
  {kr:"大丈夫です",ro:"daijoubu desu",meaning:"it's okay / I'm fine",example:"大丈夫です — I'm okay",pos:"expression",freq:9,register:"neutral",script:"kanji",sit:["meeting","emergency"]},
  {kr:"よろしくおねがいします",ro:"yoroshiku onegai shimasu",meaning:"nice to meet you / please treat me well",example:"よろしくおねがいします — Nice to meet you",pos:"expression",freq:10,register:"formal",script:"hiragana",sit:["meeting"]},

  // ══════════════════════════════════════════════
  //  VOCABULARY — pronouns & particles
  // ══════════════════════════════════════════════
  {kr:"わたし",ro:"watashi",meaning:"I / me (neutral)",example:"わたしはがくせいです — I am a student",pos:"pronoun",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ぼく",ro:"boku",meaning:"I / me (male, casual)",example:"ぼくはたなかです — I am Tanaka",pos:"pronoun",freq:9,register:"casual",script:"hiragana"},
  {kr:"あなた",ro:"anata",meaning:"you (avoid in conversation — use name instead)",example:"あなたのなまえは？— What is your name?",pos:"pronoun",freq:7,register:"neutral",script:"hiragana"},
  {kr:"かれ",ro:"kare",meaning:"he / him / boyfriend",example:"かれはやさしい — He is kind",pos:"pronoun",freq:8,register:"neutral",script:"hiragana"},
  {kr:"かのじょ",ro:"kanojo",meaning:"she / her / girlfriend",example:"かのじょはかわいい — She is cute",pos:"pronoun",freq:8,register:"neutral",script:"hiragana"},
  {kr:"みんな",ro:"minna",meaning:"everyone / all",example:"みんなでいこう — Let's all go together",pos:"pronoun",freq:9,register:"casual",script:"hiragana"},
  {kr:"は",ro:"wa",meaning:"topic marker particle",example:"わたしはがくせいです — I (topic) am a student",pos:"particle",freq:10,register:"neutral",script:"hiragana"},
  {kr:"が",ro:"ga",meaning:"subject marker particle",example:"ねこがいます — There is a cat",pos:"particle",freq:10,register:"neutral",script:"hiragana"},
  {kr:"を",ro:"wo/o",meaning:"object marker particle",example:"ほんをよみます — I read a book",pos:"particle",freq:10,register:"neutral",script:"hiragana"},
  {kr:"に",ro:"ni",meaning:"to / at / for (direction/time)",example:"がっこうにいく — go to school",pos:"particle",freq:10,register:"neutral",script:"hiragana"},
  {kr:"で",ro:"de",meaning:"at / by / with (location of action / means)",example:"バスでいく — go by bus",pos:"particle",freq:10,register:"neutral",script:"hiragana"},
  {kr:"の",ro:"no",meaning:"possessive / connecting particle",example:"わたしのほん — my book",pos:"particle",freq:10,register:"neutral",script:"hiragana"},
  {kr:"も",ro:"mo",meaning:"also / too",example:"わたしもすきです — I like it too",pos:"particle",freq:10,register:"neutral",script:"hiragana"},
  {kr:"か",ro:"ka",meaning:"question marker (turns sentence into question)",example:"これはほんですか？— Is this a book?",pos:"particle",freq:10,register:"neutral",script:"hiragana"},

  // ══════════════════════════════════════════════
  //  VOCABULARY — nouns
  // ══════════════════════════════════════════════
  {kr:"なまえ",ro:"namae",meaning:"name",example:"なまえはなんですか？— What is your name?",pos:"noun",freq:9,register:"neutral",script:"hiragana",sit:["meeting"]},
  {kr:"ひと",ro:"hito",meaning:"person / people",example:"あのひとはだれですか？— Who is that person?",pos:"noun",freq:10,register:"neutral",script:"hiragana"},
  {kr:"とも/ともだち",ro:"tomodachi",meaning:"friend",example:"ともだちとあそぶ — play with a friend",pos:"noun",freq:10,register:"neutral",script:"hiragana",sit:["meeting","dating"]},
  {kr:"せんせい",ro:"sensei",meaning:"teacher",example:"せんせいにきく — ask the teacher",pos:"noun",freq:9,register:"formal",script:"hiragana"},
  {kr:"がくせい",ro:"gakusei",meaning:"student",example:"わたしはがくせいです — I am a student",pos:"noun",freq:9,register:"neutral",script:"hiragana"},
  {kr:"みず",ro:"mizu",meaning:"water",example:"みずをください — water please",pos:"noun",freq:10,register:"neutral",script:"hiragana",sit:["food","restaurant"]},
  {kr:"ごはん",ro:"gohan",meaning:"rice / meal",example:"ごはんをたべる — eat a meal",pos:"noun",freq:10,register:"neutral",script:"hiragana",sit:["food","restaurant"]},
  {kr:"おかね",ro:"okane",meaning:"money",example:"おかねがありません — I don't have money",pos:"noun",freq:9,register:"neutral",script:"hiragana",sit:["shopping"]},
  {kr:"じかん",ro:"jikan",meaning:"time",example:"じかんがありません — I don't have time",pos:"noun",freq:10,register:"neutral",script:"hiragana",sit:["airport","getting_around"]},
  {kr:"まち",ro:"machi",meaning:"town / city",example:"このまちがすき — I like this town",pos:"noun",freq:8,register:"neutral",script:"hiragana",sit:["getting_around"]},
  {kr:"えき",ro:"eki",meaning:"train station",example:"えきはどこですか？— Where is the station?",pos:"noun",freq:9,register:"neutral",script:"hiragana",sit:["airport","getting_around"]},
  {kr:"でんしゃ",ro:"densha",meaning:"train",example:"でんしゃにのる — ride the train",pos:"noun",freq:9,register:"neutral",script:"hiragana",sit:["getting_around"]},
  {kr:"バス",ro:"basu",meaning:"bus",example:"バスをまつ — wait for the bus",pos:"noun",freq:8,register:"neutral",script:"katakana",sit:["getting_around"]},
  {kr:"タクシー",ro:"takushii",meaning:"taxi",example:"タクシーをよぶ — call a taxi",pos:"noun",freq:8,register:"neutral",script:"katakana",sit:["getting_around"]},
  {kr:"くうこう",ro:"kuukou",meaning:"airport",example:"くうこうにいく — go to the airport",pos:"noun",freq:8,register:"neutral",script:"hiragana",sit:["airport"]},
  {kr:"ホテル",ro:"hoteru",meaning:"hotel",example:"ホテルはどこですか？— Where is the hotel?",pos:"noun",freq:8,register:"neutral",script:"katakana",sit:["airport","getting_around"]},
  {kr:"レストラン",ro:"resutoran",meaning:"restaurant",example:"レストランにいく — go to a restaurant",pos:"noun",freq:9,register:"neutral",script:"katakana",sit:["food","restaurant"]},
  {kr:"トイレ",ro:"toire",meaning:"toilet / bathroom",example:"トイレはどこですか？— Where is the bathroom?",pos:"noun",freq:10,register:"neutral",script:"katakana",sit:["airport","getting_around","restaurant"]},
  {kr:"びょういん",ro:"byouin",meaning:"hospital",example:"びょういんにいく — go to the hospital",pos:"noun",freq:7,register:"neutral",script:"hiragana",sit:["emergency"]},
  {kr:"けいさつ",ro:"keisatsu",meaning:"police",example:"けいさつをよぶ — call the police",pos:"noun",freq:6,register:"neutral",script:"hiragana",sit:["emergency"]},
  {kr:"にほん",ro:"nihon",meaning:"Japan",example:"にほんにいきたい — I want to go to Japan",pos:"noun",freq:9,register:"neutral",script:"hiragana"},
  {kr:"にほんご",ro:"nihongo",meaning:"Japanese language",example:"にほんごをべんきょうする — study Japanese",pos:"noun",freq:9,register:"neutral",script:"hiragana"},
  {kr:"コーヒー",ro:"koohii",meaning:"coffee",example:"コーヒーをください — coffee please",pos:"noun",freq:9,register:"neutral",script:"katakana",sit:["food","restaurant"]},
  {kr:"ビール",ro:"biiru",meaning:"beer",example:"ビールをください — beer please",pos:"noun",freq:8,register:"neutral",script:"katakana",sit:["food","restaurant"]},
  {kr:"すし",ro:"sushi",meaning:"sushi",example:"すしがたべたい — I want to eat sushi",pos:"noun",freq:9,register:"neutral",script:"hiragana",sit:["food","restaurant"]},
  {kr:"ラーメン",ro:"raamen",meaning:"ramen",example:"ラーメンをたのむ — order ramen",pos:"noun",freq:9,register:"neutral",script:"katakana",sit:["food","restaurant"]},

  // ══════════════════════════════════════════════
  //  VOCABULARY — adjectives
  // ══════════════════════════════════════════════
  {kr:"おおきい",ro:"ookii",meaning:"big / large",example:"おおきいいぬ — a big dog",pos:"adjective",freq:10,register:"neutral",script:"hiragana"},
  {kr:"ちいさい",ro:"chiisai",meaning:"small / little",example:"ちいさいねこ — a small cat",pos:"adjective",freq:10,register:"neutral",script:"hiragana"},
  {kr:"たかい",ro:"takai",meaning:"expensive / tall / high",example:"たかいかばん — an expensive bag",pos:"adjective",freq:9,register:"neutral",script:"hiragana",sit:["shopping"]},
  {kr:"やすい",ro:"yasui",meaning:"cheap / inexpensive",example:"やすいです — it's cheap",pos:"adjective",freq:9,register:"neutral",script:"hiragana",sit:["shopping"]},
  {kr:"おいしい",ro:"oishii",meaning:"delicious",example:"おいしい！— Delicious!",pos:"adjective",freq:10,register:"neutral",script:"hiragana",sit:["food","restaurant"]},
  {kr:"かわいい",ro:"kawaii",meaning:"cute / adorable",example:"かわいいねこ — cute cat",pos:"adjective",freq:9,register:"casual",script:"hiragana",sit:["dating","shopping"]},
  {kr:"かっこいい",ro:"kakkoii",meaning:"cool / stylish",example:"かっこいい！ — So cool!",pos:"adjective",freq:8,register:"casual",script:"hiragana",sit:["dating"]},
  {kr:"むずかしい",ro:"muzukashii",meaning:"difficult",example:"にほんごはむずかしい — Japanese is difficult",pos:"adjective",freq:8,register:"neutral",script:"hiragana"},
  {kr:"やさしい",ro:"yasashii",meaning:"easy / kind / gentle",example:"やさしいひと — a kind person",pos:"adjective",freq:8,register:"neutral",script:"hiragana"},
  {kr:"たのしい",ro:"tanoshii",meaning:"fun / enjoyable",example:"たのしい！— Fun!",pos:"adjective",freq:9,register:"casual",script:"hiragana"},
  {kr:"すごい",ro:"sugoi",meaning:"amazing / wow / incredible",example:"すごい！— Wow / Amazing!",pos:"adjective",freq:9,register:"casual",script:"hiragana",sit:["dating","meeting"]},
  {kr:"いい",ro:"ii",meaning:"good / fine / nice",example:"いいですね — That's nice",pos:"adjective",freq:10,register:"neutral",script:"hiragana"},
  {kr:"わるい",ro:"warui",meaning:"bad",example:"わるいひと — a bad person",pos:"adjective",freq:8,register:"neutral",script:"hiragana"},
  {kr:"あたらしい",ro:"atarashii",meaning:"new",example:"あたらしいほん — a new book",pos:"adjective",freq:8,register:"neutral",script:"hiragana"},
  {kr:"ふるい",ro:"furui",meaning:"old (things, not people)",example:"ふるいいえ — an old house",pos:"adjective",freq:7,register:"neutral",script:"hiragana"},

  // ══════════════════════════════════════════════
  //  VOCABULARY — verbs
  // ══════════════════════════════════════════════
  {kr:"います",ro:"imasu",meaning:"to exist / to be (living things)",example:"ねこがいます — There is a cat",pos:"verb",freq:10,register:"formal",script:"hiragana"},
  {kr:"あります",ro:"arimasu",meaning:"to exist / to be (non-living things)",example:"ほんがあります — There is a book",pos:"verb",freq:10,register:"formal",script:"hiragana"},
  {kr:"いきます",ro:"ikimasu",meaning:"to go",example:"がっこうにいきます — I go to school",pos:"verb",freq:10,register:"formal",script:"hiragana",sit:["airport","getting_around"]},
  {kr:"きます",ro:"kimasu",meaning:"to come",example:"きてください — Please come",pos:"verb",freq:10,register:"formal",script:"hiragana"},
  {kr:"たべます",ro:"tabemasu",meaning:"to eat",example:"すしをたべます — I eat sushi",pos:"verb",freq:10,register:"formal",script:"hiragana",sit:["food","restaurant"]},
  {kr:"のみます",ro:"nomimasu",meaning:"to drink",example:"みずをのみます — I drink water",pos:"verb",freq:10,register:"formal",script:"hiragana",sit:["food","restaurant"]},
  {kr:"みます",ro:"mimasu",meaning:"to see / watch",example:"えいがをみます — I watch a movie",pos:"verb",freq:10,register:"formal",script:"hiragana"},
  {kr:"ききます",ro:"kikimasu",meaning:"to listen / hear / ask",example:"おんがくをききます — I listen to music",pos:"verb",freq:9,register:"formal",script:"hiragana"},
  {kr:"はなします",ro:"hanashimasu",meaning:"to speak / talk",example:"にほんごではなします — I speak Japanese",pos:"verb",freq:10,register:"formal",script:"hiragana"},
  {kr:"わかります",ro:"wakarimasu",meaning:"to understand",example:"わかります — I understand",pos:"verb",freq:10,register:"formal",script:"hiragana",sit:["meeting","airport","getting_around"]},
  {kr:"かいます",ro:"kaimasu",meaning:"to buy",example:"これをかいます — I'll buy this",pos:"verb",freq:9,register:"formal",script:"hiragana",sit:["shopping"]},
  {kr:"かえります",ro:"kaerimasu",meaning:"to return / go home",example:"うちにかえります — I'll go home",pos:"verb",freq:9,register:"formal",script:"hiragana"},
  {kr:"ねます",ro:"nemasu",meaning:"to sleep",example:"はやくねます — I'll sleep early",pos:"verb",freq:9,register:"formal",script:"hiragana"},
  {kr:"おきます",ro:"okimasu",meaning:"to wake up / get up",example:"はやくおきます — I wake up early",pos:"verb",freq:8,register:"formal",script:"hiragana"},
  {kr:"べんきょうします",ro:"benkyou shimasu",meaning:"to study",example:"にほんごをべんきょうします — I study Japanese",pos:"verb",freq:9,register:"formal",script:"hiragana"},
  {kr:"すきです",ro:"suki desu",meaning:"to like / to love",example:"にほんごがすきです — I like Japanese",pos:"verb",freq:10,register:"neutral",script:"hiragana",sit:["dating","meeting"]},
  {kr:"すみません",ro:"sumimasen",meaning:"excuse me / sorry (also a verb use)",example:"すみません！— Excuse me!",pos:"verb",freq:10,register:"formal",script:"hiragana",sit:["airport","getting_around","shopping","restaurant"]},

  // ══════════════════════════════════════════════
  //  VOCABULARY — adverbs & useful words
  // ══════════════════════════════════════════════
  {kr:"とても",ro:"totemo",meaning:"very / extremely",example:"とてもおいしい — very delicious",pos:"adverb",freq:10,register:"neutral",script:"hiragana"},
  {kr:"すごく",ro:"sugoku",meaning:"very / really (casual)",example:"すごくかわいい — really cute",pos:"adverb",freq:9,register:"casual",script:"hiragana"},
  {kr:"ちょっと",ro:"chotto",meaning:"a little / just a moment",example:"ちょっとまって — wait a moment",pos:"adverb",freq:10,register:"casual",script:"hiragana",sit:["meeting","getting_around"]},
  {kr:"もう",ro:"mou",meaning:"already / anymore",example:"もうたべました — I already ate",pos:"adverb",freq:9,register:"neutral",script:"hiragana"},
  {kr:"まだ",ro:"mada",meaning:"still / not yet",example:"まだです — not yet",pos:"adverb",freq:9,register:"neutral",script:"hiragana"},
  {kr:"いつも",ro:"itsumo",meaning:"always",example:"いつもありがとう — thank you as always",pos:"adverb",freq:9,register:"neutral",script:"hiragana"},
  {kr:"たぶん",ro:"tabun",meaning:"probably / maybe",example:"たぶんいきます — I'll probably go",pos:"adverb",freq:8,register:"neutral",script:"hiragana"},
  {kr:"どこ",ro:"doko",meaning:"where",example:"どこですか？— Where is it?",pos:"adverb",freq:10,register:"neutral",script:"hiragana",sit:["airport","getting_around"]},
  {kr:"なに/なん",ro:"nani/nan",meaning:"what",example:"なんですか？— What is it?",pos:"adverb",freq:10,register:"neutral",script:"hiragana"},
  {kr:"いつ",ro:"itsu",meaning:"when",example:"いつきますか？— When are you coming?",pos:"adverb",freq:9,register:"neutral",script:"hiragana"},
  {kr:"なぜ/どうして",ro:"naze/doushite",meaning:"why",example:"どうしてですか？— Why?",pos:"adverb",freq:8,register:"neutral",script:"hiragana"},
  {kr:"どうぞ",ro:"douzo",meaning:"please / go ahead / here you go",example:"どうぞ — Please / Go ahead",pos:"adverb",freq:9,register:"formal",script:"hiragana",sit:["meeting","food","shopping"]},
  {kr:"いくら",ro:"ikura",meaning:"how much",example:"いくらですか？— How much is it?",pos:"adverb",freq:9,register:"neutral",script:"hiragana",sit:["shopping","food","restaurant"]},

  // ══════════════════════════════════════════════
  //  KANJI — essential characters
  // ══════════════════════════════════════════════
  {kr:"日",ro:"nichi/hi",meaning:"sun / day / Japan",example:"日本 (nihon) — Japan",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"本",ro:"hon/moto",meaning:"book / origin / Japan",example:"本を読む — read a book",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"人",ro:"jin/hito",meaning:"person / people",example:"日本人 (nihonjin) — Japanese person",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"大",ro:"dai/oo",meaning:"big / large / great",example:"大学 (daigaku) — university",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"小",ro:"shou/chii",meaning:"small / little",example:"小学校 (shougakkou) — elementary school",pos:"kanji",freq:9,register:"neutral",script:"kanji"},
  {kr:"山",ro:"san/yama",meaning:"mountain",example:"富士山 (fujisan) — Mt. Fuji",pos:"kanji",freq:9,register:"neutral",script:"kanji"},
  {kr:"川",ro:"kawa/gawa",meaning:"river",example:"川のそば — by the river",pos:"kanji",freq:8,register:"neutral",script:"kanji"},
  {kr:"水",ro:"sui/mizu",meaning:"water",example:"水をください — water please",pos:"kanji",freq:10,register:"neutral",script:"kanji",sit:["food","restaurant"]},
  {kr:"火",ro:"ka/hi",meaning:"fire",example:"火曜日 (kayoubi) — Tuesday",pos:"kanji",freq:9,register:"neutral",script:"kanji"},
  {kr:"木",ro:"moku/ki",meaning:"tree / wood",example:"木曜日 (mokuyoubi) — Thursday",pos:"kanji",freq:9,register:"neutral",script:"kanji"},
  {kr:"金",ro:"kin/kana",meaning:"gold / money / Friday",example:"お金 (okane) — money",pos:"kanji",freq:10,register:"neutral",script:"kanji",sit:["shopping"]},
  {kr:"土",ro:"do/tsuchi",meaning:"earth / soil / Saturday",example:"土曜日 (doyoubi) — Saturday",pos:"kanji",freq:8,register:"neutral",script:"kanji"},
  {kr:"月",ro:"getsu/tsuki",meaning:"moon / month / Monday",example:"月曜日 (getsuyoubi) — Monday",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"年",ro:"nen/toshi",meaning:"year",example:"今年 (kotoshi) — this year",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"上",ro:"jou/ue",meaning:"up / above / on top",example:"上に — on top",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"下",ro:"ka/shita",meaning:"down / below / under",example:"下に — below",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"中",ro:"chuu/naka",meaning:"middle / inside / China",example:"中に入る — enter inside",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"食",ro:"shoku/ta",meaning:"eat / food",example:"食べる (taberu) — to eat",pos:"kanji",freq:10,register:"neutral",script:"kanji",sit:["food","restaurant"]},
  {kr:"飲",ro:"in/no",meaning:"drink",example:"飲む (nomu) — to drink",pos:"kanji",freq:9,register:"neutral",script:"kanji",sit:["food","restaurant"]},
  {kr:"見",ro:"ken/mi",meaning:"see / look / watch",example:"見る (miru) — to see",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"言",ro:"gen/i",meaning:"say / word / language",example:"言う (iu) — to say",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"行",ro:"kou/i",meaning:"go",example:"行く (iku) — to go",pos:"kanji",freq:10,register:"neutral",script:"kanji",sit:["airport","getting_around"]},
  {kr:"来",ro:"rai/ku",meaning:"come",example:"来る (kuru) — to come",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"好",ro:"kou/su",meaning:"like / fond of",example:"好き (suki) — to like",pos:"kanji",freq:10,register:"neutral",script:"kanji",sit:["dating"]},
  {kr:"友",ro:"yuu/tomo",meaning:"friend",example:"友達 (tomodachi) — friend",pos:"kanji",freq:9,register:"neutral",script:"kanji",sit:["meeting","dating"]},
  {kr:"学",ro:"gaku/mana",meaning:"study / learn",example:"学校 (gakkou) — school",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"語",ro:"go/kata",meaning:"language / word",example:"日本語 (nihongo) — Japanese",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"何",ro:"nani/nan",meaning:"what",example:"何ですか？ — What is it?",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"今",ro:"kon/ima",meaning:"now / present",example:"今日 (kyou) — today",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
  {kr:"私",ro:"watashi",meaning:"I / me",example:"私は学生です — I am a student",pos:"kanji",freq:10,register:"neutral",script:"kanji"},
];

const LANGS = {
  korean: {
    label:'Korean', script:'한국어', flag:'🇰🇷',
    placeholder:'search hangul, romanization, or meaning…',
    words: KOREAN_WORDS,
    sentences: KOREAN_SENTENCES,
    grammar: GRAMMAR.korean,
  },
  italian: {
    label:'Italian', script:'Italiano', flag:'🇮🇹',
    placeholder:'search Italian, pronunciation, or meaning…',
    words: ITALIAN_WORDS,
    sentences: ITALIAN_SENTENCES,
    grammar: GRAMMAR.italian,
  },
  japanese: {
    label:'Japanese', script:'日本語', flag:'🇯🇵',
    placeholder:'search hiragana, romaji, or meaning…',
    words: JAPANESE_WORDS,
    sentences: [],
    grammar: [],
  }
};

const SITUATIONS = [
  {key:'airport',       label:'at the airport',   color:'#7a8cc8'},
  {key:'food',          label:'ordering food',     color:'#c8a87a'},
  {key:'restaurant',    label:'at a restaurant',   color:'#7ac8a0'},
  {key:'shopping',      label:'shopping',          color:'#c87aa8'},
  {key:'meeting',       label:'meeting people',    color:'#7ac8c8'},
  {key:'getting_around',label:'getting around',    color:'#c8c87a'},
  {key:'emergency',     label:'emergencies',       color:'#c87a7a'},
  {key:'dating',        label:'dating & texting',  color:'#a87ac8'},
];
let activeSituation = null;

let curLang = 'korean';
let curTab  = 'vocab';
let theme   = localStorage.getItem('lf-theme') || 'dark';

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('lf-theme', theme);
  document.body.className = theme;
  applyFontSize(fontSize);
  document.getElementById('themeBtn').textContent = theme === 'dark' ? 'light mode' : 'dark mode';
}

function switchLang(lang) {
  curLang = lang;
  localStorage.setItem('lf-lang', lang);
  const L = LANGS[lang];
  document.getElementById('langFlag').textContent   = L.flag;
  document.getElementById('langLabel').textContent  = L.label;
  // logoScript is the tagline, not language-specific
  const srch = document.getElementById('searchInput');
  if (srch) srch.placeholder = L.placeholder;
  document.querySelectorAll('.lang-option').forEach(el => el.classList.toggle('active', el.dataset.lang === lang));
  document.getElementById('langMenu').classList.remove('open');
  openSecs = {};
  activeSituation = null;
  // default to script grouping for Japanese
  if (lang === 'japanese' && curGrouping === 'pos') { curGrouping = 'script'; save('lf-grouping','script'); }
  if (lang !== 'japanese' && curGrouping === 'script') { curGrouping = 'pos'; save('lf-grouping','pos'); }
  renderTab(curTab);
}

function toggleLangMenu() {
  const menu = document.getElementById('langMenu');
  const btn  = document.getElementById('langBtn');
  const open = menu.classList.contains('open');
  if (open) {
    menu.classList.remove('open');
    return;
  }
  const r = btn.getBoundingClientRect();
  menu.style.top  = (r.bottom + 6) + 'px';
  menu.style.right = (window.innerWidth - r.right) + 'px';
  menu.classList.add('open');
}
document.addEventListener('click', e => {
  const btn  = document.getElementById('langBtn');
  const menu = document.getElementById('langMenu');
  if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) menu.classList.remove('open');
});

function switchTab(tab) {
  curTab = tab;
  localStorage.setItem('lf-tab', tab);
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
    b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false');
  });
  renderTab(tab);
}

function renderTab(tab) {
  const main = document.getElementById('mainContent');
  if (!main) return;
  main.innerHTML = '';
  if (tab === 'vocab')    renderVocab(main);
  if (tab === 'practice') renderPractice(main);
  if (tab === 'grammar')  renderGrammar(main);
}

function speak(text, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'korean' ? 'ko-KR' : lang === 'japanese' ? 'ja-JP' : 'it-IT';
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// ═══════════════════════════════════════════════════════════════
// VOCABULARY TAB
// ═══════════════════════════════════════════════════════════════
// ── VOCABULARY TAB ────────────────────────────────────────────────────────────

// Deck state — initialized in vocabInit() after all scripts load
let decks        = [];
let activeDeckIdx = -1;

// deck state initialized in boot()

let openSecs = {};

const POS_ORDER = ['expression','verb','adjective','noun','adverb','pronoun','particle','hiragana','katakana','kanji'];
const PALETTE   = ['#c8a87a','#7ac8a0','#7a8cc8','#c87aa8','#7ac8c8','#c8c87a','#c87a7a','#a87ac8'];

const GROUPINGS = {
  script: {
    label:'by script',
    key: w => w.script || w.pos,
    order: () => ['hiragana','katakana','kanji','expression','verb','adjective','noun','adverb','pronoun','particle'],
    color: k => ({hiragana:'#7ac8a0',katakana:'#7a8cc8',kanji:'#c87aa8',verb:'#7a8cc8',noun:'#7ac8a0',adjective:'#c87aa8',adverb:'#c8a87a',expression:'#c87a7a',pronoun:'#7ac8c8',particle:'#c8c87a'}[k]||'#888')
  },
  pos: {
    label:'part of speech',
    key: w => w.pos,
    order: () => POS_ORDER,
    color: k => ({verb:'#7a8cc8',noun:'#7ac8a0',adjective:'#c87aa8',adverb:'#c8a87a',expression:'#c87a7a',pronoun:'#7ac8c8',particle:'#c8c87a',hiragana:'#7ac8a0',katakana:'#7a8cc8',kanji:'#c87aa8'}[k]||'#888')
  },
  register: {
    label:'formality',
    key: w => w.register || 'neutral',
    order: () => ['formal','neutral','casual'],
    color: k => ({formal:'#7a8cc8',neutral:'#7ac8a0',casual:'#c8a87a'}[k]||'#888')
  },
  most_common: {
    label:'most common first',
    key: w => w.freq>=10?'essential':w.freq>=8?'very common':w.freq>=6?'common':w.freq>=4?'uncommon':'rare',
    order: () => ['essential','very common','common','uncommon','rare'],
    color: () => '#7ac8a0'
  },
  least_common: {
    label:'least common first',
    key: w => w.freq>=10?'essential':w.freq>=8?'very common':w.freq>=6?'common':w.freq>=4?'uncommon':'rare',
    order: () => ['rare','uncommon','common','very common','essential'],
    color: () => '#c87a7a'
  },
  shortest: {
    label:'shortest first',
    key: w => { const l=w.kr.length; return l<=1?'1 char':l<=2?'2 chars':l<=3?'3 chars':l<=4?'4 chars':'5+ chars'; },
    order: () => ['1 char','2 chars','3 chars','4 chars','5+ chars'],
    color: () => '#7ac8c8'
  },
  longest: {
    label:'longest first',
    key: w => { const l=w.kr.length; return l<=1?'1 char':l<=2?'2 chars':l<=3?'3 chars':l<=4?'4 chars':'5+ chars'; },
    order: () => ['5+ chars','4 chars','3 chars','2 chars','1 char'],
    color: () => '#c87aa8'
  },
  a_z: {
    label:'a → z',
    key: w => w.ro[0].toUpperCase(),
    order: keys => keys.slice().sort(),
    color: () => '#7a8cc8'
  },
  in_deck: {
    label:'in my deck',
    key: w => deckColorFor(w.kr) ? 'in a deck' : 'not in deck',
    order: () => ['in a deck','not in deck'],
    color: k => k==='in a deck' ? '#c8a87a' : '#888'
  }
};

let curGrouping = 'pos';

// Deck helpers
function deckColorFor(kr) {
  // returns first color (for backward compat single-color uses)
  for (let i=0;i<decks.length;i++) { if (decks[i].words[kr]) return decks[i].color; }
  return null;
}
function deckColorsFor(kr) {
  // returns all colors for a word across all decks
  return decks.filter(d => d.words[kr]).map(d => d.color);
}
function deckIdxFor(kr) {
  for (let i=0;i<decks.length;i++) { if (decks[i].words[kr]) return i; }
  return -1;
}
function nextDeckColor() {
  const used = decks.map(d=>d.color);
  for (let c of PALETTE) { if (!used.includes(c)) return c; }
  return PALETTE[decks.length % PALETTE.length];
}
function addDeck(name) {
  decks.push({name, color:nextDeckColor(), words:{}});
  activeDeckIdx = decks.length - 1;
  saveDeckState();
}
function deleteDeck(idx) {
  decks.splice(idx,1);
  if (activeDeckIdx >= decks.length) activeDeckIdx = decks.length - 1;
  saveDeckState();
}
function saveDeckState() {
  save('lf-decks', decks);
  save('lf-activeDeck', activeDeckIdx);
}

// ── RENDER VOCAB TAB ──────────────────────────────────────────────────────────
function renderVocab(container) {
  const words = LANGS[curLang].words;

  container.innerHTML = `
    <div class="ctrl">
      <div class="sit-row" id="sitRow"></div>
      <div class="ctrl-row filters-row" id="filtersRow" style="display:none">
        <input id="searchInput" type="text" placeholder="${LANGS[curLang].placeholder}" />
        <div id="groupBar"></div>
        <button class="ubtn" onclick="vocabExpandAll()">expand all</button>
        <button class="ubtn" onclick="vocabCollapseAll()">collapse all</button>
      </div>
      <div class="ctrl-row" style="margin-top:4px">
        <button class="ubtn filters-toggle" id="filtersToggle" onclick="toggleFilters()">more filters ▾</button>
        <input id="searchInput2" type="text" placeholder="${LANGS[curLang].placeholder}" style="flex:1;min-width:0;width:0" />
      </div>
    </div>
    <div id="wordSections"></div>
    <div id="deckPanel" class="deck-panel surface">
      <div class="deck-hdr">
        <span class="deck-title">your deck</span>
        <div class="deck-acts">
          <button class="abtn danger" onclick="clearActiveDeck()">remove all</button>
          <button class="abtn accent" onclick="openStudy()">study deck →</button>
        </div>
      </div>
      <div id="deckSwitcher" class="deck-switcher"></div>
      <div id="deckChips"></div>
    </div>
  `;

  document.getElementById('searchInput2').oninput = renderWordGrid;
  buildSitPills();
  buildGroupBtns();
  renderWordGrid();
  renderDeckSwitcher();
  renderDeckChips();
}

function buildSitPills() {
  const row = document.getElementById('sitRow');
  if (!row) return;
  row.innerHTML = '';

  // "all situations" pill
  const allBtn = document.createElement('button');
  allBtn.className = 'sit-pill' + (activeSituation === 'all' ? ' sit-active' : '');
  allBtn.textContent = 'all situations';
  allBtn.style.setProperty('--sc', '#c8a87a');
  allBtn.onclick = () => {
    activeSituation = activeSituation === 'all' ? null : 'all';
    openSecs = {};
    buildSitPills();
    renderWordGrid();
  };
  row.appendChild(allBtn);

  SITUATIONS.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'sit-pill' + (activeSituation === s.key ? ' sit-active' : '');
    btn.textContent = s.label;
    btn.style.setProperty('--sc', s.color);
    btn.onclick = () => {
      activeSituation = activeSituation === s.key ? null : s.key;
      openSecs = {};
      buildSitPills();
      renderWordGrid();
    };
    row.appendChild(btn);
  });

  // "add all to deck" button — only shown when a situation is active
  if (activeSituation) {
    const words = LANGS[curLang].words;
    const sitWords = activeSituation === 'all'
      ? words.filter(w => w.sit && w.sit.length > 0)
      : words.filter(w => w.sit && w.sit.includes(activeSituation));

    const addAll = document.createElement('button');
    addAll.className = 'sit-add-all';
    addAll.textContent = 'add all to deck →';
    addAll.onclick = () => {
      if (activeDeckIdx < 0 || activeDeckIdx >= decks.length) {
        // no deck selected — open bottom sheet to create one, then add all
        const name = prompt('Name your new deck (all ' + sitWords.length + ' words will be added):','');
        if (!name || !name.trim()) return;
        addDeck(name.trim());
        sitWords.forEach(w => decks[decks.length-1].words[w.kr] = true);
        saveDeckState(); buildSitPills(); renderDeckSwitcher(); renderDeckChips(); renderWordGrid();
        return;
      }
      const deck = decks[activeDeckIdx];
      sitWords.forEach(w => deck.words[w.kr] = true);
      saveDeckState(); buildSitPills(); renderDeckSwitcher(); renderDeckChips(); renderWordGrid();
    };
    row.appendChild(addAll);
  }
}

function toggleFilters() {
  const row = document.getElementById('filtersRow');
  const btn = document.getElementById('filtersToggle');
  const open = row.style.display === 'flex';
  row.style.display = open ? 'none' : 'flex';
  btn.textContent = open ? 'more filters ▾' : 'hide filters ▴';
}

function buildGroupBtns() {
  const bar = document.getElementById('groupBar');
  if (!bar) return;
  bar.innerHTML = '';
  Object.entries(GROUPINGS).forEach(([key, cfg]) => {
    const btn = document.createElement('button');
    btn.className = 'gbtn' + (key === curGrouping ? ' on' : '');
    btn.textContent = cfg.label;
    btn.onclick = () => { curGrouping = key; save('lf-grouping', key); openSecs = {}; buildGroupBtns(); renderWordGrid(); };
    bar.appendChild(btn);
  });
}

function renderWordGrid() {
  const container = document.getElementById('wordSections');
  if (!container) return;

  const rawSearch = document.getElementById('searchInput2') || document.getElementById('searchInput');
  const search = (rawSearch?.value || '').toLowerCase().trim();
  const cfg = GROUPINGS[curGrouping];
  const words = LANGS[curLang].words;

  let filtered = words.filter(w => {
    if (activeSituation === 'all' && !(w.sit && w.sit.length > 0)) return false;
    if (activeSituation && activeSituation !== 'all' && !(w.sit && w.sit.includes(activeSituation))) return false;
    if (search && !w.kr.includes(search) && !w.ro.toLowerCase().includes(search) && !w.meaning.toLowerCase().includes(search)) return false;
    return true;
  });

  let groups = {}, allKeys, ordered;

  if (activeSituation) {
    // When a situation is active, group by priority tier and auto-open all
    const tierKey = w => w.freq >= 9 ? 'say this first' : w.freq >= 7 ? 'essential' : 'good to know';
    const tierOrder = ['say this first', 'essential', 'good to know'];
    const tierColors = {'say this first':'#7ac8a0','essential':'#c8a87a','good to know':'#888894'};
    filtered.sort((a,b) => b.freq - a.freq);
    filtered.forEach(w => { const k = tierKey(w); if (!groups[k]) groups[k]=[]; groups[k].push(w); });
    allKeys = tierOrder;
    ordered = tierOrder.filter(k => groups[k]?.length > 0);
    ordered.forEach(k => openSecs[k] = true);
    // override color for section rendering
    window._sitTierColors = tierColors;
  } else {
    window._sitTierColors = null;
    filtered.forEach(w => { const k = cfg.key(w); if (!groups[k]) groups[k]=[]; groups[k].push(w); });
    allKeys = Object.keys(groups);
    ordered = cfg.order(allKeys).filter(k => groups[k]?.length > 0);
    if (search) ordered.forEach(k => openSecs[k] = true);
  }

  container.innerHTML = '';
  if (ordered.length === 0) { container.innerHTML = '<div class="empty-msg">no words match</div>'; return; }

  ordered.forEach(key => {
    const wds = groups[key];
    const isOpen = !!openSecs[key];
    const color = (window._sitTierColors && window._sitTierColors[key]) ? window._sitTierColors[key] : cfg.color(key);
    const selCount = wds.filter(w => deckColorFor(w.kr)).length;

    const sec = document.createElement('div'); sec.className = 'sec';
    const hdr = document.createElement('div'); hdr.className = 'sec-hdr';

    const left = document.createElement('div'); left.className = 'sec-left';
    const nm = document.createElement('span'); nm.className = 'sec-name'; nm.style.color = color; nm.textContent = key;
    const ct = document.createElement('span'); ct.className = 'sec-count'; ct.textContent = wds.length;
    left.appendChild(nm); left.appendChild(ct);
    if (selCount) { const sl = document.createElement('span'); sl.className = 'sec-sel'; sl.textContent = selCount+' in deck'; left.appendChild(sl); }

    const chev = document.createElement('span'); chev.className = 'sec-chev'; chev.textContent = isOpen ? '▴' : '▾';
    hdr.appendChild(left); hdr.appendChild(chev);

    const body = document.createElement('div'); body.className = 'sec-body'; body.style.display = isOpen ? 'flex' : 'none';

    wds.forEach((w, i) => {
      const chip = document.createElement('div');
      chip.className = 'chip' + (deckColorsFor(w.kr).length > 0 ? ' on' : '');
      const chipColors = deckColorsFor(w.kr);
      const chipColor  = chipColors[0] || null;
      chip.style.animationDelay = Math.min(i * 0.008, 0.2) + 's';
      chip.title = w.meaning + ' — ' + w.example;
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-label', w.kr + ', ' + w.ro + ', ' + w.meaning);
      chip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBs(w); } });

      if (chipColors.length > 1) {
        chip.style.border = '2px solid transparent';
        chip.style.backgroundImage = 'linear-gradient(' + chip.style.background + ',var(--sf)),linear-gradient(135deg,' + chipColors.join(',') + ')';
        chip.style.backgroundOrigin = 'border-box';
        chip.style.backgroundClip = 'padding-box,border-box';
      } else if (chipColor) {
        chip.style.borderColor = chipColor;
      }

      const regColor = {formal:'#7a8cc8',casual:'#c8a87a',neutral:'transparent'}[w.register||'neutral'];
      const dotsHtml = chipColors.map(c =>
        '<span style="width:6px;height:6px;border-radius:50%;background:' + c + ';flex-shrink:0;display:inline-block"></span>'
      ).join('');

      chip.innerHTML =
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:4px">' +
          '<span class="chip-kr"' + (chipColor ? ' style="color:' + chipColor + '"' : '') + '>' + w.kr + '</span>' +
          '<div style="display:flex;align-items:center;gap:3px">' +
            (chipColors.length > 1 ? dotsHtml : '') +
            (w.register && w.register !== 'neutral' ? '<span class="reg-badge" style="background:' + regColor + '20;color:' + regColor + ';border-color:' + regColor + '40">' + w.register + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<span class="chip-ro">' + w.ro + '</span>';
            chip.onclick = () => openBs(w);
      chip.oncontextmenu = e => { e.preventDefault(); openBs(w); };

      body.appendChild(chip);
    });

    const toggle = () => {
      const open = sec.classList.toggle('open');
      body.style.display = open ? 'flex' : 'none';
      chev.textContent = open ? '▴' : '▾';
      if (open) openSecs[key] = true; else delete openSecs[key];
    };
    hdr.onclick = toggle;
    if (isOpen) sec.classList.add('open');

    sec.appendChild(hdr); sec.appendChild(body);
    container.appendChild(sec);
  });
}

function vocabExpandAll() {
  const words = LANGS[curLang].words;
  words.forEach(w => openSecs[GROUPINGS[curGrouping].key(w)] = true);
  renderWordGrid();
}
function vocabCollapseAll() { openSecs = {}; renderWordGrid(); }

// Deck operations
function toggleWordInDeck(w) {
  if (activeDeckIdx < 0 || activeDeckIdx >= decks.length) {
    // flash hint
    const panel = document.getElementById('deckPanel');
    if (panel) { panel.style.outline = '2px solid var(--acc)'; setTimeout(()=>panel.style.outline='',800); }
    return;
  }
  const d = decks[activeDeckIdx].words;
  if (d[w.kr]) delete d[w.kr]; else d[w.kr] = true;
  saveDeckState();
  renderDeckChips();
  renderWordGrid();
}



function renderDeckSwitcher() {
  const sw = document.getElementById('deckSwitcher');
  if (!sw) return;
  sw.innerHTML = '';

  if (decks.length === 0) {
    sw.innerHTML = '<span class="empty-deck">right-click any word to create your first deck</span>';
  } else {
    decks.forEach((deck, i) => {
      const btn = document.createElement('button');
      btn.className = 'dbtn' + (i === activeDeckIdx ? ' dactive' : '');
      btn.style.setProperty('--dc', deck.color);

      const dot = document.createElement('span'); dot.className = 'ddot'; dot.style.background = deck.color;
      const lbl = document.createElement('span'); lbl.textContent = deck.name;
      const ct  = document.createElement('span'); ct.className = 'dct';
      const wc  = Object.keys(deck.words).length;
      if (wc > 0) ct.textContent = wc;

      btn.appendChild(dot); btn.appendChild(lbl); btn.appendChild(ct);
      btn.onclick = () => { activeDeckIdx = i === activeDeckIdx ? -1 : i; saveDeckState(); renderDeckSwitcher(); renderDeckChips(); renderWordGrid(); };
      btn.oncontextmenu = e => showDeckCtxMenu(e, i);
      btn.title = 'tap to select · right-click to rename or delete';
      sw.appendChild(btn);
    });
  }

  // + new deck button
  const add = document.createElement('button');
  add.className = 'dbtn'; add.style.cssText='--dc:#7ac8a0;color:#7ac8a0;border-color:rgba(122,200,160,.3)';
  add.textContent = '+ new deck';
  add.onclick = () => { const n = prompt('Name your new deck:',''); if (n?.trim()) { addDeck(n.trim()); renderDeckSwitcher(); renderDeckChips(); renderWordGrid(); }};
  sw.appendChild(add);

  // update badge
  const badge = document.getElementById('deckBadge');
  if (badge) badge.textContent = activeDeckIdx >= 0 ? Object.keys(decks[activeDeckIdx]?.words||{}).length : '0';
}

function renderDeckChips() {
  const c = document.getElementById('deckChips');
  if (!c) return;
  const badge = document.getElementById('deckBadge');

  if (activeDeckIdx < 0 || activeDeckIdx >= decks.length) {
  
    c.innerHTML = '<span class="empty-deck">select or create a deck, then click words to add them</span>';
    return;
  }
  const deck = decks[activeDeckIdx];
  const keys = Object.keys(deck.words);


  if (keys.length === 0) {
    c.innerHTML = `<span class="empty-deck">left-click words to add to <strong style="color:${deck.color}">${deck.name}</strong></span>`;
    return;
  }
  c.innerHTML = '';
  keys.forEach(kr => {
    const w = LANGS[curLang].words.find(x => x.kr === kr) || {kr, ro:'', meaning:''};
    const chip = document.createElement('div'); chip.className = 'dchip';
    chip.style.cssText = `border-color:${deck.color};color:${deck.color}`;
    chip.innerHTML = `${w.kr} <span class="dchip-ro">${w.ro}</span><button class="dchip-x">×</button>`;
    chip.querySelector('button').onclick = () => { delete deck.words[kr]; saveDeckState(); renderDeckChips(); renderWordGrid(); };
    c.appendChild(chip);
  });
}

function clearActiveDeck() {
  if (activeDeckIdx < 0) return;
  decks[activeDeckIdx].words = {};
  saveDeckState(); renderDeckChips(); renderWordGrid();
}

// Context menus
let ctxMenu = null;
function removeCtxMenu() { if (ctxMenu) { ctxMenu.remove(); ctxMenu = null; } }
document.addEventListener('click', removeCtxMenu);
document.addEventListener('keydown', e => { if (e.key === 'Escape') removeCtxMenu(); });

function makeMenu(isDark) {
  const m = document.createElement('div');
  m.style.cssText = 'position:fixed;z-index:9999;border-radius:9px;overflow:hidden;min-width:170px;box-shadow:0 8px 32px rgba(0,0,0,.4)';
  m.style.background = isDark ? '#1e1e28' : '#fff';
  m.style.border     = isDark ? '1px solid rgba(255,255,255,.14)' : '1px solid rgba(0,0,0,.14)';
  return m;
}
function menuRow(menu, label, color, fn, isDark) {
  const row = document.createElement('div');
  row.style.cssText = 'padding:8px 13px;font-size:.74rem;cursor:pointer;font-family:DM Mono,monospace;display:flex;align-items:center;gap:8px;';
  row.style.color = color || (isDark ? '#f0eee8' : '#1c1a16');
  row.textContent = label;
  row.onmouseenter = () => row.style.background = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
  row.onmouseleave = () => row.style.background = '';
  row.onclick = e => { e.stopPropagation(); removeCtxMenu(); fn(); };
  menu.appendChild(row);
}
function positionMenu(menu, e) {
  menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px';
  document.body.appendChild(menu); ctxMenu = menu;
  const r = menu.getBoundingClientRect();
  if (r.right  > window.innerWidth  - 8) menu.style.left = (e.clientX - r.width)  + 'px';
  if (r.bottom > window.innerHeight - 8) menu.style.top  = (e.clientY - r.height) + 'px';
}

function showWordCtxMenu(e, w) {
  e.preventDefault(); removeCtxMenu();
  const isDark = document.body.classList.contains('dark');
  const menu = makeMenu(isDark);

  // word header
  const hd = document.createElement('div');
  hd.style.cssText = 'padding:8px 13px 4px;font-family:Noto Sans KR,sans-serif;font-size:.9rem;font-weight:500;';
  hd.style.color = isDark ? '#f0eee8' : '#1c1a16';
  hd.textContent = w.kr + ' — ' + w.ro;
  menu.appendChild(hd);

  // speak button
  const speakRow = document.createElement('div');
  speakRow.style.cssText = 'padding:4px 13px 8px;font-size:.68rem;cursor:pointer;display:flex;align-items:center;gap:6px;';
  speakRow.style.color = isDark ? '#7ac8a0' : '#1a7a4a';
  speakRow.innerHTML = '▶ listen';
  speakRow.onclick = e => { e.stopPropagation(); speak(w.kr, curLang); };
  menu.appendChild(speakRow);

  // divider
  const d1 = document.createElement('div');
  d1.style.cssText = 'border-top:1px solid;margin:2px 0;';
  d1.style.borderColor = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  menu.appendChild(d1);

  // deck header
  const dh = document.createElement('div');
  dh.style.cssText = 'padding:5px 13px 3px;font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;';
  dh.style.color = isDark ? '#55555f' : '#a09d96';
  dh.textContent = 'add to deck';
  menu.appendChild(dh);

  if (decks.length === 0) {
    const none = document.createElement('div');
    none.style.cssText = 'padding:5px 13px 7px;font-size:.72rem;';
    none.style.color = isDark ? '#55555f' : '#a09d96';
    none.textContent = 'no decks yet';
    menu.appendChild(none);
  } else {
    decks.forEach((deck, i) => {
      const inThis = !!deck.words[w.kr];
      const row = document.createElement('div');
      row.style.cssText = 'padding:7px 13px;font-size:.74rem;cursor:pointer;display:flex;align-items:center;gap:9px;font-family:DM Mono,monospace;';
      row.style.color = isDark ? '#f0eee8' : '#1c1a16';
      const dot = document.createElement('span');
      dot.style.cssText = `width:9px;height:9px;border-radius:50%;flex-shrink:0;border:2px solid ${deck.color};`;
      if (inThis) dot.style.background = deck.color;
      const lbl = document.createElement('span'); lbl.style.flex='1'; lbl.textContent = deck.name + (inThis ? ' ✓' : '');
      row.appendChild(dot); row.appendChild(lbl);
      row.onmouseenter = () => row.style.background = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
      row.onmouseleave = () => row.style.background = '';
      row.onclick = ev => {
        ev.stopPropagation();
        decks.forEach(d => delete d.words[w.kr]);
        if (!inThis) deck.words[w.kr] = true;
        saveDeckState(); removeCtxMenu(); renderDeckSwitcher(); renderDeckChips(); renderWordGrid();
      };
      menu.appendChild(row);
    });
  }

  // divider + new deck
  const d2 = document.createElement('div');
  d2.style.cssText = 'border-top:1px solid;margin:3px 0;';
  d2.style.borderColor = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  menu.appendChild(d2);
  menuRow(menu, '+ new deck', isDark ? '#7ac8a0' : '#1a7a4a', () => {
    const n = prompt('Name your new deck:', '');
    if (n?.trim()) {
      addDeck(n.trim());
      decks[decks.length-1].words[w.kr] = true;
      saveDeckState(); renderDeckSwitcher(); renderDeckChips(); renderWordGrid();
    }
  }, isDark);

  positionMenu(menu, e);
}

function showDeckCtxMenu(e, idx) {
  e.preventDefault(); removeCtxMenu();
  const isDark = document.body.classList.contains('dark');
  const deck = decks[idx];
  const menu = makeMenu(isDark);

  const hd = document.createElement('div');
  hd.style.cssText = 'padding:7px 13px 5px;font-size:.65rem;letter-spacing:.08em;font-weight:500;text-transform:uppercase;';
  hd.style.color = deck.color; hd.textContent = deck.name;
  menu.appendChild(hd);

  menuRow(menu, 'rename', null, () => {
    const n = prompt('Rename deck:', deck.name);
    if (n?.trim()) { deck.name = n.trim(); saveDeckState(); renderDeckSwitcher(); }
  }, isDark);
  menuRow(menu, 'delete deck', '#c87a7a', () => {
    if (confirm(`Delete "${deck.name}"? Words will not be deleted.`)) { deleteDeck(idx); renderDeckSwitcher(); renderDeckChips(); renderWordGrid(); }
  }, isDark);

  positionMenu(menu, e);
}

// ── STUDY MODE ────────────────────────────────────────────────────────────────
let studyList = [], sIdx = 0, sFlip = false;

function openStudy() {
  if (activeDeckIdx < 0 || activeDeckIdx >= decks.length) {
    alert('Select a deck first.'); return;
  }
  const keys = Object.keys(decks[activeDeckIdx].words);
  if (keys.length === 0) { alert(`${decks[activeDeckIdx].name} has no words yet.`); return; }
  studyList = shuffle(keys.map(kr => LANGS[curLang].words.find(w => w.kr === kr)).filter(Boolean));
  sIdx = 0; sFlip = false;
  renderStudyCard();
  document.getElementById('studyOverlay')?.classList.add('open');
}
function closeStudy() { document.getElementById('studyOverlay')?.classList.remove('open'); }
function overlayClick(e) { if (e.target.id === 'studyOverlay') closeStudy(); }

function renderStudyCard() {
  const w = studyList[sIdx];
  const front = document.getElementById('cFront');
  const back  = document.getElementById('cBack');
  if (!front || !back) return;
  front.innerHTML = `
    <button class="speak-btn" onclick="speak('${w.kr.replace(/'/g,"\\'")}','${curLang}')">▶</button>
    <div class="fc-kr">${w.kr}</div>
    <div class="fc-ro">${w.ro}</div>
    <div class="fc-pos">${w.pos}</div>
    ${w.register && w.register !== 'neutral' ? `<div class="fc-reg" style="color:${{formal:'#7a8cc8',casual:'#c8a87a'}[w.register]}">${w.register}</div>` : ''}
  `;
  back.innerHTML = `
    <button class="speak-btn" onclick="speak('${w.kr.replace(/'/g,"\\'")}','${curLang}')">▶</button>
    <div class="fc-meaning">${w.meaning}</div>
    <div class="fc-ex">${w.example}</div>
  `;
  document.getElementById('fcard')?.classList.remove('flip');
  sFlip = false;
}

function flipCard()  { sFlip = !sFlip; document.getElementById('fcard')?.classList.toggle('flip', sFlip); }
function nextCard()  {
  sIdx++;
  if (sIdx >= studyList.length) {
    const last = studyList[studyList.length-1];
    studyList = shuffle(studyList);
    if (studyList[0]?.kr === last?.kr && studyList.length > 1) { [studyList[0],studyList[1]] = [studyList[1],studyList[0]]; }
    sIdx = 0;
  }
  renderStudyCard();
}
function reshuffleStudy() {
  const cur = studyList[sIdx];
  studyList = shuffle(studyList);
  if (studyList[0]?.kr === cur?.kr && studyList.length > 1) { [studyList[0],studyList[1]] = [studyList[1],studyList[0]]; }
  sIdx = 0; renderStudyCard();
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('studyOverlay')?.classList.contains('open')) return;
  if (e.key === 'Escape')     closeStudy();
  if (e.key === 'ArrowRight') nextCard();
  if (e.key === ' ')          { e.preventDefault(); flipCard(); }
});


// ═══════════════════════════════════════════════════════════════
// PRACTICE TAB
// ═══════════════════════════════════════════════════════════════
// ── PRACTICE TAB ──────────────────────────────────────────────────────────────

let practiceQueue  = [];
let practiceIdx    = 0;
let practiceScore  = {correct:0, total:0};
let practiceFilter = 'all'; // 'all' | 'particle' | 'conjugate' | 'build' | 'fill'
let selectedBlocks = [];
let answered       = false;

function renderPractice(container) {
  container.innerHTML = `
    <div class="ctrl">
      <div class="ctrl-row" style="gap:6px;flex-wrap:wrap">
        <span class="ctrl-label">exercise type:</span>
        ${['all','particle','conjugate','build','fill'].map(t =>
          `<button class="gbtn${practiceFilter===t?' on':''}" onclick="setPracticeFilter('${t}')">${t}</button>`
        ).join('')}
      </div>
    </div>
    <div id="practiceArea" class="tab-body"></div>
  `;
  loadPracticeQueue();
  showNextExercise();
}

function setPracticeFilter(f) {
  practiceFilter = f;
  document.querySelectorAll('#practiceArea').forEach(el=>el.innerHTML='');
  document.querySelectorAll('.gbtn').forEach(b => b.classList.toggle('on', b.textContent === f));
  loadPracticeQueue();
  showNextExercise();
}

function loadPracticeQueue() {
  const s = LANGS[curLang].sentences; const all = (typeof s === 'function' ? s() : s) || [];
  let filtered = practiceFilter === 'all' ? all : all.filter(s => s.type === practiceFilter);
  if (filtered.length === 0) filtered = all;
  practiceQueue = shuffle(filtered);
  practiceIdx   = 0;
}

function showNextExercise() {
  if (practiceQueue.length === 0) {
    document.getElementById('practiceArea').innerHTML = '<div class="empty-msg">No exercises available for this language yet.</div>';
    return;
  }
  if (practiceIdx >= practiceQueue.length) {
    practiceIdx = 0;
    practiceQueue = shuffle(practiceQueue);
  }
  const ex = practiceQueue[practiceIdx];
  answered = false;
  selectedBlocks = [];

  const area = document.getElementById('practiceArea');
  if (!area) return;

  area.innerHTML = '';

  // score strip
  const score = document.createElement('div');
  score.className = 'practice-score';
  score.innerHTML = `<span class="score-num">${practiceScore.correct}/${practiceScore.total}</span><span class="score-lbl">correct</span><button class="ubtn" style="margin-left:auto" onclick="practiceScore={correct:0,total:0};showNextExercise()">reset</button>`;
  area.appendChild(score);

  // exercise card
  const card = document.createElement('div');
  card.className = 'exercise-card surface';

  // type + level badge
  const meta = document.createElement('div');
  meta.className = 'ex-meta';
  const typeColors = {particle:'#7ac8a0',conjugate:'#7a8cc8',build:'#c8a87a',fill:'#c87aa8'};
  meta.innerHTML = `<span class="ex-type" style="color:${typeColors[ex.type]||'#888'}">${ex.type}</span><span class="ex-level">level ${ex.level}</span>`;
  card.appendChild(meta);

  // english meaning
  const eng = document.createElement('div');
  eng.className = 'ex-english';
  eng.textContent = ex.english;
  card.appendChild(eng);

  // base form if conjugation
  if (ex.baseForm) {
    const bf = document.createElement('div');
    bf.className = 'ex-base';
    bf.textContent = `base: ${ex.baseForm}`;
    card.appendChild(bf);
  }

  // prompt
  const prompt = document.createElement('div');
  prompt.className = 'ex-prompt';
  prompt.id = 'exPrompt';
  card.appendChild(prompt);

  // answer area
  const ansArea = document.createElement('div');
  ansArea.className = 'ex-answer-area';
  ansArea.id = 'ansArea';
  card.appendChild(ansArea);

  // choices / blocks
  const choicesDiv = document.createElement('div');
  choicesDiv.className = 'ex-choices';
  choicesDiv.id = 'choicesDiv';
  card.appendChild(choicesDiv);

  // feedback
  const feedback = document.createElement('div');
  feedback.className = 'ex-feedback';
  feedback.id = 'exFeedback';
  feedback.style.display = 'none';
  card.appendChild(feedback);

  // next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'abtn accent';
  nextBtn.style.cssText = 'width:100%;margin-top:1rem;display:none';
  nextBtn.id = 'exNextBtn';
  nextBtn.textContent = 'next exercise →';
  nextBtn.onclick = () => { practiceIdx++; showNextExercise(); };
  card.appendChild(nextBtn);

  area.appendChild(card);

  // Render by type
  if (ex.type === 'build') renderBuildExercise(ex);
  else renderChoiceExercise(ex);
}

function renderChoiceExercise(ex) {
  const prompt = document.getElementById('exPrompt');
  prompt.innerHTML = ex.prompt.replace('___', '<span class="blank">___</span>');

  const choices = document.getElementById('choicesDiv');
  choices.innerHTML = '';
  const shuffled = shuffle(ex.choices);
  shuffled.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c;
    btn.onclick = () => submitChoiceAnswer(c, ex);
    choices.appendChild(btn);
  });
}

function submitChoiceAnswer(chosen, ex) {
  if (answered) return;
  answered = true;
  practiceScore.total++;
  const correct = chosen === ex.answer;
  if (correct) practiceScore.correct++;

  // highlight choices
  document.querySelectorAll('.choice-btn').forEach(btn => {
    if (btn.textContent === ex.answer) btn.classList.add('correct');
    else if (btn.textContent === chosen && !correct) btn.classList.add('wrong');
    btn.onclick = null;
  });

  // show filled prompt
  const prompt = document.getElementById('exPrompt');
  prompt.innerHTML = ex.prompt.replace('___', `<span class="answer-fill" style="color:${correct?'#7ac8a0':'#c87a7a'}">${chosen}</span>`);

  showFeedback(correct, ex);
}

function renderBuildExercise(ex) {
  const prompt = document.getElementById('exPrompt');
  prompt.innerHTML = '<span style="opacity:.5;font-size:.75rem">arrange the blocks in the correct order:</span>';

  const ansArea = document.getElementById('ansArea');
  ansArea.innerHTML = '<div class="build-slots" id="buildSlots"><span class="slot-hint">tap blocks below to build the sentence</span></div>';

  const choices = document.getElementById('choicesDiv');
  choices.innerHTML = '';

  // only show the correct blocks + 2-3 distractors
  const toShow = shuffle(ex.blocks);
  toShow.forEach(block => {
    const btn = document.createElement('button');
    btn.className = 'block-btn';
    btn.textContent = block;
    btn.dataset.word = block;
    btn.onclick = () => selectBlock(btn, block, ex);
    choices.appendChild(btn);
  });
}

function selectBlock(btn, block, ex) {
  if (answered) return;
  if (btn.disabled) return;

  btn.disabled = true;
  btn.style.opacity = '0.35';
  selectedBlocks.push(block);

  const slots = document.getElementById('buildSlots');
  // remove hint
  slots.querySelector('.slot-hint')?.remove();

  const chip = document.createElement('span');
  chip.className = 'placed-block';
  chip.textContent = block;
  chip.onclick = () => {
    // allow removing last placed block
    if (answered) return;
    const idx = selectedBlocks.lastIndexOf(block);
    if (idx >= 0) {
      selectedBlocks.splice(idx, 1);
      chip.remove();
      btn.disabled = false;
      btn.style.opacity = '1';
      if (slots.children.length === 0) slots.innerHTML = '<span class="slot-hint">tap blocks below to build the sentence</span>';
    }
  };
  slots.appendChild(chip);

  // auto-check when enough blocks placed
  if (selectedBlocks.length === ex.answer.length) {
    setTimeout(() => checkBuildAnswer(ex), 300);
  }
}

function checkBuildAnswer(ex) {
  if (answered && selectedBlocks.length < ex.answer.length) return;
  answered = true;
  practiceScore.total++;

  const correct = selectedBlocks.join('|') === ex.answer.join('|');
  if (correct) practiceScore.correct++;

  document.querySelectorAll('.placed-block').forEach((chip, i) => {
    chip.style.color = correct ? '#7ac8a0' : (chip.textContent === ex.answer[i] ? '#7ac8a0' : '#c87a7a');
  });

  if (!correct) {
    const slots = document.getElementById('buildSlots');
    const ans = document.createElement('div');
    ans.style.cssText = 'margin-top:8px;font-size:.75rem;color:#7ac8a0';
    ans.textContent = '✓ ' + ex.answer.join(' ');
    slots.parentNode.insertBefore(ans, slots.nextSibling);
  }

  showFeedback(correct, ex);
}

function showFeedback(correct, ex) {
  const fb = document.getElementById('exFeedback');
  fb.style.display = 'block';
  fb.className = 'ex-feedback ' + (correct ? 'fb-correct' : 'fb-wrong');
  fb.innerHTML = `
    <div class="fb-result">${correct ? '✓ correct' : '✗ not quite'}</div>
    <div class="fb-explanation">${ex.explanation}</div>
  `;

  // update score display
  const sn = document.querySelector('.score-num');
  if (sn) sn.textContent = `${practiceScore.correct}/${practiceScore.total}`;

  document.getElementById('exNextBtn').style.display = 'block';
}


// ═══════════════════════════════════════════════════════════════
// GRAMMAR TAB
// ═══════════════════════════════════════════════════════════════
// ── GRAMMAR DATA ──────────────────────────────────────────────────────────────

function renderGrammar(container) {
  const notes = (GRAMMAR[curLang]) || [];
  container.innerHTML = '';

  if (!notes || notes.length === 0) {
    container.innerHTML = '<div class="empty-msg">Grammar notes coming soon.</div>';
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'tab-body';
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

  const intro = document.createElement('div');
  intro.className = 't-muted';
  intro.style.cssText = 'font-size:.75rem;padding-bottom:.5rem;';
  intro.textContent = notes.length + ' grammar topics — click any card to expand';
  wrap.appendChild(intro);

  const levelColors = ['#7ac8a0','#c8a87a','#c87aa8'];
  const levelLabels = ['beginner','intermediate','advanced'];

  notes.forEach(function(note) {
    const card = document.createElement('div');
    card.className = 'grammar-card surface';

    const hdr = document.createElement('div');
    hdr.className = 'grammar-hdr';

    const left = document.createElement('div');
    left.className = 'grammar-left';

    const lvl = document.createElement('span');
    lvl.className = 'grammar-level';
    lvl.style.color = levelColors[(note.level||1)-1];
    lvl.textContent = levelLabels[(note.level||1)-1];

    const title = document.createElement('div');
    title.className = 'grammar-title';
    title.textContent = note.title;

    const shortEl = document.createElement('div');
    shortEl.className = 'grammar-short t-muted';
    shortEl.textContent = note.short;

    left.appendChild(lvl);
    left.appendChild(title);
    left.appendChild(shortEl);

    const chev = document.createElement('span');
    chev.className = 'sec-chev';
    chev.textContent = '▾';

    hdr.appendChild(left);
    hdr.appendChild(chev);

    const body = document.createElement('div');
    body.className = 'grammar-body';
    body.style.display = 'none';

    const bodyText = document.createElement('div');
    bodyText.className = 'grammar-text';
    bodyText.textContent = note.body;

    const exBox = document.createElement('div');
    exBox.className = 'grammar-example';
    exBox.innerHTML = '<div class="ex-label t-muted">example</div><pre class="ex-pre">' + note.example + '</pre>';

    const speakBtn = document.createElement('button');
    speakBtn.className = 'ubtn';
    speakBtn.style.marginTop = '8px';
    speakBtn.textContent = '▶ hear example';
    speakBtn.onclick = function() {
      var firstLine = note.example.split('\n')[0].split('→')[0].trim();
      speak(firstLine, curLang);
    };

    body.appendChild(bodyText);
    body.appendChild(exBox);
    body.appendChild(speakBtn);

    hdr.onclick = function() {
      var open = body.style.display === 'none';
      body.style.display = open ? 'block' : 'none';
      chev.textContent = open ? '▴' : '▾';
      card.classList.toggle('grammar-open', open);
    };

    card.appendChild(hdr);
    card.appendChild(body);
    wrap.appendChild(card);
  });

  container.appendChild(wrap);
}


// ═══════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════
// ── BOTTOM SHEET ──────────────────────────────────────────────
let bsWord = null;

function openBs(w) {
  bsWord = w;
  const sheet = document.getElementById('bottomSheet');
  const overlay = document.getElementById('bsOverlay');
  document.getElementById('bsWord').textContent = w.kr + '  ' + w.ro;
  document.getElementById('bsMeaning').textContent = w.meaning;
  renderBsDecks();
  overlay.style.display = 'block';
  sheet.style.display = 'block';
  requestAnimationFrame(() => {
    sheet.style.transform = 'translateY(0)';
  });
}

function closeBs() {
  document.getElementById('bottomSheet').style.display = 'none';
  document.getElementById('bsOverlay').style.display = 'none';
  bsWord = null;
}

function renderBsDecks() {
  const container = document.getElementById('bsDecks');
  container.innerHTML = '';

  if (decks.length === 0) {
    container.innerHTML = '<div style="padding:8px 14px;font-size:.78rem;color:var(--su)">no decks yet — create one below</div>';
    return;
  }

  decks.forEach((deck, i) => {
    const inDeck = bsWord && !!deck.words[bsWord.kr];
    const btn = document.createElement('button');
    btn.className = 'bs-deck-row';
    btn.innerHTML = `
      <span class="bs-dot" style="background:${deck.color};border:2px solid ${deck.color}"></span>
      <span style="flex:1">${deck.name}</span>
      <span style="font-size:.7rem;color:var(--mu);margin-right:6px">${Object.keys(deck.words).length} words</span>
      ${inDeck ? '<span class="bs-check">✓</span>' : ''}
    `;
    // delete button for mobile
    const delBtn = document.createElement('button');
    delBtn.style.cssText = 'background:none;border:none;color:#c87a7a;font-size:.75rem;padding:4px 6px;cursor:pointer;flex-shrink:0;opacity:.7';
    delBtn.textContent = '✕';
    delBtn.title = 'delete deck';
    delBtn.onclick = ev => {
      ev.stopPropagation();
      if (!confirm('Delete "' + deck.name + '"? Words will not be deleted.')) return;
      deleteDeck(i);
      renderBsDecks();
      renderDeckSwitcher();
      renderDeckChips();
      renderWordGrid();
    };
    btn.appendChild(delBtn);
    btn.onclick = () => {
      if (!bsWord) return;
      // toggle this deck independently — don't remove from others
      if (inDeck) delete deck.words[bsWord.kr];
      else deck.words[bsWord.kr] = true;
      saveDeckState();
      renderBsDecks();
      renderDeckChips();
      renderDeckSwitcher();
      renderWordGrid();
    };
    container.appendChild(btn);
  });
}

function bsNewDeck() {
  const name = prompt('Name your new deck:', '');
  if (!name || !name.trim()) return;
  addDeck(name.trim());
  if (bsWord) {
    decks[decks.length - 1].words[bsWord.kr] = true;
    saveDeckState();
  }
  renderBsDecks();
  renderDeckChips();
  renderDeckSwitcher();
  renderWordGrid();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeBs();
});

// ── FONT SIZE ─────────────────────────────────────────────────
const FONT_SIZES = ['sm','md','lg','xl'];
const FONT_LABELS = {'sm':'small','md':'medium','lg':'large','xl':'x-large'};
const _savedSize = localStorage.getItem('lf-fontsize'); let fontSize = ['sm','md','lg','xl'].includes(_savedSize) ? _savedSize : 'lg';

function applyFontSize(size) {
  fontSize = size;
  document.documentElement.setAttribute('data-size', size);
  localStorage.setItem('lf-fontsize', size);
  const btn = document.getElementById('fontBtn');
  if (btn) btn.textContent = 'text: ' + FONT_LABELS[size];
}

function cycleFontSize() {
  const idx = FONT_SIZES.indexOf(fontSize);
  applyFontSize(FONT_SIZES[(idx + 1) % FONT_SIZES.length]);
}

(function boot() {
  // init deck state
  decks         = load('lf-decks', []);
  activeDeckIdx = load('lf-activeDeck', -1);
  curGrouping   = load('lf-grouping', 'pos');
  if (activeDeckIdx >= decks.length) activeDeckIdx = -1;

  // theme
  document.body.className = theme;
  applyFontSize(fontSize);
  document.getElementById('themeBtn').textContent = theme === 'dark' ? 'light mode' : 'dark mode';

  // language
  const savedLang = localStorage.getItem('lf-lang') || 'korean';
  curLang = savedLang;
  const L = LANGS[savedLang];
  document.getElementById('langFlag').textContent   = L.flag;
  document.getElementById('langLabel').textContent  = L.label;
  // logoScript is the tagline, not language-specific
  document.querySelectorAll('.lang-option').forEach(el => el.classList.toggle('active', el.dataset.lang === savedLang));

  // tab
  const savedTab = localStorage.getItem('lf-tab') || 'vocab';
  curTab = savedTab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === savedTab));
  renderTab(savedTab);
})();
</script>
</body>
</html>
