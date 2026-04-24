// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
const firebaseConfig = {
    apiKey: "AIzaSyAQZ9THq-_N-llY5f8RK3R3ijfUGR_2UlQ",
    authDomain: "creative-work-flow-system.firebaseapp.com",
    projectId: "creative-work-flow-system",
    storageBucket: "creative-work-flow-system.firebasestorage.app",
    messagingSenderId: "682600751144",
    appId: "1:682600751144:web:da1f8a5daca707ddf9151d",
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/IMG_6540.PNG', // Using your logo
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
