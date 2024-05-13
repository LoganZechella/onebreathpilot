document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupSampleConfirmation();
    setupQRCodeScanner();
    fetchSamplesAndUpdateUI();
    setupSampleEventListeners();
});

function initApp() {
    const queryParams = window.location.search;
    if (queryParams) {
        document.getElementById('landing-main').style.display = 'none';
        const chipID = getQueryStringParams('chipID');
        if (chipID) {
            document.getElementById('chipID').value = chipID;
        }
    } else {
        document.getElementById('landing-main').style.display = 'flex';
        document.getElementById('add-sample-main').style.display = 'none';
    }
}

function getQueryStringParams(param) {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(param);
}

function setupSampleConfirmation() {
    const confirmButton = document.getElementById('confirm-button');
    confirmButton.addEventListener('click', async function (event) {
        event.preventDefault();
        const sample = collectSampleFormData();
        if (sample) {
            sample.timestamp = new Date().toISOString();
            sample.status = 'In Process';
            sendSample(sample);
            alert('COLLECT BREATH PER STUDY PROTOCOL THEN RETURN TO THIS PAGE. Press OK below to confirm that sample evacuation has begun and return to the dashboard.');
            window.location.reload();
        }
    });
}

function collectSampleFormData() {
    let chip_id = document.getElementById('chipID').value;
    let patient_id = document.getElementById('patientID').value;
    let location = document.getElementById('location').value;

    if (!chip_id || !patient_id || !location) {
        alert('Please fill in all required fields.');
        return null;
    }
    return { chip_id, patient_id, location };
}

function sendSample(sampleData) {
    fetch('https://onebreathpilot.onrender.com/update_sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData),
    })
        .then(response => response.json())
        .then(data => {
            alert('Sample update successful.');
            window.location.href = '/index.html';
        })
        .catch(error => {
            alert('Sample update failed.');
        });
}

function setupQRCodeScanner() {
    const addNewSampleButton = document.getElementById('add-new-sample');
    addNewSampleButton.addEventListener('click', function () {
        const bodySections = {
            'add-button': document.getElementById('add-new-sample'),
            'in-process': document.getElementById('in-process-section'),
            'pickup': document.getElementById('pickup-section'),
            'shipping': document.getElementById('shipping-section'),
            'elution': document.getElementById('elution-section')
        };
        Object.values(bodySections).forEach(section => section.style.display = 'none');
        document.getElementById('qr-close-btn').style.display = 'block';
        document.getElementById('manual-add-btn').style.display = 'block';
        document.getElementById('reader').style.display = 'block';
        AOS.refresh();

        const html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 1, qrbox: { width: 250, height: 250 } };

        document.getElementById('manual-add-btn').addEventListener('click', function () {
            html5QrCode.stop().then(() => {
                showManualEntryForm();
            }).catch((err) => {
                console.error('Failed to stop the QR Scanner', err);
            });
        });

        document.getElementById('qr-close-btn').addEventListener('click', function () {
            html5QrCode.stop().then(() => {
                resetSampleRegistration();
            }).catch((err) => console.error('Failed to stop the QR Scanner', err));
        });

        html5QrCode.start({ facingMode: "environment" }, config,
            (decodedText, decodedResult) => {
                window.location.href = `${decodedText}`;
                html5QrCode.stop().then(() => {
                    resetSampleRegistration();
                }).catch((err) => console.error('Failed to stop the QR Scanner', err));
            },
            (errorMessage) => console.error(`QR scan error: ${errorMessage}`)
        );
    });
}

function showManualEntryForm() {
    const bodySections = {
        'add-button': document.getElementById('add-new-sample'),
        'in-process': document.getElementById('in-process-section'),
        'pickup': document.getElementById('pickup-section'),
        'shipping': document.getElementById('shipping-section'),
        'elution': document.getElementById('elution-section')
    };
    Object.values(bodySections).forEach(section => section.style.display = 'none');

    document.getElementById('qr-close-btn').style.display = 'none';
    document.getElementById('manual-add-btn').style.display = 'none';

    document.getElementById('add-sample-main').style.display = 'block';
    document.getElementById('sample-reg-section').style.display = 'block';
    AOS.refresh();
}

function resetSampleRegistration() {
    const bodySections = {
        'landing-main': document.getElementById('landing-main'),
        'add-button-div': document.getElementById('add-button-div'),
        'add-button': document.getElementById('add-new-sample'),
        'in-process': document.getElementById('in-process-section'),
        'pickup': document.getElementById('pickup-section'),
        'shipping': document.getElementById('shipping-section'),
        'elution': document.getElementById('elution-section')
    };
    document.getElementById('sample-reg-section').style.display = 'none';
    document.getElementById('qr-close-btn').style.display = 'none';
    document.getElementById('manual-add-btn').style.display = 'none';
    document.getElementById('add-button-div').querySelector('.add-new-sample').style.display = 'flex';
    Object.values(bodySections).forEach(section => section.style.display = 'flex');
    AOS.refresh();
}

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
            alert('Sample updated successfully.');
            document.getElementById('pickup-form-modal').style.display = 'none';
            fetchSamplesAndUpdateUI();
        })
        .catch(error => {
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
        <h3>${sample.chip_id}</h3>
        <p>Status:<br/> <strong>${sample.status}</strong></p>
        <p>Location:<br/> <strong>${sample.location}</strong></p>
        <div class="timer" id="timer-${sample.chip_id}"></div>
    `;
    appendButtonsBasedOnStatus(card, sample);

    document.body.appendChild(card);

    if (sample.status === 'In Process' && sample.timestamp) {
        initializeCountdown(sample.timestamp, `timer-${sample.chip_id}`, sample.chip_id);
    }

    return card;
}

function initializeCountdown(timestamp, timerId, chipId) {
    const endTime = new Date(timestamp).getTime() + 7200000;
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
            timerElement.parentElement.removeChild(timerElement);
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
            fetchSamplesAndUpdateUI();
        })
        .catch(error => {
            console.error('Error updating sample status:', error);
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
    document.getElementById('pickup-form-modal').style.marginTop = '5em';
    document.getElementById('pickup-form-modal').scrollIntoView({ behavior: 'smooth' });
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
            fetchSamplesAndUpdateUI();
        })
        .catch(error => {
            console.error('Error updating sample status:', error);
        });
}

function displayNoSamplesMessage(elements) {
    elements.forEach(el => {
        if (el.children.length === 0) {
            el.style.display = 'flex';
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

function setupSampleEventListeners() {
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
            document.getElementById('pickup-form-modal').style.display = 'none';
        }
        if (event.target.classList.contains('sample-reg-close-btn')) {
            resetSampleRegistration();
        }
    });
}
