import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for LEO.AI
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBqn23kKtOWXvfVt--vRRpw3Ai_-8TVNUU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "leo-fitness-c0aa7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "leo-fitness-c0aa7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "leo-fitness-c0aa7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "762537186112",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:762537186112:web:9c69c5d3a57da09a2a20a5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-1EMP5FTMEP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
