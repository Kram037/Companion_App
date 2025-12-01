// Firebase Configuration Template
// Copia questo file come firebase-config.js e inserisci le tue credenziali Firebase
// Per ottenere le credenziali:
// 1. Vai su https://console.firebase.google.com/
// 2. Crea un nuovo progetto o seleziona uno esistente
// 3. Vai su Project Settings > General
// 4. Scorri fino a "Your apps" e aggiungi una Web app
// 5. Copia le credenziali qui sotto

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID" // Opzionale
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Export for use in other modules
export { app, auth, analytics };

