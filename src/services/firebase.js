// إعدادات Firebase — بديل من Firebase Console
// Firebase Console -> Project Settings -> General -> Your apps -> SDK setup and configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBeCgYUrERFOEPe6p7JKhZbAfzfFGNkcsw',
  authDomain: 'jotia-app.firebaseapp.com',
  projectId: 'jotia-app',
  storageBucket: 'jotia-app.firebasestorage.app',
  messagingSenderId: '150628485816',
  appId: '1:150628485816:web:953252479c8a94c8c1424d',
  measurementId: 'G-06BJ9D9GLR',
};

// نتفاداو تكرار التهيئة مع Fast Refresh
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
