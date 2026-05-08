/* ═══════════════════════════════════
   MOGME.TV — AUTH.JS
   Firebase Auth + Firestore profile system
   Loaded as type="module" on every page
═══════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup,
         signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection,
         query, orderBy, limit, getDocs, serverTimestamp, increment }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBpMuv59Rlhc2roSiTPBzjKKHjuwqe0TFs",
  authDomain: "mogmetv.firebaseapp.com",
  projectId: "mogmetv",
  storageBucket: "mogmetv.firebasestorage.app",
  messagingSenderId: "1067675943117",
  appId: "1:1067675943117:web:9545a8bbfa7f68d5db2984",
};

const fbApp  = initializeApp(FIREBASE_CONFIG);
const auth   = getAuth(fbApp);
const db     = getFirestore(fbApp);
const gProvider = new GoogleAuthProvider();

window._auth = auth;
window._db   = db;

let _currentUser    = null;
let _currentProfile = null;

/* ── TIER HELPER ── */
function getTierFromElo(elo) {
  if (elo >= 5001) return { name:'Slayer',   emoji:'💀', color:'#ff3d6b' };
  if (elo >= 3501) return { name:'Chad',     emoji:'👑', color:'#f5a623' };
  if (elo >= 2001) return { name:'Chadlite', emoji:'🔥', color:'#7b61ff' };
  if (elo >= 1501) return { name:'HTN',      emoji:'⭐', color:'#0df2c8' };
  if (elo >= 1001) return { name:'MTN',      emoji:'⚡', color:'#f5a623' };
  if (elo >= 501)  return { name:'LTN',      emoji:'🌙', color:'#7090d0' };
  if (elo >= 1)    return { name:'Sub3',     emoji:'🔴', color:'#ff3d6b' };
  return                   { name:'Molecule',emoji:'🧪', color:'#888aaa' };
}

/* ══════════════════════════════════
   SIGN IN / OUT
══════════════════════════════════ */
window.signInWithGoogle = async function() {
  const btn = document.getElementById('googleSignInBtn');
  if (btn) { btn.textContent = 'Opening Google...'; btn.disabled = true; }
  try {
    const result = await signInWithPopup(auth, gProvider);
    console.log('Popup sign-in success:', result.user.email);
    // onAuthStateChanged will fire automatically
  } catch(e) {
    console.error('Sign in error:', e.code, e.message);
    if (btn) { btn.innerHTML = googleBtnHTML(); btn.disabled = false; }
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      alert('Sign in failed: ' + e.message);
    }
  }
};

window.signOutUser = async function() {
  console.log('[Auth] Sign out requested');
  // 1. Clear localStorage IMMEDIATELY so we have clean local state regardless of Firebase
  ['mgm_name','mgm_elo','mgm_wins','mgm_losses','mgm_uid','mgm_photo','mgm_username','mgm_hd_clip']
    .forEach(k => localStorage.removeItem(k));
  _currentUser = null;
  _currentProfile = null;
  // 2. Try Firebase signOut (don't let errors block redirect)
  try { await signOut(auth); console.log('[Auth] Firebase signed out'); }
  catch(e) { console.warn('[Auth] Firebase signOut error:', e.message); }
  // 3. Hard redirect with cache bypass
  window.location.replace('index.html?logout=' + Date.now());
};

/* ══════════════════════════════════
   FIRESTORE PROFILE
══════════════════════════════════ */
async function loadOrCreateProfile(user) {
  const ref  = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    // Sync to localStorage
    localStorage.setItem('mgm_uid',      user.uid);
    localStorage.setItem('mgm_name',     data.username || user.displayName);
    localStorage.setItem('mgm_username', data.username || '');
    localStorage.setItem('mgm_elo',      data.elo      || 400);
    localStorage.setItem('mgm_wins',     data.wins     || 0);
    localStorage.setItem('mgm_losses',   data.losses   || 0);
    localStorage.setItem('mgm_photo',    data.photoURL || user.photoURL || '');
    await updateDoc(ref, { lastSeen: serverTimestamp() });
    return data;
  }
  // New user — redirect to setup
  return null;
}

window.saveEloToFirestore = async function(elo, wins, losses) {
  const uid = localStorage.getItem('mgm_uid');
  if (!uid) return;
  try {
    await updateDoc(doc(db, 'users', uid), {
      elo, wins, losses, lastSeen: serverTimestamp()
    });
    localStorage.setItem('mgm_elo',    elo);
    localStorage.setItem('mgm_wins',   wins);
    localStorage.setItem('mgm_losses', losses);
  } catch(e) { console.error('Save ELO error:', e); }
};

window.getFirestoreLeaderboard = async function(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  try {
    const q = query(collection(db,'users'), orderBy('elo','desc'), limit(20));
    const snap = await getDocs(q);
    if (snap.empty) {
      el.innerHTML = '<div style="padding:24px;text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted2);">No ranked players yet — be the first!</div>';
      return;
    }
    const medals = ['🥇','🥈','🥉'];
    el.innerHTML = snap.docs.map((d,i) => {
      const u = d.data();
      const t = getTierFromElo(u.elo || 400);
      const cls = t.name.toLowerCase().replace(' ','');
      const photo = u.photoURL
        ? `<img src="${u.photoURL}" style="width:32px;height:32px;border-radius:8px;object-fit:cover;">`
        : `<div class="lb-av ${cls}">${(u.username||'?')[0].toUpperCase()}</div>`;
      const userHref = `user.html?u=${encodeURIComponent(u.username||'')}`;
      return `<a class="lb-row" href="${userHref}" style="text-decoration:none;color:inherit;cursor:pointer;">
        <div class="lb-rank">${medals[i]||('#'+(i+1))}</div>
        <div class="lb-info">
          ${photo}
          <div>
            <div class="lb-name">${escHtml(u.username||'Unknown')}</div>
            <div class="lb-sub">${t.emoji} ${t.name} · ${u.wins||0}W ${u.losses||0}L</div>
          </div>
        </div>
        <div class="lb-elo">${u.elo||400} ELO</div>
      </a>`;
    }).join('');
  } catch(e) {
    el.innerHTML = '<div style="padding:24px;text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted2);">Could not load leaderboard</div>';
  }
};

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════
   UI UPDATES
══════════════════════════════════ */
function updateNavForUser(user, profile) {
  const btn    = document.getElementById('navClaimBtn');
  const banner = document.getElementById('guestBanner');
  const chatInputRow = document.getElementById('chatInputRow');
  const chatSignin   = document.getElementById('chatSigninPrompt');
  const chatInput    = document.getElementById('chatMsgIn');
  const chatName     = document.getElementById('chatNameIn');

  if (user && profile) {
    // Logged in
    if (btn) {
      const photo = profile.photoURL || user.photoURL;
      const uname = profile.username || user.displayName?.split(' ')[0] || 'Profile';
      btn.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;border-radius:999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);cursor:pointer;';
      btn.innerHTML = photo
        ? `<img src="${photo}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;"><span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#E8E8E8;letter-spacing:0.5px;">${uname}</span>`
        : `<div style="width:30px;height:30px;border-radius:50%;background:rgba(74,158,255,0.12);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#4A9EFF;">${(uname[0]||'?').toUpperCase()}</div><span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#E8E8E8;letter-spacing:0.5px;">${uname}</span>`;
      // Site-wide: clicking profile icon goes directly to profile/edit page
      btn.onclick = () => { window.location.href = 'profile.html'; };
      btn.title = 'Edit Profile';
    }
    if (banner) banner.style.display = 'none';
    document.body.style.paddingTop = 'var(--nav-h)';

    // Show real chat input, hide sign-in prompt
    if (chatInputRow) chatInputRow.style.display = 'flex';
    if (chatSignin)   chatSignin.style.display = 'none';
    if (chatInput)    { chatInput.disabled = false; chatInput.placeholder = 'Say something...'; }
    if (chatName)     { chatName.value = profile.username||user.displayName; chatName.disabled = true; }
  } else {
    // Guest
    if (btn) {
      btn.style.cssText = '';
      btn.textContent = 'CLAIM RANK';
      btn.onclick = () => window.openClaimModal && window.openClaimModal();
    }
    if (banner) banner.style.display = 'flex';
    document.body.style.paddingTop = 'calc(var(--nav-h) + 36px)';

    // Hide chat input, show sign-in prompt
    if (chatInputRow) chatInputRow.style.display = 'none';
    if (chatSignin)   chatSignin.style.display = 'block';
  }
}

function injectUserMenu() {
  if (document.getElementById('userMenu')) return;
  const menu = document.createElement('div');
  menu.id = 'userMenu';
  menu.style.cssText = 'position:fixed;top:calc(var(--nav-h)+8px);right:calc(var(--chat-w)+8px);background:#1a1a28;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:8px;min-width:210px;z-index:500;display:none;box-shadow:0 12px 40px rgba(0,0,0,0.6);';
  menu.innerHTML = `
    <div id="uMenuHead" style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:6px;display:flex;align-items:center;gap:10px;">
      <div id="uMenuPhoto" style="width:38px;height:38px;border-radius:50%;background:var(--teal-dim);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;overflow:hidden;"></div>
      <div>
        <div id="uMenuName" style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:16px;color:#f2f2ff;"></div>
        <div id="uMenuElo" style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#0df2c8;margin-top:1px;"></div>
      </div>
    </div>
    <a href="profile.html" style="display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:8px;color:#6b6b8f;text-decoration:none;font-family:'JetBrains Mono',monospace;font-size:11px;transition:all 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.05)';this.style.color='#f2f2ff'" onmouseout="this.style.background='';this.style.color='#6b6b8f'">👤 My Profile</a>
    <a href="rank.html" style="display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:8px;color:#6b6b8f;text-decoration:none;font-family:'JetBrains Mono',monospace;font-size:11px;transition:all 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.05)';this.style.color='#f2f2ff'" onmouseout="this.style.background='';this.style.color='#6b6b8f'">🏆 Global Rank</a>
    <div style="height:1px;background:rgba(255,255,255,0.06);margin:6px 0;"></div>
    <button onclick="signOutUser()" style="width:100%;display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:8px;color:#ff3d6b;background:none;border:none;font-family:'JetBrains Mono',monospace;font-size:11px;cursor:pointer;text-align:left;" onmouseover="this.style.background='rgba(255,61,107,0.08)'" onmouseout="this.style.background=''">↩ Sign Out</button>`;
  document.body.appendChild(menu);
  document.addEventListener('click', e => {
    const btn = document.querySelector('.nav-claim-btn');
    if (menu.style.display==='block' && !menu.contains(e.target) && e.target!==btn && !btn?.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
}

window.toggleUserMenu = function() {
  const menu = document.getElementById('userMenu');
  if (!menu) return;
  if (menu.style.display === 'block') { menu.style.display = 'none'; return; }
  const elo  = parseInt(localStorage.getItem('mgm_elo')||'400');
  const name = localStorage.getItem('mgm_username') || localStorage.getItem('mgm_name') || 'User';
  const photo = localStorage.getItem('mgm_photo') || '';
  const t = getTierFromElo(elo);
  const nameEl  = document.getElementById('uMenuName');
  const eloEl   = document.getElementById('uMenuElo');
  const photoEl = document.getElementById('uMenuPhoto');
  if (nameEl)  nameEl.textContent  = name;
  if (eloEl)   eloEl.textContent   = elo+' ELO · '+t.name;
  if (photoEl) photoEl.innerHTML   = photo ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;">` : name[0]||'?';
  menu.style.display = 'block';
};

function googleBtnHTML() {
  return `<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Continue with Google`;
}

/* ══════════════════════════════════
   AUTH STATE LISTENER
══════════════════════════════════ */
onAuthStateChanged(auth, async (user) => {
  console.log('Auth state changed:', user ? user.email : 'no user');
  if (user) {
    _currentUser = user;
    try {
      const profile = await loadOrCreateProfile(user);
      if (!profile) {
        if (!window.location.pathname.includes('setup.html')) {
          window.location.href = 'setup.html';
          return;
        }
      } else {
        _currentProfile = profile;
        injectUserMenu();
        updateNavForUser(user, profile);
        const cm = document.getElementById('claimModal');
        if (cm) cm.classList.remove('open');

        // ── Send Firebase ID Token to WebSocket server for JWT verification ──
        try {
          const idToken = await user.getIdToken(false); // false = use cached token
          if (window.wsSend) {
            window.wsSend({
              type:     'set_user',
              idToken,  // Server verifies this via admin.auth().verifyIdToken()
              name:     profile.username || user.displayName,
              username: profile.username || '',
              uid:      user.uid,
              photoURL: profile.photoURL || user.photoURL || '',
            });
          }
        } catch(tokenErr) {
          console.warn('Could not get ID token:', tokenErr.message);
        }
      }
    } catch(e) {
      console.error('Auth state error:', e);
      updateNavForUser(null, null);
    }
  } else {
    _currentUser    = null;
    _currentProfile = null;
    updateNavForUser(null, null);
  }
});

window.getCurrentUser    = () => _currentUser;
window.getCurrentProfile = () => _currentProfile;
window.isLoggedIn        = () => !!_currentUser && !!_currentProfile;
