import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Function to fetch Firebase config from Netlify function
async function getFirebaseConfig() {
    try {
        const response = await fetch('/.netlify/functions/getFirebaseConfig');
        if (!response.ok) {
            throw new Error('Failed to fetch Firebase config');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching Firebase config:', error);
        throw error;
    }
}

// Initialize Firebase App
let app, auth;

async function initializeFirebase() {
    const firebaseConfig = await getFirebaseConfig();
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Function to handle auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            window.user = user;
            window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
        } else {
            // No user is signed in
            window.user = null;
            window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: null } }));
        }
    });

    // Expose auth for other scripts to use
    window.firebaseAuth = auth;
}

// Call the initialization function
initializeFirebase().catch(console.error);

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('show-sign-in').addEventListener('click', (event) => {
        event.preventDefault();
        if (auth.currentUser) {
            signOut(auth).then(() => {
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
                window.location.reload();
            } catch (error) {
                console.error('Login failed:', error);
            }
        });
        window.user = auth.currentUser;
    }

    // document.getElementById('sign-in-google').addEventListener('click', async () => {
    //     const googleProvider = new GoogleAuthProvider();
    //     try {
    //         await signInWithPopup(auth, googleProvider);
    //     } catch (error) {
    //         console.error('Google sign-in failed:', error);
    //     }
    // });
});
