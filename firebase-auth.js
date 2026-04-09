// ═══════════════════════════════════════════════════════════════════════
// THE MARK SCHEME METHOD® — Firebase Authentication Module
//
// Provides email/password sign-in with Firestore progress sync.
// Progress is synced to the cloud on login, on change (debounced),
// on tab hide, and on window close.
//
// Requires: window.MSM_APP set by firebase-config.js
// Exposes:  window.MSM_AUTH
// ═══════════════════════════════════════════════════════════════════════

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserSessionPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import {
  doc,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── Progress keys synced between localStorage and Firestore ────────────
const PROGRESS_KEYS = [
  'msm_xp',
  'msm_badges',
  'msm_callsign',
  'msm_ft_611', 'msm_ft_612', 'msm_ft_613',
  'msm_ft_62',  'msm_ft_63',  'msm_ft_64',
  'msm_ft_611_scene', 'msm_ft_612_scene', 'msm_ft_613_scene',
  'msm_ft_62_scene',  'msm_ft_63_scene',  'msm_ft_64_scene',
];

let _auth        = null;
let _currentUser = null;
let _syncTimer   = null;
let _lsProxy     = false;

// ── Wait for firebase-config.js to initialise MSM_APP ──────────────────
async function _waitForApp() {
  let n = 0;
  while (!window.MSM_APP && n++ < 60) {
    await new Promise(r => setTimeout(r, 100));
  }
  if (!window.MSM_APP) throw new Error('[MSM Auth] window.MSM_APP not found');
}

// ── Firestore helpers ───────────────────────────────────────────────────
function _progressRef(uid) {
  return doc(window.MSM_DB, 'users', uid, 'data', 'progress');
}

async function _loadFromCloud(uid) {
  try {
    const snap = await getDoc(_progressRef(uid));
    if (snap.exists()) {
      const data = snap.data();
      for (const key of PROGRESS_KEYS) {
        if (data[key] !== undefined) {
          const stored = typeof data[key] === 'string'
            ? data[key]
            : JSON.stringify(data[key]);
          // Bypass the proxy to avoid triggering a re-save during load
          Object.getPrototypeOf(localStorage).setItem.call(localStorage, key, stored);
        }
      }
      console.log('[MSM Auth] Progress loaded from cloud');
      // Notify any open hub/dashboard of updated state
      window.dispatchEvent(new CustomEvent('msm:progress-loaded'));
    } else {
      // New account — push local progress to cloud
      await _saveToCloud(uid);
      console.log('[MSM Auth] Local progress pushed to new account');
    }
  } catch (e) {
    console.warn('[MSM Auth] Load failed:', e.message);
  }
}

async function _saveToCloud(uid) {
  const targetUid = uid || _currentUser?.uid;
  if (!targetUid) return;
  try {
    const progress = { _lastSync: new Date().toISOString() };
    for (const key of PROGRESS_KEYS) {
      const raw = Object.getPrototypeOf(localStorage).getItem.call(localStorage, key);
      if (raw !== null) {
        try { progress[key] = JSON.parse(raw); }
        catch { progress[key] = raw; }
      }
    }
    await setDoc(_progressRef(targetUid), progress, { merge: true });
  } catch (e) {
    console.warn('[MSM Auth] Save failed:', e.message);
  }
}

function _scheduleSave() {
  if (!_currentUser) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => _saveToCloud(), 3000);
}

// ── Proxy localStorage.setItem to trigger debounced sync ───────────────
function _installProxy() {
  if (_lsProxy) return;
  _lsProxy = true;
  const origSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    origSet.call(this, key, value);
    if (this === localStorage && PROGRESS_KEYS.includes(key)) {
      _scheduleSave();
    }
  };
}

// ── Save on visibility change + unload ─────────────────────────────────
function _installUnloadHandlers() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && _currentUser) {
      clearTimeout(_syncTimer);
      _saveToCloud();
    }
  });
  window.addEventListener('beforeunload', () => {
    if (_currentUser) {
      clearTimeout(_syncTimer);
      _saveToCloud();
    }
  });
}

// ── Styles ──────────────────────────────────────────────────────────────
function _injectStyles() {
  if (document.getElementById('msm-auth-css')) return;
  const s = document.createElement('style');
  s.id = 'msm-auth-css';
  s.textContent = `
/* ── Auth pill ─────────────────────────────────────────────── */
#msm-auth-pill{
  position:fixed;top:10px;right:10px;z-index:9000;
  display:flex;align-items:center;gap:8px;
  background:rgba(13,17,23,0.90);
  border:1px solid rgba(57,255,20,0.22);
  border-radius:20px;padding:5px 12px 5px 10px;
  font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.07em;
  backdrop-filter:blur(10px);
  transition:opacity .2s;
}
#msm-auth-pill:hover{opacity:1 !important;}
#msm-auth-dot{
  width:7px;height:7px;border-radius:50%;flex-shrink:0;
  background:#39FF14;box-shadow:0 0 6px rgba(57,255,20,0.7);
  transition:all .3s;
}
#msm-auth-dot.out{background:#FF4444;box-shadow:0 0 6px rgba(255,68,68,0.6);}
#msm-auth-user{
  color:rgba(57,255,20,0.85);
  max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.msm-auth-btn{
  background:transparent;border:1px solid rgba(57,255,20,0.3);
  border-radius:10px;padding:2px 9px;
  color:rgba(57,255,20,0.8);
  font-family:inherit;font-size:9px;letter-spacing:0.1em;
  cursor:pointer;transition:all .15s;
}
.msm-auth-btn:hover{background:rgba(57,255,20,0.12);border-color:rgba(57,255,20,0.6);}

/* ── Modal overlay ─────────────────────────────────────────── */
#msm-auth-overlay{
  position:fixed;inset:0;z-index:10000;
  background:rgba(0,0,0,0.72);
  display:flex;align-items:center;justify-content:center;
  backdrop-filter:blur(4px);
}
#msm-auth-overlay.msm-hidden{display:none;}
.msm-auth-box{
  background:#0D1117;
  border:1px solid rgba(57,255,20,0.22);
  border-radius:12px;padding:34px 32px;
  width:100%;max-width:390px;position:relative;
  box-shadow:0 24px 80px rgba(0,0,0,0.6);
}
.msm-auth-wordmark{
  font-family:'Orbitron',monospace;font-size:19px;font-weight:900;color:#fff;
  margin-bottom:4px;letter-spacing:-.01em;
}
.msm-auth-wordmark span{color:#39FF14;}
.msm-auth-tagline{
  font-family:'Share Tech Mono',monospace;font-size:9px;
  color:rgba(232,237,243,0.4);letter-spacing:.12em;
  margin-bottom:26px;
}
.msm-auth-tabs{
  display:flex;border-bottom:1px solid rgba(255,255,255,0.07);
  margin-bottom:22px;
}
.msm-auth-tab{
  flex:1;text-align:center;padding:8px 0;
  font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.09em;
  color:rgba(232,237,243,0.35);cursor:pointer;
  border-bottom:2px solid transparent;margin-bottom:-1px;
  transition:all .15s;
}
.msm-auth-tab.on{color:#39FF14;border-bottom-color:#39FF14;}
.msm-auth-lbl{
  display:block;
  font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.1em;
  color:rgba(232,237,243,0.4);margin-bottom:5px;margin-top:14px;
}
.msm-auth-inp{
  width:100%;box-sizing:border-box;
  padding:10px 13px;
  background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.1);border-radius:6px;
  color:#E8EDF3;font-family:'Share Tech Mono',monospace;font-size:13px;
  outline:none;transition:border-color .15s;
}
.msm-auth-inp:focus{border-color:rgba(57,255,20,0.45);}
.msm-auth-go{
  width:100%;margin-top:18px;padding:12px;
  background:rgba(57,255,20,0.12);
  border:1px solid rgba(57,255,20,0.38);border-radius:6px;
  color:#39FF14;font-family:'Orbitron',monospace;
  font-size:10px;font-weight:700;letter-spacing:1.4px;
  cursor:pointer;transition:all .2s;
}
.msm-auth-go:hover{background:rgba(57,255,20,0.22);box-shadow:0 0 18px rgba(57,255,20,0.18);}
.msm-auth-go:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;}
.msm-auth-err{
  font-family:'Share Tech Mono',monospace;font-size:10px;
  color:#FF4444;background:rgba(255,68,68,0.07);
  border:1px solid rgba(255,68,68,0.18);border-radius:4px;
  padding:8px 11px;margin-top:11px;display:none;
}
.msm-auth-err.on{display:block;}
.msm-auth-x{
  position:absolute;top:12px;right:14px;
  background:transparent;border:none;
  color:rgba(232,237,243,0.25);font-size:20px;line-height:1;
  cursor:pointer;transition:color .15s;
}
.msm-auth-x:hover{color:rgba(232,237,243,0.7);}
.msm-auth-note{
  font-family:'Share Tech Mono',monospace;font-size:9px;
  color:rgba(232,237,243,0.25);text-align:center;
  margin-top:16px;line-height:1.7;
}
`;
  document.head.appendChild(s);
}

// ── DOM: pill ───────────────────────────────────────────────────────────
function _buildPill() {
  if (document.getElementById('msm-auth-pill')) return;
  const el = document.createElement('div');
  el.id = 'msm-auth-pill';
  el.style.opacity = '0.75';
  el.innerHTML = `
    <div id="msm-auth-dot" class="out"></div>
    <span id="msm-auth-user" style="display:none"></span>
    <button class="msm-auth-btn" id="msm-auth-action">SIGN IN</button>
  `;
  document.body.appendChild(el);
  el.addEventListener('mouseenter', () => el.style.opacity = '1');
  el.addEventListener('mouseleave', () => el.style.opacity = '0.75');
  document.getElementById('msm-auth-action').addEventListener('click', _onPillClick);
}

// ── DOM: modal ──────────────────────────────────────────────────────────
function _buildModal() {
  if (document.getElementById('msm-auth-overlay')) return;
  const el = document.createElement('div');
  el.id = 'msm-auth-overlay';
  el.className = 'msm-hidden';
  el.innerHTML = `
    <div class="msm-auth-box" role="dialog" aria-modal="true" aria-label="Sign in to MSM">
      <button class="msm-auth-x" id="msm-auth-x" aria-label="Close">×</button>
      <div class="msm-auth-wordmark">MSM<span>®</span></div>
      <div class="msm-auth-tagline">MARK SCHEME METHOD — ACCOUNT ACCESS</div>
      <div class="msm-auth-tabs">
        <div class="msm-auth-tab on" data-t="in" id="msm-t-in">SIGN IN</div>
        <div class="msm-auth-tab" data-t="up" id="msm-t-up">CREATE ACCOUNT</div>
      </div>
      <label class="msm-auth-lbl" for="msm-email">EMAIL ADDRESS</label>
      <input class="msm-auth-inp" id="msm-email" type="email"
             placeholder="your@email.com" autocomplete="email">
      <label class="msm-auth-lbl" for="msm-pass">PASSWORD</label>
      <input class="msm-auth-inp" id="msm-pass" type="password"
             placeholder="Minimum 6 characters" autocomplete="current-password">
      <div id="msm-confirm-row" style="display:none">
        <label class="msm-auth-lbl" for="msm-confirm">CONFIRM PASSWORD</label>
        <input class="msm-auth-inp" id="msm-confirm" type="password"
               placeholder="Re-enter password" autocomplete="new-password">
      </div>
      <button class="msm-auth-go" id="msm-auth-go">SIGN IN →</button>
      <div class="msm-auth-err" id="msm-auth-err"></div>
      <div class="msm-auth-note">
        Your progress is saved to your account<br>
        and can be resumed on any device.
      </div>
    </div>
  `;
  document.body.appendChild(el);

  // Tab toggle
  el.querySelectorAll('.msm-auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      el.querySelectorAll('.msm-auth-tab').forEach(t => t.classList.remove('on'));
      tab.classList.add('on');
      const up = tab.dataset.t === 'up';
      document.getElementById('msm-confirm-row').style.display = up ? '' : 'none';
      document.getElementById('msm-auth-go').textContent = up ? 'CREATE ACCOUNT →' : 'SIGN IN →';
      document.getElementById('msm-pass').autocomplete = up ? 'new-password' : 'current-password';
      document.getElementById('msm-auth-err').classList.remove('on');
    });
  });

  // Close
  document.getElementById('msm-auth-x').addEventListener('click', _hideModal);
  el.addEventListener('click', e => { if (e.target === el) _hideModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') _hideModal(); });

  // Submit on Enter in any field
  ['msm-email','msm-pass','msm-confirm'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') _submit();
    });
  });
  document.getElementById('msm-auth-go').addEventListener('click', _submit);
}

// ── Auth actions ────────────────────────────────────────────────────────
async function _submit() {
  const email   = document.getElementById('msm-email').value.trim();
  const pass    = document.getElementById('msm-pass').value;
  const confirm = document.getElementById('msm-confirm')?.value;
  const isUp    = document.getElementById('msm-t-up').classList.contains('on');
  const btn     = document.getElementById('msm-auth-go');

  _clearError();

  if (!email || !pass) { _showError('Please enter your email and password.'); return; }
  if (pass.length < 6) { _showError('Password must be at least 6 characters.'); return; }
  if (isUp && pass !== confirm) { _showError('Passwords do not match.'); return; }

  btn.disabled = true;
  btn.textContent = 'PLEASE WAIT...';
  try {
    if (isUp) {
      await createUserWithEmailAndPassword(_auth, email, pass);
    } else {
      await signInWithEmailAndPassword(_auth, email, pass);
    }
    _hideModal();
  } catch (e) {
    _showError(_friendly(e.code));
  } finally {
    btn.disabled = false;
    btn.textContent = isUp ? 'CREATE ACCOUNT →' : 'SIGN IN →';
  }
}

async function _doSignOut() {
  if (!_currentUser) return;
  clearTimeout(_syncTimer);
  await _saveToCloud();
  await signOut(_auth);
  // Clear local progress so unauthenticated access starts clean
  for (const key of PROGRESS_KEYS) localStorage.removeItem(key);
  // Return to homepage regardless of which page the user is on
  const root = window.location.pathname.split('/mark-scheme-method-pilot')[0] + '/mark-scheme-method-pilot/';
  window.location.href = root + 'index.html';
}

function _onPillClick() {
  if (_currentUser) {
    if (window.confirm('Sign out of MSM\u00ae?\nYour progress has been saved.')) {
      _doSignOut();
    }
  } else {
    _showModal();
  }
}

// ── UI helpers ──────────────────────────────────────────────────────────
function _showModal() {
  document.getElementById('msm-auth-overlay')?.classList.remove('msm-hidden');
  setTimeout(() => document.getElementById('msm-email')?.focus(), 60);
}
function _hideModal() {
  document.getElementById('msm-auth-overlay')?.classList.add('msm-hidden');
  _clearError();
}
function _showError(msg) {
  const el = document.getElementById('msm-auth-err');
  if (el) { el.textContent = msg; el.classList.add('on'); }
}
function _clearError() {
  document.getElementById('msm-auth-err')?.classList.remove('on');
}
function _friendly(code) {
  return ({
    'auth/user-not-found':         'No account found with that email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/email-already-in-use':   'An account already exists with this email.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/too-many-requests':      'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  })[code] || 'Something went wrong. Please try again.';
}

function _updatePill(user) {
  const dot    = document.getElementById('msm-auth-dot');
  const userEl = document.getElementById('msm-auth-user');
  const btn    = document.getElementById('msm-auth-action');
  if (!dot) return;
  if (user) {
    dot.classList.remove('out');
    userEl.style.display = '';
    const callsign = localStorage.getItem('msm_callsign');
    userEl.textContent = callsign
      ? callsign.toUpperCase()
      : user.email.split('@')[0].toUpperCase().slice(0, 14);
    if (btn) btn.textContent = 'SIGN OUT';
  } else {
    dot.classList.add('out');
    userEl.style.display = 'none';
    if (btn) btn.textContent = 'SIGN IN';
  }
}

// ── Boot ────────────────────────────────────────────────────────────────
(async function _boot() {
  try {
    await _waitForApp();
    _auth = getAuth(window.MSM_APP);

    // Session-only persistence — auth clears when browser is closed.
    // Progress is still saved to Firestore and restored on next sign-in.
    await setPersistence(_auth, browserSessionPersistence);

    _injectStyles();
    _buildPill();
    _buildModal();
    _installProxy();
    _installUnloadHandlers();

    onAuthStateChanged(_auth, async user => {
      _currentUser = user;
      _updatePill(user);
      if (user) {
        await _loadFromCloud(user.uid);
        _updatePill(user); // refresh callsign after load
      }
    });
  } catch (e) {
    console.warn('[MSM Auth] Init failed:', e.message);
  }
})();

// ── Public API ───────────────────────────────────────────────────────────
window.MSM_AUTH = {
  signOut:    _doSignOut,
  syncNow:    () => _saveToCloud(),
  getUser:    () => _currentUser,
  showModal:  _showModal,
  isSignedIn: () => !!_currentUser,
};
