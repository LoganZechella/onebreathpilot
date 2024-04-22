// Configuration for API endpoint to make it flexible for different environments
const API_BASE_URL = 'https://onebreathpilot.onrender.com';
// const API_BASE_URL = 'http://127.0.0.1:5000';
const SAMPLES_ENDPOINT = `/latestsample`;

// Utility function for debouncing
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        let context = this, args = arguments;
        let later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Simple caching mechanism
let cache = {};

async function fetchData(url) {
    if (cache[url]) {
        return cache[url]; // Return cached data
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        cache[url] = data; // Cache the fetched data
        return data;
    } catch (error) {
        console.error("Fetch error: ", error);
    }
}

async function updateSample(sampleData) {
    
    try {
        const response = await fetch('https://onebreathpilot.onrender.com/updateLatestSample', {
        // const response = await fetch('http://127.0.0.1:5000/updateLatestSample', {    
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sampleData),
        });
        if (response !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("Sample updated successfully");
        // Provide UI feedback here (e.g., success message, spinner hide)
        window.location.href = '/index.html';
    } catch (error) {
        console.error("Sending sample error: ", error);
        // Provide UI feedback here (e.g., error message, spinner hide)
    }
}

function validateSampleData(data) {
    // Define required fields with expected data types
    const requiredFields = {
        chipID: 'string',
        patientID: 'string',
        location: 'string'
    };

    // Check for the existence and correct type of all required fields
    for (const [field, type] of Object.entries(requiredFields)) {
        const value = data[field];

        // Check for existence
        if (value === undefined) {
            console.error(`Validation error: ${field} is missing.`);
            return false;
        }

        // Check for correct type
        if (typeof value !== type) {
            console.error(`Validation error: ${field} is expected to be a ${type}, but got ${typeof value}.`);
            return false;
        }
    }
    return true;
}



document.addEventListener('DOMContentLoaded', async () => {
    const queryParams = new URLSearchParams(window.location.search);
    const sampleId = queryParams.get('chipID');
    if (sampleId) {
        // const sampleDataUrl = `${API_BASE_URL}${SAMPLES_ENDPOINT}`;
        // const sampleData = await fetchData(sampleDataUrl);
        // if (sampleData) {
            // Display sample data and setup event listeners
            let message1 = '<h2>COLLECT BREATH PER STUDY PROTOCOL THEN RETURN TO THIS PAGE.</h2>'; 
            let message2 = `<h3>When evacuation for sample ${sampleId} has started, press the start button below:</h3>`;
            let messageCombined = `${message1} <br/> ${message2}`;
            document.getElementById('confirmation-message-text').innerHTML = messageCombined;
            document.getElementById('start-button').addEventListener('click', function () {
                    window.location.href = '/index.html';
            });
    // }
    }
});


