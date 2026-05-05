/* ═══════════════════════════════════
   MOGME.TV — SHARED STYLES
   Include this in every page via <link>
═══════════════════════════════════ */
:root {
  --bg: #0d0d14;
  --bg2: #11111c;
  --card: #18182a;
  --card2: #1e1e30;
  --card-hover: #22223a;
  --border: rgba(255,255,255,0.06);
  --purple: #7c5cbf;
  --purple-light: #9b7de0;
  --gold: #c9a84c;
  --gold-bright: #f0c060;
  --cyan: #00e5ff;
  --green: #00e676;
  --red: #ff4d6d;
  --white: #f0f0f8;
  --muted: #6b6b8a;
  --muted2: #4a4a65;
  --nav-h: 58px;
  --chat-w: 272px;
}

* { margin:0; padding:0; box-sizing:border-box; }

body {
  background: var(--bg);
  color: var(--white);
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  padding-top: var(--nav-h);
  padding-right: var(--chat-w);
}

body::before {
  content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
  background:
    radial-gradient(ellipse 60% 50% at 80% 20%, rgba(100,60,180,0.1) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 10% 80%, rgba(60,40,120,0.08) 0%, transparent 60%);
}

/* ── TOP NAV ── */
.top-nav {
  position: fixed; top:0; left:0; right: var(--chat-w);
  height: var(--nav-h); z-index: 150;
  background: rgba(13,13,20,0.97);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);
  display: flex; align-items: center;
  padding: 0 24px; gap: 24px;
}

.nav-logo {
  font-family: 'Syne', sans-serif; font-weight: 800;
  font-size: 20px; letter-spacing: 2px; color: var(--gold);
  text-shadow: 0 0 20px rgba(201,168,76,0.35);
  text-decoration: none; flex-shrink: 0;
}

.nav-links {
  display: flex; align-items: center; gap: 4px; flex: 1;
}

.nav-link {
  padding: 7px 14px; border-radius: 8px;
  font-family: 'Space Mono', monospace; font-size: 10px;
  letter-spacing: 1px; color: var(--muted);
  text-decoration: none; transition: all 0.2s;
  border: 1px solid transparent;
}
.nav-link:hover { color: var(--white); background: rgba(255,255,255,0.04); }
.nav-link.active {
  color: var(--gold); background: rgba(201,168,76,0.08);
  border-color: rgba(201,168,76,0.2);
}

.nav-right {
  display: flex; align-items: center; gap: 12px; margin-left: auto;
}

.nav-online {
  display: flex; align-items: center; gap: 6px;
  font-family: 'Space Mono', monospace; font-size: 10px; color: var(--muted);
}

.nav-online-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green); box-shadow: 0 0 6px var(--green);
  animation: pulse 2s infinite;
}

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

/* ── CHAT SIDEBAR ── */
.chat-sidebar {
  position: fixed; top:0; right:0; bottom:0;
  width: var(--chat-w); z-index: 200;
  background: #0f0f1d;
  border-left: 1px solid rgba(255,255,255,0.05);
  display: flex; flex-direction: column;
}

.chat-head {
  height: var(--nav-h);
  padding: 0 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(13,13,20,0.97);
  flex-shrink: 0;
}

.chat-head-title {
  font-family: 'Syne', sans-serif; font-size: 13px;
  font-weight: 700; letter-spacing: 1px; color: var(--white);
}

.chat-head-online {
  display: flex; align-items: center; gap: 5px;
  font-family: 'Space Mono', monospace; font-size: 9px; color: var(--muted);
}

.chat-head-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--green); box-shadow: 0 0 5px var(--green);
  animation: pulse 2s infinite;
}

.chat-msgs {
  flex: 1; overflow-y: auto;
  padding: 10px 8px;
  display: flex; flex-direction: column; gap: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.06) transparent;
}
.chat-msgs::-webkit-scrollbar { width: 3px; }
.chat-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius:999px; }

.chat-msg { display:flex; flex-direction:column; gap:2px; animation: msgIn 0.2s ease; }
@keyframes msgIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.chat-msg-top { display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
.chat-msg-name { font-family:'Space Mono',monospace; font-size:10px; font-weight:700; color:var(--white); }

.rank-pill {
  font-family:'Space Mono',monospace; font-size:8px;
  padding:1px 6px; border-radius:4px; letter-spacing:0.5px;
}
.rank-pill.sub3   { background:rgba(255,77,109,0.12);  color:#ff4d6d; border:1px solid rgba(255,77,109,0.2); }
.rank-pill.ltn    { background:rgba(100,130,200,0.12); color:#7090d0; border:1px solid rgba(100,130,200,0.2); }
.rank-pill.mtn    { background:rgba(96,200,144,0.12);  color:#60c890; border:1px solid rgba(96,200,144,0.2); }
.rank-pill.htn    { background:rgba(0,229,255,0.1);    color:#00e5ff; border:1px solid rgba(0,229,255,0.2); }
.rank-pill.chadlite{ background:rgba(155,125,224,0.12);color:#9b7de0; border:1px solid rgba(155,125,224,0.2); }
.rank-pill.chad   { background:rgba(201,168,76,0.12);  color:#c9a84c; border:1px solid rgba(201,168,76,0.25); }

.chat-msg-text {
  font-size: 12px; color: rgba(240,240,248,0.82);
  line-height: 1.5; padding: 5px 9px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 2px 8px 8px 8px;
  word-break: break-word;
}

.chat-msg-time {
  font-family:'Space Mono',monospace; font-size:8px;
  color: var(--muted2); padding-left:3px;
}

.chat-sys {
  font-family:'Space Mono',monospace; font-size:9px;
  color: var(--muted2); text-align:center; padding:3px 0; letter-spacing:0.5px;
}

.chat-foot {
  padding: 8px; border-top: 1px solid rgba(255,255,255,0.05); flex-shrink:0;
}

.chat-name-row { display:flex; gap:6px; margin-bottom:6px; }

.chat-name-in {
  flex:1; background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.07); border-radius:6px;
  padding:6px 10px; font-family:'Space Mono',monospace;
  font-size:10px; color:var(--white); outline:none;
}
.chat-name-in::placeholder { color:var(--muted2); }
.chat-name-in:focus { border-color:rgba(201,168,76,0.3); }

.chat-input-row { display:flex; gap:6px; }

.chat-in {
  flex:1; background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.07); border-radius:8px;
  padding:8px 10px; font-family:'DM Sans',sans-serif;
  font-size:12px; color:var(--white); outline:none;
}
.chat-in::placeholder { color:var(--muted2); }
.chat-in:focus { border-color:rgba(201,168,76,0.3); }

.chat-send {
  width:32px; height:32px; flex-shrink:0;
  background:linear-gradient(135deg,var(--gold),#b8943e);
  border:none; border-radius:8px; color:#0d0d14;
  font-size:13px; cursor:pointer; transition:all 0.2s;
  display:flex; align-items:center; justify-content:center;
}
.chat-send:hover { background:linear-gradient(135deg,var(--gold-bright),var(--gold)); transform:scale(1.05); }

/* ── PAGE WRAPPER ── */
.page-wrap {
  max-width: 1100px; margin: 0 auto;
  padding: 32px 24px 60px;
  position: relative; z-index:1;
}

/* ── COMMON CARD ── */
.g-card {
  background:var(--card); border:1px solid var(--border);
  border-radius:16px; overflow:hidden;
  transition:border-color 0.2s, transform 0.2s;
}
.g-card:hover { border-color:rgba(124,92,191,0.25); }

/* ── BUTTONS ── */
.btn-gold {
  padding:14px 28px; border:none; border-radius:12px;
  background:linear-gradient(135deg,var(--gold),#b8943e);
  color:#0d0d14; font-family:'Syne',sans-serif;
  font-size:15px; font-weight:800; letter-spacing:1px;
  cursor:pointer; transition:all 0.2s;
}
.btn-gold:hover { background:linear-gradient(135deg,var(--gold-bright),var(--gold)); transform:translateY(-2px); box-shadow:0 8px 24px rgba(201,168,76,0.25); }
.btn-gold:disabled { background:var(--card2); color:var(--muted); cursor:not-allowed; transform:none; box-shadow:none; }

.btn-purple {
  padding:14px 28px; border:none; border-radius:12px;
  background:linear-gradient(135deg,var(--purple),#5a3fa0);
  color:var(--white); font-family:'Syne',sans-serif;
  font-size:15px; font-weight:800; letter-spacing:1px;
  cursor:pointer; transition:all 0.2s;
}
.btn-purple:hover { background:linear-gradient(135deg,var(--purple-light),var(--purple)); transform:translateY(-2px); }
.btn-purple:disabled { background:var(--card2); color:var(--muted); cursor:not-allowed; transform:none; }

.btn-outline {
  padding:13px 24px; border-radius:12px;
  border:1px solid rgba(201,168,76,0.3);
  background:transparent; color:var(--gold);
  font-family:'Syne',sans-serif; font-size:14px; font-weight:700;
  cursor:pointer; transition:all 0.2s;
}
.btn-outline:hover { background:rgba(201,168,76,0.08); transform:translateY(-1px); }

/* ── RESPONSIVE ── */
@media(max-width:768px) {
  :root { --chat-w: 0px; }
  .chat-sidebar { display:none; }
  body { padding-right:0; }
  .top-nav { right:0; }
}
