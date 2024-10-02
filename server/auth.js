import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

let firebaseApp;
let auth;

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
    // Function to handle auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
        } else {
            // No user is signed in
            window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: null } }));
        }
        // Update window.user here instead
        window.user = user;
    });

    // Expose auth for other scripts to use
    window.firebaseAuth = auth;

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('show-sign-in').addEventListener('click', (event) => {
            event.preventDefault();
            if (auth.currentUser) {
                auth.signOut().then(() => {
                    window.location.reload();
                }).catch((error) => {
                    console.error('Sign out error:', error);
                });
            } else {
                const event = new Event('showSignIn');
                window.dispatchEvent(event);
            }
        });

        if (document.getElementById('sign-in')) {    
            document.getElementById('sign-in').addEventListener('click', async () => {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                try {
                    await signInWithEmailAndPassword(auth, email, password);
                    // Consider updating UI here instead of reloading
                } catch (error) {
                    console.error('Login failed:', error);
                    // Add user-facing error message
                    alert('Login failed: ' + error.message);
                }
            });
        }
    });
}

// Initialize Firebase when the script loads
initializeFirebase();