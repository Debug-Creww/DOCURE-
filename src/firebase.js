// src/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration can be customized via Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoDocureApiKey123456789",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "docure-health-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "docure-health-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "docure-health-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcdef123456"
};

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize and export Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Default mock current user fallback for local development or demo sessions
export const getDefaultUserId = () => {
  return auth.currentUser?.uid || "docure_patient_anushka";
};

export default app;
