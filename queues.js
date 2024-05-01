document.addEventListener('DOMContentLoaded', function () {
    fetchSamplesAndUpdateUI();
});

function fetchSamplesAndUpdateUI() {
    fetch('http://127.0.0.1:8080/samples')
        .then(response => response.json())
        .then(samples => {  // Directly use the array returned from the server
            updateSampleQueues(samples);
        })
        .catch(error => console.error('Error fetching samples:', error));
}

function updateSampleQueues(samples) {
    const inProcessElement = document.getElementById('in-process-section').querySelector('.grid');
    const pickupElement = document.getElementById('pickup-section').querySelector('.grid');
    const shippingElement = document.getElementById('shipping-section').querySelector('.grid');
    const analysisElement = document.getElementById('elution-section').querySelector('.grid');

    // Clear existing content
    inProcessElement.innerHTML = '';
    pickupElement.innerHTML = '';
    shippingElement.innerHTML = '';
    analysisElement.innerHTML = '';

    // Populate each queue based on the status of the sample
    samples.forEach(sample => {
        const sampleCard = createSampleCard(sample);
        switch (sample.status) {
            case 'In Process':
                inProcessElement.appendChild(sampleCard);
                break;
            case 'Ready for Pickup':
                pickupElement.appendChild(sampleCard);
                break;
            case 'Picked up. Ready for Analysis':
                shippingElement.appendChild(sampleCard);
                break;
        }
    });

    if (inProcessElement.children.length === 0) {
        inProcessElement.style.display = 'flex';
        inProcessElement.style.justifyContent = 'center';
        inProcessElement.innerHTML = '<p>No samples in process.</p>';
    }
    if (pickupElement.children.length === 0) {
        pickupElement.style.display = 'flex';
        pickupElement.style.justifyContent = 'center';
        pickupElement.innerHTML = '<p>No samples ready for pickup.</p>';
    }
    if (shippingElement.children.length === 0) {
        shippingElement.style.display = 'flex';
        shippingElement.style.justifyContent = 'center';
        shippingElement.innerHTML = '<p>No samples ready for shipping.</p>';
    }
    if (analysisElement.children.length === 0) {
        analysisElement.style.display = 'flex';
        analysisElement.style.justifyContent = 'center';
        analysisElement.innerHTML = '<p>No samples ready for analysis.</p>';
    }
}

function createSampleCard(sample) {
    const card = document.createElement('div');
    card.className = `card ${sample.chip_id}`;
    card.innerHTML = `
        <h3>Chip ID: ${sample.chip_id}</h3>
        <p>Status: ${sample.status}</p>
        <p>Location: ${sample.location}</p>
        <div class="timer" id="timer-${sample.chip_id}"></div>
    `;
    if (sample.status === 'Ready for Pickup') {
        card.innerHTML += `<button class="pickup-button" id="${sample.chip_id}">Pickup Chip</button>`;
    }
    if (sample.status === 'Picked up. Ready for Analysis') {
        card.innerHTML += `<button class="finish-button" id="${sample.chip_id}">Finish</button>`;
    }

    // Append the card to the document before initializing the countdown
    // This ensures the element exists in the DOM when accessed later
    document.body.appendChild(card); // Adjust this line to append to the correct container

    // Initialize countdown if the status is 'In Process' and a timestamp exists
    if (sample.status === 'In Process' && sample.timestamp) {
        initializeCountdown(sample.timestamp, `timer-${sample.chip_id}`);
    }

    return card;
}

function initializeCountdown(timestamp, timerId) {
    const endTime = new Date(timestamp).getTime() + 7200000; // 2 hours in milliseconds
    const timerElement = document.getElementById(timerId);

    if (!timerElement) {
        console.error(`Timer element with ID ${timerId} not found.`);
        return; // Stop the function if the element is not found
    }

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(interval);
            timerElement.innerHTML = "Expired"; // Display expired if time is up
            return;
        }

        // Display countdown
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerElement.innerHTML = `${hours}h ${minutes}m ${seconds}s remaining`;
    }, 1000);
}


document.addEventListener('click', (event) => {
    if (event.target.classList.contains('pickup-button')) {
        const chipID = event.target.id;
        showPickupForm(chipID);
    }
    if (event.target.id === 'pickup-close-button') {
        document.getElementById('pickup-form-modal').style.display = 'none';
    }
});

function showPickupForm(chipID) {
    const form = document.getElementById('pickup-form');
    form.elements['data-chip-id'].value = chipID;
    document.getElementById('pickup-form-modal').style.display = 'block';
}
