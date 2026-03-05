// Firebase configuration for Aapada Rakshak

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBHRQvYgY6ayB5fQRRzTUJ9iYVrnmHjzM4",
  authDomain: "aapada-rakshak-8ee30.firebaseapp.com",
  projectId: "aapada-rakshak-8ee30",
  storageBucket: "aapada-rakshak-8ee30.firebasestorage.app",
  messagingSenderId: "1084772978039",
  appId: "1:1084772978039:web:a7c037d918041672676572",
  measurementId: "G-T842Y9N2Q2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;