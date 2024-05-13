document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupSampleConfirmation();
    setupQRCodeScanner();
});

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
                // Ensure all other sections are hidden except for the manual entry form
                const bodySections = {
                    'add-button': document.getElementById('add-new-sample'),
                    'in-process': document.getElementById('in-process-section'),
                    'pickup': document.getElementById('pickup-section'),
                    'shipping': document.getElementById('shipping-section'),
                    'elution': document.getElementById('elution-section')
                };
                Object.values(bodySections).forEach(section => section.style.display = 'none');

                // Hide the QR code related buttons
                document.getElementById('qr-close-btn').style.display = 'none';
                document.getElementById('manual-add-btn').style.display = 'none';

                // Display the manual entry form
                document.getElementById('add-sample-main').style.display = 'block';
                document.getElementById('sample-reg-section').style.display = 'block';
                AOS.refresh();
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

function resetSampleRegistration() {
    const bodySections = {
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
    Object.values(bodySections).forEach(section => section.style.display = 'grid');
    AOS.refresh();
}
