async function fetchAndDisplayInProcessSamples() {
    try {
        const response = await fetch('https://onebreathpilot.onrender.com/samples/inprocess');
        // const response = await fetch('http://127.0.0.1:5000/samples/inprocess');
        // if (response.status === 404) {
        //     console.log('No in-process samples found.'); // Log a message or handle this scenario as needed
        //     // return; // Exit the function early
        // }
        const data = await response.json();
        if (!data.samples) {

            return;
        }
        const samples = data.samples.filter(sample => sample.status !== 'complete');

        function moveToPickupSection(card) {
            document.getElementById('in-process-section').style.gridTemplateColumns = '1fr';
            document.getElementById('in-process-section').querySelector('.grid').innerHTML = '<h4>No Samples In Process</h4>';
            const pickupSection = document.getElementById('pickup-section');
            pickupSection.querySelector('.grid').appendChild(card);
        }

        function updateCountdown(element, targetTime) {
            const interval = setInterval(() => {
                const now = new Date();
                const distance = targetTime - now;
                if (distance < 0) {
                    clearInterval(interval);
                    moveToPickupSection(element.parentElement);
                    element.innerHTML = 'Expired';
                } else {
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    element.innerHTML = `Remaining Time: ${hours}h ${minutes}m ${seconds}s`;
                }
            }, 1000);
        }
        samples.forEach(sample => {
            const card = document.createElement('div');
            card.className = `card ${sample.chipID}`;
            const sampleTimestamp = new Date(sample.timestamp);
            const now = new Date();
            const fourHoursInMs = (0 * 60 * 60 * 1000) + (1 * 60 * 1000); // SET TIME FOR COUNTDOWN TIMER HERE
            const timeElapsed = now - sampleTimestamp;
            const countdownTargetTime = new Date(sampleTimestamp.getTime() + fourHoursInMs);

            if (timeElapsed < fourHoursInMs) {
                // Display countdown
                card.innerHTML = `
                <h3 id="card-text-id">Chip ID: ${sample.chipID}</h3>
                <p id="card-text-status">Status: ${sample.status}</p>
                <p id="card-text-location">Location: ${sample.location}</p>
                <p><span id="countdown-${sample.chipID}">${sample.timestamp}</span></p>`;
                const countdownElement = card.querySelector(`#countdown-${sample.chipID}`);
                updateCountdown(countdownElement, countdownTargetTime);
                document.getElementById('in-process-section').querySelector('.grid').appendChild(card);
            } else {
                // Move to 'pickup-section'
                sample.status = 'Ready for Pickup';
                moveToPickupSection(card);
                card.innerHTML = `
                <h3 id="card-text-id">Chip ID: ${sample.chipID}</h3>
                <p id="card-text-status">Status: ${sample.status}</p>
                <p id="card-text-location">Location: ${sample.location}</p>
                <button class="pickup-button" id="${sample.chipID}">Pickup Chip</button>
                `;
            }

        })
    }
    catch (error) {
        console.error('Failed to fetch in-process samples:', error);
    }
}

// Check for Samples Ready for Analysis
async function fetchAndDisplayAnalysisSamples() {
    try {
        const response = await fetch('https://onebreathpilot.onrender.com/samples/analysis');
        // const response = await fetch('http://127.0.0.1:5000/samples/analysis');  

        const data = await response.json();
        if (!data.samples) {
            return;
        }
        const samples = data.samples.filter(sample => sample.status !== 'complete');

        function moveToAnalysisSection(card) {
            const pickupGrid = document.getElementById('pickup-section').querySelector('.grid');
            pickupGrid.innerHTML = '<h4>No Samples Ready for Pickup</h4>';
            pickupGrid.style.gridTemplateColumns = 'none';
            const analysisSection = document.getElementById('shipping-section');
            analysisSection.querySelector('.grid').appendChild(card);
        }
        samples.forEach(sample => {
            const card = document.createElement('div');
            card.className = `card ${sample.chipID}`;
            card.innerHTML = `
                <h3 id="card-text-id">Chip ID: ${sample.chipID}</h3>
                <p id="card-text-status">Status: ${sample.status}</p>
                <button class="${sample.chipID} finish-sample-button" id="finish-sample-button">Finish</button>`;
            moveToAnalysisSection(card);
            const analysisSection = document.getElementById('shipping-section');
            analysisSection.querySelector('.grid').querySelectorAll('h4').forEach(h4 => h4.remove());


        });
    }
    catch (error) {
        console.error('Failed to fetch in-process samples:', error);
    }
};


// Pickup Form

// Show the pickup form modal when the pickup button is clicked
document.querySelectorAll('.pickup-button').forEach(button => {
    button.addEventListener('click', function () {
        const chipID = this.getElementById;
        console.log(chipID);
        document.querySelector('#pickup-form [name="data-chip-id"]').value = chipID;
        document.getElementById('pickup-form-modal').style.display = 'block';
    });
});

// Handle form submission
document.getElementById('pickup-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const chipID = this.elements['data-chip-id'].value;
    const updateData = {
        chipID: chipID,
        finalVolume: this.elements['final-volume'].value,
        averageCO2: this.elements['average-co2'].value,
        status: 'Picked up, ready for elution and analysis.',
        errorCode: this.elements['error-codes'].value
    };

    try {
        const response = await fetch(`https://onebreathpilot.onrender.com/updateSample/${chipID}`, {
            // const response = await fetch(`http://127.0.0.1:5000/updateSample/${chipID}`, {    
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            alert('Sample updated successfully.');
            document.getElementById('pickup-form-modal').style.display = 'none';
            // Refresh or update the UI as needed
            function moveToShippingSection(card) {
                const shippingSection = document.getElementById('shipping-section');
                shippingSection.querySelector('.grid').appendChild(card);
                shippingSection.querySelector('.grid').querySelectorAll('h4').forEach(h4 => h4.remove());
                card.querySelector('.pickup-button').remove();
                card.querySelector('#card-text-status').innerHTML = 'Status: Ready for Elution and Analysis';
            }
            const card = document.querySelector(`.${chipID}`);
            moveToShippingSection(card);
        } else {
            throw new Error('Failed to update sample');
        }
    } catch (error) {
        console.error('Error updating sample:', error);
    }
    // window.location.reload();
});

// Format and Add No Samples Message to Sections if Needed
function noSamplesCheck() {
    const inProcessSection = document.getElementById('in-process-section');
    const pickupSection = document.getElementById('pickup-section');
    const shippingSection = document.getElementById('shipping-section');
    const elutionSection = document.getElementById('elution-section');
    if (inProcessSection.querySelector('.grid').childElementCount <= 1) {
        document.getElementById('in-process-section').querySelector('.grid').style.gridTemplateColumns = 'none';
        inProcessSection.querySelector('.grid').innerHTML = '<h4>No Samples In Process</h4>';
    }
    if (pickupSection.querySelector('.grid').childElementCount <= 1) {
        document.getElementById('pickup-section').querySelector('.grid').style.gridTemplateColumns = 'none';
        pickupSection.querySelector('.grid').innerHTML = '<h4>No Samples Ready for Pickup</h4>';
    }
    if (shippingSection.querySelector('.grid').childElementCount <= 1) {
        document.getElementById('shipping-section').querySelector('.grid').style.gridTemplateColumns = 'none';
        shippingSection.querySelector('.grid').innerHTML = '<h4>No Samples Ready for Shipment</h4>';
    }
    if (elutionSection.querySelector('.grid').childElementCount <= 1) {
        document.getElementById('elution-section').querySelector('.grid').style.gridTemplateColumns = 'none';
        elutionSection.querySelector('.grid').innerHTML = '<h4>No Samples Ready for Elution</h4>';
    }
}

function removeSampleCard(event) {
    // Assuming the card element is the parent of the button
    const card = event.target.closest('.card');
    if (card) {
        card.remove();  // Remove the card from the DOM
        console.log(`Sample card for ${event.target.id} removed.`);
    }
}




document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('landing-main').addEventListener('click', async function (event) {
        if (event.target && event.target.classList.contains('pickup-button')) {
            const chipID = event.target.id; // Using the button's id as the chipID
            document.querySelector('#pickup-form [name="data-chip-id"]').value = chipID;
            document.getElementById('pickup-form-modal').style.display = 'block';
        }
        if (event.target && event.target.classList.contains('finish-sample-button')) {
            const chipID = event.target.classList[0];
            try {
                const response = await fetch(`https://onebreathpilot.onrender.com/updateSample/${chipID}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'complete' })
                });

                if (response.ok) {
                    console.log(`Sample ${chipID} marked as complete.`);
                    event.target.closest('.card').remove(); // Remove the card from the DOM
                } else {
                    throw new Error('Failed to mark sample as complete');
                }
            } catch (error) {
                console.error('Error marking sample as complete:', error);
            }
        }
    });

    fetchAndDisplayInProcessSamples();
    fetchAndDisplayAnalysisSamples();
    noSamplesCheck();
});
