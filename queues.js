async function fetchAndDisplayInProcessSamples() {
    try {
        const response = await fetch('https://onebreathpilot.onrender.com/samples/inprocess');
        if (response.status === 404) {
            console.log('No in-process samples found.'); // Log a message or handle this scenario as needed
            // return; // Exit the function early
        }
        const data = await response.json();
        if (!data.samples) {
            return;
        }
        const samples = data.samples;
        
        function moveToPickupSection(card) {
            const pickupSection = document.getElementById('pickup-section');
            pickupSection.appendChild(card);
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
            const fourHoursInMs = 1 * 60 * 60 * 1000; // SET TIME FOR COUNTDOWN TIMER HERE
            const timeElapsed = now - sampleTimestamp;
            const countdownTargetTime = new Date(sampleTimestamp.getTime() + fourHoursInMs);

            if (timeElapsed < fourHoursInMs) {
                // Display countdown
                card.innerHTML = `
                <p id="card-text-id">Chip ID: ${sample.chipID}</p>
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
                <p id="card-text-id">Chip ID: ${sample.chipID}</p>
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
        status: 'Picked up, ready for shipment.',
        errorCode: this.elements['error-codes'].value
    };
    console.log(updateData);
    try {
        const response = await fetch(`https://onebreathpilot.onrender.com/updateSample/${chipID}`, {
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
                shippingSection.appendChild(card);
            }
            const card = document.querySelector(`.${chipID}`);
            moveToShippingSection(card);
        } else {
            throw new Error('Failed to update sample');
        }
    } catch (error) {
        console.error('Error updating sample:', error);
    }
});



document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('landing-main').addEventListener('click', function (event) {
        if (event.target && event.target.classList.contains('pickup-button')) {
            const chipID = event.target.id; // Using the button's id as the chipID
            document.querySelector('#pickup-form [name="data-chip-id"]').value = chipID;
            document.getElementById('pickup-form-modal').style.display = 'block';
        }
    });

    fetchAndDisplayInProcessSamples();
});
