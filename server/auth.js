// Import auth instance from firebaseConfig.js
import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

// Listen for the document to be loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('show-sign-in').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the link from following the URL
        if (document.getElementById('show-sign-in').classList.contains('logged-in')) {
            auth.signOut();
            window.location.reload();
        } else {
            document.getElementById('sign-in-container').style.display = 'block';
        };
    });
    // Email/Password Sign-In
    document.getElementById('sign-in').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password); // Correctly capturing the result
            console.log("Email sign-in user:", userCredential.user);
            // Redirect here or update UI
            window.location.href = '/index.html'; // Example redirect
        } catch (error) {
            console.error("Error signing in with email:", error);
            alert(error.message); // Display errors to the user
        }
    });


    // Google Sign-In
    document.getElementById('sign-in-google').addEventListener('click', async () => {
        const googleProvider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, googleProvider); // Correctly capturing the result
            console.log("Google sign-in user:", result.user);
            // Redirect here or update UI
            window.location.href = '/index.html'; // Example redirect
        } catch (error) {
            console.error("Error with Google sign-in:", error);
            alert(error.message); // Display errors to the user
        }
    });
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, update the UI or redirect
        console.log("User is signed in", user);
        let login = document.getElementById('show-sign-in');
        login.innerHTML = "Sign Out";
        login.classList.add('logged-in');
    } else {
        // User is signed out, update the UI
        console.log("User is signed out");
        let login = document.getElementById('show-sign-in');
        login.innerHTML = "Sign In";
        login.classList.add('logged-out');
    }
});
