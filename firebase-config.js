// ─────────────────────────────────────────────────────────────
// THE MARK SCHEME METHOD® – Firebase Configuration
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const MSM_FIREBASE_CONFIG = {
    apiKey:            "AIzaSyCVC9ao5TOZEbq-xqetOoP-pBy-k8HJ4Lk",
    authDomain:        "mark-scheme-method-3efe9.firebaseapp.com",
    projectId:         "mark-scheme-method-3efe9",
    storageBucket:     "mark-scheme-method-3efe9.firebasestorage.app",
    messagingSenderId: "148025025945",
    appId:             "1:148025025945:web:dbc09dbd4ac2777f959f08"
};

const app = initializeApp(MSM_FIREBASE_CONFIG);
const db  = getFirestore(app);

// ─────────────────────────────────────────────────────────────
// Do not edit below this line
// ─────────────────────────────────────────────────────────────
window.MSM_FIREBASE_CONFIG = MSM_FIREBASE_CONFIG;
window.MSM_DB = db;
window.MSM_APP = app;

export { app, db };
