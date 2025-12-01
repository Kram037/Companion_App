// Firebase Configuration - Compat Version (no ES modules)
// This version works without a local server

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDELUDb7rOrUXsl72U6rRFoj_CqFMJDU1k",
    authDomain: "companionapp-37.firebaseapp.com",
    projectId: "companionapp-37",
    storageBucket: "companionapp-37.firebasestorage.app",
    messagingSenderId: "857457875294",
    appId: "1:857457875294:web:dbfef7b69a374b30f697cf",
    measurementId: "G-HEC1PZE3HD"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const analytics = firebase.analytics();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

console.log('✅ Firebase (Compat) inizializzato correttamente');

