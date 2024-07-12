import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, getIdToken } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
// Import statements for Firebase v9+
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

// Helper function to make API requests to Netlify function
async function makeAuthRequest(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            body: JSON.stringify(data)
        });
        return response.json();
    } catch (error) {
        // console.error('Error with auth request:', error);
        throw error;
    }
}

// Listen for the document to be loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.currentUser) {
        document.querySelector('.blocker').style.display = 'none';
        document.getElementById('sign-in-container').style.display = 'block';
    }
    document.getElementById('show-sign-in').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the link from following the URL
        if (document.getElementById('show-sign-in').classList.contains('logged-in')) {
            auth.signOut();
            window.location.reload();
        } else {
            document.getElementById('sign-in-container').style.display = 'block';
        };
    });

    document.getElementById('sign-in').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            const idToken = await getIdToken(auth.currentUser);
            const data = await makeAuthRequest('https://onebreathpilot.netlify.app/authFrontend', { idToken, type: 'emailSignIn' });
            // console.log('Login successful:', data);
        } catch (error) {
            // console.error('Login failed:', error);
            // alert('Login failed: ' + error.message);
        }
    });

    document.getElementById('sign-in-google').addEventListener('click', async () => {
        const googleProvider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            const data = await makeAuthRequest('https://onebreathpilot.netlify.app/authFrontend', { idToken, type: 'googleSignIn' });
            // console.log('Google sign-in successful:', data);
        } catch (error) {
            // console.error('Google sign-in failed:', error);
            // alert('Google sign-in failed: ' + error.message);
        }
    });

});

onAuthStateChanged(auth, user => {
    if (user) {
        document.querySelector('.blocker').style.display = 'flex'; // Hide the blocker
        document.getElementById('sign-in-container').style.display = 'none'; // Hide the sign-in form
        document.getElementById('show-sign-in').classList.add('logged-in'); // Update the UI to show the user is logged in
        document.getElementById('show-sign-in').textContent = 'Sign Out'; // Change the text to "Sign Out"
    } else {
        document.querySelector('.blocker').style.display = 'none'; // Show the blocker
        document.getElementById('show-sign-in').classList.remove('logged-in'); // Update the UI to show the user is logged out
        document.getElementById('show-sign-in').textContent = 'Sign In'; // Change the text to "Sign In"
    }
});
