import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyBj-s-Xj--Dx-tfxkxY_k7UTbZqULj1DD4",
  authDomain: "vervex-c5b91.firebaseapp.com",
  projectId: "vervex-c5b91",
  storageBucket: "vervex-c5b91.firebasestorage.app",
  messagingSenderId: "363855728600",
  appId: "1:363855728600:web:6e279fd0bb27dbab1e2cad"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
