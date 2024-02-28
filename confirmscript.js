document.addEventListener('DOMContentLoaded', function () {
    const queryParams = new URLSearchParams(window.location.search);
    const sampleId = queryParams.get('sample_id');

    function sendSample(sampleData) {
        sampleData.timestamp = new Date().toISOString();

        fetch('https://onebreathpilot.onrender.com/collectedsamples', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sampleData),
        })
            .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
            .then(json => {
                console.log('Sample added to the database:', json);
                document.getElementById('confirmation-message-text').innerText = 'Sample successfully added to the database.';
            })
            .catch(error => {
                console.error('Error adding sample to the database:', error);
                document.getElementById('confirmation-message-text').innerText = 'Error adding sample to the database.';
            });
    }

    if (sampleId) {
        const url = `https://onebreathpilot.onrender.com/temp_samples/ + ${sampleId}`;
        console.log(url);

        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',

            },
            body: JSON.stringify(sampleId),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data)});


        // Fetching data from server using the sampleId
    //     fetch(url)
    //         .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
    //         .then(data => {
    //             // Update to correctly handle the expected data structure
    //             if (data.chipID) { // Assuming data is a single object
    //                 let message = `Collect breath per study protocol then return to this page. 
    //                                 When evacuation for sample ${data.chipID} has started, press the start button below:`;
    //                 document.getElementById('confirmation-message-text').innerHTML = message;

    //                 document.getElementById('start-button').addEventListener('click', function () {
    //                     sendSample(data);
    //                 });
    //             } else {
    //                 console.error('Sample data is missing or malformed:', data);
    //             }
    //         })
    //         .catch(error => {
    //             console.error('Error fetching sample:', error);
    //         });
    }
});
