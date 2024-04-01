import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

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
    document.getElementById('sign-in').addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        fetch('http://127.0.0.1:5000/api/auth/signin', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })
        .then(response => response.json())
        
        .catch(error => {
            console.error("Error signing in with email:", error);
            alert(error.message); // Display errors to the user
        });
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
