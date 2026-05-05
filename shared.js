// ============================================================
// MOGME.TV — SHARED COMPONENTS
// Chat sidebar + nav used across all pages
// ============================================================

const SERVER_URL = 'wss://mogmetv-production.up.railway.app';
const HTTP_URL = 'https://mogmetv-production.up.railway.app';

const RANKS = {
  'Sub3':    { color: '#888', label: 'Sub3',    min: 0    },
  'LTN':     { color: '#4fa3e0', label: 'LTN',  min: 800  },
  'MTN':     { color: '#5bc45b', label: 'MTN',  min: 1000 },
  'HTN':     { color: '#c4a827', label: 'HTN',  min: 1200 },
  'Chadlite':{ color: '#c47a27', label: 'Chadlite', min: 1400 },
  'Chad':    { color: '#d4af37', label: 'Chad', min: 1600 },
};

function getRankFromElo(elo) {
  if (elo >= 1600) return 'Chad';
  if (elo >= 1400) return 'Chadlite';
  if (elo >= 1200) return 'HTN';
  if (elo >= 1000) return 'MTN';
  if (elo >= 800)  return 'LTN';
  return 'Sub3';
}

function getRankBadge(rank) {
  const r = RANKS[rank] || RANKS['Sub3'];
  return `<span class="rank-badge" style="color:${r.color};border-color:${r.color}">${r.label}</span>`;
}

// Inject shared CSS
function injectSharedCSS() {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

    :root {
      --gold: #d4af37;
      --gold-dim: #a07c1a;
      --gold-glow: rgba(212,175,55,0.3);
      --bg: #080808;
      --bg2: #0f0f0f;
      --bg3: #161616;
      --border: rgba(212,175,55,0.15);
      --text: #e8e8e8;
      --text-dim: #888;
      --chat-width: 260px;
      --nav-height: 56px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Rajdhani', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* TOP NAV */
    #mogme-nav {
      position: fixed;
      top: 0; left: 0; right: var(--chat-width);
      height: var(--nav-height);
      background: rgba(8,8,8,0.95);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 24px;
      z-index: 1000;
      backdrop-filter: blur(10px);
    }

    #mogme-nav .nav-logo {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 22px;
      letter-spacing: 3px;
      color: var(--gold);
      text-decoration: none;
      text-shadow: 0 0 20px var(--gold-glow);
    }

    #mogme-nav .nav-links {
      display: flex;
      gap: 4px;
      flex: 1;
    }

    #mogme-nav .nav-link {
      padding: 6px 14px;
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--text-dim);
      text-decoration: none;
      border: 1px solid transparent;
      border-radius: 3px;
      transition: all 0.2s;
    }

    #mogme-nav .nav-link:hover,
    #mogme-nav .nav-link.active {
      color: var(--gold);
      border-color: var(--border);
      background: rgba(212,175,55,0.05);
    }

    #mogme-nav .nav-online {
      font-family: 'Share Tech Mono', monospace;
      font-size: 12px;
      color: var(--text-dim);
      margin-left: auto;
    }

    #mogme-nav .nav-online span {
      color: #4caf50;
    }

    /* MAIN CONTENT AREA */
    #main-content {
      margin-top: var(--nav-height);
      margin-right: var(--chat-width);
      min-height: calc(100vh - var(--nav-height));
    }

    /* CHAT SIDEBAR */
    #chat-sidebar {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: var(--chat-width);
      background: var(--bg2);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      z-index: 999;
    }

    #chat-sidebar .chat-header {
      padding: 14px 14px 10px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      height: var(--nav-height);
    }

    #chat-sidebar .chat-header-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 15px;
      letter-spacing: 2px;
      color: var(--gold);
    }

    #chat-sidebar .chat-online {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: #4caf50;
    }

    #chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    #chat-messages::-webkit-scrollbar { width: 3px; }
    #chat-messages::-webkit-scrollbar-track { background: transparent; }
    #chat-messages::-webkit-scrollbar-thumb { background: var(--gold-dim); border-radius: 2px; }

    .chat-msg {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .chat-msg-header {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .chat-msg-name {
      font-size: 12px;
      font-weight: 700;
      color: var(--text);
    }

    .rank-badge {
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border: 1px solid;
      border-radius: 2px;
      letter-spacing: 0.5px;
    }

    .chat-msg-text {
      font-size: 12px;
      color: var(--text-dim);
      line-height: 1.4;
      word-break: break-word;
    }

    #chat-input-area {
      padding: 10px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
    }

    #chat-name-input, #chat-msg-input {
      background: var(--bg3);
      border: 1px solid var(--border);
      color: var(--text);
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      padding: 7px 10px;
      border-radius: 3px;
      outline: none;
      width: 100%;
      transition: border-color 0.2s;
    }

    #chat-name-input:focus, #chat-msg-input:focus {
      border-color: var(--gold-dim);
    }

    #chat-name-input::placeholder, #chat-msg-input::placeholder {
      color: #444;
    }

    #chat-send-btn {
      background: var(--gold-dim);
      color: #000;
      border: none;
      padding: 8px;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 14px;
      letter-spacing: 2px;
      border-radius: 3px;
      cursor: pointer;
      width: 100%;
      transition: background 0.2s;
    }

    #chat-send-btn:hover { background: var(--gold); }

    /* GOLD BUTTON */
    .btn-gold {
      background: transparent;
      border: 1px solid var(--gold);
      color: var(--gold);
      padding: 10px 28px;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 16px;
      letter-spacing: 3px;
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.2s;
    }
    .btn-gold:hover {
      background: var(--gold);
      color: #000;
      box-shadow: 0 0 20px var(--gold-glow);
    }

    .btn-gold-solid {
      background: var(--gold);
      color: #000;
      border: 1px solid var(--gold);
      padding: 10px 28px;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 16px;
      letter-spacing: 3px;
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.2s;
    }
    .btn-gold-solid:hover {
      background: #c4a010;
      box-shadow: 0 0 20px var(--gold-glow);
    }
  `;
  document.head.appendChild(style);
}

// Build nav HTML
function buildNav(activePage) {
  const pages = [
    { href: 'index.html', label: 'Dashboard', id: 'dashboard' },
    { href: 'arena.html', label: '1V1 Arena', id: 'arena' },
    { href: 'lab.html', label: 'The Lab', id: 'lab' },
    { href: 'rank.html', label: 'Global Rank', id: 'rank' },
    { href: 'private.html', label: 'Private Room', id: 'private' },
  ];

  const linksHTML = pages.map(p =>
    `<a href="${p.href}" class="nav-link${activePage === p.id ? ' active' : ''}">${p.label}</a>`
  ).join('');

  return `
    <a href="index.html" class="nav-logo">MOGME.TV</a>
    <div class="nav-links">${linksHTML}</div>
    <div class="nav-online">ONLINE: <span id="nav-online-count">0</span></div>
  `;
}

// Build chat sidebar HTML
function buildChatSidebar() {
  return `
    <div class="chat-header">
      <div class="chat-header-title">LIVE CHAT</div>
      <div class="chat-online" id="chat-online-count">0 online</div>
    </div>
    <div id="chat-messages"></div>
    <div id="chat-input-area">
      <input type="text" id="chat-name-input" placeholder="Your name" maxlength="20" />
      <input type="text" id="chat-msg-input" placeholder="Say something..." maxlength="120" />
      <button id="chat-send-btn">SEND</button>
    </div>
  `;
}

// Init shared layout
function initSharedLayout(activePage) {
  injectSharedCSS();

  // Nav
  const nav = document.createElement('div');
  nav.id = 'mogme-nav';
  nav.innerHTML = buildNav(activePage);
  document.body.prepend(nav);

  // Wrap content
  const mainContent = document.createElement('div');
  mainContent.id = 'main-content';
  while (document.body.children.length > 1) {
    if (document.body.lastChild.id !== 'chat-sidebar') {
      mainContent.prepend(document.body.lastChild);
    } else break;
  }
  document.body.appendChild(mainContent);

  // Chat sidebar
  const sidebar = document.createElement('div');
  sidebar.id = 'chat-sidebar';
  sidebar.innerHTML = buildChatSidebar();
  document.body.appendChild(sidebar);

  // Init chat WS
  initChat();
}

// ---- CHAT WEBSOCKET ----
let chatWs = null;
let chatName = localStorage.getItem('mogme-name') || '';
let chatElo = parseInt(localStorage.getItem('mogme-elo') || '800');

function initChat() {
  const nameInput = document.getElementById('chat-name-input');
  const msgInput = document.getElementById('chat-msg-input');
  const sendBtn = document.getElementById('chat-send-btn');

  if (chatName) nameInput.value = chatName;

  connectChatWs();

  sendBtn.addEventListener('click', sendChatMsg);
  msgInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMsg(); });
  nameInput.addEventListener('change', () => {
    chatName = nameInput.value.trim();
    localStorage.setItem('mogme-name', chatName);
  });
}

function connectChatWs() {
  try {
    chatWs = new WebSocket(SERVER_URL);
    chatWs.onopen = () => {
      chatWs.send(JSON.stringify({ type: 'chat-join', name: chatName || 'Anonymous', elo: chatElo }));
    };
    chatWs.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleChatMessage(msg);
      } catch(err) {}
    };
    chatWs.onclose = () => {
      setTimeout(connectChatWs, 3000);
    };
    chatWs.onerror = () => {};
  } catch(err) {}
}

function handleChatMessage(msg) {
  const onlineEl = document.getElementById('chat-online-count');
  const navOnline = document.getElementById('nav-online-count');

  if (msg.type === 'online-count') {
    if (onlineEl) onlineEl.textContent = `${msg.count} online`;
    if (navOnline) navOnline.textContent = msg.count;
  }

  if (msg.type === 'chat-message') {
    appendChatMessage(msg.name, msg.rank || 'Sub3', msg.text);
  }

  if (msg.type === 'chat-history') {
    msg.messages.forEach(m => appendChatMessage(m.name, m.rank || 'Sub3', m.text));
  }
}

function appendChatMessage(name, rank, text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `
    <div class="chat-msg-header">
      <span class="chat-msg-name">${escapeHtml(name)}</span>
      ${getRankBadge(rank)}
    </div>
    <div class="chat-msg-text">${escapeHtml(text)}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  // keep max 100 messages
  while (container.children.length > 100) {
    container.removeChild(container.firstChild);
  }
}

function sendChatMsg() {
  const nameInput = document.getElementById('chat-name-input');
  const msgInput = document.getElementById('chat-msg-input');
  const name = nameInput.value.trim() || 'Anonymous';
  const text = msgInput.value.trim();
  if (!text || !chatWs || chatWs.readyState !== WebSocket.OPEN) return;
  chatName = name;
  localStorage.setItem('mogme-name', name);
  chatWs.send(JSON.stringify({ type: 'chat-message', name, elo: chatElo, text }));
  msgInput.value = '';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
