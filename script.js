document.addEventListener('DOMContentLoaded', () => {
    const confirmButton = document.getElementById('confirm-button');
    confirmButton.addEventListener('click', async function (event) {
        event.preventDefault();
        const sample = collectSampleFormData();
        if (sample) {
            sample.timestamp = new Date().toISOString();
            sample.status = 'In Process';
            sendSample(sample);  // Send sample data using HTTP POST
            alert('Sample submitted successfully!');
        }
        window.location.reload();
    });

    // Initialize application if needed here
    initApp();
});



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
    // fetch('http://127.0.0.1:8080/update_sample', { 
    fetch('https://onebreahtpilot.onrender.com/update_sample', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Sample processed:', data);
            alert('Sample update successful.');
        })
        .catch(error => {
            console.error('Error updating sample:', error);
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
        document.getElementById('add-sample-main').style.display = 'none';
        document.getElementById('landing-main').style.display = 'flex';
    }
    const sampleRegCloseBtn = document.getElementById('sample-reg-close-btn');
    sampleRegCloseBtn.addEventListener('click', function () {
        const bodySections = {
            'add-button': document.getElementById('add-new-sample'),
            'in-process': document.getElementById('in-process-section'),
            'pickup': document.getElementById('pickup-section'),
            'shipping': document.getElementById('shipping-section'),
            'elution': document.getElementById('elution-section')
        }
        for (const section in bodySections) {
            bodySections[section].style.display = 'grid';
            document.getElementById('add-sample-main').style.display = 'none';
            document.getElementById('landing-main').style.display = 'flex';
            document.getElementById('add-button-div').style.display = 'flex';
            document.getElementById('qr-close-btn').style.display = 'none';
            document.getElementById('manual-add-btn').style.display = 'none';
        }
    });
}

function getQueryStringParams(param) {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(param);
}
