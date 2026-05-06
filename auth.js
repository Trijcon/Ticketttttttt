/* ═══════════════════════════════════
   MOGME.TV — FIREBASE AUTH
   Handles Google Sign-In + user persistence
═══════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpMuv59Rlhc2roSiTPBzjKKHjuwqe0TFs",
  authDomain: "mogmetv.firebaseapp.com",
  projectId: "mogmetv",
  storageBucket: "mogmetv.firebasestorage.app",
  messagingSenderId: "1067675943117",
  appId: "1:1067675943117:web:9545a8bbfa7f68d5db2984",
  measurementId: "G-KNSED137FQ"
};

const app    = initializeApp(firebaseConfig);
const auth   = getAuth(app);
const db     = getFirestore(app);
const provider = new GoogleAuthProvider();

/* ── CURRENT USER STATE ── */
let currentUser  = null;
let currentProfile = null;

/* ═══════════════════════════════════
   SIGN IN WITH GOOGLE
═══════════════════════════════════ */
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch(e) {
    console.error('Sign in error:', e.message);
    throw e;
  }
}

/* ═══════════════════════════════════
   SIGN OUT
═══════════════════════════════════ */
async function signOutUser() {
  try {
    await signOut(auth);
    currentUser = null;
    currentProfile = null;
    localStorage.removeItem('mgm_name');
    localStorage.removeItem('mgm_elo');
    localStorage.removeItem('mgm_wins');
    localStorage.removeItem('mgm_losses');
    localStorage.removeItem('mgm_uid');
    updateAuthUI(null);
  } catch(e) {
    console.error('Sign out error:', e.message);
  }
}

/* ═══════════════════════════════════
   GET OR CREATE USER PROFILE
═══════════════════════════════════ */
async function getOrCreateProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    // User exists — load their data
    const data = snap.data();
    // Sync to localStorage
    localStorage.setItem('mgm_name',   data.displayName || user.displayName);
    localStorage.setItem('mgm_elo',    data.elo   || 400);
    localStorage.setItem('mgm_wins',   data.wins  || 0);
    localStorage.setItem('mgm_losses', data.losses|| 0);
    localStorage.setItem('mgm_uid',    user.uid);
    // Update last seen
    await updateDoc(ref, { lastSeen: serverTimestamp() });
    return data;
  } else {
    // New user — create profile
    const profile = {
      uid:         user.uid,
      displayName: user.displayName,
      email:       user.email,
      photoURL:    user.photoURL,
      elo:         400,
      wins:        0,
      losses:      0,
      labScore:    null,
      createdAt:   serverTimestamp(),
      lastSeen:    serverTimestamp(),
    };
    await setDoc(ref, profile);
    localStorage.setItem('mgm_name',   user.displayName);
    localStorage.setItem('mgm_elo',    400);
    localStorage.setItem('mgm_wins',   0);
    localStorage.setItem('mgm_losses', 0);
    localStorage.setItem('mgm_uid',    user.uid);
    return profile;
  }
}

/* ═══════════════════════════════════
   SAVE STATS TO FIRESTORE
   Called after match result
═══════════════════════════════════ */
async function saveStatsToFirestore(elo, wins, losses) {
  if (!currentUser) return;
  try {
    const ref = doc(db, 'users', currentUser.uid);
    await updateDoc(ref, { elo, wins, losses, lastSeen: serverTimestamp() });
  } catch(e) {
    console.error('Save stats error:', e.message);
  }
}

/* ═══════════════════════════════════
   SAVE LAB SCORE
═══════════════════════════════════ */
async function saveLabScore(score) {
  if (!currentUser) return;
  try {
    const ref = doc(db, 'users', currentUser.uid);
    await updateDoc(ref, { labScore: score, lastSeen: serverTimestamp() });
  } catch(e) {
    console.error('Save lab score error:', e.message);
  }
}

/* ═══════════════════════════════════
   UPDATE AUTH UI
   Called whenever auth state changes
═══════════════════════════════════ */
function updateAuthUI(user) {
  const claimBtn    = document.querySelector('.nav-claim-btn');
  const guestBanner = document.getElementById('guestBanner');
  const userMenu    = document.getElementById('userMenu');

  if (user && currentProfile) {
    // LOGGED IN
    if (claimBtn) {
      claimBtn.textContent = user.displayName?.split(' ')[0] || 'Account';
      claimBtn.onclick = toggleUserMenu;
    }
    if (guestBanner) guestBanner.style.display = 'none';
    // Adjust body padding since banner is gone
    document.body.style.paddingTop = 'var(--nav-h)';
  } else {
    // GUEST
    if (claimBtn) {
      claimBtn.textContent = 'CLAIM RANK';
      claimBtn.onclick = openClaimModal;
    }
    if (guestBanner) guestBanner.style.display = 'flex';
    document.body.style.paddingTop = 'calc(var(--nav-h) + 36px)';
  }
}

/* ═══════════════════════════════════
   USER MENU (dropdown when logged in)
═══════════════════════════════════ */
function injectUserMenu() {
  if (document.getElementById('userMenu')) return;
  const menu = document.createElement('div');
  menu.id = 'userMenu';
  menu.style.cssText = `
    position:fixed; top:calc(var(--nav-h) + 8px); right:calc(var(--chat-w) + 8px);
    background:#1a1a28; border:1px solid rgba(255,255,255,0.1); border-radius:12px;
    padding:8px; min-width:200px; z-index:400; display:none;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);
  `;
  menu.innerHTML = `
    <div id="userMenuHeader" style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:6px;">
      <div id="userMenuName" style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:16px;color:#f2f2ff;"></div>
      <div id="userMenuElo" style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#0df2c8;margin-top:2px;"></div>
    </div>
    <a href="index.html" style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;color:#6b6b8f;text-decoration:none;font-family:'JetBrains Mono',monospace;font-size:11px;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.04)';this.style.color='#f2f2ff'" onmouseout="this.style.background='';this.style.color='#6b6b8f'">🏠 Dashboard</a>
    <a href="rank.html" style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;color:#6b6b8f;text-decoration:none;font-family:'JetBrains Mono',monospace;font-size:11px;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.04)';this.style.color='#f2f2ff'" onmouseout="this.style.background='';this.style.color='#6b6b8f'">🏆 My Rank</a>
    <div style="height:1px;background:rgba(255,255,255,0.06);margin:6px 0;"></div>
    <button onclick="signOutUser()" style="width:100%;display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;color:#ff3d6b;background:none;border:none;font-family:'JetBrains Mono',monospace;font-size:11px;cursor:pointer;text-align:left;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,61,107,0.08)'" onmouseout="this.style.background=''">↩ Sign Out</button>
  `;
  document.body.appendChild(menu);

  // Close on outside click
  document.addEventListener('click', (e) => {
    const claimBtn = document.querySelector('.nav-claim-btn');
    if (menu.style.display === 'block' && !menu.contains(e.target) && e.target !== claimBtn) {
      menu.style.display = 'none';
    }
  });
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (!menu) return;
  if (menu.style.display === 'block') {
    menu.style.display = 'none';
  } else {
    // Update menu content
    const elo  = parseInt(localStorage.getItem('mgm_elo') || '400');
    const name = localStorage.getItem('mgm_name') || 'User';
    document.getElementById('userMenuName').textContent = name;
    document.getElementById('userMenuElo').textContent  = elo + ' ELO · ' + getTierName(elo);
    menu.style.display = 'block';
  }
}

/* ═══════════════════════════════════
   AUTH STATE LISTENER
   Runs on every page load
═══════════════════════════════════ */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    try {
      currentProfile = await getOrCreateProfile(user);
      injectUserMenu();
      updateAuthUI(user);
      // Update claim modal to show signed-in state
      const claimModal = document.getElementById('claimModal');
      if (claimModal) claimModal.classList.remove('open');
    } catch(e) {
      console.error('Profile load error:', e.message);
    }
  } else {
    currentUser = null;
    currentProfile = null;
    updateAuthUI(null);
  }
});

/* ═══════════════════════════════════
   EXPORTS — available globally
═══════════════════════════════════ */
window.signInWithGoogle   = signInWithGoogle;
window.signOutUser        = signOutUser;
window.saveStatsToFirestore = saveStatsToFirestore;
window.saveLabScore       = saveLabScore;
window.getCurrentUser     = () => currentUser;
window.getCurrentProfile  = () => currentProfile;
window.isLoggedIn         = () => !!currentUser;
