// firebase/config.js — Aapada Rakshak Firebase Configuration
// Replace these values with your Firebase project credentials
// Go to: Firebase Console → Project Settings → Your Apps → Web App

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// ⚠️ REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBHRQvYgY6ayB5fQRRzTUJ9iYVrnmHjzM4",
  authDomain: "aapada-raksnphak-8ee30.firebaseapp.com",
  projectId: "aapada-rakshak-8ee30",
  storageBucket: "aapada-rakshak-8ee30.firebasestorage.app",
  messagingSenderId: "1084772978039",
  appId: "1:1084772978039:web:a7c037d918041672676572",
  measurementId: "G-T842Y9N2Q2",
};
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Services
export const db = getFirestore(app);
export const auth = getAuth(app);

// FCM (Cloud Messaging) — only in browser
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn("[FCM] Messaging not supported:", e);
}
export { messaging };

// Request FCM permission and get token
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) return null;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey:
          "BGLBCeeRwM2Wx03My5QbiJODleDS4wYZB4ZJjbT5y_gkkcWsMHSoL_8toOpsflB2ooeW9n3RprOGXYzFQA921uY	", // From Firebase Console → Cloud Messaging → Web Push certificates
      });
      console.log("[FCM] Token:", token);
      return token;
    }
    return null;
  } catch (error) {
    console.error("[FCM] Permission error:", error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

export default app;
