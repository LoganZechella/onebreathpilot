
const animateCSS = (element, animation, prefix = 'animate__') =>
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        node.classList.add(`${prefix}animated`, animationName);

        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        node.addEventListener('animationend', handleAnimationEnd, { once: true });
    });

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    if (window.user) {
        updateUIBasedOnAuth(window.user);
    } else {
        updateUIBasedOnAuth(null);
    }
    setupSampleConfirmation();
    setupPatientIntakeForm();
    setupQRCodeScanner();
    fetchSamplesAndUpdateUI();
    setupSampleEventListeners();
    setupPatientIntakeEventListeners();
    setupOptionContainerEventListeners();
    setupBackButtonIntakeEventListener();
    setupNewButtonsEventListeners();
    enumerateVideoDevices();
});

function showElementWithAnimation(elementId, animation) {
    const element = document.getElementById(elementId);
    element.style.display = 'block';
    animateCSS(`#${elementId}`, animation);
}

function hideElementWithAnimation(elementId, animation) {
    const element = document.getElementById(elementId);
    animateCSS(`#${elementId}`, animation).then(() => {
        element.style.display = 'none';
    });
}

function updateUIBasedOnAuth(user) {
    const signInContainer = document.getElementById('sign-in-container');
    const landingMain = document.getElementById('landing-main');
    const blocker = document.querySelector('.blocker');
    const signInButton = document.getElementById('show-sign-in');

    if (user) {
        hideElementWithAnimation('sign-in-container', 'fadeOut');
        if (window.location.search.includes('chipID') === true) {
            document.getElementById('landing-main').style.display = 'none';
            signInButton.textContent = 'Sign Out';
            showElementWithAnimation('add-sample-main', 'fadeIn');
            document.getElementById('add-sample-main').style.display = 'flex';
        } else {
            showElementWithAnimation('landing-main', 'fadeIn');
            document.getElementById('landing-main').style.display = 'flex';
            blocker.style.display = 'flex';
            signInButton.textContent = 'Sign Out';
        }
    } else {
        showElementWithAnimation('sign-in-container', 'fadeIn');
        // hideElementWithAnimation('landing-main', 'fadeOut');
        blocker.style.display = 'none';
        signInButton.textContent = 'Sign In';
    }
}

window.addEventListener('authStateChanged', (event) => {
    const user = event.detail.user;
    updateUIBasedOnAuth(user);
});

window.addEventListener('showSignIn', () => {
    showElementWithAnimation('sign-in-container', 'fadeIn');
});

document.addEventListener('DOMContentLoaded', () => {
    if (window.user) {
        updateUIBasedOnAuth(window.user);
    } else {
        updateUIBasedOnAuth(null);
    }
});


function initApp() {
    const signIn = document.getElementById('sign-in-container');
    const splashScreen = document.getElementById('splash-screen');

    setTimeout(() => {
        animateCSS('#splash-screen', 'fadeOut').then(() => {
            document.getElementById('splash-screen').style.display = 'none';
        });
        animateCSS('#sign-in-container', 'fadeIn');
        checkAuthState();
        if (checkAuthState() === true) {
            hideElementWithAnimation('sign-in-container', 'fadeOut');
            // showElementWithAnimation('landing-main', 'fadeIn');
            showElementWithAnimation('blocker', 'fadeIn');
            showElementWithAnimation('container-fluid', 'fadeIn');
            // document.getElementById('landing-main').style.display = 'flex';
            document.querySelector('.blocker').style.display = 'flex';
            const nav = document.querySelector('.container-fluid');
            nav.style.display = 'flex';
        } else {
            showElementWithAnimation('sign-in-container', 'fadeIn');
            document.getElementById('landing-main').style.display = 'none';
            document.getElementById('sign-in-container').removeAttribute('hidden');
        }
        hideElementWithAnimation('splash-screen', 'fadeOut');
        showElementWithAnimation('sign-in-container', 'fadeIn');
    }, 1500);

    const queryParams = window.location.search;
    if (queryParams) {
        document.getElementById('landing-main').style.display = 'none';
        document.getElementById('add-sample-main').style.display = 'flex';
        const chipID = queryParams.split('=')[1];
        if (chipID) {
            document.getElementById('chipID').value = chipID;
        }
    } else {
        document.getElementById('landing-main').style.display = 'flex';
        document.getElementById('add-sample-main').style.display = 'none';
    }
}

function checkAuthState() {
    const user = window.user;
    if (user) {
        return true;
    } else {
        return false;
    }
}

function setupSampleConfirmation() {
    const confirmButton = document.getElementById('confirm-button');
    confirmButton.addEventListener('click', async function (event) {
        event.preventDefault();
        const sample = collectSampleFormData();
        if (sample) {
            sample.timestamp = new Date().toISOString();
            sample.status = 'In Process';
            // document.getElementById('loading-dashes').style.display = 'block';
            // showElementWithAnimation('loading-dashes', 'zoomInBig');
            await sendSample(sample).then(() => {
                setTimeout(() => {
                    // hideElementWithAnimation('loading-dashes', 'zoomOutBig');
                    animateCSS('#sample-reg-section', 'pulse').then(() => {
                        hideElementWithAnimation('sample-reg-section', 'fadeOut');
                    });
                    document.getElementById('sample-reg-section').style.display = 'none';
                    showOptionButtons();
                }, 1000);
            }).catch(error => {
                console.error('Failed to submit sample:', error);
                alert('Failed to submit sample.');
            });
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

async function sendSample(sampleData) {
    fetch('https://onebreathpilot.onrender.com/update_sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData),
    })
        .then(response => response.json())
        .then(data => {
            // alert('Sample update successful.');
            return true;
        })
        .catch(error => {
            alert(`Sample submission failed: ${error}.  Please try again.`);
            return false;
        });
}

function showOptionButtons() {
    const optionContainer = document.getElementById('option-container');
    const message = document.getElementById('option-message');
    showElementWithAnimation('option-container', 'fadeIn');
    optionContainer.style.display = 'flex';
    message.style.display = 'block';
    const digitalFormButton = document.getElementById('digital-form-button');
    const scanDocumentButton = document.getElementById('scan-document-button');

    digitalFormButton.addEventListener('click', () => {
        document.getElementById('patient-intake-form-section').style.display = 'block';
        optionContainer.style.display = 'none';
        document.getElementById('back-button-intake').style.display = 'block';
    });

    scanDocumentButton.addEventListener('click', () => {
        startDocumentScanning();
        optionContainer.style.display = 'none';
    });

    document.getElementById('back-button-options').addEventListener('click', () => {
        // document.getElementById('sample-reg-section').style.display = 'block';
        // optionContainer.style.display = 'none';
        window.location.href = '/index.html';
    });
}

function setupOptionContainerEventListeners() {
    const digitalFormButton = document.getElementById('digital-form-button');
    const scanDocumentButton = document.getElementById('scan-document-button');
    const backButton = document.getElementById('back-button-options');

    digitalFormButton.addEventListener('click', () => {
        document.getElementById('patient-intake-form-section').style.display = 'block';
        document.getElementById('option-container').style.display = 'none';
        document.getElementById('back-button-intake').style.display = 'block';
    });

    scanDocumentButton.addEventListener('click', () => {
        startDocumentScanning();
        document.getElementById('option-container').style.display = 'none';
    });

    backButton.addEventListener('click', () => {
        // document.getElementById('sample-reg-section').style.display = 'block';
        // optionContainer.style.display = 'none';
        window.location.href = '/index.html';
    });
}

function setupBackButtonIntakeEventListener() {
    const backButtonIntake = document.getElementById('back-button-intake');
    backButtonIntake.addEventListener('click', () => {
        stopDocumentScanning();
        document.getElementById('patient-intake-form-section').style.display = 'none';
        document.getElementById('option-container').style.display = 'flex';
        document.getElementById('back-button-intake-container').style.display = 'none';
        setupOptionContainerEventListeners(); // Re-setup event listeners
        setupBackButtonIntakeEventListener(); // Re-setup event listener
    });
}

let scannerStream = null;
let scannerInterval = null;
let videoDevices = [];
let currentCameraIndex = 0;

function enumerateVideoDevices() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            videoDevices = devices.filter(device => device.kind === 'videoinput');
            if (videoDevices.length > 0) {
                // Default to rear camera if available
                const rearCameraIndex = videoDevices.findIndex(device => device.label.toLowerCase().includes('environment') || device.label.toLowerCase().includes('main'));
                currentCameraIndex = rearCameraIndex !== -1 ? rearCameraIndex : 0;
            }
        })
        .catch(error => {
            console.error('Error enumerating media devices.', error);
        });
}

function startDocumentScanning() {
    document.getElementById('scanner-container').style.display = 'block';
    document.getElementById('back-button-intake-container').style.display = 'flex';
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const resultCanvas = document.getElementById('result');
    const scanner = new jscanify();
    const canvasCtx = canvas.getContext("2d", { willReadFrequently: true });
    const resultCtx = resultCanvas.getContext("2d", { willReadFrequently: true });

    video.setAttribute('playsinline', '');

    if (videoDevices.length > 0) {
        const selectedDevice = videoDevices[currentCameraIndex];
        const constraints = {
            video: {
                deviceId: selectedDevice.deviceId ? { exact: selectedDevice.deviceId } : undefined,
                facingMode: selectedDevice.label.toLowerCase().includes('environment') ? { exact: "environment" } : "environment"
            }
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                scannerStream = stream;
                video.srcObject = stream;

                video.onloadedmetadata = () => {
                    video.play();
                    scannerInterval = setInterval(() => {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        resultCanvas.width = video.videoWidth;
                        resultCanvas.height = video.videoHeight;
                        canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const highlightedCanvas = scanner.highlightPaper(canvas);
                        resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
                        resultCtx.drawImage(highlightedCanvas, 0, 0, resultCanvas.width, resultCanvas.height);
                    }, 100);
                    document.getElementById("capture-button").addEventListener("click", async () => {
                        try {
                            const track = scannerStream.getTracks()[0];
                            console.log(track);

                            // Create an image element to display the captured frame
                            const image = new Image();
                            image.src = canvas.toDataURL();


                            // Create a mock result object to pass to handleDocumentScanResult
                            const mockResult = {
                                images: [{ imageUrl: image.src }]
                            };
                            handleDocumentScanResult(mockResult);  // Updated to match expected structure
                            stopDocumentScanning();
                        } catch (error) {
                            console.error("Error capturing image:", error);
                        }
                    });
                };
            })
            .catch(error => {
                console.error('Error accessing media devices.', error);
            });
    } else {
        console.error('No video devices found.');
    }
}

function stopDocumentScanning() {
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
    if (scannerInterval) {
        clearInterval(scannerInterval);
        scannerInterval = null;
    }
    document.getElementById('scanner-container').style.display = 'none';
}

function changeCamera() {
    stopDocumentScanning();
    currentCameraIndex = (currentCameraIndex + 1) % videoDevices.length;
    startDocumentScanning();
}

function handleDocumentScanResult(result) {
    console.log('Scan result:', result);

    // Check if result and result.images are defined and if result.images is an array
    if (result && Array.isArray(result.images)) {
        const scannedImages = result.images.map(image => image.imageUrl);

        // Display scanned images for review
        const imagesContainer = document.getElementById('scanned-images');
        imagesContainer.innerHTML = ''; // Clear existing images
        scannedImages.forEach(imageUrl => {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.width = '40vw';
            imagesContainer.appendChild(img);
        });

        // Show the review section
        document.getElementById('review-section').style.display = 'flex';
        document.getElementById('scanner-container').style.display = 'none';
        document.getElementById('back-button-intake-container').style.display = 'none';
    } else {
        console.error('No images found in scan result or scan result is invalid.');
    }
}

document.getElementById('rescan-button').addEventListener('click', () => {
    document.getElementById('review-section').style.display = 'none';
    startDocumentScanning();
});

// Function to upload file contents to GCS
async function uploadFileToGCS(destinationBlobName, contents) {
    try {
        const response = await fetch('https://onebreathpilot.onrender.com/upload_from_memory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'destination_blob_name': destinationBlobName,
                'source_file_name': contents  // Send base64 image data
            })
        });

        const data = await response.json();
        if (data.success) {
            console.log('File uploaded successfully.');
        } else {
            alert('File upload failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('File upload failed. Please try again.');
    }
}

document.getElementById('confirm-upload-button').addEventListener('click', async () => {
    const chipId = document.getElementById('chipID').value;
    const scannedImages = Array.from(document.getElementById('scanned-images').getElementsByTagName('img')).map(img => img.src);

    const reviewSection = document.querySelectorAll('.review-non-loader');
    const loader = document.getElementById('document-upload-loader');
    reviewSection.forEach(section => section.style.display = 'none');
    loader.style.display = 'inline-block';

    try {
        const documentUrls = await Promise.all(scannedImages.map(async (image, index) => {
            const response = await fetch('https://onebreathpilot.onrender.com/generate_presigned_url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ file_name: `document_${chipId}.jpeg` })
            });
            const data = await response.json();
            if (data.success) {
                const fullUrl = data.url;
                const imageUrl = data.url.split('?')[0];
                const short_blob_name = imageUrl.split('/')[4];
                console.log(short_blob_name);
                await uploadFileToGCS(short_blob_name, image).then(() => {
                    uploadDocumentMetadata(chipId, imageUrl)
                });
                loader.style.display = 'none';
                alert('Document uploaded successfully.');
                stopDocumentScanning();
                document.getElementById('review-section').style.display = 'none';
                resetSampleRegistration();
            }
        }));
    } catch (error) {
        console.error('Error during document upload:', error);
        alert('Document upload failed. Please try again.');
        loader.style.display = 'none';
        reviewSection.style.display = 'flex';
    }
});

async function uploadDocumentMetadata(chipId, documentUrls) {
    try {
        const response = await fetch('https://onebreathpilot.onrender.com/upload_document_metadata', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ chip_id: chipId, document_urls: documentUrls })
        });
        const data = await response.json();
        if (data.success) {
            console.log('Document metadata uploaded successfully.');
        } else {
            alert('Document upload failed.');
        }
    } catch (error) {
        console.error('Error uploading document metadata:', error);
        alert('Document metadata upload failed. Please try again.');
    }
}

function setupPatientIntakeForm() {
    // Display the patient intake form when appropriate
    document.getElementById('patient-intake-form-confirm-button').addEventListener('click', (event) => {
        event.preventDefault();
        const patientInfo = collectPatientFormData();
        if (patientInfo) {
            sendPatientInfo(patientInfo).then(() => {
                document.getElementById('patient-intake-form-section').style.display = 'none';
            }).catch(error => {
                console.error('Failed to submit patient info:', error);
                alert('Failed to submit patient information.');
            });
        }
    });

    document.getElementById('patient-intake-form-close-btn').addEventListener('click', () => {
        document.getElementById('patient-intake-form-section').style.display = 'none';
        resetSampleRegistration();
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
        chip_id: document.getElementById('chipID').value,
        insurance: document.querySelector('input[name="insurance"]:checked')?.value,
        occupation: document.getElementById('occupation').value,
        asbestos_exposure: document.querySelector('input[name="asbestos_exposure"]:checked')?.value,
        lung_disease: document.querySelector('input[name="lung_disease"]:checked')?.value,
        diabetes: document.querySelector('input[name="diabetes"]:checked')?.value,
        family_lung_cancer: document.querySelector('input[name="family_lung_cancer"]:checked')?.value,
        smoking_history: document.querySelector('input[name="smoking_history"]:checked')?.value,
        pack_years: document.querySelector('input[name="pack_years"]')?.value,
        time_since_last_cigarette: document.getElementById('time_since_last_cigarette').value,
        current_diagnosis: document.querySelector('input[name="current_diagnosis"]:checked')?.value,
        personal_lung_cancer: document.querySelector('input[name="personal_lung_cancer"]:checked')?.value,
        lung_cancer_details: {
            diagnosis_date: document.querySelector('input[name="lung_cancer_diagnosis_date"]')?.value,
            stage: document.querySelector('input[name="lung_cancer_stage"]')?.value,
            histology: document.querySelector('input[name="lung_cancer_histology"]')?.value,
            treatment: Array.from(document.querySelectorAll('input[name="lung_cancer_treatment"]:checked')).map(el => el.value)
        },
        personal_other_cancer: document.querySelector('input[name="personal_other_cancer"]:checked')?.value,
        other_cancer_details: {
            diagnosis_date: document.querySelector('input[name="other_cancer_diagnosis_date"]')?.value,
            stage: document.querySelector('input[name="other_cancer_stage"]')?.value,
            histology: document.querySelector('input[name="other_cancer_histology"]')?.value,
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

function setupPatientIntakeEventListeners() {
    document.getElementById('patient-intake-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const patientInfo = collectPatientFormData();
        if (patientInfo) {
            sendPatientInfo(patientInfo).then(() => {
                document.getElementById('patient-intake-form-section').style.display = 'none';
            }).catch(error => {
                console.error('Failed to submit patient info:', error);
                alert('Failed to submit patient information.');
            });
        }
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
        if (window.window.innerWidth >= 768) {
            document.getElementById('reader').removeAttribute('style');
            document.getElementById('reader').setAttribute('style', 'width: 500px;');
        }
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
                    // resetSampleRegistration();

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
        'shipping': document.getElementById('shipping-section')
    };
    Object.values(bodySections).forEach(section => section.style.display = 'none');

    document.getElementById('qr-close-btn').style.display = 'none';
    document.getElementById('manual-add-btn').style.display = 'none';
    document.getElementById('patient-intake-form-section').style.display = 'none';
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
    Object.values(bodySections)[0].style.display = 'flex';
    AOS.refresh();
}

// Function to fetch samples and update UI
function fetchSamplesAndUpdateUI() {
    // Fetch data
    fetch('https://onebreathpilot.onrender.com/samples')
        .then(response => response.json())
        .then(samples => {
            updateSampleQueues(samples);
        })
        .catch(error => {
            console.error('Error fetching samples:', error);
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
    card.className = `card ${sample.chip_id}`;
    card.innerHTML = `
        <h3>${sample.chip_id}</h3>
        <p>Status: <strong>${sample.status}</strong></p>
        <p>Location: <strong>${sample.location}</strong></p>
        <div class="timer" id="timer-${sample.chip_id}"></div>
        <button class="edit-button">Edit</button>
        ${sample.status === 'In Process' ? '<button class="evacuation-complete-button">Evacuation Complete?</button>' : ''}
    `;

    // Attach event listeners for edit and evacuation buttons if they exist
    card.querySelector('.edit-button').addEventListener('click', handleEditButtonClick);

    if (sample.status === 'In Process') {
        const timerElement = card.querySelector(`#timer-${sample.chip_id}`);
        if (timerElement) {
            card.querySelector('.evacuation-complete-button').addEventListener('click', handleEvacuationCompleteButtonClick);
            initializeCountdown(sample.timestamp, `timer-${sample.chip_id}`, sample.chip_id);
        }
    }

    return card;
}

function setupNewButtonsEventListeners() {
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', handleEditButtonClick);
    });

    document.querySelectorAll('.evacuation-complete-button').forEach(button => {
        button.addEventListener('click', handleEvacuationCompleteButtonClick);
    });
}

function handleEditButtonClick(event) {
    const card = event.target.closest('.card');
    const chipID = card.querySelector('h3').innerText;
    const existingMenu = card.querySelector('.edit-options-menu');

    // Remove existing menu if it's already open
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    // Create a new div for the options menu
    const optionsMenu = document.createElement('div');
    optionsMenu.classList.add('edit-options-menu');
    optionsMenu.innerHTML = `
        <button class="update-button">Update</button>
        <button class="attach-document-button">Attach Document</button>
        <button class="cancel-sample-button">Cancel Sample</button>
    `;

    // Append the menu to the card
    card.appendChild(optionsMenu);

    // Event listeners for the new buttons (placeholders for now)
    optionsMenu.querySelector('.update-button').addEventListener('click', () => alert(`Update clicked for ${chipID}`));
    optionsMenu.querySelector('.attach-document-button').addEventListener('click', () => alert(`Attach Document clicked for ${chipID}`));
    optionsMenu.querySelector('.cancel-sample-button').addEventListener('click', () => alert(`Cancel Sample clicked for ${chipID}`));
}

function handleEvacuationCompleteButtonClick(event) {
    const chipID = event.target.closest('.card').querySelector('h3').innerText;
    
    // Implement the functionality to mark the sample as evacuated
}

function initializeCountdown(timestamp, timerId, chipId) {
    const endTime = new Date(timestamp).getTime() + 7200000; // 2 hours from timestamp
    const timerElement = document.getElementById(timerId);

    if (!timerElement) {
        console.error(`Timer element with ID ${timerId} not found. Skipping countdown.`);
        return;  // Exit if no timer element is found
    }

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(interval);
            timerElement.innerHTML = "Time's up";
            updateStatusToReadyForPickup(chipId);
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerElement.innerHTML = `${hours}h ${minutes}m ${seconds}s remaining`;
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

function updateStatusToReadyForAnalysis(chipId) {
    const sampleData = {
        chip_id: chipId,
        status: "Picked up. Ready for Analysis"
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
        updateStatusToReadyForAnalysis(event.target.elements['data-chip-id'].value);
        document.getElementById('pickup-form-modal').style.display = 'none';
        document.getElementById('pickup-form').reset();
    });

    document.getElementById('pickup-close-button').addEventListener('click', function () {
        hideElementWithAnimation('pickup-form-modal', 'zoomOut');
        document.getElementById('pickup-form-modal').style.display = 'none';
    });

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('pickup-button')) {
            showElementWithAnimation(event.target.id, 'zoomIn');
            showPickupForm(event.target.id);
        }
        if (event.target.classList.contains('finish-button')) {
            completeSample(event.target.id);
        }
        if (event.target.classList.contains('sample-reg-close-btn')) {
            resetSampleRegistration();
        }
        if (event.target.classList.contains('patient-intake-form-close-btn')) {
            document.getElementById('patient-intake-form-section').style.display = 'none';
        }
        if (event.target.id === 'start-scanning') {
            startDocumentScanning();
        }
        if (event.target.id === 'change-camera-button') {
            changeCamera();
        }
    });

}