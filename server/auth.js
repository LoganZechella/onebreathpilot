import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";


// Initialize Firebase App
const firebaseConfig = {
    apiKey: "AIzaSyC8LkfOZniLfcItfzU4vO-vxFw2Jcr15y0",
    authDomain: "dashboard-424301.firebaseapp.com",
    projectId: "dashboard-424301",
    storageBucket: "dashboard-424301.appspot.com",
    messagingSenderId: "121248577105",
    appId: "1:121248577105:web:ad670277dad3b9cfd8aa70",
    measurementId: "G-GSKZV0PKMN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to handle auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
    } else {
        // No user is signed in
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: null } }));
    }
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