export default async function authFrontend(event, context) {
    // Setup CORS headers for both production and local development
    const headers = {
        'Access-Control-Allow-Origin': event.headers.origin || event.headers.Origin || '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        if (!event.body) {
            return new Response(JSON.stringify({ error: "No request body provided" }), { status: 400, headers });
        }

        const { type, email, password, idToken } = JSON.parse(event.body);
        const backendUrl = "https://onebreathpilot.onrender.com";
        const apiSecret = context.clientContext.environment.API_SECRET;
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
                    body: JSON.stringify({ idToken })  // Updated to send only the idToken
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
                return new Response(JSON.stringify({ error: "Invalid request type" }), { status: 400, headers });
        }

        const response = await fetch(apiUrl, fetchOptions);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200, headers });

    } catch (error) {
        console.error('Error processing the request:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error: ' + error.message }), { status: 500, headers });
    }
}
