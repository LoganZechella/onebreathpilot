import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "",
    authDomain: "pilotdash-2466b.firebaseapp.com",
    projectId: "pilotdash-2466b",
    storageBucket: "pilotdash-2466b.appspot.com",
    messagingSenderId: "929141041648",
    appId: "1:929141041648:web:1f27019dda3624dd885535",
    measurementId: "G-R0EETJKW7B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the auth service for use in other modules
export const auth = getAuth(app);
