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

    window.firebaseAuth = auth;

    document.addEventListener('DOMContentLoaded', () => {
        const signInButton = document.getElementById('show-sign-in');
        if (signInButton) {
            signInButton.addEventListener('click', (event) => {
                event.preventDefault();
                if (auth.currentUser) {
                    signOut(auth).then(() => {
                        window.location.reload();
                    }).catch((error) => {
                        console.error('Sign out error:', error);
                    });
                } else {
                    window.location.href = '/index.html';
                }
            });
        }

        const signInForm = document.getElementById('sign-in');
        if (signInForm) {
            signInForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                try {
                    await signInWithEmailAndPassword(auth, email, password);
                    window.location.reload();
                } catch (error) {
                    console.error('Login failed:', error);
                    alert('Login failed: ' + error.message);
                }
            });
        }
    });
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