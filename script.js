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

            let chipID = 'P' + document.getElementById('chipID').value;
            let patientID = 'BDx' + document.getElementById('patientID').value;
            let location = document.getElementById('location').value;

            let sample = {
                chipID: chipID,
                patientID: patientID,
                location: location,
                timestamp: new Date().toISOString() // We'll add a timestamp here
            };

            samples.push(sample);
            localStorage.setItem('samples', JSON.stringify(samples));

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




