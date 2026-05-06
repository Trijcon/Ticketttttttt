/* ═══════════════════════════════════
   MOGME.TV — SHARED.JS v4
   WebSocket + Chat (logged-in only) + UI injection
═══════════════════════════════════ */

const SERVER_WS   = 'wss://mogmetv-production.up.railway.app';
const SERVER_HTTP = 'https://mogmetv-production.up.railway.app';

let ws = null, mySocketId = null, reconnectTimer = null, pageOnMsg = null;

// Load from localStorage (synced from Firestore after login)
let myName     = localStorage.getItem('mgm_username') || localStorage.getItem('mgm_name') || 'Anonymous';
let myElo      = parseInt(localStorage.getItem('mgm_elo')     || '400');
let myWins     = parseInt(localStorage.getItem('mgm_wins')    || '0');
let myLosses   = parseInt(localStorage.getItem('mgm_losses')  || '0');
let myUid      = localStorage.getItem('mgm_uid')      || null;
let myPhoto    = localStorage.getItem('mgm_photo')    || '';
let myUsername = localStorage.getItem('mgm_username') || '';

/* ── TIER HELPERS ── */
function getTierName(elo) {
  if (elo>=5001) return 'Slayer';
  if (elo>=3501) return 'Chad';
  if (elo>=2001) return 'Chadlite';
  if (elo>=1501) return 'HTN';
  if (elo>=1001) return 'MTN';
  if (elo>=501)  return 'LTN';
  if (elo>=1)    return 'Sub3';
  return 'Molecule';
}
function getTierEmoji(elo) {
  return {Slayer:'💀',Chad:'👑',Chadlite:'🔥',HTN:'⭐',MTN:'⚡',LTN:'🌙',Sub3:'🔴',Molecule:'🧪'}[getTierName(elo)]||'🔴';
}
function rankClass(t) {
  return {Slayer:'slayer',Chad:'chad',Chadlite:'chadlite',HTN:'htn',MTN:'mtn',LTN:'ltn',Sub3:'sub3',Molecule:'molecule'}[t]||'sub3';
}
function escapeHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function saveStats() {
  localStorage.setItem('mgm_name',   myName);
  localStorage.setItem('mgm_elo',    myElo);
  localStorage.setItem('mgm_wins',   myWins);
  localStorage.setItem('mgm_losses', myLosses);
}
function getTime() {
  return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}

/* ═══════════════════════════════════
   WEBSOCKET
═══════════════════════════════════ */
function connectWS(onMsg) {
  pageOnMsg = onMsg || null;
  if (ws && (ws.readyState===WebSocket.OPEN||ws.readyState===WebSocket.CONNECTING)) return;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer=null; }
  try { ws = new WebSocket(SERVER_WS); } catch(e) {
    chatSys('Server unavailable — retrying...');
    reconnectTimer = setTimeout(()=>connectWS(pageOnMsg), 5000); return;
  }
  ws.onopen = () => {
    chatSys('Connected to MogMe.TV ✓');
    // Send user info to server
    wsSend({
      type:'set_user',
      name:     myUsername || myName,
      username: myUsername,
      uid:      myUid,
      photoURL: myPhoto,
      elo:      myElo,
      wins:     myWins,
      losses:   myLosses,
    });
  };
  ws.onmessage = (e) => {
    let msg; try { msg=JSON.parse(e.data); } catch { return; }
    handleShared(msg);
    if (typeof pageOnMsg==='function') pageOnMsg(msg);
  };
  ws.onclose = () => {
    chatSys('Disconnected — reconnecting...');
    ws=null;
    reconnectTimer = setTimeout(()=>connectWS(pageOnMsg), 3000);
  };
  ws.onerror = ()=>{};
}

function wsSend(data) {
  if (ws&&ws.readyState===WebSocket.OPEN) { ws.send(JSON.stringify(data)); return true; }
  return false;
}

/* ═══════════════════════════════════
   SHARED MESSAGE HANDLER
═══════════════════════════════════ */
function handleShared(msg) {
  switch(msg.type) {
    case 'welcome':
      mySocketId = msg.socketId;
      updateOnlineUI(msg.onlineCount);
      if (msg.chatHistory) msg.chatHistory.forEach(m=>renderChatMsg(m));
      break;
    case 'chat':
      renderChatMsg(msg.message);
      break;
    case 'chat_reset':
      // Clear chat UI and show reset message
      const chatMsgsEl = document.getElementById('chatMsgs');
      if (chatMsgsEl) chatMsgsEl.innerHTML = '';
      renderChatMsg(msg.message);
      break;
    case 'online_count':
      updateOnlineUI(msg.count);
      break;
    case 'match_result':
      myElo = msg.newElo || myElo;
      if (msg.won) myWins++; else myLosses++;
      saveStats();
      // Save to Firestore if logged in
      if (window.saveEloToFirestore) {
        window.saveEloToFirestore(myElo, myWins, myLosses);
      }
      break;
    case 'chat_error':
      chatSys('⚠ ' + msg.error);
      break;
  }
}

function updateOnlineUI(count) {
  if (count==null) return;
  document.querySelectorAll('.online-count-val').forEach(el=>{
    el.textContent = Number(count).toLocaleString()+' online';
  });
  // Update chat info section
  const infoOnline = document.getElementById('chatInfoOnline');
  if (infoOnline) infoOnline.textContent = Number(count).toLocaleString()+' online now';
}

/* ═══════════════════════════════════
   CHAT RENDERING
═══════════════════════════════════ */
function chatSys(text) {
  const el = document.getElementById('chatMsgs');
  if (!el) return;
  const div = document.createElement('div');
  div.className = 'chat-sys';
  div.textContent = '— '+text+' —';
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function renderChatMsg(msg) {
  const el = document.getElementById('chatMsgs');
  if (!el||!msg) return;

  // System message styling
  if (msg.isSystem) {
    const div = document.createElement('div');
    div.className = 'chat-sys-important';
    div.textContent = msg.text;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    return;
  }

  const tierName = msg.tier||'Sub3';
  const cls = rankClass(tierName);
  const emoji = msg.tierEmoji||getTierEmoji(msg.elo||400);
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    : getTime();

  const photoHTML = msg.photoURL
    ? `<img src="${escapeHtml(msg.photoURL)}" class="chat-msg-avatar" onerror="this.style.display='none'">`
    : `<div class="chat-msg-avatar-fallback">${escapeHtml((msg.name||'?')[0].toUpperCase())}</div>`;

  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `
    <div class="chat-msg-left">${photoHTML}</div>
    <div class="chat-msg-right">
      <div class="chat-msg-top">
        <span class="chat-msg-name">${escapeHtml(msg.name)}</span>
        <span class="rank-pill ${cls}">${emoji} ${tierName}</span>
        <span class="chat-msg-time">${time}</span>
      </div>
      <div class="chat-msg-text">${escapeHtml(msg.text)}</div>
    </div>`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function sendChat() {
  const msgEl = document.getElementById('chatMsgIn');
  if (!msgEl) return;
  const text = msgEl.value.trim();
  if (!text) return;

  // Must be logged in
  if (!myUid || !myUsername) {
    chatSys('Sign in to chat');
    return;
  }

  if (!wsSend({ type:'chat', text })) {
    chatSys('Reconnecting...');
    connectWS(pageOnMsg);
    return;
  }
  msgEl.value = '';
}

/* ═══════════════════════════════════
   LEADERBOARD (from Firestore via auth.js)
═══════════════════════════════════ */
function loadLeaderboard(containerId) {
  // Use Firestore leaderboard if auth is loaded
  if (window.getFirestoreLeaderboard) {
    window.getFirestoreLeaderboard(containerId);
  } else {
    // Fallback — wait for auth to load
    setTimeout(()=>{
      if (window.getFirestoreLeaderboard) window.getFirestoreLeaderboard(containerId);
    }, 2000);
  }
}

/* ═══════════════════════════════════
   ACTIVITY FEED
═══════════════════════════════════ */
const _actNames=['ApexK','NordicG','ZeusMode','IronWill','PhiRatio','SilentMax','CanthalK','JawGod','MewingPro','LooksMax'];
function startActivityFeed() {
  const el = document.getElementById('activityFeed');
  if (!el) return;
  function add() {
    const n1=_actNames[Math.floor(Math.random()*_actNames.length)];
    let n2=_actNames[Math.floor(Math.random()*_actNames.length)];
    while(n2===n1) n2=_actNames[Math.floor(Math.random()*_actNames.length)];
    const elo=Math.floor(Math.random()*28+10);
    const div=document.createElement('div');
    div.className='activity-item';
    div.innerHTML=`<span class="activity-name">${n1}</span> beat <span class="activity-name">${n2}</span> <span class="activity-elo">+${elo} ELO</span>`;
    el.prepend(div);
    while(el.children.length>6) el.removeChild(el.lastChild);
    setTimeout(add, 4000+Math.random()*6000);
  }
  for(let i=0;i<4;i++) setTimeout(()=>{
    const n1=_actNames[Math.floor(Math.random()*_actNames.length)];
    const n2=_actNames[Math.floor(Math.random()*_actNames.length)];
    const elo=Math.floor(Math.random()*28+10);
    const div=document.createElement('div');
    div.className='activity-item';
    div.innerHTML=`<span class="activity-name">${n1}</span> beat <span class="activity-name">${n2}</span> <span class="activity-elo">+${elo} ELO</span>`;
    el.appendChild(div);
  },i*500);
  setTimeout(add,4500);
}

/* ═══════════════════════════════════
   INJECT SHARED UI
═══════════════════════════════════ */
function injectSharedUI() {
  const path = window.location.pathname.split('/').pop()||'index.html';
  const isLoggedIn = !!myUid && !!myUsername;

  /* ── NAV ── */
  const nav = document.createElement('nav');
  nav.className = 'top-nav';
  nav.innerHTML = `
    <a class="nav-logo" href="index.html">MOGME.TV</a>
    <div class="nav-links">
      <a class="nav-link" href="index.html">HOME</a>
      <a class="nav-link" href="arena.html">⚔ ARENA</a>
      <a class="nav-link" href="lab.html">🧬 LAB</a>
      <a class="nav-link" href="rank.html">🏆 RANK</a>
      <a class="nav-link" href="private.html">🔒 PRIVATE</a>
    </div>
    <div class="nav-right">
      <div class="nav-online"><div class="nav-dot"></div><span class="online-count-val">— online</span></div>
      <button class="nav-claim-btn" onclick="openClaimModal()">CLAIM RANK</button>
    </div>`;
  document.body.prepend(nav);

  // Active link
  nav.querySelectorAll('.nav-link').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('/').pop();
    if(href===path||(path===''&&href==='index.html')) a.classList.add('active');
  });

  /* ── GUEST BANNER ── */
  const banner = document.createElement('div');
  banner.className = 'guest-banner';
  banner.id = 'guestBanner';
  banner.innerHTML = `
    You're playing as a Guest.
    <a href="#" onclick="openClaimModal();return false;">Click here to claim your rank</a>
    and save your ELO permanently.
    <button class="guest-banner-close" onclick="document.getElementById('guestBanner').style.display='none'">✕</button>`;
  nav.after(banner);

  /* ── CHAT SIDEBAR ── */
  const chat = document.createElement('div');
  chat.className = 'chat-sidebar';
  chat.innerHTML = `
    <div class="chat-head">
      <div class="chat-head-title">💬 LIVE CHAT</div>
      <div class="chat-head-right">
        <div class="chat-head-dot"></div>
        <span class="online-count-val">—</span>
      </div>
    </div>
    <div class="chat-msgs" id="chatMsgs"></div>
    <div class="chat-input-section">
      ${isLoggedIn ? `
        <div class="chat-input-row">
          <input type="text" class="chat-in" id="chatMsgIn" placeholder="Say something..." maxlength="200" onkeydown="if(event.key==='Enter')sendChat()">
          <button class="chat-send" onclick="sendChat()">➤</button>
        </div>
      ` : `
        <div class="chat-signin-prompt" onclick="openClaimModal()">
          <span>🔒 Sign in to chat</span>
        </div>
      `}
    </div>
    <div class="chat-info-section">
      <div class="chat-info-row"><span class="chat-info-dot"></span><span id="chatInfoOnline">— online now</span></div>
      <div class="chat-info-row"><span>🏆</span><span>Season 1 active</span></div>
      <div class="chat-info-divider"></div>
      <div class="chat-info-rules">
        <div class="chat-info-rules-title">CHAT RULES</div>
        <div class="chat-info-rule">No spam or self-promotion</div>
        <div class="chat-info-rule">No slurs or hate speech</div>
        <div class="chat-info-rule">Keep it competitive & clean</div>
        <div class="chat-info-rule">Chat resets every 45 minutes</div>
      </div>
    </div>`;
  document.body.appendChild(chat);

  /* ── HIDDEN INPUT for username (used internally) ── */
  const hiddenName = document.createElement('input');
  hiddenName.type='hidden'; hiddenName.id='chatNameIn';
  hiddenName.value = myUsername || myName;
  document.body.appendChild(hiddenName);

  /* ── HOW TO MOG MODAL ── */
  const howModal = document.createElement('div');
  howModal.className='modal-overlay'; howModal.id='howModal';
  howModal.onclick=e=>{if(e.target===howModal)closeModal('howModal');};
  const howItems=[
    {icon:'👁',title:'EYES FORWARD',desc:'Keep your face centered and chin level. One face per frame.'},
    {icon:'📈',title:'WIN TO RISE',desc:'Beat higher-ranked opponents for bigger ELO gains.'},
    {icon:'🚫',title:'NO BAILING',desc:'Leaving mid-match forfeits and costs 7 ELO.'},
    {icon:'🔐',title:'STAYS PRIVATE',desc:'Your camera runs in your browser only. Nothing recorded.'},
    {icon:'🔒',title:'LOCK YOUR RANK',desc:'Sign in to save your ELO, history and identity.'},
    {icon:'💡',title:'FACE THE LIGHT',desc:'Front lighting gives the clearest scan. Clean your lens.'},
  ];
  howModal.innerHTML=`<div class="modal-box" style="max-width:580px;">
    <button class="modal-close" onclick="closeModal('howModal')">✕</button>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;padding:16px;background:var(--surface2);border-radius:12px;border:1px solid var(--border);">
      <div style="width:44px;height:44px;border-radius:10px;background:var(--teal-dim);border:1px solid rgba(13,242,200,0.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">❓</div>
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:20px;letter-spacing:1px;">HOW TO MOG</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;margin-top:2px;">QUICK RULES FOR CLEANER SCANS AND FAIRER MATCHES</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      ${howItems.map(p=>`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:16px;">
        <div style="font-size:24px;margin-bottom:10px;">${p.icon}</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;letter-spacing:1px;margin-bottom:5px;">${p.title}</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.5;">${p.desc}</div>
      </div>`).join('')}
    </div>
  </div>`;
  document.body.appendChild(howModal);

  /* ── CLAIM MODAL ── */
  const claimModal = document.createElement('div');
  claimModal.className='modal-overlay'; claimModal.id='claimModal';
  claimModal.onclick=e=>{if(e.target===claimModal)closeModal('claimModal');};
  claimModal.innerHTML=`<div class="modal-box" style="max-width:420px;text-align:center;background:linear-gradient(135deg,#1a1030,#13131f);">
    <button class="modal-close" onclick="closeModal('claimModal')">✕</button>
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:42px;letter-spacing:2px;line-height:1;margin-bottom:14px;">LOCK IN YOUR<br>RANK</div>
    <p style="font-size:14px;color:var(--muted);line-height:1.7;margin-bottom:18px;">Sign in to permanently save your ELO,<br>match history and leaderboard identity.</p>
    <div style="display:inline-flex;align-items:center;gap:8px;background:var(--violet-dim);border:1px solid rgba(123,97,255,0.25);border-radius:999px;padding:6px 16px;margin-bottom:22px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#7b61ff;">✓ ELO, history and identity preserved</div>
    <button id="googleSignInBtn" onclick="handleGoogleSignIn()" style="width:100%;padding:15px;border-radius:12px;border:none;background:#fff;color:#080810;font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:opacity 0.2s;">
      <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Continue with Google
    </button>
    <p style="margin-top:12px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted2);">By continuing, you agree to our <a href="#" style="color:var(--teal);">Terms</a> and <a href="#" style="color:var(--teal);">Privacy Policy</a></p>
  </div>`;
  document.body.appendChild(claimModal);
}

/* ── MODAL HELPERS ── */
function openModal(id)    { const el=document.getElementById(id); if(el) el.classList.add('open'); }
function closeModal(id)   { const el=document.getElementById(id); if(el) el.classList.remove('open'); }
function openClaimModal() { openModal('claimModal'); }
function openHowModal()   { openModal('howModal'); }

async function handleGoogleSignIn() {
  if (window.signInWithGoogle) {
    await window.signInWithGoogle();
  } else {
    alert('Auth loading — try again in a moment');
  }
}

setInterval(()=>wsSend({type:'ping'}), 25000);
