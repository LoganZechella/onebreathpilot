document.addEventListener('DOMContentLoaded', function () {
    fetchSamplesAndUpdateUI();

    document.getElementById('pickup-form').addEventListener('submit', function (event) {
        event.preventDefault();
        updateSample();
    });

    document.getElementById('pickup-close-button').addEventListener('click', function () {
        document.getElementById('pickup-form-modal').style.display = 'none';
    });

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('pickup-button')) {
            showPickupForm(event.target.id);
        }
        if (event.target.classList.contains('finish-button')) {
            completeSample(event.target.id);
        }
    });
});

function fetchSamplesAndUpdateUI() {
    setTimeout(() => {
        fetch('https://onebreathpilot.onrender.com/samples')
            .then(response => response.json())
            .then(samples => updateSampleQueues(samples))
            .catch(error => console.error('Error fetching samples:', error));
    }, 1000);
}

function updateSample() {
    const form = document.getElementById('pickup-form');
    const chipID = form.elements['data-chip-id'].value;
    const finalVolume = form.elements['final-volume'].value;
    const avgCO2 = form.elements['average-co2'].value;
    const errorCodes = form.elements['error-codes'].value;

    const sampleData = {
        chip_id: chipID,
        final_volume: finalVolume,
        avg_co2: avgCO2,
        error_code: errorCodes,
        status: "Picked up. Ready for Analysis"
    };

    fetch('https://onebreathpilot.onrender.com/update_sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData),
    })
        .then(response => response.json())
        .then(data => {
            // console.log('Sample updated:', data);
            alert('Sample updated successfully.');
            document.getElementById('pickup-form-modal').style.display = 'none';
            fetchSamplesAndUpdateUI();
        })
        .catch(error => {
            // console.error('Error updating sample:', error);
            alert('Failed to update sample.');
        });
}

function updateSampleQueues(samples) {
    const inProcessElement = document.getElementById('in-process-section').querySelector('.grid');
    const pickupElement = document.getElementById('pickup-section').querySelector('.grid');
    const shippingElement = document.getElementById('shipping-section').querySelector('.grid');
    const analysisElement = document.getElementById('elution-section').querySelector('.grid');

    clearElements([inProcessElement, pickupElement, shippingElement, analysisElement]);

    samples.forEach(sample => {
        const sampleCard = createSampleCard(sample);
        switch (sample.status) {
            case 'In Process': inProcessElement.appendChild(sampleCard); break;
            case 'Ready for Pickup': pickupElement.appendChild(sampleCard); break;
            case 'Picked up. Ready for Analysis': shippingElement.appendChild(sampleCard); break;
        }
    });
    
    for (const element of [inProcessElement, pickupElement, shippingElement, analysisElement]) {
        element.style.display = 'grid';
    }

    displayNoSamplesMessage([inProcessElement, pickupElement, shippingElement, analysisElement]);
}

function createSampleCard(sample) {
    const card = document.createElement('div');
    card.setAttribute('data-aos', 'zoom-in');
    card.setAttribute('data-aos-duration', '500');
    card.setAttribute('data-aos-delay', '500');
    card.className = `card ${sample.chip_id}`;
    card.innerHTML = `
        <h3>Chip ID: ${sample.chip_id}</h3>
        <p>Status: ${sample.status}</p>
        <p>Location: ${sample.location}</p>
        <div class="timer" id="timer-${sample.chip_id}"></div>
    `;
    appendButtonsBasedOnStatus(card, sample);

    document.body.appendChild(card); // Ensure this is the correct container

    if (sample.status === 'In Process' && sample.timestamp) {
        initializeCountdown(sample.timestamp, `timer-${sample.chip_id}`, sample.chip_id);
    }

    return card;
}

function initializeCountdown(timestamp, timerId, chipId) {
    const endTime = new Date(timestamp).getTime() + 7200000; // 2 hours in milliseconds
    const timerElement = document.getElementById(timerId);

    if (!timerElement) {
        console.error(`Timer element with ID ${timerId} not found.`);
        return;
    }

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(interval);
            timerElement.parentElement.removeChild(timerElement); // Properly remove the timer element
            updateStatusToReadyForPickup(chipId);
            return;
        }

        updateTimerDisplay(timerElement, distance);
    }, 1000);
}

function updateStatusToReadyForPickup(chipId) {
    const sampleData = {
        chip_id: chipId,
        status: "Ready for Pickup"
    };

    fetch('https://onebreathpilot.onrender.com/update_sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData),
    })
        .then(response => response.json())
        .then(data => {
            // console.log('Status updated:', data);
            fetchSamplesAndUpdateUI(); // Update UI only after successful update
        })
        .catch(error => {
            // console.error('Error updating sample status:', error);
        });
}

function clearElements(elements) {
    elements.forEach(el => {
        el.innerHTML = '';
        el.style.display = 'flex';
        el.style.justifyContent = 'center';
    });
}

function showPickupForm(chipId) {
    const form = document.getElementById('pickup-form');
    form.elements['data-chip-id'].value = chipId;
    document.getElementById('pickup-form-modal').style.display = 'block';
}

function completeSample(chipId) {
    const sampleData = {
        chip_id: chipId,
        status: "Complete"
    };

    fetch('https://onebreathpilot.onrender.com/update_sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData),
    })
        .then(response => response.json())
        .then(data => {
            // console.log('Sample status updated:', data);
            fetchSamplesAndUpdateUI(); // Update UI only after successful update
        })
        .catch(error => {
            // console.error('Error updating sample status:', error);
        });
}

function displayNoSamplesMessage(elements) {
    elements.forEach(el => {
        if (el.children.length === 0) {
            el.innerHTML = '<p>No samples in this category.</p>';
        }
    });
}

function appendButtonsBasedOnStatus(card, sample) {
    if (sample.status === 'Ready for Pickup') {
        const pickupButton = document.createElement('button');
        pickupButton.className = 'pickup-button';
        pickupButton.id = sample.chip_id;
        pickupButton.textContent = 'Pickup Chip';
        card.appendChild(pickupButton);
    }
    if (sample.status === 'Picked up. Ready for Analysis') {
        const finishButton = document.createElement('button');
        finishButton.className = 'finish-button';
        finishButton.id = sample.chip_id;
        finishButton.textContent = 'Finish';
        card.appendChild(finishButton);
    }
}

function updateTimerDisplay(timerElement, distance) {
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    timerElement.innerHTML = `${hours}h ${minutes}m ${seconds}s remaining`;
}
