function toggleMenu() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('responsive');
}

document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.querySelector('#completed-samples-table tbody');

    // Function to fetch and populate completed samples
    function loadCompletedSamples() {
        fetch('https://onebreathpilot.onrender.com/api/completed_samples')
            .then(response => response.json())
            .then(data => {
                console.log('Completed samples:', data);
                data.forEach(sample => {
                    const row = document.createElement('tr');

                    // Create cells for each column
                    const sampleIdCell = document.createElement('td');
                    sampleIdCell.textContent = sample.chip_id;

                    const patientIdCell = document.createElement('td');
                    patientIdCell.textContent = sample.patient_id || 'N/A';

                    const dateCompletedCell = document.createElement('td');
                    const formattedDate = sample.timestamp.split('T')[0];
                    const parts = formattedDate.split('-');
                    const shortDate = `${parts[1]}/${parts[2]}/${parts[0]}`;
                    dateCompletedCell.textContent = shortDate || 'N/A';

                    // Create the Upload button cell
                    const uploadCell = document.createElement('td');
                    const uploadButton = document.createElement('button');
                    uploadButton.className = 'upload-button';
                    uploadButton.dataset.chipId = sample.chip_id;
                    uploadButton.textContent = 'Upload Form';
                    uploadCell.appendChild(uploadButton);

                    // Append cells to the row
                    row.appendChild(sampleIdCell);
                    row.appendChild(patientIdCell);
                    row.appendChild(dateCompletedCell);
                    row.appendChild(uploadCell);

                    // Append the row to the table body
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error fetching completed samples:', error);
            });
    }

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('upload-button')) {
            showUploadMenu(event.target.dataset.chipId);
        }
    });

    // Show the upload menu when the Upload button is clicked
    function showUploadMenu(chipId) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.click();

        fileInput.addEventListener('change', async function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = async function () {
                    const imageDataUrl = reader.result;

                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'img-preview-div';
                    document.getElementById('main-content').appendChild(imgDiv);

                    const imgElement = document.createElement('img');
                    imgElement.src = imageDataUrl;
                    imgDiv.appendChild(imgElement);

                    // Display a preview and confirmation button
                    const confirmationButton = document.createElement('button');
                    confirmationButton.className = 'confirm-upload-button';
                    confirmationButton.dataset.chipId = chipId;
                    confirmationButton.textContent = 'Confirm Upload';
                    imgDiv.appendChild(confirmationButton);

                    confirmationButton.addEventListener('click', async function () {
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
                                const presignedUrl = data.url;

                                // Upload the file directly to the storage using the presigned URL
                                const uploadResponse = await fetch(presignedUrl, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'image/jpeg',
                                        'Access-Control-Allow-Origin': '*'
                                    },
                                    body: new Blob([imageDataUrl], { type: 'image/jpeg' })
                                });

                                if (!uploadResponse.ok) {
                                    throw new Error('Failed to upload image to the presigned URL.');
                                }

                                // After the file is uploaded, save the metadata in the database
                                const destinationBlobName = presignedUrl.split('?')[0];
                                await saveDocumentMetadata(chipId, destinationBlobName);
                                alert('Document uploaded successfully.');
                            } else {
                                alert('Failed to generate presigned URL.');
                            }
                        } catch (error) {
                            console.error('Error during document upload:', error);
                            alert('Document upload failed. Please try again.');
                        }
                    });
                };
                reader.readAsDataURL(file);
            }
        });
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

    // Load completed samples on page load
    loadCompletedSamples();
});

