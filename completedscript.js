function toggleMenu() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('responsive');
}

document.addEventListener('DOMContentLoaded', function () {
    const auth = window.firebaseAuth;
    auth.onAuthStateChanged((user) => {
        updateUIBasedOnAuth(user);
    });

    function updateUIBasedOnAuth(user) {
        const authButton = document.getElementById('show-sign-in');
        const tableSection = document.getElementById('table-section');
        const signInContainer = document.getElementById('sign-in-container');
        const mainContent = document.getElementById('main-content');

        if (user) {
            authButton.textContent = 'Sign Out';
            authButton.addEventListener('click', () => auth.signOut());
            tableSection.style.display = 'flex';
            signInContainer.hidden = true;
            loadCompletedSamples();
        } else {
            authButton.textContent = 'Sign In';
            authButton.addEventListener('click', () => {
                signInContainer.hidden = false;
                tableSection.style.display = 'none';
            });
            tableSection.style.display = 'none';
            signInContainer.hidden = false;
        }
    }

    document.getElementById('sign-in').addEventListener('click', function () {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                updateUIBasedOnAuth(user);
            })
            .catch((error) => {
                console.error('Error during sign-in:', error.message);
                alert('Sign-in failed. Please check your credentials and try again.');
            });
    });

    // Function to fetch and populate completed samples
    function loadCompletedSamples() {
        fetch('https://onebreathpilot.onrender.com/api/completed_samples')
            .then(response => response.json())
            .then(data => {
                // Sort the data by timestamp (oldest first)
                data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                const tableBody = document.querySelector('#completed-samples-table tbody');
                tableBody.innerHTML = '';
                data.forEach(sample => {
                    const row = document.createElement('tr');

                    const sampleIdCell = document.createElement('td');
                    sampleIdCell.textContent = sample.chip_id;

                    const patientIdCell = document.createElement('td');
                    patientIdCell.textContent = sample.patient_id || 'N/A';

                    const dateCompletedCell = document.createElement('td');
                    const formattedDate = sample.timestamp.split('T')[0];
                    const parts = formattedDate.split('-');
                    const shortYear = parts[0].split('0');
                    const shortDate = `${parts[1]}/${parts[2]}/${shortYear[1]}`;
                    dateCompletedCell.textContent = shortDate || 'N/A';

                    const volumeCell = document.createElement('td');
                    volumeCell.textContent = `${sample.final_volume} mL`;

                    const co2Cell = document.createElement('td');
                    co2Cell.textContent = `${sample.average_co2}%`

                    // const imageCell = document.createElement('td');
                    // imageCell.textContent = sample.document_urls ? 'Yes' : 'No';

                    const errorCodeCell = document.createElement('td');
                    errorCodeCell.textContent = sample.error || 'N/A';

                    const uploadCell = document.createElement('td');
                    const uploadButton = document.createElement('button');
                    uploadButton.innerHTML = '<img class="upload-icon" src="assets/images/icons8-upload-96.png" alt="Upload"/>';
                    uploadButton.className = 'upload-button';
                    uploadButton.dataset.chipId = sample.chip_id;
                    uploadCell.appendChild(uploadButton);
                    
                    row.appendChild(dateCompletedCell);
                    row.appendChild(sampleIdCell);
                    row.appendChild(patientIdCell);
                    row.appendChild(volumeCell);
                    row.appendChild(co2Cell);
                    // row.appendChild(imageCell);
                    row.appendChild(errorCodeCell);
                    row.appendChild(uploadCell);

                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error fetching completed samples:', error);
            });
    }

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('upload-icon')) {
            const chipId = event.target.dataset.chipId;
            if (auth.currentUser) {
                showUploadMenu(chipId);
            } else {
                alert('You must be signed in to upload a file.');
            }
        }
    });

    // Download dataset button logic
    document.getElementById('download-dataset-button').addEventListener('click', function () {
        const confirmation = confirm('Are you sure you want to download the dataset as a CSV file?');
        if (confirmation) {
            window.location.href = 'https://onebreathpilot.onrender.com/download_dataset';
        }
    });


    function showUploadMenu(chipId) {
        clearImagePreview();
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.click();

        fileInput.addEventListener('change', async function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = function () {
                    const imageDataUrl = reader.result;

                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'img-preview-div';
                    document.getElementById('main-content').appendChild(imgDiv);

                    const imgElement = document.createElement('img');
                    imgElement.src = imageDataUrl;
                    imgDiv.appendChild(imgElement);

                    const confirmationButton = document.createElement('button');
                    confirmationButton.className = 'confirm-upload-button';
                    confirmationButton.dataset.chipId = chipId;
                    confirmationButton.textContent = 'Confirm Upload';
                    imgDiv.appendChild(confirmationButton);

                    const cancelButton = document.createElement('button');
                    cancelButton.className = 'cancel-upload-button';
                    cancelButton.textContent = 'Cancel';
                    imgDiv.appendChild(cancelButton);

                    confirmationButton.addEventListener('click', async function () {
                        await uploadImage(chipId, imageDataUrl);
                    });

                    cancelButton.addEventListener('click', function () {
                        clearImagePreview();
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    async function uploadImage(chipId, imageDataUrl) {
        try {
            const response = await fetch('https://onebreathpilot.onrender.com/upload_from_memory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    destination_blob_name: `document_${chipId}.jpeg`,
                    source_file_name: imageDataUrl
                })
            });
            const data = await response.json();
            if (data.success) {
                const documentUrl = `https://storage.cloud.google.com/breathdocument_bucket/document_${chipId}.jpeg`;
                await saveDocumentMetadata(chipId, documentUrl);
                alert('Document uploaded successfully.');
                clearImagePreview();
                loadCompletedSamples();
            } else {
                alert('Failed to upload document.');
            }
        } catch (error) {
            console.error('Error during document upload:', error);
            alert('Document upload failed. Please try again.');
        }
    }

    async function saveDocumentMetadata(chipId, documentUrl) {
        try {
            const response = await fetch('https://onebreathpilot.onrender.com/upload_document_metadata', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ chip_id: chipId, document_urls: documentUrl })
            });
            const data = await response.json();
            if (!data.success) {
                alert('Document metadata upload failed.');
            }
        } catch (error) {
            console.error('Error uploading document metadata:', error);
            alert('Document metadata upload failed. Please try again.');
        }
    }

    function clearImagePreview() {
        const imgPreviewDiv = document.querySelector('.img-preview-div');
        if (imgPreviewDiv) {
            imgPreviewDiv.remove();
        }
    }
});