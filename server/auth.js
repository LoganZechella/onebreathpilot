import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

let firebaseApp;
let auth;
let authStateReady = false;

async function initializeFirebase() {
    try {
        const response = await fetch('/.netlify/functions/getFirebaseConfig');
        const firebaseConfig = await response.json();
        firebaseApp = initializeApp(firebaseConfig);
        auth = getAuth(firebaseApp);
        setupAuthListeners();
    } catch (error) {
        console.error('Error initializing Firebase:', error);
    }
}

function setupAuthListeners() {
    onAuthStateChanged(auth, (user) => {
        window.user = user;
        authStateReady = true;
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
    });

    // Expose Firebase Auth methods globally
    window.firebaseAuth = {
        signInWithEmailAndPassword: (email, password) => signInWithEmailAndPassword(auth, email, password),
        signOut: () => signOut(auth),
        currentUser: auth.currentUser
    };
}

window.waitForAuthReady = function() {
    return new Promise((resolve) => {
        if (authStateReady) {
            resolve();
        } else {
            window.addEventListener('authStateChanged', () => resolve(), { once: true });
        }
    });
};

initializeFirebase();