// ============================================================
//  auth.js — Firebase Google Auth + Daily Plan Limit
//
//  Uses Firebase v10 modular SDK via CDN.
//  Each user gets 1 free plan generation per day.
//  Usage is tracked in Firestore: usage/{uid}_{date}
// ============================================================

import { initializeApp }           from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInWithPopup,
         GoogleAuthProvider,
         onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc,
         getDoc, setDoc,
         serverTimestamp }         from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig }          from '../firebase-config.js';

export const DAILY_LIMIT = 1;

// ─── Firebase init ─────────────────────────────────────────
let app, auth, db;
let _currentUser = null;
let _configMissing = false;

try {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY') {
    throw new Error('Firebase config not filled in.');
  }
  app  = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
} catch (err) {
  _configMissing = true;
  console.warn('[Auth] Firebase not configured:', err.message);
}

export function isFirebaseReady() { return !_configMissing; }

// ─── Auth state ────────────────────────────────────────────
export function onAuthChange(callback) {
  if (_configMissing) { callback(null); return; }
  onAuthStateChanged(auth, (user) => {
    _currentUser = user;
    callback(user);
  });
}

export function getCurrentUser() { return _currentUser; }

// ─── Sign in / out ────────────────────────────────────────
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function signOutUser() {
  await signOut(auth);
  _currentUser = null;
}

// ─── Daily limit helpers ───────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function usageDocRef(uid) {
  return doc(db, 'usage', `${uid}_${todayKey()}`);
}

/** Returns { allowed: true } or { allowed: false, reason: 'not_logged_in' | 'limit_reached' } */
export async function checkDailyLimit() {
  if (!_currentUser) return { allowed: false, reason: 'not_logged_in' };

  const snap = await getDoc(usageDocRef(_currentUser.uid));
  const count = snap.exists() ? (snap.data().count ?? 0) : 0;

  if (count < DAILY_LIMIT) return { allowed: true };
  return { allowed: false, reason: 'limit_reached' };
}

/** Call AFTER a successful generation to record usage */
export async function recordUsage() {
  if (!_currentUser) return;

  const ref  = usageDocRef(_currentUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid:       _currentUser.uid,
      email:     _currentUser.email,
      date:      todayKey(),
      count:     1,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      count:     (snap.data().count ?? 0) + 1,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
}
