:root {
  --bg:       #080810;
  --bg2:      #0e0e1a;
  --surface:  #13131f;
  --surface2: #1a1a28;
  --surface3: #202030;
  --border:   rgba(255,255,255,0.06);
  --border2:  rgba(255,255,255,0.1);
  --teal:        #0df2c8;
  --teal-dim:    rgba(13,242,200,0.1);
  --teal-glow:   rgba(13,242,200,0.25);
  --amber:       #f5a623;
  --amber-dim:   rgba(245,166,35,0.1);
  --amber-glow:  rgba(245,166,35,0.3);
  --violet:      #7b61ff;
  --violet-dim:  rgba(123,97,255,0.1);
  --crimson:     #ff3d6b;
  --green:       #0df27a;
  --white:       #f2f2ff;
  --muted:       #6b6b8f;
  --muted2:      #3f3f5a;
  --nav-h:    56px;
  --chat-w:   268px;
}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { background: #080810; }

body {
  background: var(--bg);
  color: var(--white);
  font-family: 'Barlow', 'DM Sans', sans-serif;
  min-height: 100vh;
  padding-top: calc(var(--nav-h) + 36px);
  padding-right: var(--chat-w);
  overflow-x: hidden;
}

body::before {
  content: '';
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 15% 0%, rgba(123,97,255,0.08) 0%, transparent 55%),
    radial-gradient(ellipse 50% 60% at 90% 100%, rgba(13,242,200,0.05) 0%, transparent 55%);
}

/* ════════ TOP NAV ════════ */
.top-nav {
  position: fixed; top: 0; left: 0; right: var(--chat-w);
  height: var(--nav-h); z-index: 300;
  background: rgba(8,8,16,0.98);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center;
  padding: 0 20px; gap: 6px;
}
.nav-logo {
  font-family: 'Barlow Condensed', 'DM Sans', sans-serif;
  font-weight: 900; font-size: 20px;
  letter-spacing: 2px; color: var(--teal);
  text-decoration: none; margin-right: 12px; flex-shrink: 0;
  text-shadow: 0 0 20px var(--teal-glow);
}
.nav-links { display: flex; align-items: center; gap: 2px; flex: 1; }
.nav-link {
  padding: 6px 12px; border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.5px;
  color: var(--muted); text-decoration: none;
  transition: all 0.2s; border: 1px solid transparent;
  white-space: nowrap;
}
.nav-link:hover { color: var(--white); background: rgba(255,255,255,0.05); }
.nav-link.active { color: var(--teal); background: var(--teal-dim); border-color: rgba(13,242,200,0.2); }
.nav-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.nav-online {
  display: flex; align-items: center; gap: 6px;
  font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted);
}
.nav-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green); box-shadow: 0 0 6px var(--green);
  animation: blink 2s ease infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
.nav-claim-btn {
  padding: 6px 14px; border-radius: 8px;
  background: var(--teal-dim); border: 1px solid rgba(13,242,200,0.3);
  color: var(--teal); font-family: 'JetBrains Mono', monospace;
  font-size: 10px; cursor: pointer; transition: all 0.2s;
}
.nav-claim-btn:hover { background: rgba(13,242,200,0.18); }

/* ════════ GUEST BANNER ════════ */
.guest-banner {
  position: fixed; top: var(--nav-h); left: 0; right: var(--chat-w); z-index: 200;
  padding: 9px 20px;
  background: linear-gradient(90deg, rgba(123,97,255,0.12), rgba(13,242,200,0.08), rgba(123,97,255,0.12));
  border-bottom: 1px solid rgba(123,97,255,0.2);
  display: flex; align-items: center; justify-content: center; gap: 10px;
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: rgba(242,242,255,0.65);
}
.guest-banner a { color: var(--teal); text-decoration: none; font-weight: 700; }
.guest-banner-close {
  position: absolute; right: 16px; background: none; border: none;
  color: var(--muted); cursor: pointer; font-size: 15px;
}
.guest-banner-close:hover { color: var(--white); }

/* ════════ CHAT SIDEBAR ════════ */
.chat-sidebar {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: var(--chat-w); z-index: 250;
  background: var(--bg2); border-left: 1px solid var(--border);
  display: flex; flex-direction: column;
}
.chat-head {
  height: var(--nav-h); padding: 0 14px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(8,8,16,0.98); flex-shrink: 0;
}
.chat-head-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700; font-size: 15px; letter-spacing: 1px; color: var(--white);
}
.chat-head-right {
  display: flex; align-items: center; gap: 5px;
  font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--muted);
}
.chat-head-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--green); box-shadow: 0 0 5px var(--green);
  animation: blink 2s infinite;
}
.chat-msgs {
  flex: 1; overflow-y: auto; padding: 10px 8px;
  display: flex; flex-direction: column; gap: 6px;
  scrollbar-width: thin; scrollbar-color: var(--surface3) transparent;
}
.chat-msgs::-webkit-scrollbar { width: 3px; }
.chat-msgs::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 999px; }
.chat-msg { display: flex; flex-direction: column; gap: 3px; animation: msgIn 0.2s ease; }
@keyframes msgIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
.chat-msg-top { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.chat-msg-name { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: var(--white); }
.rank-pill { font-family: 'JetBrains Mono', monospace; font-size: 8px; padding: 1px 6px; border-radius: 4px; }
.rank-pill.molecule { background:rgba(100,100,120,0.2); color:#888aaa; border:1px solid rgba(100,100,120,0.3); }
.rank-pill.sub3     { background:rgba(255,61,107,0.12); color:#ff3d6b; border:1px solid rgba(255,61,107,0.25); }
.rank-pill.ltn      { background:rgba(100,130,200,0.12);color:#7090d0; border:1px solid rgba(100,130,200,0.2); }
.rank-pill.mtn      { background:rgba(245,166,35,0.12); color:#f5a623; border:1px solid rgba(245,166,35,0.2); }
.rank-pill.htn      { background:rgba(13,242,200,0.1);  color:#0df2c8; border:1px solid rgba(13,242,200,0.2); }
.rank-pill.chadlite { background:rgba(123,97,255,0.12); color:#7b61ff; border:1px solid rgba(123,97,255,0.2); }
.rank-pill.chad     { background:rgba(245,166,35,0.15); color:#f5a623; border:1px solid rgba(245,166,35,0.3); }
.rank-pill.slayer   { background:rgba(255,61,107,0.15); color:#ff3d6b; border:1px solid rgba(255,61,107,0.35); }
.chat-msg-text {
  font-size: 12px; color: rgba(242,242,255,0.8); line-height: 1.5;
  padding: 6px 10px; background: var(--surface); border: 1px solid var(--border);
  border-radius: 2px 8px 8px 8px; word-break: break-word;
}
.chat-msg-time { font-family: 'JetBrains Mono', monospace; font-size: 8px; color: var(--muted2); padding-left: 3px; }
.chat-sys { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--muted2); text-align: center; padding: 3px 0; }
.chat-foot { padding: 8px; border-top: 1px solid var(--border); flex-shrink: 0; }
.chat-name-row { margin-bottom: 6px; }
.chat-name-in {
  width: 100%; background: var(--surface); border: 1px solid var(--border2);
  border-radius: 7px; padding: 6px 10px;
  font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--white); outline: none;
}
.chat-name-in::placeholder { color: var(--muted2); }
.chat-name-in:focus { border-color: rgba(13,242,200,0.3); }
.chat-input-row { display: flex; gap: 6px; }
.chat-in {
  flex: 1; background: var(--surface); border: 1px solid var(--border2);
  border-radius: 8px; padding: 8px 10px;
  font-size: 12px; color: var(--white); outline: none;
}
.chat-in::placeholder { color: var(--muted2); }
.chat-in:focus { border-color: rgba(13,242,200,0.3); }
.chat-send {
  width: 34px; height: 34px; flex-shrink: 0;
  background: var(--teal); border: none; border-radius: 8px;
  color: #080810; font-size: 14px; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.chat-send:hover { background: #2fffd8; transform: scale(1.05); }

/* ════════ PAGE WRAP ════════ */
.page-wrap {
  max-width: 1100px; margin: 0 auto;
  padding: 28px 22px 60px;
  position: relative; z-index: 1;
}

/* ════════ BUTTONS ════════ */
.btn-teal {
  padding: 13px 26px; border: none; border-radius: 10px;
  background: var(--teal); color: #080810;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 16px; font-weight: 700; letter-spacing: 1px;
  cursor: pointer; transition: all 0.2s;
}
.btn-teal:hover { background: #2fffd8; transform: translateY(-2px); box-shadow: 0 8px 24px var(--teal-glow); }
.btn-teal:disabled { background: var(--surface2); color: var(--muted); cursor: not-allowed; transform: none; box-shadow: none; }

.btn-amber {
  padding: 13px 26px; border: none; border-radius: 10px;
  background: var(--amber); color: #080810;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 16px; font-weight: 700; letter-spacing: 1px;
  cursor: pointer; transition: all 0.2s;
}
.btn-amber:hover { background: #ffc04a; transform: translateY(-2px); box-shadow: 0 8px 24px var(--amber-glow); }
.btn-amber:disabled { background: var(--surface2); color: var(--muted); cursor: not-allowed; transform: none; }

.btn-outline {
  padding: 12px 22px; border-radius: 10px;
  border: 1px solid var(--border2); background: transparent; color: var(--muted);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 15px; font-weight: 600; letter-spacing: 1px;
  cursor: pointer; transition: all 0.2s;
}
.btn-outline:hover { color: var(--white); border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); }

/* ════════ MODALS ════════ */
.modal-overlay {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(0,0,0,0.82); backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity 0.25s;
}
.modal-overlay.open { opacity: 1; pointer-events: all; }
.modal-box {
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: 20px; padding: 32px; max-width: 560px; width: 92%;
  position: relative; animation: modalIn 0.3s ease;
}
@keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(10px)} to{opacity:1;transform:none} }
.modal-close {
  position: absolute; top: 16px; right: 16px;
  background: none; border: none; color: var(--muted);
  font-size: 18px; cursor: pointer; transition: color 0.2s;
}
.modal-close:hover { color: var(--white); }

/* ════════ LEADERBOARD ROWS ════════ */
.lb-row { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s; }
.lb-row:last-child { border-bottom: none; }
.lb-row:hover { background: rgba(255,255,255,0.02); }
.lb-rank { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 800; color: var(--muted2); text-align: center; }
.lb-info { display: flex; align-items: center; gap: 10px; }
.lb-av { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 800; }
.lb-av.chad,.lb-av.slayer { background: var(--amber-dim); color: var(--amber); }
.lb-av.chadlite { background: var(--violet-dim); color: var(--violet); }
.lb-av.htn { background: var(--teal-dim); color: var(--teal); }
.lb-av.mtn,.lb-av.ltn,.lb-av.sub3,.lb-av.molecule { background: var(--surface2); color: var(--muted); }
.lb-name { font-weight: 600; font-size: 13px; color: var(--white); }
.lb-sub { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--muted); margin-top: 2px; }
.lb-elo { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--teal); }

/* ════════ RESPONSIVE ════════ */
@media(max-width: 900px) {
  :root { --chat-w: 0px; }
  .chat-sidebar { display: none; }
  body { padding-right: 0; }
  .top-nav, .guest-banner { right: 0; }
}
@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes shimmer { to { left: 200%; } }
