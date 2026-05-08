/* ═══════════════════════════════════
   MOGME.TV — SHARED.JS v5
   All security & polish fixes applied
═══════════════════════════════════ */

const SERVER_WS   = 'wss://mogmetv-production.up.railway.app';
const SERVER_HTTP = 'https://mogmetv-production.up.railway.app';

let ws = null, mySocketId = null, reconnectTimer = null, pageOnMsg = null;

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
function getTime() {
  return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}

/* ════════════════════════════════
   PROFANITY / SLUR BLOCKLIST
   Used by chat, comments, usernames sitewide.
════════════════════════════════ */
window.MGM_BAD_WORDS = [
  'nigger','nigga','niger','n1gger','n1gga','chink','gook','spic','kike','wetback',
  'beaner','towelhead','sandnigger','sandnigga','coon','cracka','cracker','jewboy',
  'faggot','fagot','fag','f4g','f4ggot','tranny','dyke','homo','queer',
  'bitch','b1tch','cunt','c0nt','whore','slut','hoe',
  'retard','retarded','retart','ret4rd',
  'fuck','fck','phuck','shit','sh1t','asshole','assh0le','dick','d1ck','cock','c0ck',
  'pussy','pu55y','bastard',
  'porn','xxx','nude','naked','rape','rapist','pedo','pedophile','molest',
  'kys','suicide','nazi','hitler','isis','terrorist'
];
window.containsProfanity = function(text) {
  if (!text) return null;
  var cleaned = String(text).toLowerCase()
    .replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e').replace(/4/g,'a')
    .replace(/5/g,'s').replace(/7/g,'t').replace(/_/g,'').replace(/\s+/g,'');
  for (var i=0; i<window.MGM_BAD_WORDS.length; i++) {
    if (cleaned.indexOf(window.MGM_BAD_WORDS[i]) >= 0) return window.MGM_BAD_WORDS[i];
  }
  return null;
};

/* ════════════════════════════════
   WEBSOCKET
════════════════════════════════ */
function connectWS(onMsg) {
  pageOnMsg = onMsg || null;
  if (ws && (ws.readyState===WebSocket.OPEN||ws.readyState===WebSocket.CONNECTING)) return;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer=null; }
  try { ws = new WebSocket(SERVER_WS); } catch(e) {
    chatSys('Server unavailable — retrying...');
    reconnectTimer = setTimeout(()=>connectWS(pageOnMsg), 5000); return;
  }
  ws.onopen = () => {
    chatSys('Connected ✓');
    // Send real stats to server — server will overwrite with Firestore values
    wsSend({
      type:'set_user',
      name:     myUsername || myName,
      username: myUsername,
      photoURL: myPhoto,
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
// Expose globally so auth.js can call it after login
window.wsSend = wsSend;

/* ════════════════════════════════
   SHARED MESSAGE HANDLER
════════════════════════════════ */
function handleShared(msg) {
  switch(msg.type) {
    case 'welcome':
      mySocketId = msg.socketId;
      updateOnlineUI(msg.onlineCount);
      if (msg.chatHistory) msg.chatHistory.forEach(m=>renderChatMsg(m));
      break;
    case 'user_updated':
      // Server sent back authoritative stats — sync to localStorage
      if (msg.user) {
        if (msg.user.elo   !== undefined) { myElo    = msg.user.elo;    localStorage.setItem('mgm_elo',    myElo); }
        if (msg.user.wins  !== undefined) { myWins   = msg.user.wins;   localStorage.setItem('mgm_wins',   myWins); }
        if (msg.user.losses!== undefined) { myLosses = msg.user.losses; localStorage.setItem('mgm_losses', myLosses); }
      }
      // Update ELO bar with accurate progress from server
      if (msg.progress) updateEloBar(msg.progress);
      break;
    case 'chat':       renderChatMsg(msg.message); break;
    case 'chat_reset':
      const el = document.getElementById('chatMsgs');
      if (el) el.innerHTML = '';
      renderChatMsg(msg.message);
      break;
    case 'online_count': updateOnlineUI(msg.count); break;
    case 'match_result':
      // Server is authoritative — sync ELO from server result
      if (msg.newElo !== undefined) {
        myElo = msg.newElo;
        localStorage.setItem('mgm_elo', myElo);
      }
      // Only ranked matches change W/L and persist to Firestore.
      // msg.unranked is set true by server for private matches.
      if (!msg.unranked) {
        if (msg.won) { myWins++;   localStorage.setItem('mgm_wins',   myWins); }
        else         { myLosses++; localStorage.setItem('mgm_losses', myLosses); }
        // Persist to Firestore as a safety net — works even if server lacks admin SDK
        if (typeof window.saveEloToFirestore === 'function') {
          // ELO persistence is server-authoritative.
        }
      }
      break;
    case 'chat_error': chatSys('⚠ '+msg.error); break;
    case 'auth_error': chatSys('Auth warning: '+msg.error); break;
    case 'banned':
      alert(msg.message || 'You have been banned from MogMe.TV.');
      window.location.href = 'index.html';
      break;
  }
}

function updateOnlineUI(count) {
  if (count==null) return;
  document.querySelectorAll('.online-count-val').forEach(el=>{
    el.textContent = Number(count).toLocaleString()+' online';
  });
  const infoOnline = document.getElementById('chatInfoOnline');
  if (infoOnline) infoOnline.textContent = Number(count).toLocaleString()+' online now';
}

/* ════════════════════════════════
   CHAT
════════════════════════════════ */
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
  if (!myUid || !myUsername) { chatSys('Sign in to chat'); return; }
  // Profanity filter — also reject bypasses via leet-speak
  const bad = window.containsProfanity && window.containsProfanity(text);
  if (bad) { chatSys('Message blocked — restricted language'); msgEl.value=''; return; }
  if (!wsSend({ type:'chat', text })) { chatSys('Reconnecting...'); connectWS(pageOnMsg); return; }
  msgEl.value = '';
}

/* ════════════════════════════════
   LEADERBOARD — with skeleton screens
   Uses Firestore via auth.js
════════════════════════════════ */
function loadLeaderboard(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  // Show skeleton while loading
  el.innerHTML = [1,2,3,4,5].map(()=>`
    <div class="skeleton-row">
      <div class="skeleton skeleton-avatar"></div>
      <div class="skeleton-text-wrap">
        <div class="skeleton skeleton-text long"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
      <div class="skeleton skeleton-elo"></div>
    </div>`).join('');
  // Use Firestore leaderboard if auth is loaded
  const attempt = () => {
    if (window.getFirestoreLeaderboard) {
      window.getFirestoreLeaderboard(containerId);
    } else {
      setTimeout(attempt, 500);
    }
  };
  attempt();
}

/* ════════════════════════════════
   ACTIVITY FEED
════════════════════════════════ */
const _actNames=['ApexK','NordicG','ZeusMode','IronWill','PhiRatio','SilentMax','CanthalK','JawGod','MewingPro','LooksMax','NTfacial','SigmaFace'];
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
  }, i*500);
  setTimeout(add, 4500);
}

/* ════════════════════════════════
   AGE GATE — 18+ confirmation
════════════════════════════════ */
function injectAgeGate() {
  if (localStorage.getItem('mgm_age_ok') === '1') return;
  // Don't show on admin or setup pages
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (path === 'admin.html') return;

  const gate = document.createElement('div');
  gate.id = 'ageGate';
  gate.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.94);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:20px;';
  gate.innerHTML = `
    <div style="max-width:440px;width:100%;background:#0a0a14;border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:32px;text-align:center;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:3px;color:#666;margin-bottom:8px;">⚠ AGE VERIFICATION</div>
      <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:26px;color:#fff;margin-bottom:14px;letter-spacing:-0.3px;">Are you 18 or older?</div>
      <div style="font-size:13px;color:#888;line-height:1.6;margin-bottom:24px;">
        MogMe.TV is intended for adults only. By continuing you confirm that you are at least 18 years of age and agree to our Terms of Service and Privacy Policy.
      </div>
      <div style="display:flex;gap:10px;">
        <button id="ageNo" style="flex:1;padding:13px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:#888;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:500;cursor:pointer;">I'm under 18</button>
        <button id="ageYes" style="flex:1;padding:13px;border-radius:8px;border:none;background:#4A9EFF;color:#000;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">Yes, I'm 18+</button>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#444;letter-spacing:1px;margin-top:14px;">Misrepresenting your age is a violation of our Terms of Service.</div>
    </div>`;
  document.body.appendChild(gate);
  document.getElementById('ageYes').onclick = () => {
    localStorage.setItem('mgm_age_ok', '1');
    gate.remove();
  };
  document.getElementById('ageNo').onclick = () => {
    window.location.replace('https://www.google.com');
  };
}

/* ════════════════════════════════
   INJECT SHARED UI
════════════════════════════════ */
function injectSharedUI() {
  injectAgeGate();
  const path = window.location.pathname.split('/').pop()||'index.html';
  const isLoggedIn = !!myUid && !!myUsername;

  /* NAV */
  const nav = document.createElement('nav');
  nav.className = 'top-nav';
  nav.innerHTML = `
    <a class="nav-logo" href="index.html">MOGME.TV</a>
    <div class="nav-links">
      <a class="nav-link" href="index.html">HOME</a>
      <a class="nav-link" href="arena.html">⚔ ARENA</a>
      <span class="nav-link-disabled" onclick="window.openLabSoonModal&&window.openLabSoonModal()">🧬 LAB</span>
      <a class="nav-link" href="rank.html">🏆 RANK</a>
      <a class="nav-link" href="private.html">🔒 PRIVATE</a>
      <a class="nav-link" href="messages.html">✉ MESSAGES</a>
    </div>
    <div class="nav-right">
      <div class="nav-online"><div class="nav-dot"></div><span class="online-count-val">— online</span></div>
      <button class="nav-claim-btn" id="navClaimBtn" onclick="openClaimModal()">CLAIM RANK</button>
    </div>`;
  document.body.prepend(nav);

  nav.querySelectorAll('.nav-link').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('/').pop();
    if(href===path||(path===''&&href==='index.html')) a.classList.add('active');
  });

  /* GUEST BANNER */
  const banner = document.createElement('div');
  banner.className='guest-banner'; banner.id='guestBanner';
  banner.innerHTML=`
    You're playing as a Guest.
    <a href="#" onclick="openClaimModal();return false;">Click here to claim your rank</a>
    and save your ELO permanently.
    <button class="guest-banner-close" onclick="document.getElementById('guestBanner').style.display='none'">✕</button>`;
  nav.after(banner);

  /* CHAT SIDEBAR */
  const chat = document.createElement('div');
  chat.className = 'chat-sidebar';
  chat.innerHTML = `
    <div class="chat-head">
      <div class="chat-head-title">💬 LIVE CHAT</div>
      <div class="chat-head-right"><div class="chat-head-dot"></div><span class="online-count-val">—</span></div>
    </div>
    <div class="chat-msgs" id="chatMsgs"></div>
    <div class="chat-input-section">
      <div class="chat-input-row" id="chatInputRow" style="display:${isLoggedIn?'flex':'none'};">
        <input type="text" class="chat-in" id="chatMsgIn" placeholder="Say something..." maxlength="200" onkeydown="if(event.key==='Enter')sendChat()">
        <button class="chat-send" onclick="sendChat()">➤</button>
      </div>
      <div class="chat-signin-prompt" id="chatSigninPrompt" style="display:${isLoggedIn?'none':'block'};" onclick="openClaimModal()">🔒 Sign in to chat</div>
    </div>
    <div class="chat-info-section">
      <div class="chat-info-row"><span class="chat-info-dot"></span><span id="chatInfoOnline">— online now</span></div>
      <div class="chat-info-row"><span>🏆</span><span>Season 1 · Ends Jun 6 2026</span></div>
      <div class="chat-info-divider"></div>
      <div class="chat-info-rules-title">CHAT RULES</div>
      <div class="chat-info-rule">No spam or self-promotion</div>
      <div class="chat-info-rule">No slurs or hate speech</div>
      <div class="chat-info-rule">Keep it competitive & clean</div>
      <div class="chat-info-rule">Chat resets every 45 minutes</div>
    </div>`;
  document.body.appendChild(chat);

  /* HIDDEN username input */
  const h = document.createElement('input');
  h.type='hidden'; h.id='chatNameIn'; h.value=myUsername||myName;
  document.body.appendChild(h);

  /* HOW TO MOG MODAL */
  const howModal = document.createElement('div');
  howModal.className='modal-overlay'; howModal.id='howModal';
  howModal.onclick=e=>{if(e.target===howModal)closeModal('howModal');};
  const howItems=[
    {icon:'👁',title:'EYES ON SCREEN',desc:'Keep your face centered and chin level. One face per frame only.'},
    {icon:'📈',title:'WIN TO RISE',desc:'Beat higher-ranked opponents for bigger ELO gains. Every match counts.'},
    {icon:'🚫',title:'NO BAILING',desc:'Leaving an active match forfeits the round and costs you ELO.'},
    {icon:'🔐',title:'PEER-TO-PEER VIDEO',desc:'Video connects directly between players. The server handles matchmaking and scores, not recordings.'},
    {icon:'🔒',title:'LOCK IN YOUR RANK',desc:'Sign in to save your ELO, match history and leaderboard identity.'},
    {icon:'💡',title:'GOOD LIGHTING',desc:'Face the light source. Clean your lens for the most accurate scan.'},
  ];
  howModal.innerHTML=`<div class="modal-box" style="max-width:580px;">
    <button class="modal-close" onclick="closeModal('howModal')">✕</button>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;padding:16px;background:var(--surface2);border-radius:12px;border:1px solid var(--border);">
      <div style="width:44px;height:44px;border-radius:10px;background:var(--teal-dim);border:1px solid rgba(13,242,200,0.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">⚔️</div>
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

  /* LAB COMING SOON MODAL */
  if (!document.getElementById('labSoonModal')) {
    const labModal = document.createElement('div');
    labModal.className='modal-overlay'; labModal.id='labSoonModal';
    labModal.onclick=e=>{if(e.target===labModal)closeModal('labSoonModal');};
    labModal.innerHTML=`<div class="modal-box" style="max-width:400px;text-align:center;">
      <button class="modal-close" onclick="closeModal('labSoonModal')">✕</button>
      <div style="font-size:52px;margin-bottom:16px;">🧬</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:28px;letter-spacing:1px;margin-bottom:10px;">COMING SOON</div>
      <div style="font-size:14px;color:var(--muted);line-height:1.7;margin-bottom:20px;">We're fine-tuning our facial detection algorithm to make it the most accurate attractiveness scan on the internet.<br><br>Our team is working hard to get it right. Stay tuned.</div>
      <div style="display:inline-flex;align-items:center;gap:6px;background:var(--teal-dim);border:1px solid rgba(13,242,200,0.2);border-radius:999px;padding:6px 16px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--teal);">⚗️ Algorithm in development</div>
    </div>`;
    document.body.appendChild(labModal);
  }
  window.openLabSoonModal = () => openModal('labSoonModal');

  /* CLAIM MODAL */
  const claimModal = document.createElement('div');
  claimModal.className='modal-overlay'; claimModal.id='claimModal';
  claimModal.onclick=e=>{if(e.target===claimModal)closeModal('claimModal');};
  claimModal.innerHTML=`<div class="modal-box" style="max-width:420px;text-align:center;background:linear-gradient(135deg,#1a1030,#13131f);">
    <button class="modal-close" onclick="closeModal('claimModal')">✕</button>
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:42px;letter-spacing:2px;line-height:1;margin-bottom:14px;">LOCK IN YOUR<br>RANK</div>
    <p style="font-size:14px;color:var(--muted);line-height:1.7;margin-bottom:18px;">Sign in to permanently save your ELO,<br>match history and leaderboard identity.</p>
    <div style="display:inline-flex;align-items:center;gap:8px;background:var(--violet-dim);border:1px solid rgba(123,97,255,0.25);border-radius:999px;padding:6px 16px;margin-bottom:22px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#7b61ff;">✓ ELO, history and identity preserved</div>
    <button id="googleSignInBtn" onclick="handleGoogleSignIn()" style="width:100%;padding:15px;border-radius:12px;border:none;background:#fff;color:#080810;font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">
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
  const btn = document.getElementById('googleSignInBtn');
  if (btn) { btn.textContent = 'Redirecting to Google...'; btn.disabled = true; }
  let attempts = 0;
  while (!window.signInWithGoogle && attempts < 50) {
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }
  if (!window.signInWithGoogle) {
    if (btn) { btn.innerHTML = 'Continue with Google'; btn.disabled = false; }
    alert('Auth not loaded — please refresh and try again.');
    return;
  }
  try { await window.signInWithGoogle(); }
  catch(e) { if (btn) { btn.innerHTML = 'Continue with Google'; btn.disabled = false; } }
}

setInterval(()=>wsSend({type:'ping'}), 25000);

/* ════════════════════════════════
   DYNAMIC ELO PROGRESS BAR
   Uses tier floor/ceiling math —
   not hardcoded percentages
════════════════════════════════ */
const TIER_FLOORS = [
  { name:'Slayer',   min:5001 },
  { name:'Chad',     min:3501 },
  { name:'Chadlite', min:2001 },
  { name:'HTN',      min:1501 },
  { name:'MTN',      min:1001 },
  { name:'LTN',      min:501  },
  { name:'Sub3',     min:1    },
  { name:'Molecule', min:0    },
];

function calcEloProgress(elo) {
  const idx   = TIER_FLOORS.findIndex(t => elo >= t.min);
  const curr  = TIER_FLOORS[idx]   || TIER_FLOORS[TIER_FLOORS.length-1];
  const next  = TIER_FLOORS[idx-1] || null;
  const floor   = curr.min;
  const ceiling = next ? next.min : floor + 500;
  const range   = ceiling - floor;
  const pct     = range > 0 ? Math.min(100, Math.max(0, ((elo-floor)/range)*100)) : 100;
  return { pct:Math.round(pct), floor, ceiling, eloNeeded:next?Math.max(0,next.min-elo):0, nextTier:next?.name||null };
}

function updateEloBar(progress) {
  // progress can come from server msg.progress (uses .progress) or be calculated locally (uses .pct)
  const p = progress || calcEloProgress(myElo);
  const pct = (p.pct != null) ? p.pct : (p.progress != null ? p.progress : 0);
  const fill = document.getElementById('eloBarFill');
  if (fill) {
    setTimeout(() => { fill.style.width = pct + '%'; }, 300);
  }
  // Update by ID first (more reliable than span index)
  const pctEl = document.getElementById('eloBarPct');
  const needEl = document.getElementById('eloBarNeeded');
  if (pctEl) pctEl.textContent = pct + '%';
  if (needEl) needEl.textContent = p.eloNeeded > 0 ? p.eloNeeded + ' TO NEXT' : 'MAX TIER';
  // Fallback for any other elo bars without IDs
  const labels = document.querySelectorAll('.elo-bar-labels');
  labels.forEach(el => {
    const spans = el.querySelectorAll('span');
    if (spans[0] && !spans[0].id) spans[0].textContent = pct + '%';
    if (spans[1] && !spans[1].id) spans[1].textContent = p.eloNeeded > 0 ? p.eloNeeded + ' ELO NEEDED' : 'MAX TIER';
  });
}
