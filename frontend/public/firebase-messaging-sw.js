// firebase-messaging-sw.js — Service Worker for Firebase Cloud Messaging
// Place this file in frontend/public/

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// ⚠️ Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBHRQvYgY6ayB5fQRRzTUJ9iYVrnmHjzM4",
  authDomain: "aapada-rakshak-8ee30.firebaseapp.com",
  projectId: "aapada-rakshak-8ee30",
  storageBucket: "aapada-rakshak-8ee30.appspot.com",
  messagingSenderId: "1084772978039",
  appId: "1:1084772978039:web:a7c037d918041672676572",
  measurementId: "G-T842Y9N2Q2"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);
  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || '⚠️ Disaster Alert', {
    body: body || 'A new disaster alert has been issued in your area.',
    icon: icon || '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'disaster-alert',
    requireInteraction: true,
    actions: [
      { action: 'view-map', title: '🗺️ View Map' },
      { action: 'find-shelter', title: '🏥 Find Shelter' }
    ],
    data: payload.data || {}
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const urlMap = {
    'view-map': '/map',
    'find-shelter': '/shelters',
  };
  const url = urlMap[action] || '/';
  event.waitUntil(clients.openWindow(url));
});