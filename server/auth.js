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

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

function updateUIForAuth(user) {
    if (user) {
        document.querySelector('.blocker').style.display = 'flex';
        document.getElementById('sign-in-container').style.display = 'none';
        document.getElementById('show-sign-in').textContent = 'Sign Out';
        document.getElementById('show-sign-in').classList.add('logged-in');
    } else {
        document.querySelector('.blocker').style.display = 'none';
        document.getElementById('sign-in-container').style.display = 'block';
        document.getElementById('show-sign-in').textContent = 'Sign In';
        document.getElementById('show-sign-in').classList.remove('logged-in');
    }
}

// Listen for authentication state to change
onAuthStateChanged(auth, user => {
    updateUIForAuth(user);
});

document.addEventListener('DOMContentLoaded', () => {
    // Check initial state of user authentication
    updateUIForAuth(auth.currentUser);

    document.getElementById('show-sign-in').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the link from following the URL
        if (auth.currentUser) {
            auth.signOut().then(() => {
                window.location.reload();
            }).catch((error) => {
                console.error('Sign out error:', error);
            });
        } else {
            document.getElementById('sign-in-container').style.display = 'block';
        }
    });

    document.getElementById('sign-in').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        document.getElementById('loading-spinner').style.display = 'block';  // Show spinner
        try {
            await signInWithEmailAndPassword(auth, email, password);
            const idToken = await getIdToken(auth.currentUser);
            await makeAuthRequest('https://onebreathpilot.netlify.app/authFrontend', { idToken, type: 'emailSignIn' });
            document.getElementById('loading-spinner').style.display = 'none';
            animateCSS('#sign-in-container', 'animate__fadeOut', () => {
                updateUIForAuth(auth.currentUser);
            });
        } catch (error) {
            console.error('Login failed:', error);
            document.getElementById('loading-spinner').style.display = 'none';
        }
    });

    document.getElementById('sign-in-google').addEventListener('click', async () => {
        const googleProvider = new GoogleAuthProvider();
        document.getElementById('loading-spinner').style.display = 'block';  // Show spinner
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            await makeAuthRequest('https://onebreathpilot.netlify.app/authFrontend', { idToken, type: 'googleSignIn' });
            document.getElementById('loading-spinner').style.display = 'none';
            animateCSS('#sign-in-container', 'animate__fadeOut', () => {
                updateUIForAuth(auth.currentUser);
            });
        } catch (error) {
            console.error('Google sign-in failed:', error);
            document.getElementById('loading-spinner').style.display = 'none';
        }
    });
});

async function makeAuthRequest(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(data)
        });
        return response.json();
    } catch (error) {
        console.error('Error with auth request:', error);
        throw error;
    }
}

function animateCSS(element, animationName, callback) {
    const node = document.querySelector(element);
    node.classList.add('animate__animated', animationName);

    function handleAnimationEnd(event) {
        event.stopPropagation();
        node.classList.remove('animate__animated', animationName);
        if (callback) {
            callback();
        }
    }

    node.addEventListener('animationend', handleAnimationEnd, { once: true });
}
