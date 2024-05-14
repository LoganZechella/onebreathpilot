document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupSampleConfirmation();
    setupPatientIntakeForm();
    setupQRCodeScanner();
    fetchSamplesAndUpdateUI();
    setupSampleEventListeners();
    setupPatientIntakeEventListeners();
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
            window.location.href = '/index.html';
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

function setupPatientIntakeForm() {
    document.getElementById('add-new-sample').addEventListener('click', () => {
        document.getElementById('patient-intake-form-section').style.display = 'block';
    });

    document.getElementById('patient-intake-form-confirm-button').addEventListener('click', (event) => {
        event.preventDefault();
        const patientInfo = collectPatientFormData();
        if (patientInfo) {
            sendPatientInfo(patientInfo).then(() => {
                document.getElementById('patient-intake-form-section').style.display = 'none';
                initializeDocumentScanner();
            }).catch(error => {
                console.error('Failed to submit patient info:', error);
                alert('Failed to submit patient information.');
            });
        }
    });

    document.getElementById('patient-intake-form-close-btn').addEventListener('click', () => {
        document.getElementById('patient-intake-form-section').style.display = 'none';
    });

    setupConditionalFields();
}

function setupConditionalFields() {
    document.querySelectorAll('input[name="personal_lung_cancer"]').forEach(input => {
        input.addEventListener('change', () => {
            document.getElementById('lung_cancer_details').style.display = input.value === 'yes' ? 'block' : 'none';
        });
    });

    document.querySelectorAll('input[name="personal_other_cancer"]').forEach(input => {
        input.addEventListener('change', () => {
            document.getElementById('other_cancer_details').style.display = input.value === 'yes' ? 'block' : 'none';
        });
    });
}

function collectPatientFormData() {
    const formData = {
        insurance: document.querySelector('input[name="insurance"]:checked')?.value,
        occupation: document.getElementById('occupation').value,
        asbestos_exposure: document.querySelector('input[name="asbestos_exposure"]:checked')?.value,
        lung_disease: document.querySelector('input[name="lung_disease"]:checked')?.value,
        diabetes: document.querySelector('input[name="diabetes"]:checked')?.value,
        family_lung_cancer: document.querySelector('input[name="family_lung_cancer"]:checked')?.value,
        smoking_history: document.querySelector('input[name="smoking_history"]:checked')?.value,
        pack_years: document.querySelector('input[name="pack_years"]').value,
        time_since_last_cigarette: document.getElementById('time_since_last_cigarette').value,
        current_diagnosis: document.querySelector('input[name="current_diagnosis"]:checked')?.value,
        personal_lung_cancer: document.querySelector('input[name="personal_lung_cancer"]:checked')?.value,
        lung_cancer_details: {
            diagnosis_date: document.querySelector('input[name="lung_cancer_diagnosis_date"]').value,
            stage: document.querySelector('input[name="lung_cancer_stage"]').value,
            histology: document.querySelector('input[name="lung_cancer_histology"]').value,
            treatment: Array.from(document.querySelectorAll('input[name="lung_cancer_treatment"]:checked')).map(el => el.value)
        },
        personal_other_cancer: document.querySelector('input[name="personal_other_cancer"]:checked')?.value,
        other_cancer_details: {
            diagnosis_date: document.querySelector('input[name="other_cancer_diagnosis_date"]').value,
            stage: document.querySelector('input[name="other_cancer_stage"]').value,
            histology: document.querySelector('input[name="other_cancer_histology"]').value,
            treatment: Array.from(document.querySelectorAll('input[name="other_cancer_treatment"]:checked')).map(el => el.value)
        },
        dentition: document.querySelector('input[name="dentition"]:checked')?.value,
        time_since_last_meal: document.getElementById('time_since_last_meal').value,
        meal_consumed: document.getElementById('meal_consumed').value,
        ketogenic_diet: document.querySelector('input[name="ketogenic_diet"]:checked')?.value
    };

    if (!formData.insurance || !formData.occupation || !formData.asbestos_exposure || !formData.lung_disease || !formData.diabetes || !formData.family_lung_cancer || !formData.smoking_history || !formData.current_diagnosis || !formData.personal_lung_cancer || !formData.personal_other_cancer || !formData.dentition || !formData.ketogenic_diet) {
        alert('Please fill in all required fields.');
        return null;
    }
    return formData;
}

async function sendPatientInfo(patientInfo) {
    return fetch('https://onebreathpilot.onrender.com/update_patient_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientInfo),
    })
        .then(response => response.json())
        .then(data => {
            alert('Patient information submitted successfully.');
            return data;
        });
}

function initializeDocumentScanner() {
    ScannerJS.scanToPdf({
        onComplete: async (pdf, mimeType, file) => {
            try {
                const formData = new FormData();
                formData.append('document', file, 'patient-form.pdf');
                const response = await fetch('https://onebreathpilot.onrender.com/upload_document', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.success) {
                    alert('Document scanned and uploaded successfully.');
                } else {
                    alert('Failed to upload document.');
                }
            } catch (error) {
                console.error('Error scanning or uploading document:', error);
                alert('Error scanning or uploading document.');
            }
        },
        onError: (error) => {
            console.error('Error during scanning:', error);
            alert('Error during scanning.');
        }
    });
}

function setupPatientIntakeEventListeners() {
    document.getElementById('patient-intake-form').addEventListener('submit', function (event) {
        event.preventDefault();
        updatePatient();
    });

    document.getElementById('patient-intake-form-close-btn').addEventListener('click', function () {
        document.getElementById('patient-intake-form-section').style.display = 'none';
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
    document.getElementById('patient-intake-form-section').style.display = 'none';
    document.getElementById('qr-close-btn').style.display = 'none';
    document.getElementById('manual-add-btn').style.display = 'none';
    document.getElementById('add-button-div').querySelector('.add-new-sample').style.display = 'flex';
    Object.values(bodySections).forEach(section => section.style.display = 'grid');
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
        const formId = event.target.elements['data-chip-id'].value;
        updateStatusToReadyForPickup(formId);
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
        if (event.target.classList.contains('patient-intake-form-close-btn')) {
            document.getElementById('patient-intake-form-section').style.display = 'none';
        }
    });
}
