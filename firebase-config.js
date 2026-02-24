// ─────────────────────────────────────────────────────────────
// THE MARK SCHEME METHOD® — Firebase Configuration
// ─────────────────────────────────────────────────────────────
// SETUP: Replace every value below with your own Firebase project
// credentials. Get these from:
//   Firebase Console → Your Project → Project Settings
//   → Your apps → Web app → SDK setup and configuration
// ─────────────────────────────────────────────────────────────

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVC9ao5TOZEbq-xqetOoP-pBy-k8HJ4Lk",
  authDomain: "mark-scheme-method-3efe9.firebaseapp.com",
  projectId: "mark-scheme-method-3efe9",
  storageBucket: "mark-scheme-method-3efe9.firebasestorage.app",
  messagingSenderId: "148025025945",
  appId: "1:148025025945:web:dbc09dbd4ac2777f959f08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// ─────────────────────────────────────────────────────────────
// Do not edit below this line
// ─────────────────────────────────────────────────────────────
window.MSM_FIREBASE_CONFIG = MSM_FIREBASE_CONFIG;
