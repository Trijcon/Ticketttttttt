const SERVER_WS   = 'wss://mogmetv-production.up.railway.app';
const SERVER_HTTP = 'https://mogmetv-production.up.railway.app';

let ws = null, mySocketId = null, reconnectTimer = null, pageOnMsg = null;
let myName   = localStorage.getItem('mgm_name')    || 'Anonymous';
let myElo    = parseInt(localStorage.getItem('mgm_elo')     || '400');
let myWins   = parseInt(localStorage.getItem('mgm_wins')    || '0');
let myLosses = parseInt(localStorage.getItem('mgm_losses')  || '0');

function getTierName(elo) {
  if (elo >= 5001) return 'Slayer';
  if (elo >= 3501) return 'Chad';
  if (elo >= 2001) return 'Chadlite';
  if (elo >= 1501) return 'HTN';
  if (elo >= 1001) return 'MTN';
  if (elo >= 501)  return 'LTN';
  if (elo >= 1)    return 'Sub3';
  return 'Molecule';
}
function getTierEmoji(elo) {
  const map = {Slayer:'💀',Chad:'👑',Chadlite:'🔥',HTN:'⭐',MTN:'⚡',LTN:'🌙',Sub3:'🔴',Molecule:'🧪'};
  return map[getTierName(elo)] || '🔴';
}
function rankClass(t) {
  const map = {Slayer:'slayer',Chad:'chad',Chadlite:'chadlite',HTN:'htn',MTN:'mtn',LTN:'ltn',Sub3:'sub3',Molecule:'molecule'};
  return map[t] || 'sub3';
}
function escapeHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function saveStats() {
  localStorage.setItem('mgm_name', myName);
  localStorage.setItem('mgm_elo', myElo);
  localStorage.setItem('mgm_wins', myWins);
  localStorage.setItem('mgm_losses', myLosses);
}
function getTime() {
  return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

/* ── WEBSOCKET ── */
function connectWS(onMsg) {
  pageOnMsg = onMsg || null;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  try {
    ws = new WebSocket(SERVER_WS);
  } catch(e) {
    chatSys('Server unavailable — retrying...');
    reconnectTimer = setTimeout(() => connectWS(pageOnMsg), 5000);
    return;
  }
  ws.onopen = () => {
    chatSys('Connected to MogMe.TV ✓');
    wsSend({ type: 'set_user', name: myName });
  };
  ws.onmessage = (e) => {
    let msg; try { msg = JSON.parse(e.data); } catch { return; }
    handleShared(msg);
    if (typeof pageOnMsg === 'function') pageOnMsg(msg);
  };
  ws.onclose = () => {
    chatSys('Disconnected — reconnecting...');
    ws = null;
    reconnectTimer = setTimeout(() => connectWS(pageOnMsg), 3000);
  };
  ws.onerror = () => {};
}

function wsSend(data) {
  if (ws && ws.readyState === WebSocket.OPEN) { ws.send(JSON.stringify(data)); return true; }
  return false;
}

function handleShared(msg) {
  switch(msg.type) {
    case 'welcome':
      mySocketId = msg.socketId;
      updateOnlineUI(msg.onlineCount);
      if (msg.chatHistory) msg.chatHistory.forEach(m => renderChatMsg(m));
      break;
    case 'chat': renderChatMsg(msg.message); break;
    case 'online_count': updateOnlineUI(msg.count); break;
    case 'match_result':
      if (msg.newElo !== undefined) myElo = msg.newElo;
      if (msg.won) myWins++; else myLosses++;
      saveStats();
      break;
  }
}

function updateOnlineUI(count) {
  if (count == null) return;
  document.querySelectorAll('.online-count-val').forEach(el => {
    el.textContent = Number(count).toLocaleString() + ' online';
  });
}

/* ── CHAT ── */
function chatSys(text) {
  const el = document.getElementById('chatMsgs');
  if (!el) return;
  const div = document.createElement('div');
  div.className = 'chat-sys';
  div.textContent = '— ' + text + ' —';
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function renderChatMsg(msg) {
  const el = document.getElementById('chatMsgs');
  if (!el || !msg) return;
  const tierName = msg.tier || 'Sub3';
  const cls = rankClass(tierName);
  const emoji = msg.tierEmoji || getTierEmoji(msg.elo || 400);
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    : getTime();
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `
    <div class="chat-msg-top">
      <span class="chat-msg-name">${escapeHtml(msg.name)}</span>
      <span class="rank-pill ${cls}">${emoji} ${tierName}</span>
    </div>
    <div class="chat-msg-text">${escapeHtml(msg.text)}</div>
    <div class="chat-msg-time">${time}</div>`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function sendChat() {
  const nameEl = document.getElementById('chatNameIn');
  const msgEl  = document.getElementById('chatMsgIn');
  if (!nameEl || !msgEl) return;
  const name = nameEl.value.trim();
  const text = msgEl.value.trim();
  if (!text) return;
  if (name && name !== myName) { myName = name; saveStats(); }
  wsSend({ type: 'set_user', name: myName });
  if (!wsSend({ type: 'chat', text })) {
    chatSys('Reconnecting...');
    connectWS(pageOnMsg);
    return;
  }
  msgEl.value = '';
}

/* ── ACTIVITY FEED ── */
const _actNames = ['ApexK','NordicG','ZeusMode','IronWill','PhiRatio','AthensKing','SilentMax','CanthalK','JawPilled','MewingPro','LooksGod','SymBro'];
function startActivityFeed() {
  const el = document.getElementById('activityFeed');
  if (!el) return;
  function add() {
    const n1 = _actNames[Math.floor(Math.random()*_actNames.length)];
    let n2 = _actNames[Math.floor(Math.random()*_actNames.length)];
    while (n2 === n1) n2 = _actNames[Math.floor(Math.random()*_actNames.length)];
    const elo = Math.floor(Math.random() * 28 + 10);
    const div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML = `<span class="activity-name">${n1}</span> beat <span class="activity-name">${n2}</span> <span class="activity-elo">+${elo} ELO</span>`;
    el.prepend(div);
    while(el.children.length > 6) el.removeChild(el.lastChild);
    setTimeout(add, 3500 + Math.random() * 5000);
  }
  for(let i=0;i<4;i++) setTimeout(() => {
    const n1=_actNames[Math.floor(Math.random()*_actNames.length)];
    const n2=_actNames[Math.floor(Math.random()*_actNames.length)];
    const elo=Math.floor(Math.random()*28+10);
    const div=document.createElement('div');
    div.className='activity-item';
    div.innerHTML=`<span class="activity-name">${n1}</span> beat <span class="activity-name">${n2}</span> <span class="activity-elo">+${elo} ELO</span>`;
    el.appendChild(div);
  }, i * 500);
  setTimeout(add, 4000);
}

/* ── LEADERBOARD ── */
async function loadLeaderboard(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  try {
    const res = await fetch(SERVER_HTTP + '/leaderboard');
    const data = await res.json();
    if (!data || !data.length) {
      el.innerHTML = '<div style="padding:24px;text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted2);">No players yet — be the first!</div>';
      return;
    }
    const medals = ['🥇','🥈','🥉'];
    el.innerHTML = data.slice(0,20).map((u,i) => {
      const t = u.tier || {name:'Sub3',emoji:'🔴'};
      const cls = rankClass(t.name);
      return `<div class="lb-row">
        <div class="lb-rank">${medals[i] || ('#'+(i+1))}</div>
        <div class="lb-info">
          <div class="lb-av ${cls}">${escapeHtml((u.name||'?')[0].toUpperCase())}</div>
          <div>
            <div class="lb-name">${escapeHtml(u.name||'Unknown')}</div>
            <div class="lb-sub">${t.emoji} ${t.name} · ${u.wins||0}W ${u.losses||0}L</div>
          </div>
        </div>
        <div class="lb-elo">${u.elo||400} ELO</div>
      </div>`;
    }).join('');
  } catch(e) {
    el.innerHTML = '<div style="padding:24px;text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted2);">Could not load — server may be starting up</div>';
  }
}

/* ── INJECT UI ── */
function injectSharedUI() {
  const path = window.location.pathname.split('/').pop() || 'index.html';

  // NAV
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
      <div class="nav-online">
        <div class="nav-dot"></div>
        <span class="online-count-val">— online</span>
      </div>
      <button class="nav-claim-btn" onclick="openClaimModal()">CLAIM RANK</button>
    </div>`;
  document.body.prepend(nav);

  // Set active link
  nav.querySelectorAll('.nav-link').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  // GUEST BANNER
  const banner = document.createElement('div');
  banner.className = 'guest-banner';
  banner.id = 'guestBanner';
  banner.innerHTML = `
    You're playing as a Guest.
    <a href="#" onclick="openClaimModal();return false;">Click here to claim your rank</a>
    and save your ELO permanently.
    <button class="guest-banner-close" onclick="document.getElementById('guestBanner').style.display='none'">✕</button>`;
  nav.after(banner);

  // CHAT SIDEBAR
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
    <div class="chat-foot">
      <div class="chat-name-row">
        <input class="chat-name-in" id="chatNameIn" type="text" placeholder="Your name..." maxlength="18" value="${escapeHtml(myName)}">
      </div>
      <div class="chat-input-row">
        <input class="chat-in" id="chatMsgIn" type="text" placeholder="Say something..." maxlength="200" onkeydown="if(event.key==='Enter')sendChat()">
        <button class="chat-send" onclick="sendChat()">➤</button>
      </div>
    </div>`;
  document.body.appendChild(chat);

  // HOW TO MOG MODAL
  const howModal = document.createElement('div');
  howModal.className = 'modal-overlay';
  howModal.id = 'howModal';
  howModal.onclick = (e) => { if(e.target===howModal) closeModal('howModal'); };
  const howItems = [
    {icon:'👁',title:'EYES FORWARD',desc:'Keep your face centered and chin level. One face per frame only.'},
    {icon:'📈',title:'WIN TO RISE',desc:'Beat higher-ranked opponents for bigger ELO gains.'},
    {icon:'🚫',title:'NO BAILING',desc:'Leaving an active match forfeits and costs you 7 ELO.'},
    {icon:'🔐',title:'STAYS PRIVATE',desc:'Your camera runs in your browser only. Nothing is recorded.'},
    {icon:'🔒',title:'LOCK YOUR RANK',desc:'Sign in to save your ELO, history and leaderboard identity.'},
    {icon:'💡',title:'FACE THE LIGHT',desc:'Front lighting gives the clearest scan. Clean your lens.'},
  ];
  howModal.innerHTML = `<div class="modal-box" style="max-width:580px;">
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

  // CLAIM MODAL
  const claimModal = document.createElement('div');
  claimModal.className = 'modal-overlay';
  claimModal.id = 'claimModal';
  claimModal.onclick = (e) => { if(e.target===claimModal) closeModal('claimModal'); };
  claimModal.innerHTML = `<div class="modal-box" style="max-width:420px;text-align:center;background:linear-gradient(135deg,#1a1030,#13131f);">
    <button class="modal-close" onclick="closeModal('claimModal')">✕</button>
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:42px;letter-spacing:2px;line-height:1;margin-bottom:14px;">LOCK IN YOUR<br>RANK</div>
    <p style="font-size:14px;color:var(--muted);line-height:1.7;margin-bottom:18px;">Sign in to permanently save your ELO,<br>match history and leaderboard identity.</p>
    <div style="display:inline-flex;align-items:center;gap:8px;background:var(--violet-dim);border:1px solid rgba(123,97,255,0.25);border-radius:999px;padding:6px 16px;margin-bottom:22px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#7b61ff;">✓ ELO, history and identity preserved</div>
    <button onclick="alert('Google Sign-In coming soon!')" style="width:100%;padding:15px;border-radius:12px;border:none;background:#fff;color:#080810;font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">
      <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Continue with Google
    </button>
    <p style="margin-top:12px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted2);">By continuing, you agree to our <a href="#" style="color:var(--teal);">Terms</a> and <a href="#" style="color:var(--teal);">Privacy Policy</a></p>
  </div>`;
  document.body.appendChild(claimModal);
}

function openModal(id)  { const el=document.getElementById(id); if(el) el.classList.add('open'); }
function closeModal(id) { const el=document.getElementById(id); if(el) el.classList.remove('open'); }
function openClaimModal() { openModal('claimModal'); }
function openHowModal()   { openModal('howModal'); }

setInterval(() => wsSend({ type: 'ping' }), 25000);
