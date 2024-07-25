import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, getIdToken } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

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

function handleAuthStateChange(user) {
    window.user = user;
    const event = new CustomEvent('authStateChanged', { detail: { user } });
    window.dispatchEvent(event);
}

onAuthStateChanged(auth, handleAuthStateChange);

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

    document.getElementById('sign-in').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Login failed:', error);
        }
    });

    document.getElementById('sign-in-google').addEventListener('click', async () => {
        const googleProvider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Google sign-in failed:', error);
        }
    });
});