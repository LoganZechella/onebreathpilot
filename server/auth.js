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
    const signInContainer = document.getElementById('sign-in-container');
    const landingMain = document.getElementById('landing-main');
    const signInButton = document.getElementById('show-sign-in');
    const blocker = document.querySelector('.blocker');

    if (user) {
        signInContainer.style.display = 'none';
        landingMain.style.display = 'flex';
        blocker.style.display = 'flex';
        signInButton.textContent = 'Sign Out';
    } else {
        signInContainer.style.display = 'block';
        landingMain.style.display = 'block';
        signInButton.textContent = 'Sign In';
    }
}

// Listen for authentication state to change
onAuthStateChanged(auth, user => {
    updateUIForAuth(user);
    window.user = user; // Expose user to global scope
});

document.addEventListener('DOMContentLoaded', () => {
    window.auth = auth; // Expose auth to global scope

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
            const authRequest = await makeAuthRequest('https://onebreathpilot.netlify.app/api/auth/signin', { idToken, type: 'emailSignIn' }).then(() => {
                if (authRequest.success) {
                    document.getElementById('loading-spinner').classList.add('animate__animated', "animate__fadeOut");
                    document.getElementById('loading-spinner').style.display = 'none';
                    document.getElementById('loading-spinner').classList.remove('animate__animated', "animate__fadeOut");
                    document.getElementById('sign-in-container').classList.add('animate__animated', "animate__bounceOut");
                    document.getElementById('sign-in-container').style.display = 'none';
                    document.getElementById('landing-main').style.display = 'flex';
                    document.querySelector('.blocker').style.display = 'flex';
                    const nav = document.querySelector('.container-fluid');
                    nav.style.display = 'flex';
                } else {
                    alert('Error with auth request:', authRequest.error);
                    document.getElementById('loading-spinner').style.display = 'none';
                }
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
            await makeAuthRequest('https://onebreathpilot.netlify.app/api/auth/signin', { idToken, type: 'googleSignIn' });
            document.getElementById('loading-spinner').style.display = 'none';
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
