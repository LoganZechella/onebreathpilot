const animateCSS = (element, animation, options = {}) =>
    new Promise((resolve, reject) => {
        const { prefix = 'animate__', delay, duration, iterationCount } = options;
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        if (delay) node.style.setProperty('--animate-delay', delay);
        if (duration) node.style.setProperty('--animate-duration', duration);
        if (iterationCount) node.style.setProperty('--animate-iteration-count', iterationCount);

        node.classList.add(`${prefix}animated`, animationName);

        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);

            // Remove the inline styles after the animation ends
            if (delay) node.style.removeProperty('--animate-delay');
            if (duration) node.style.removeProperty('--animate-duration');
            if (iterationCount) node.style.removeProperty('--animate-iteration-count');

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
    enumerateVideoDevices();
});

function showElementWithAnimation(elementId, animation, options = {}) {
    const element = document.getElementById(elementId);
    element.style.display = 'block';
    animateCSS(`#${elementId}`, animation, options);
}

// Function to hide an element with an animation
function hideElementWithAnimation(elementId, animation, options = {}) {
    const element = document.getElementById(elementId);
    animateCSS(`#${elementId}`, animation, options).then(() => {
        element.style.display = 'none';
    });
}

function updateUIBasedOnAuth(user) {
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
    setTimeout(() => {
        hideElementWithAnimation('splash-screen', 'fadeOut', { duration: '500ms' });
        showElementWithAnimation('sign-in-container', 'fadeIn', { duration: '500ms' });
        checkAuthState();
        if (checkAuthState() === true) {
            hideElementWithAnimation('sign-in-container', 'fadeOut', { duration: '500ms' });
            // hideElementWithAnimation('splash-screen', 'fadeOut', { duration: '500ms' });
            showElementWithAnimation('blocker', 'zoonIn', { delay: '1500ms', duration: '500ms' });
            showElementWithAnimation('container-fluid', 'fadeIn', { delay: '1000ms', duration: '1000ms' });
            const nav = document.querySelector('.container-fluid');
            nav.style.display = 'flex';
        } else {
            showElementWithAnimation('sign-in-container', 'fadeIn');
            document.getElementById('landing-main').style.display = 'none';
            document.getElementById('sign-in-container').removeAttribute('hidden');
        }
    }, 1200);

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
    return !!window.firebaseAuth.currentUser;
}

// Setup the confirm button to trigger animations and sample upload
function setupSampleConfirmation() {
    const confirmButton = document.getElementById('confirm-button');

    confirmButton.addEventListener('click', async function (event) {
        event.preventDefault();
        const sample = collectSampleFormData();
        if (sample) {
            sample.timestamp = new Date().toISOString();
            sample.status = 'In Process';

            // Add pulsing animation to the confirm button
            animateCSS('#confirm-button', 'pulse', { iterationCount: 'infinite' });

            await sendSample(sample).then(() => {
                alert('Sample uploaded successfully.');

                // Stop pulsing animation
                confirmButton.classList.remove('animate__pulse', 'animate__animated');

                // Hide sample-reg-section with fadeOut animation
                hideElementWithAnimation('sample-reg-section', 'fadeOut');
                document.getElementById('sample-reg-section').style.display = 'none';
                showElementWithAnimation('option-container', 'fadeIn');
                document.getElementById('option-container').style.display = 'flex';
            }).catch(error => {
                console.error('Failed to submit sample:', error);
                alert('Failed to submit sample.');
                confirmButton.classList.remove('animate__pulse', 'animate__animated');
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
    return fetch('https://onebreathpilot.onrender.com/update_sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData),
    })
        .then(response => response.json())
        .then(data => {
            return true;  // Indicate success
        })
        .catch(error => {
            alert(`Sample submission failed: ${error}. Please try again.`);
            return false;  // Indicate failure
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
        window.location.reload();
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

const rescanButton = document.getElementById('rescan-button');
if (rescanButton) {
    rescanButton.addEventListener('click', () => {
        document.getElementById('review-section').style.display = 'none';
        startDocumentScanning();
    });
}

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

function setupDocumentUploadListener() {
    const confirmUploadButton = document.getElementById('confirm-upload-button');
    if (confirmUploadButton) {
        confirmUploadButton.addEventListener('click', handleDocumentUpload);
    }
}

async function handleDocumentUpload() {
    const chipId = window.chipId || document.getElementById('chipID').value;
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
                window.location.reload();
            }
        }));
    } catch (error) {
        console.error('Error during document upload:', error);
        alert('Document upload failed. Please try again.');
        loader.style.display = 'none';
        reviewSection.forEach(section => section.style.display = 'flex');
    }
}

// Call this function when the document upload section becomes visible
function showDocumentUploadSection() {
    setupDocumentUploadListener();
}

function startDocumentScanningFromEditMenu() {
    const bodySections = {
        'add-button': document.getElementById('add-new-sample'),
        'in-process': document.getElementById('in-process-section'),
        'pickup': document.getElementById('pickup-section'),
        'shipping': document.getElementById('shipping-section')
    };
    Object.values(bodySections).forEach(section => section.style.display = 'none');
    document.getElementById('scanner-container').style.display = 'block';
    document.getElementById('back-button-intake').innerText = 'Cancel';
    document.getElementById('back-button-intake').addEventListener('click', () => {window.location.href = '/index.html'; fetchSamplesAndUpdateUI();});

    // Start the document scanning process
    startDocumentScanning();
}

function uploadFromFile() {
    // Reference the existing file input element
    const fileInput = document.getElementById('capture-input');

    // Trigger the file browser when the input is clicked
    fileInput.click();

    // Handle file selection
    fileInput.addEventListener('change', async function (event) {
        const file = event.target.files[0];
        const loader = document.getElementById('document-upload-loader');
        const scanner = document.getElementById('scanner-container');
        const reviewSection = document.getElementById('review-section');
        const captureButtons = document.getElementById('back-button-intake-container');
        scanner.style.display = 'none';
        captureButtons.style.display = 'none';
        reviewSection.style.display = 'flex';
        document.getElementById('rescan-button').innerText = 'Select New File';
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async function () {
                const imageDataUrl = reader.result;
                const chipId = window.chipId;
                // Display the uploaded image
                    const capturedImage = document.getElementById('scanned-images');
                    const imgElement = document.createElement('img');
                    imgElement.src = imageDataUrl;
                    capturedImage.appendChild(imgElement);
                    capturedImage.style.display = 'flex';
                try {
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
                        const imageUrl = data.url.split('?')[0];
                        const shortBlobName = imageUrl.split('/')[4];
                        console.log(shortBlobName);
                        loader.style.display = 'none';
                    } else {
                        alert('Failed to generate presigned URL.');
                    }
                } catch (error) {
                    console.error('Error during document upload:', error);
                    alert('Document upload failed. Please try again.');
                }
            };

            // Read the file as a data URL
            reader.readAsDataURL(file);
        }
    });
}

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
            'shipping': document.getElementById('shipping-section')
        };
        Object.values(bodySections).forEach(section => section.style.display = 'none');
        document.getElementById('qr-close-btn').style.display = 'flex';
        document.getElementById('manual-add-btn').style.display = 'flex';
        document.getElementById('add-button-div').style.alignSelf = 'center';
        document.getElementById('add-button-div').style.margin = '0.5em 0 2em 0'
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
        'in-process': document.getElementById('in-process-section'),
        'pickup': document.getElementById('pickup-section'),
        'shipping': document.getElementById('shipping-section')
    };
    document.getElementById('sample-reg-section').style.display = 'none';
    document.getElementById('patient-intake-form-section').style.display = 'none';
    document.getElementById('qr-close-btn').style.display = 'none';
    document.getElementById('manual-add-btn').style.display = 'none';
    document.getElementById('add-button-div').style.alignSelf = 'flex-end';
    document.getElementById('add-button-div').style.margin = '-1em 0 0.5em 0';
    document.getElementById('add-new-sample').style.display = 'flex';
    Object.values(bodySections).forEach(section => section.style.display = 'grid');
    Object.values(bodySections)[0].style.display = 'flex';
    Object.values(bodySections)[1].style.display = 'flex';
    AOS.refresh();
}

setInterval(fetchSamplesAndUpdateUI, 60000); // Refresh every minute

// Function to fetch samples and update UI
function fetchSamplesAndUpdateUI() {
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

    clearElements([inProcessElement, pickupElement, shippingElement]);

    samples.forEach(sample => {
        const sampleCard = createSampleCard(sample);
        switch (sample.status) {
            case 'In Process': inProcessElement.appendChild(sampleCard); break;
            case 'Ready for Pickup': pickupElement.appendChild(sampleCard); break;
            case 'Picked up. Ready for Analysis': shippingElement.appendChild(sampleCard); break;
        }
    });
    for (const element of [inProcessElement, pickupElement, shippingElement]) {
        const cardCount = element.querySelectorAll('.card').length;
        const sectionTitle = element.parentElement.querySelector('.section-title h3');
        const sectionTitleText = sectionTitle.textContent.split(': ')[0];
        sectionTitle.textContent = `${sectionTitleText}: ${cardCount}`;
    }
    
    const inprocessSection = document.getElementById('in-process-section');
    const pickupSection = document.getElementById('pickup-section');
    const shippingSection = document.getElementById('shipping-section');

    for (const element of [inprocessSection, pickupSection, shippingSection]) {
        showElementWithAnimation(element.id, 'zoomIn', { duration: '700ms', delay: '1200ms' });
    }

    for (const element of [inProcessElement, pickupElement, shippingElement]) {
        element.style.display = 'grid';
    }

    displayNoSamplesMessage([inProcessElement, pickupElement, shippingElement]);
}

function createSampleCard(sample) {
    const card = document.createElement('div');
    card.className = `card ${sample.chip_id}`;
    card.innerHTML = `
        <div class="card-content">
            <div class="card-header">
                <div class="chip-id-location">
                    <h3 class="chip-id">${sample.chip_id}</h3>
                    <p class="location">Location: ${sample.location}</p>
                </div>
                <div class="status-timer">
                    <p class="status"><strong>${sample.status}</strong></p>
                    <div class="timer" id="timer-${sample.chip_id}"></div>
                </div>
            </div>
            <div class="card-buttons">
                ${sample.status === 'In Process' ? '<button class="finish-early-button"><img src="assets/images/icons8-check-ios-17-filled-96.png"></button>' : ''}
                ${sample.status === 'Ready for Pickup' ? '<button class="pickup-button">Pickup</button>' : ''}
                ${sample.status === 'Picked up. Ready for Analysis' ? '<button class="complete-button">Complete</button>' : ''}
                <button class="edit-button">Edit</button>
            </div>
        </div>
    `
    ;

    // Append card to the respective status section (ensuring it's in the DOM)
    switch (sample.status) {
        case 'In Process':
            document.getElementById('in-process-section').querySelector('.grid').appendChild(card);
            break;
        case 'Ready for Pickup':
            document.getElementById('pickup-section').querySelector('.grid').appendChild(card);
            card.querySelector('.edit-button').remove();
            break;
        case 'Picked up. Ready for Analysis':
            document.getElementById('shipping-section').querySelector('.grid').appendChild(card);
            card.querySelector('.edit-button').remove();
            break;
    }

    // Ensure the timer element exists and is correctly referenced
    const timerElementId = `timer-${sample.chip_id}`;
    const timerElement = document.getElementById(timerElementId);
    if (timerElement) {
        // Attach event listeners for edit and evacuation buttons if they exist
        if (sample.status === 'In Process') {
            initializeCountdown(sample.timestamp, timerElementId, sample.chip_id);
        }
    } else {
        // console.error(`Timer element with ID ${timerElementId} not found. Skipping countdown.`);
    }

    // Attach event listeners for buttons
    if (sample.status === 'In Process') {
        card.querySelector('.edit-button').addEventListener('click', handleEditButtonClick);
    }
    if (sample.status === 'Picked up. Ready for Analysis') {
        card.querySelector('.complete-button').addEventListener('click', () => completeSample(sample.chip_id));
    }

    if (sample.status === 'Ready for Pickup') {
        card.querySelector('.pickup-button').addEventListener('click', handlePickupButtonClick);
    }

    return card;
}

function handleEditButtonClick(event) {
    const card = event.target.closest('.card');
    const editButton = event.target;
    const chipId = card.querySelector('.chip-id').innerText;

    // Add a class to the edit button for identification
    editButton.classList.add(chipId);

    // Toggle the display of the edit options menu
    let menuContainer = card.querySelector('.edit-options-menu');
    if (!menuContainer) {
        // Create and show the menu if it doesn't exist
        menuContainer = document.createElement('div');
        menuContainer.classList.add('edit-options-menu');
        menuContainer.innerHTML = `
            <button data-option="update">Update</button>
            <button data-option="upload">Upload</button>
            <button data-option="cancel">Cancel</button>
        `;
        editButton.style.display = 'none'; // Hide the edit button
        card.querySelector('.card-buttons').appendChild(menuContainer);

        // Attach event listeners for menu options
        menuContainer.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', handleEditMenuOptionClick);
        });
    } else {
        // Toggle the menu visibility
        menuContainer.style.display = menuContainer.style.display === 'none' ? 'flex' : 'none';
    }
}

function handleUpdateClick(event) {
    const card = event.target.closest('.card');

    // Get the elements that display the chip ID and location
    const chipIdElement = card.querySelector('.chip-id');
    const locationElement = card.querySelector('.location');
    const editButton = card.querySelector('.edit-button');


    // Save the current text values
    const currentChipId = chipIdElement.innerText;
    const currentLocation = locationElement.innerText.replace('Location: ', '');
    chipIdElement.style.display = 'none';
    locationElement.style.display = 'none';

    // Replace chip ID text with an input field
    const chipIdInput = document.createElement('input');
    chipIdInput.type = 'text';
    chipIdInput.value = currentChipId;
    chipIdInput.className = 'chip-id-input'; // Optional: Add a class for styling
    chipIdInput.style.width = '100px';
    chipIdInput.style.height = '25px';
    chipIdInput.style.fontSize = '12px';
    card.querySelector('.chip-id-location').appendChild(chipIdInput);

    // Replace location text with an input field
    const locationInput = document.createElement('select');
    locationInput.className = 'location-input';
    locationInput.style.width = '160px';
    locationInput.style.height = '25px';
    locationInput.style.fontSize = '12px';
    if (currentLocation === 'CT - Radiology') {
        locationInput.selectedIndex = 0;
    } else {
        locationInput.selectedIndex = 1;
    }

    const option1 = document.createElement('option');
    option1.value = 'CT - Radiology';
    option1.text = 'CT - Radiology';
    option1.style.color = '#ffffff';
    locationInput.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = 'BCC - 3rd Floor Clinic';
    option2.text = 'BCC - 3rd Floor Clinic';
    option2.style.color = '#ffffff';
    locationInput.appendChild(option2);

    card.querySelector('.chip-id-location').appendChild(locationInput);

    // Add a save button to save the changes
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.className = 'save-button';
    card.querySelector('.card-buttons').appendChild(saveButton);

    // Event listener to handle save action
    saveButton.addEventListener('click', async () => {
        const updatedChipId = chipIdInput.value;
        const updatedLocation = locationInput.value;
        chipIdElement.innerText = updatedChipId;
        locationElement.innerText = `Location: ${updatedLocation}`;
        chipIdInput.remove();
        locationInput.remove();
        chipIdElement.style.display = 'flex';
        locationElement.style.display = 'flex';

        try {
            // Make an API call to update the sample in the database
            const response = await fetch('https://onebreathpilot.onrender.com/update_sample', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    chip_id: updatedChipId,
                    location: updatedLocation
                })
            });

            const data = await response.json();

            if (data.success) {
                // Replace the input fields with the updated text
                chipIdElement.innerText = updatedChipId;
                locationElement.innerText = `Location: ${updatedLocation}`;
                chipIdInput.remove();
                locationInput.remove();
                chipIdElement.style.display = 'flex';
                locationElement.style.display = 'flex';
            } else {
                throw new Error('Failed to update the sample.');
            }
        } catch (error) {
            console.error('Error updating sample:', error);
            alert(`Error updating sample: ${error}`);
        }

        // Remove the save button after saving
        saveButton.remove();
        editButton.style.display = 'flex';
    });
}


function handleEditMenuOptionClick(event) {
    const option = event.target.getAttribute('data-option');
    const menuContainer = event.target.closest('.edit-options-menu');
    const chipId = event.target.closest('.card').querySelector('.chip-id').innerText;
    const editButton = document.querySelector(`.edit-button.${chipId}`);

    switch (option) {
        case 'update':
            menuContainer.style.display = 'none';
            handleUpdateClick(event);
            break;
        case 'upload':
            menuContainer.style.display = 'none';
            editButton.style.display = 'none';
            window.chipId = chipId;
            // Start document scanning
            startDocumentScanningFromEditMenu();
            break;
        case 'cancel':
            // Hide the menu and show the edit button
            menuContainer.style.display = 'none';
            editButton.style.display = 'flex';
            break;
    }
}

function handlePickupButtonClick(event) {
    formId = event.target.closest('.card').querySelector('.chip-id').innerText;
    document.getElementById('pickup-form').elements['confirm-pickup-button'].classList.add(formId);
    const chipID = event.target.closest('.card').querySelector('.chip-id').innerText;
    showPickupForm(formId);
}

function handleEvacuationCompleteButtonClick(event) {
    const chipID = event.target.closest('.card').querySelector('h3').innerText;
}

function initializeCountdown(timestamp, timerId, chipId) {
    const endTime = new Date(timestamp).getTime() + 7200000; // 2 hours from timestamp
    const timerElement = document.getElementById(timerId);

    if (!timerElement) {
        console.error(`Timer element with ID ${timerId} not found. Skipping countdown.`);
        return;
    }

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(interval);
            timerElement.innerHTML = 'Awaiting status update...';
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerElement.innerHTML = `${hours}h ${minutes}m ${seconds}s remaining`;
    }, 1000);
}
// Refresh every minute

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

function collectPickupFormData() {
    let chip_id = document.getElementById('chipID').value;
    let patient_id = document.getElementById('patientID').value;
    let location = document.getElementById('location').value;

    if (!chip_id || !patient_id || !location) {
        alert('Please fill in all required fields.');
        return null;
    }
    return { chip_id, patient_id, location };
}

async function updateStatusToReadyForAnalysis(chipId, volume, co2, error) {
    const sampleData = {
        chip_id: chipId,
        status: "Picked up. Ready for Analysis",
        final_volume: volume,
        average_co2: co2
    };
    if (error) {
        sampleData.error = error;
    }

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
    showElementWithAnimation('pickup-form-modal', 'fadeIn', { duration: '800ms', delay: '0s' });
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
            alert('Sample completed successfully.');fetchSamplesAndUpdateUI();
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
    if (sample.status === 'In Process') {
        card.querySelector('.finish-early-button').className = `finish-early-button ${sample.chip_id}`;
        card.querySelector('.edit-button').className = `edit-button ${sample.chip_id}`;
    }

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

function toggleMenu() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('responsive');
}

function setupSampleEventListeners() {
    document.getElementById('pickup-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const chipId = event.target.elements['confirm-pickup-button'].classList[0];
        const volume = event.target.elements['final-volume'].value;
        const co2 = event.target.elements['average-co2'].value;
        if (event.target.elements['error-codes'].value) {
            const error = event.target.elements['error-codes'].value;
            updateStatusToReadyForAnalysis(chipId, volume, co2, error).then(() => {
                hideElementWithAnimation('pickup-form-modal', 'fadeOut', 'duration-500ms', 'delay-0s');
                document.getElementById('pickup-form').reset();
                
            }).catch(error => {
                console.error('Failed to update sample status:', error);
                alert('Failed to update sample status.');
            });
        } else {
            updateStatusToReadyForAnalysis(chipId, volume, co2).then(() => {
                hideElementWithAnimation('pickup-form-modal', 'fadeOut', 'duration-500ms', 'delay-0s');
                document.getElementById('pickup-form').reset();
            }).catch(error => {
                console.error('Failed to update sample status:', error);
                alert('Failed to update sample status.');
            });
        }
    });

    document.getElementById('pickup-close-button').addEventListener('click', function () {
        hideElementWithAnimation('pickup-form-modal', 'fadeOut', { duration: '1000ms', delay: '0s' });
    });

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('pickup-button')) {
            handlePickupButtonClick(event);
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
            uploadFromFile();
        }
        if (event.target.id === 'completed-samples-button') {
            window.location.href = '/completed.html';
        }
    });
}