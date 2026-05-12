/* ═══════════════════════════════════
   MOGME.TV — SHARED.JS v6
   Luxury redesign edition
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

/* ── DYNAMIC ELO PROGRESS ── */
const TIER_FLOORS=[
  {name:'Slayer',min:5001},{name:'Chad',min:3501},{name:'Chadlite',min:2001},
  {name:'HTN',min:1501},{name:'MTN',min:1001},{name:'LTN',min:501},
  {name:'Sub3',min:1},{name:'Molecule',min:0},
];
function calcEloProgress(elo){
  const idx=TIER_FLOORS.findIndex(t=>elo>=t.min);
  const curr=TIER_FLOORS[idx]||TIER_FLOORS[TIER_FLOORS.length-1];
  const next=TIER_FLOORS[idx-1]||null;
  const floor=curr.min, ceiling=next?next.min:floor+500;
  const range=ceiling-floor;
  const pct=range>0?Math.min(100,Math.max(0,((elo-floor)/range)*100)):100;
  return {pct:Math.round(pct),floor,ceiling,eloNeeded:next?Math.max(0,next.min-elo):0,nextTier:next?.name||null};
}
function updateEloBar(progress){
  const p=progress||calcEloProgress(myElo);
  const fill=document.getElementById('eloBarFill');
  if(fill) setTimeout(()=>{fill.style.width=p.pct+'%';},400);
  document.querySelectorAll('.elo-bar-labels').forEach(el=>{
    const s=el.querySelectorAll('span');
    if(s[0]) s[0].textContent=p.pct+'%';
    if(s[1]) s[1].textContent=p.eloNeeded>0?p.eloNeeded+' TO NEXT':'MAX TIER';
  });
}

/* ════════════════════════════════
   WEBSOCKET
════════════════════════════════ */
function connectWS(onMsg) {
  pageOnMsg = onMsg || null;
  if (ws && (ws.readyState===WebSocket.OPEN||ws.readyState===WebSocket.CONNECTING)) return;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer=null; }
  try { ws = new WebSocket(SERVER_WS); } catch(e) {
    chatSys('Server unavailable — retrying...');
    reconnectTimer=setTimeout(()=>connectWS(pageOnMsg),5000); return;
  }
  ws.onopen = () => {
    chatSys('Connected');
    wsSend({ type:'set_user', name:myUsername||myName, username:myUsername, uid:myUid, photoURL:myPhoto, elo:myElo, wins:myWins, losses:myLosses });
  };
  ws.onmessage = (e) => {
    let msg; try{msg=JSON.parse(e.data);}catch{return;}
    handleShared(msg);
    if(typeof pageOnMsg==='function') pageOnMsg(msg);
  };
  ws.onclose = () => {
    chatSys('Reconnecting...');
    ws=null; reconnectTimer=setTimeout(()=>connectWS(pageOnMsg),3000);
  };
  ws.onerror = ()=>{};
}

function wsSend(data) {
  if(ws&&ws.readyState===WebSocket.OPEN){ws.send(JSON.stringify(data));return true;}
  return false;
}
window.wsSend = wsSend;

/* ════════════════════════════════
   MESSAGE HANDLER
════════════════════════════════ */
function handleShared(msg) {
  switch(msg.type) {
    case 'welcome':
      mySocketId=msg.socketId;
      updateOnlineUI(msg.onlineCount);
      if(msg.chatHistory) msg.chatHistory.forEach(m=>renderChatMsg(m));
      break;
    case 'user_updated':
      if(msg.user){
        if(msg.user.elo!==undefined){myElo=msg.user.elo;localStorage.setItem('mgm_elo',myElo);}
        if(msg.user.wins!==undefined){myWins=msg.user.wins;localStorage.setItem('mgm_wins',myWins);}
        if(msg.user.losses!==undefined){myLosses=msg.user.losses;localStorage.setItem('mgm_losses',myLosses);}
      }
      if(msg.progress) updateEloBar(msg.progress);
      break;
    case 'chat': renderChatMsg(msg.message); break;
    case 'chat_reset':
      const el=document.getElementById('chatMsgs');
      if(el) el.innerHTML='';
      renderChatMsg(msg.message);
      break;
    case 'online_count': updateOnlineUI(msg.count); break;
    case 'match_result':
      if(msg.newElo!==undefined){myElo=msg.newElo;localStorage.setItem('mgm_elo',myElo);}
      if(msg.won){myWins++;localStorage.setItem('mgm_wins',myWins);}
      else{myLosses++;localStorage.setItem('mgm_losses',myLosses);}
      break;
    case 'chat_error': chatSys(msg.error); break;
    case 'banned':
      alert(msg.message||'You have been banned from MogMe.TV.');
      window.location.href='index.html'; break;
  }
}

function updateOnlineUI(count) {
  if(count==null) return;
  document.querySelectorAll('.online-count-val').forEach(el=>{el.textContent=Number(count).toLocaleString()+' online';});
  const info=document.getElementById('chatInfoOnline');
  if(info) info.textContent=Number(count).toLocaleString()+' online';
}

/* ════════════════════════════════
   CHAT
════════════════════════════════ */
function chatSys(text) {
  const el=document.getElementById('chatMsgs');
  if(!el) return;
  const div=document.createElement('div');
  div.className='chat-sys'; div.textContent='— '+text+' —';
  el.appendChild(div); el.scrollTop=el.scrollHeight;
}

function renderChatMsg(msg) {
  const el=document.getElementById('chatMsgs');
  if(!el||!msg) return;
  if(msg.isSystem){
    const div=document.createElement('div');
    div.className='chat-sys-important'; div.textContent=msg.text;
    el.appendChild(div); el.scrollTop=el.scrollHeight; return;
  }
  const tierName=msg.tier||'Sub3';
  const cls=rankClass(tierName);
  const emoji=msg.tierEmoji||getTierEmoji(msg.elo||400);
  const time=msg.timestamp?new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):getTime();
  const photoHTML=msg.photoURL
    ?`<img src="${escapeHtml(msg.photoURL)}" class="chat-msg-avatar" onerror="this.style.display='none'">`
    :`<div class="chat-msg-avatar-fallback">${escapeHtml((msg.name||'?')[0].toUpperCase())}</div>`;
  const div=document.createElement('div');
  div.className='chat-msg';
  div.innerHTML=`
    <div class="chat-msg-left">${photoHTML}</div>
    <div class="chat-msg-right">
      <div class="chat-msg-top">
        <span class="chat-msg-name">${escapeHtml(msg.name)}</span>
        <span class="rank-pill ${cls}">${emoji} ${tierName}</span>
        <span class="chat-msg-time">${time}</span>
      </div>
      <div class="chat-msg-text">${escapeHtml(msg.text)}</div>
    </div>`;
  el.appendChild(div); el.scrollTop=el.scrollHeight;
}

function sendChat() {
  const msgEl=document.getElementById('chatMsgIn');
  if(!msgEl) return;
  const text=msgEl.value.trim();
  if(!text) return;
  if(!myUid||!myUsername){chatSys('Sign in to chat');return;}
  if(!wsSend({type:'chat',text})){chatSys('Reconnecting...');connectWS(pageOnMsg);return;}
  msgEl.value='';
}

/* ════════════════════════════════
   LEADERBOARD
════════════════════════════════ */
function loadLeaderboard(containerId) {
  const el=document.getElementById(containerId);
  if(!el) return;
  el.innerHTML=[1,2,3,4,5].map(()=>`
    <div class="skeleton-row">
      <div class="skeleton skeleton-avatar"></div>
      <div class="skeleton-text-wrap">
        <div class="skeleton skeleton-text long"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
      <div class="skeleton skeleton-elo"></div>
    </div>`).join('');
  const attempt=()=>{
    if(window.getFirestoreLeaderboard) window.getFirestoreLeaderboard(containerId);
    else setTimeout(attempt,500);
  };
  attempt();
}

/* ════════════════════════════════
   ACTIVITY FEED
════════════════════════════════ */
const _actNames=['ApexK','NordicG','ZeusMode','IronWill','PhiRatio','SilentMax','CanthalK','JawGod','MewingPro','LooksMax'];
function startActivityFeed() {
  const el=document.getElementById('activityFeed');
  if(!el) return;
  function add(){
    const n1=_actNames[Math.floor(Math.random()*_actNames.length)];
    let n2=_actNames[Math.floor(Math.random()*_actNames.length)];
    while(n2===n1) n2=_actNames[Math.floor(Math.random()*_actNames.length)];
    const elo=Math.floor(Math.random()*28+10);
    const div=document.createElement('div'); div.className='activity-item';
    div.innerHTML=`<span class="activity-name">${n1}</span> beat <span class="activity-name">${n2}</span> <span class="activity-elo">+${elo}</span>`;
    el.prepend(div);
    while(el.children.length>6) el.removeChild(el.lastChild);
    setTimeout(add,4000+Math.random()*6000);
  }
  for(let i=0;i<4;i++) setTimeout(()=>{
    const n1=_actNames[Math.floor(Math.random()*_actNames.length)];
    const n2=_actNames[Math.floor(Math.random()*_actNames.length)];
    const elo=Math.floor(Math.random()*28+10);
    const div=document.createElement('div'); div.className='activity-item';
    div.innerHTML=`<span class="activity-name">${n1}</span> beat <span class="activity-name">${n2}</span> <span class="activity-elo">+${elo}</span>`;
    el.appendChild(div);
  },i*500);
  setTimeout(add,4500);
}

/* ════════════════════════════════
   INJECT SHARED UI
════════════════════════════════ */
function injectSharedUI() {
  const path=window.location.pathname.split('/').pop()||'index.html';
  const isLoggedIn=!!myUid&&!!myUsername;

  /* ── FAVICON ── */
  const link=document.createElement('link');
  link.rel='icon'; link.type='image/svg+xml'; link.href='favicon.svg';
  document.head.appendChild(link);

  /* ── NAV ── */
  const nav=document.createElement('nav');
  nav.className='top-nav';
  nav.innerHTML=`
    <a class="nav-logo" href="index.html">MOGME.TV</a>
    <div class="nav-links">
      <a class="nav-link" href="index.html">Home</a>
      <a class="nav-link" href="arena.html">Arena</a>
      <a class="nav-link" href="lab.html">Lab</a>
      <a class="nav-link" href="rank.html">Rank</a>
      <a class="nav-link" href="private.html">Private</a>
      <a class="nav-link" href="messages.html">Inbox</a>
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

  /* ── GUEST BANNER ── */
  const banner=document.createElement('div');
  banner.className='guest-banner'; banner.id='guestBanner';
  banner.innerHTML=`
    You're playing as a guest.
    <a href="#" onclick="openClaimModal();return false;">Sign in to claim your rank</a>
    and save your ELO.
    <button class="guest-banner-close" onclick="document.getElementById('guestBanner').style.display='none'">✕</button>`;
  nav.after(banner);

  /* ── CHAT SIDEBAR ── */
  const chat=document.createElement('div');
  chat.className='chat-sidebar';
  chat.innerHTML=`
    <div class="chat-head">
      <div class="chat-head-title">Live Chat</div>
      <div class="chat-head-right"><div class="chat-head-dot"></div><span class="online-count-val">—</span></div>
    </div>
    <div class="chat-msgs" id="chatMsgs"></div>
    <div class="chat-input-section">
      ${isLoggedIn
        ?`<div class="chat-input-row">
            <input type="text" class="chat-in" id="chatMsgIn" placeholder="Say something..." maxlength="200" onkeydown="if(event.key==='Enter')sendChat()">
            <button class="chat-send" onclick="sendChat()">➤</button>
          </div>`
        :`<div class="chat-signin-prompt" onclick="openClaimModal()">Sign in to chat</div>`
      }
    </div>
    <div class="chat-info-section">
      <div class="chat-info-row"><span class="chat-info-dot"></span><span id="chatInfoOnline">—</span></div>
      <div class="chat-info-row"><span>Season 1 · ends Jun 6 2026</span></div>
      <div class="chat-info-divider"></div>
      <div class="chat-info-rules-title">Rules</div>
      <div class="chat-info-rule">No spam</div>
      <div class="chat-info-rule">No slurs or hate</div>
      <div class="chat-info-rule">Stay competitive</div>
      <div class="chat-info-rule">Resets every 45 min</div>
    </div>`;
  document.body.appendChild(chat);

  /* ── HOW TO MOG MODAL ── */
  const howModal=document.createElement('div');
  howModal.className='modal-overlay'; howModal.id='howModal';
  howModal.onclick=e=>{if(e.target===howModal)closeModal('howModal');};
  const howItems=[
    {title:'Eyes on screen',desc:'Face centered, chin level. One face per frame.'},
    {title:'Win to rise',desc:'Beat higher-ranked opponents for bigger ELO gains.'},
    {title:'No bailing',desc:'Leaving mid-match costs you ELO. Finish what you start.'},
    {title:'100% private',desc:'Your camera never leaves your browser. Nothing recorded.'},
    {title:'Lock in your rank',desc:'Sign in to save ELO, history and identity permanently.'},
    {title:'Good lighting',desc:'Face the light. Clean your lens for the best scan.'},
  ];
  howModal.innerHTML=`<div class="modal-box" style="max-width:560px;">
    <button class="modal-close" onclick="closeModal('howModal')">✕</button>
    <div class="modal-title">How to Mog</div>
    <div class="modal-sub">Quick rules for cleaner scans and fairer matches.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      ${howItems.map(p=>`<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:16px;">
        <div style="font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13px;color:var(--silver);margin-bottom:5px;">${p.title}</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.5;">${p.desc}</div>
      </div>`).join('')}
    </div>
  </div>`;
  document.body.appendChild(howModal);

  /* ── LAB COMING SOON ── */
  if(!document.getElementById('labSoonModal')){
    const labModal=document.createElement('div');
    labModal.className='modal-overlay'; labModal.id='labSoonModal';
    labModal.onclick=e=>{if(e.target===labModal)closeModal('labSoonModal');};
    labModal.innerHTML=`<div class="modal-box" style="max-width:380px;text-align:center;">
      <button class="modal-close" onclick="closeModal('labSoonModal')">✕</button>
      <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:22px;color:var(--white);margin-bottom:10px;">The Lab</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:20px;">We're fine-tuning our facial detection algorithm to make it the most accurate attractiveness scan on the internet.<br><br>Coming soon.</div>
      <div class="tag blue">Algorithm in development</div>
    </div>`;
    document.body.appendChild(labModal);
  }
  window.openLabSoonModal=()=>openModal('labSoonModal');

  /* ── CLAIM MODAL ── */
  const claimModal=document.createElement('div');
  claimModal.className='modal-overlay'; claimModal.id='claimModal';
  claimModal.onclick=e=>{if(e.target===claimModal)closeModal('claimModal');};
  claimModal.innerHTML=`<div class="modal-box" style="max-width:400px;text-align:center;">
    <button class="modal-close" onclick="closeModal('claimModal')">✕</button>
    <div class="modal-title" style="font-size:28px;margin-bottom:8px;">Claim your rank</div>
    <div class="modal-sub">Sign in to permanently save your ELO, match history and leaderboard identity.</div>
    <div class="tag blue" style="margin-bottom:22px;">ELO, history and identity preserved</div>
    <button id="googleSignInBtn" onclick="handleGoogleSignIn()" style="width:100%;padding:14px;border-radius:var(--radius);border:none;background:#fff;color:#000;font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Continue with Google
    </button>
    <p style="margin-top:12px;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted2);letter-spacing:0.5px;">By continuing you agree to our <a href="#" style="color:var(--blue);">Terms</a> and <a href="#" style="color:var(--blue);">Privacy Policy</a></p>
  </div>`;
  document.body.appendChild(claimModal);

  /* ── USER DROPDOWN MENU ── */
  const userMenu=document.createElement('div');
  userMenu.id='userMenu';
  userMenu.style.cssText='position:fixed;top:calc(var(--nav-h)+6px);right:calc(var(--chat-w)+8px);background:var(--bg2);border:1px solid var(--border2);border-radius:var(--radius);padding:6px;min-width:180px;z-index:500;display:none;box-shadow:0 8px 32px rgba(0,0,0,0.8);';
  userMenu.innerHTML=`
    <div id="uMenuHead" style="padding:10px 12px;border-bottom:1px solid var(--border);margin-bottom:4px;">
      <div id="uMenuName" style="font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;color:var(--white);"></div>
      <div id="uMenuElo" style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--blue);margin-top:2px;letter-spacing:0.5px;"></div>
    </div>
    <a href="profile.html" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:4px;color:var(--muted);text-decoration:none;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.5px;transition:all 0.15s;" onmouseover="this.style.background='var(--glass2)';this.style.color='var(--silver)'" onmouseout="this.style.background='';this.style.color='var(--muted)'">My Profile</a>
    <a href="rank.html" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:4px;color:var(--muted);text-decoration:none;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.5px;transition:all 0.15s;" onmouseover="this.style.background='var(--glass2)';this.style.color='var(--silver)'" onmouseout="this.style.background='';this.style.color='var(--muted)'">Global Rank</a>
    <div style="height:1px;background:var(--border);margin:4px 0;"></div>
    <button onclick="signOutUser()" style="width:100%;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:4px;color:var(--red);background:none;border:none;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.5px;cursor:pointer;text-align:left;transition:all 0.15s;" onmouseover="this.style.background='rgba(239,68,68,0.06)'" onmouseout="this.style.background=''">Sign Out</button>`;
  document.body.appendChild(userMenu);
  document.addEventListener('click',e=>{
    const btn=document.getElementById('navClaimBtn');
    if(userMenu.style.display==='block'&&!userMenu.contains(e.target)&&e.target!==btn&&!btn?.contains(e.target)){
      userMenu.style.display='none';
    }
  });
}

/* ── MODAL HELPERS ── */
function openModal(id)    { const el=document.getElementById(id); if(el) el.classList.add('open'); }
function closeModal(id)   { const el=document.getElementById(id); if(el) el.classList.remove('open'); }
function openClaimModal() { openModal('claimModal'); }
function openHowModal()   { openModal('howModal'); }

window.toggleUserMenu = function() {
  const menu=document.getElementById('userMenu');
  if(!menu) return;
  if(menu.style.display==='block'){menu.style.display='none';return;}
  const elo=parseInt(localStorage.getItem('mgm_elo')||'400');
  const name=localStorage.getItem('mgm_username')||localStorage.getItem('mgm_name')||'User';
  const photo=localStorage.getItem('mgm_photo')||'';
  document.getElementById('uMenuName').textContent=name;
  document.getElementById('uMenuElo').textContent=elo+' ELO · '+getTierName(elo);
  menu.style.display='block';
};

async function handleGoogleSignIn() {
  const btn=document.getElementById('googleSignInBtn');
  if(btn){btn.textContent='Opening Google...';btn.disabled=true;}
  let attempts=0;
  while(!window.signInWithGoogle&&attempts<50){await new Promise(r=>setTimeout(r,100));attempts++;}
  if(!window.signInWithGoogle){
    if(btn){btn.innerHTML='Continue with Google';btn.disabled=false;}
    alert('Auth not loaded — please refresh.');
    return;
  }
  try{await window.signInWithGoogle();}
  catch(e){if(btn){btn.innerHTML='Continue with Google';btn.disabled=false;}}
}

setInterval(()=>wsSend({type:'ping'}),25000);
