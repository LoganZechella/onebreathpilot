import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, getIdToken, getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";

// Initialize Firebase App
const firebaseConfig = {
    apiKey: "AIzaSyC8LkfOZniLfcItfzU4vO-vxFw2Jcr15y0",
    authDomain: "dashboard-424301.firebaseapp.com",
    projectId: "dashboard-424301",
    storageBucket: "dashboard-424301.appspot.com",
    messagingSenderId: "121248577105",
    appId: "1:121248577105:web:ad670277dad3b9cfd8aa70"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function handleAuthStateChange(user) {
    if (user) {
        getIdToken(user).then(idToken => {
            if (success) {
                window.user = user;
                const event = new CustomEvent('authStateChanged', { detail: { user } });
                window.dispatchEvent(event);
            } else {
                console.error('Authentication failed:', response.error);
            }
        }).catch((error) => {
            console.error('Error getting ID token:', error);
        });
    } else {
        window.user = null;
        const event = new CustomEvent('authStateChanged', { detail: { user: null } });
        window.dispatchEvent(event);
    }
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

async function makeAuthRequest(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 'idToken': data })
        });
        return response.json();
    } catch (error) {
        console.error('Error with auth request:', error);
        throw error;
    }
}
