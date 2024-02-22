document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname.endsWith('confirm.html')) {
        let samples = JSON.parse(localStorage.getItem('samples'));
        if (samples && samples.length > 0) {
            let lastSample = samples[samples.length - 1];

            // Display instructions with Chip ID
            let message = `Collect breath sample per study protocol. 
                           Return to this screen when evacuation for sample ${lastSample.chipID} has begun, 
                           then press the start button below.`;
            document.getElementById('confirmation-message-text').innerText = message;

            // Start button logic
            document.getElementById('start-button').addEventListener('click', function () {
                // Update the sample status to 'Evacuation Started'
                lastSample.status = 'In Process';
                localStorage.setItem('samples', JSON.stringify(samples));

                // Redirect back to the dashboard
                window.location.href = 'index.html';
            });
        }
    }
});
