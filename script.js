
function updateSampleQueues() {
    let samples = JSON.parse(localStorage.getItem('samples')) || [];
    let now = new Date().getTime();

    samples.forEach(sample => {
        if (sample.status === 'In Process') {
            let endTime = new Date(sample.timestamp).getTime() + (2 * 60 * 60 * 1000);
            if (now >= endTime) {
                sample.status = 'Ready for Pickup';
            }
        }
    });

    localStorage.setItem('samples', JSON.stringify(samples));
    refreshQueuesDisplay();
}

function refreshQueuesDisplay() {
    let samples = JSON.parse(localStorage.getItem('samples')) || [];
    let inProcessElement = document.getElementById('in-process-section');
    let readyForPickupElement = document.getElementById('pickup-section');

    samples.forEach(sample => {
        let sampleCard = createSampleCard(sample);

        if (sample.status === 'In Process') {
            inProcessElement.appendChild(sampleCard);
        } else if (sample.status === 'Ready for Pickup') {
            readyForPickupElement.appendChild(sampleCard);
            // Add 'Pick Up Chip' button if not already present
            if (!sampleCard.querySelector('.pickup-chip-button')) {
                addPickupButton(sample, sampleCard);
            }
        }
    });
}

function createSampleCard(sample) {
    let card = document.createElement('div');
    card.className = 'card';
    // card.id = `sample-card-${sample.chipID}`;
    card.innerHTML = `
                <p>Chip ID: ${sample.chipID}</p>
                <p>Patient ID: ${sample.patientID}</p>
                <p>Location: ${sample.location}</p>
                <p>Timer: <span id="timer-${sample.chipID}">00:00:00</span></p>
    `;
    return card;
}

function addPickupButton(sample, cardElement) {
    let button = document.createElement('button');
    button.className = 'pickup-chip-button';
    button.innerText = 'Pick Up Chip';
    button.addEventListener('click', () => openPickupForm(sample.chipID));
    cardElement.appendChild(button);
}

// Async function to send sample data to the server
async function sendSample(sampleData) {
    try {
        // const response = await fetch('http://127.0.0.1:5000/collectedsamples', {
        const response = await fetch('https://onebreathpilot.onrender.com/collectedsamples', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sampleData),
        });
        const data = await response.json();
        console.log('Sample added to the database:', data);
        
    } catch (error) {
        console.error('Error adding sample to the database:', error);
    }
    
}

// Utility function for getting query string parameters
function getQueryStringParams(param) {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(param);
}

// Function to initialize the application
async function initApp() {
    const queryParams = window.location.search;

    // Handle different parts of the application based on URL and queryParams
    if (queryParams) {
        document.getElementById('landing-main').style.display = 'none';
        const chipID = getQueryStringParams('chipID');
        if (chipID) {
            document.getElementById('chipID').value = chipID;
        }
    } else {
        document.getElementById('add-sample-main').style.display = 'none';
        document.getElementById('landing-main').style.display = 'flex';
        console.log('URL does not include query parameters');
    }

    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        setupFormSubmissionListener();
    } else if (window.location.pathname.endsWith('confirm.html')) {
        displayConfirmationMessage();
    }
}

function setupFormSubmissionListener() {
    document.getElementById('confirm-button').addEventListener('click', async function (event) {
        event.preventDefault();
        const sample = collectSampleFormData();
        if (sample) {
            sample.timestamp = new Date().toISOString();
            sample.status = 'In Process';
            await sendSample(sample);
            // Redirect or update UI based on the application's flow
            window.location.href = `confirm.html?chipID=${sample.chipID}`;
        }
    });
}

// Collects form data and validates it
function collectSampleFormData() {
    let chipID = document.getElementById('chipID').value;
    let patientID = document.getElementById('patientID').value;
    let location = document.getElementById('location').value;

    // Basic validation (expand based on requirements)
    if (!chipID || !patientID || !location) {
        alert('Please fill in all required fields.');
        return null;
    }

    return {
        chipID: chipID,
        patientID: patientID,
        location: location,
    };
}

function displayConfirmationMessage() {
    // Implement logic to display confirmation message based on the application's state
    console.log('Display confirmation message for the last sample');
}
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    AOS.refresh();
    
    // Show the sign-in form
    document.getElementById('show-sign-in').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the link from following the URL
        document.getElementById('sign-in-container').style.display = 'block';
    });

    // Optionally, if you have a close button in your form, handle its click event to hide the form
    document.getElementById('sign-in-close-btn').addEventListener('click', () => {
        document.getElementById('sign-in-container').style.display = 'none';
    });
});

