document.addEventListener('DOMContentLoaded', function () {
    const queryParams = new URLSearchParams(window.location.search);
    const sampleId = queryParams.get('sample_id');

    // Function to add a timestamp and send the sample to the backend
    function sendSample(sampleData) {
        // // Add a timestamp to the sample
        sampleData.timestamp = new Date().toISOString();

        // Send the updated sample to the backend
        fetch('https://onebreathpilot.onrender.com/collectedsamples', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sampleData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(json => {
            console.log('Sample added to the database:', json);
            document.getElementById('confirmation-message-text').innerText = 'Sample successfully added to the database.';
        })
        .catch(error => {
            console.error('Error adding sample to the database:', error);
            document.getElementById('confirmation-message-text').innerText = 'Error adding sample to the database.';
        });
    }

    if (window.location.pathname.endsWith('confirm.html') && sampleId) {
        fetch(`https://onebreathpilot.onrender.com/temp_samples/${sampleId}`)
            .then(response => response.json())
            .then(data => {
                // Assuming the first item is the sample we're interested in

                const sample = data[0].chipID; // This assumes the data is already an object, not a string
                if (sample) {
                    let message = `Collect breath per study protocol then return to this page. 
                        When evacuation for sample ${sample} has started, press the start button below:`;
                    document.getElementById('confirmation-message-text').innerHTML = message;

                    // Add event listener to the start button
                    document.getElementById('start-button').addEventListener('click', function() {
                        sendSample(parseData[0]);
                    });
                } else {
                    // Handle case where sample or chipID is undefined
                    console.error('Sample data is missing or malformed:', data);
                }
            })
            .catch(error => {
                console.error('Error fetching sample:', error);
            });
    }
});
