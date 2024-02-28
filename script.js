
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


function submitSampleToTempBackend(sampleData) {
    // Add a timestamp to the sampleData object
    // sampleData.timestamp = new Date().toISOString();

    console.log(sampleData)
    // API call to submit data to the backend
    fetch('https://onebreathpilot.onrender.com/temp_samples', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            
        },
        body: JSON.stringify(sampleData),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data)
            if (data.sample_id) {
                window.location.href = `confirm.html?sample_id=${data.sample_id}`;
            } else {
                console.error('No sample_id returned from the backend:', data);
            }
        })
        .catch((error) => console.error('Error:', error));

    }

// Check if the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Check if the URL includes any query parameters
    const queryParams = window.location.search;
    if (queryParams) {
        // Query parameters exist
        document.getElementById('landing-main').style.display = 'none';
        // Function to get query string parameters
        function getQueryStringParams(param) {
            let searchParams = new URLSearchParams(window.location.search);
            return searchParams.get(param);
        }

        // Pre-fill the Chip ID field if the parameter is present
        let chipID = getQueryStringParams('chipID');
        if (chipID) {
            document.getElementById('chipID').value = chipID;
        }
    } else {
        // No query parameters
        updateSampleQueues();
        document.getElementById('add-sample-main').style.display = 'none';
        document.getElementById('landing-main').style.display = 'flex';
        console.log('URL does not include query parameters');
    }


    if (window.location.pathname.includes('index.html') === true || window.location.pathname === '/') {
        // let samples = JSON.parse(localStorage.getItem('samples')) || [];

        document.getElementById('confirm-button').addEventListener('click', function (event) {
            event.preventDefault();

            let chipID = document.getElementById('chipID').value;
            if (!chipID) {
                alert('Invalid Chip ID format.');
                return;
            }

            // Validate Patient ID Format
            let patientID = document.getElementById('patientID').value;
            if (!patientID) {
                alert('Invalid Patient ID format.');
                return;
            }

            // Ensure Location is Selected
            let location = document.getElementById('location').value;
            if (!location) {
                alert('Please select a location.');
                return;
            }

            let sample = {
                chipID: chipID,
                patientID: patientID,
                location: location,
            };

            // sample.status = 'In Process';
            // Add any additional fields as needed
            // localStorage.setItem('samples', JSON.stringify(samples.concat(sample)));
            submitSampleToTempBackend(JSON.stringify(sample));


            // Redirect to the confirmation page
            
            // window.location.href = `confirm.html?sample_id=${sample.chipID}`;
        });
    } else if (window.location.pathname.endsWith('confirm.html')) {
        let samples = JSON.parse(localStorage.getItem('samples'));
        let lastSample = samples[samples.length - 1];
        let message = `Collect breath per study protocol then return to this page. 
                        When evacuation for sample ${lastSample.chipID} started, press start button below:`;
        document.getElementById('confirmation-message-text').innerHTML = message;

        document.getElementById('start-button').addEventListener('click', function () {
            // Here you can add any logic that needs to run when the start button is clicked
            console.log('Evacuation started for sample:', lastSample.chipID);
        });
    }
});

// Function to update the 'In Process' queue
let samples = JSON.parse(localStorage.getItem('samples')) || [];
function updateInProcessQueue() {
    let inProcessQueue = samples.filter(sample => sample.status === 'In Process');
    let inProcessElement = document.getElementById('in-process-section');
    // inProcessElement.innerHTML = ''; // Clear existing entries

    inProcessQueue.forEach(sample => {
        let card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
                <p>Chip ID: ${sample.chipID}</p>
                <p>Patient ID: ${sample.patientID}</p>
                <p>Location: ${sample.location}</p>
                <p>Timer: <span id="timer-${sample.chipID}">00:00:00</span></p>
            `;
        inProcessElement.appendChild(card);
        startCountdownTimer(sample);
    });
}

// Function to start a countdown timer for a sample
function startCountdownTimer(sample) {
    let timerElement = document.getElementById(`timer-${sample.chipID}`);
    let initialTime = new Date(sample.timestamp).getTime(); // Timestamp when sample was added
    let countdownDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    let endTime = initialTime + countdownDuration; // Calculate end time

    let timerInterval = setInterval(function () {
        let currentTime = new Date().getTime();
        let remainingTime = endTime - currentTime; // Calculate remaining time in milliseconds

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            timerElement.innerText = "00:00:00";
            moveToNextQueue(sample.chipID);
        } else {
            let hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
            timerElement.innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Call the function to update the 'In Process' queue
updateInProcessQueue();



// Function to move a sample to the next queue
function moveToNextQueue(chipID) {
    let samples = JSON.parse(localStorage.getItem('samples')) || [];
    let sampleIndex = samples.findIndex(sample => sample.chipID === chipID);
    if (sampleIndex !== -1) {
        samples[sampleIndex].status = 'Ready for Pickup'; // Update status
        localStorage.setItem('samples', JSON.stringify(samples));
        // Refresh the display of the queues
        updateSampleQueues();
    }
}

// Function to open the pickup form modal
function openPickupModal(chipID) {
    let samples = JSON.parse(localStorage.getItem('samples')) || [];
    let sample = samples.find(s => s.chipID === chipID);

    if (sample) {
        // Populate the hidden field with chipID
        document.querySelector('#pickup-form [name="data-chip-id"]').value = chipID;
        document.getElementById('pickup-form-modal').style.display = 'block';
    }
}

document.getElementById('pickup-form').addEventListener('submit', function (event) {
    event.preventDefault();

    let chipID = this.elements['data-chip-id'].value;
    let finalVolume = this.elements['final-volume'].value;
    let averageCO2 = this.elements['average-co2'].value;
    let errorCodes = this.elements['error-codes'].value;

    // Find the sample and update its details
    let samples = JSON.parse(localStorage.getItem('samples')) || [];
    let sampleIndex = samples.findIndex(s => s.chipID === chipID);
    if (sampleIndex !== -1) {
        samples[sampleIndex].finalVolume = finalVolume;
        samples[sampleIndex].averageCO2 = averageCO2;
        samples[sampleIndex].errorCodes = errorCodes;
        localStorage.setItem('samples', JSON.stringify(samples));

        // Display data for review
        alert(`Review Data:\nChip ID: ${chipID}\nFinal Volume: ${finalVolume}\nAverage CO2: ${averageCO2}\nError Codes: ${errorCodes}`);
    }
});


// Add event listeners to open the pickup form for each sample
document.querySelectorAll('.pickup-chip-button').forEach(button => {
    button.addEventListener('click', function () {
        let chipID = this.getAttribute('data-chip-id');
        openPickupForm(chipID);
    });
});





window.addEventListener('close', function (event) {
    // Clear form fields
    document.getElementById('chipID').value = '';
    document.getElementById('patientID').value = '';
    document.getElementById('location').value = '';

    // Clear the samples from localStorage if they haven't been confirmed
    localStorage.removeItem('samples');

    event.returnValue = 'Are you sure you want to leave?';
});




