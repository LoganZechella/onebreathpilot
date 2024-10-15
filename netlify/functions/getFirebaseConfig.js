export const handler = async () => {
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_FRONTEND_API_KEY,
        authDomain: process.env.FIREBASE_FRONTEND_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_FRONTEND_PROJECT_ID,
        storageBucket: process.env.FIREBASE_FRONTEND_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_FRONTEND_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_FRONTEND_APP_ID,
        measurementId: process.env.FIREBASE_FRONTEND_MEASUREMENT_ID
    };

    return {
        statusCode: 200,
        body: JSON.stringify(firebaseConfig)
    };
};