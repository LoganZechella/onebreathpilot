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
        document.getElementById('add-sample-main').style.display = 'none';
        document.getElementById('landing-main').style.display = 'flex';
        console.log('URL does not include query parameters');
    }
    

    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        let samples = JSON.parse(localStorage.getItem('samples')) || [];

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
                timestamp: new Date().toISOString() // We'll add a timestamp here
            };

            sample.status = 'In Process';
            // Add any additional fields as needed
            localStorage.setItem('samples', JSON.stringify(samples.concat(sample)));

            // Redirect to the confirmation page
            window.location.href = 'confirm.html';
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
            startCountdownTimer(sample.chipID);
        });
    }

    // Function to start a countdown timer for a sample
    function startCountdownTimer(chipID) {
        let timerElement = document.getElementById(`timer-${chipID}`);
        let countdownTime = 120 * 60; // Example: 30 minutes countdown
        let timerInterval = setInterval(function () {
            let minutes = parseInt(countdownTime / 60, 10);
            let seconds = parseInt(countdownTime % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            timerElement.innerText = minutes + ":" + seconds;

            if (--countdownTime < 0) {
                clearInterval(timerInterval);
                // Move the sample to the next queue, e.g., 'Ready for Pickup'
                moveToNextQueue(chipID);
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
});




window.addEventListener('beforeunload', function (event) {
    // Clear form fields
    document.getElementById('chipID').value = '';
    document.getElementById('patientID').value = '';
    document.getElementById('location').value = '';

    // Clear the samples from localStorage if they haven't been confirmed
    localStorage.removeItem('samples');

    event.returnValue = 'Are you sure you want to leave?';
});




