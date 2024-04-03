
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
// Import statements for Firebase v9+
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Initialize Firebase App
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "pilotdash-2466b",
    storageBucket: "pilotdash-2466b.appspot.com",
    messagingSenderId: "929141041648",
    appId: "1:929141041648:web:1f27019dda3624dd885535",
    measurementId: "G-R0EETJKW7B"
};
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

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
    // Email Sign-In
    document.getElementById('sign-in').addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                return user.getIdToken();
            })
            .then((idToken) => {
                return fetch('http://127.0.0.1:5000/api/auth/signin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken })
                });
            })
            .then(response => response.json())
            .then(data => {
                console.log('Login Successful:', data);
                document.getElementById('sign-in-container').style.display = 'none'; // Hide the sign-in form
                document.getElementById('show-sign-in').classList.add('logged-in'); // Update the UI to show the user is logged in
                document.getElementById('show-sign-in').textContent = 'Sign Out'; // Change the text to "Sign Out"
            })
            .catch(error => {
                console.error('Error signing in with email:', error);
                alert('Login failed: ' + error.message);
            });
    });

    // Google Sign-In
    document.getElementById('sign-in-google').addEventListener('click', async () => {
        const googleProvider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // Send ID token to your backend via HTTP POST
            const idToken = await result.user.getIdToken();
            fetch('http://127.0.0.1:5000/api/auth/googleSignIn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            }).then(response => response.json())
                .then(data => {
                    // console.log('Backend response:', data);
                    document.getElementById('sign-in-container').style.display = 'none'; // Hide the sign-in form
                    document.getElementById('show-sign-in').classList.add('logged-in'); // Update the UI to show the user is logged in
                    document.getElementById('show-sign-in').textContent = 'Sign Out'; // Change the text to "Sign Out"
                    // Handle response from your backend
                }).catch(error => {
                    console.error('Error sending ID token to backend:', error);
                });
        } catch (error) {
            console.error("Error with Google sign-in:", error);
            alert(error.message);
        }
    });
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in:', user);
        document.getElementById('show-sign-in').classList.add('logged-in'); // Update the UI to show the user is logged in
        document.getElementById('show-sign-in').textContent = 'Sign Out'; // Change the text to "Sign Out"
    } else {
        document.getElementById('show-sign-in').classList.remove('logged-in'); // Update the UI to show the user is logged out
        document.getElementById('show-sign-in').textContent = 'Sign In'; // Change the text to "Sign In"
    }
});
