import fetch from 'node-fetch';

export async function authFrontend(event) {
    // Setting CORS headers
    const headers = {
        'Access-Control-Allow-Origin': 'https://onebreathpilot.netlify.app',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    try {
        const { type, email, password, idToken } = JSON.parse(event.body);
        const backendUrl = process.env.BACKEND_URL;
        const apiSecret = process.env.API_SECRET;
        let apiUrl = '';
        let fetchOptions = {};

        switch (type) {
            case 'emailSignIn':
                apiUrl = `${backendUrl}/api/auth/signin`;
                fetchOptions = {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiSecret}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                };
                break;
            case 'googleSignIn':
                apiUrl = `${backendUrl}/api/auth/googleSignIn`;
                fetchOptions = {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiSecret}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ idToken })
                };
                break;
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Invalid request type" }),
                    headers
                };
        }

        const response = await fetch(apiUrl, fetchOptions);

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error: ' + error.message }),
            headers
        };
    }
}
