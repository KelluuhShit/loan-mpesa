// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDElJRnG_LrcHdOn9wYfftIWOIOkrtLMxQ",
  authDomain: "kopa-to-mpesa.firebaseapp.com",
  projectId: "kopa-to-mpesa",
  storageBucket: "kopa-to-mpesa.firebasestorage.app",
  messagingSenderId: "1040216613542",
  appId: "1:1040216613542:web:e709de32957f6142ac8a67",
  measurementId: "G-EGHWEKRLMT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Export Firebase services
export { app, analytics, logEvent, db };