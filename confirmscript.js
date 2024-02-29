// document.addEventListener('DOMContentLoaded', function () {
//     const queryParams = new URLSearchParams(window.location.search);
//     const sampleId = queryParams.get('sample_id');

//     function sendSample(sampleData) {
//         sampleData.timestamp = new Date().toISOString();

//         fetch('https://onebreathpilot.onrender.com/collectedsamples', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(sampleData),
//         })
//             .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
//             .then(json => {
//                 console.log('Sample added to the database:', json);
//                 document.getElementById('confirmation-message-text').innerText = 'Sample successfully added to the database.';
//             })
//             .catch(error => {
//                 console.error('Error adding sample to the database:', error);
//                 document.getElementById('confirmation-message-text').innerText = 'Error adding sample to the database.';
//             });
//     }

//     if (sampleId) {
//         // Correctly concatenate the sampleId with the URL
//         const url = `https://onebreathpilot.onrender.com/temp_samples/${sampleId}`;
//         console.log(url);

//         fetch(url, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         })
//             .then(response => response.json())
//             .then(data => {
//                 console.log('Success:', data);
//                 if (data.chipID) { // Assuming data is a single object
//                     let message = `Collect breath per study protocol then return to this page. 
//                                     When evacuation for sample ${data.chipID} has started, press the start button below:`;
//                     document.getElementById('confirmation-message-text').innerHTML = message;

//                     document.getElementById('start-button').addEventListener('click', function () {
//                         sendSample(data);
//                     });
//                 } else {
//                     console.error('Sample data is missing or malformed:', data);
//                 }
//                 // Assuming you want to call sendSample with the fetched data
//                 // sendSample(data);
//             })
//             .catch(error => {
//                 console.error('Error fetching sample:', error);
//             });
//     }
// });

// Configuration for API endpoint to make it flexible for different environments
const API_BASE_URL = 'http://127.0.0.1:5000';
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
        const response = await fetch('http://127.0.0.1:5000/updateLatestSample', {
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
            let message = `Collect breath per study protocol then return to this page. 
                         When evacuation for sample ${sampleId} has started, press the start button below:`;
            document.getElementById('confirmation-message-text').innerHTML = message;

            document.getElementById('start-button').addEventListener('click', function () {
                    window.location.href = '/index.html';
            });
    // }
    }
});


