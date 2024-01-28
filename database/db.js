
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Assumes DATABASE_URL is set in your environment variables
    // Additional configuration may be required for SSL, etc.
});

const query = async (text, params) => {
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release();
    }
};

module.exports = {
    query
};
