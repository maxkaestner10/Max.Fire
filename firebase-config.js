// =======================================
// Maximum Fire - firebase-config.js
// =======================================

const firebaseConfig = {
    apiKey: "AIzaSyAKUTkRHThhoyjw-UWlUWoKBNcadwwNB0U",
    authDomain: "maximumfiremax.firebaseapp.com",
    projectId: "maximumfiremax",
    storageBucket: "maximumfiremax.firebasestorage.app",
    messagingSenderId: "356373963033",
    appId: "1:356373963033:web:1aa879f1c6a3cc21632588"
};

// Firebase initialisieren
firebase.initializeApp(firebaseConfig);

// Zugriff auf die Firestore Datenbank bereitstellen
const db = firebase.firestore();
console.log("Firebase erfolgreich verbunden!");