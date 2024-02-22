// Check if the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
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

// Section Sample Creation and Adding

function generateSectionElement() {
    const sectionElement = document.getElementById('in-process')
    const chipID = 'P12345';
    const completionTime = '4:30 - 5:30 PM EST';

    const newElement = document.createElement("div");
    newElement.className = "section-element-text";
    newElement.style.display = "flex";
    newElement.innerHTML = `Chip ID: ${chipID} <br/> Est. Pickup Time: <br/>${completionTime}`;

    sectionElement.appendChild(newElement);
}

generateSectionElement();
generateSectionElement();

{/* <div class="section-element-text" style="display: flex;">Chip ID: P12345 <br> Est. Pickup Time: <br>4:30 - 5:30 PM EST</div> */}