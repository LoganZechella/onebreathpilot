async function fetchAndDisplayInProcessSamples() {
    try {
        const response = await fetch('http://127.0.0.1:5000/samples/inprocess');
        // if (!response.ok) {
        //     throw new Error('Network response was not ok');
        // }
        const data = await response.json();
        const samples = data.samples;

        const inProcessElement = document.getElementById('in-process-section').querySelector('.grid');
        // inProcessElement.innerHTML = ''; // Clear current content
        function moveToPickupSection(card) {
            const pickupSection = document.getElementById('pickup-section');
            pickupSection.appendChild(card);
        }

        function updateCountdown(element, targetTime) {
            const interval = setInterval(() => {
                const now = new Date();
                const distance = targetTime - now;
                if (distance < 0) {
                    clearInterval(interval);
                    moveToPickupSection(element.parentElement);
                    element.innerHTML = 'Expired';
                } else {
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    element.innerHTML = `Remaining Time: ${hours}h ${minutes}m ${seconds}s`;
                }
            }, 1000);
        }

        samples.forEach(sample => {
            const card = document.createElement('div');
            card.className = 'card';

            const sampleTimestamp = new Date(sample.timestamp);
            const now = new Date();
            const fourHoursInMs = 4 * 60 * 60 * 1000;
            const timeElapsed = now - sampleTimestamp;
            const countdownTargetTime = new Date(sampleTimestamp.getTime() + fourHoursInMs);

            if (timeElapsed < fourHoursInMs) {
                // Display countdown
                card.innerHTML = `
                <p>Chip ID: ${sample.chipID}</p>
                <p>Status: ${sample.status}</p>
                <p><span id="countdown-${sample.chipID}">${sample.timestamp}</span></p>`;
                const countdownElement = card.querySelector(`#countdown-${sample.chipID}`);
                updateCountdown(countdownElement, countdownTargetTime);
                document.getElementById('in-process-section').querySelector('.grid').appendChild(card);
            } else {
                // Move to 'pickup-section'
                moveToPickupSection(card);
                card.innerHTML = `
                <p>Chip ID: ${sample.chipID}</p>
                <p>Status: Ready for Pickup</p>
                <button class="pickup-button">Pickup Chip</button>
                `;
            }
        });
    } catch (error) {
        console.error('Failed to fetch in-process samples:', error);
    }
}

document.addEventListener('DOMContentLoaded', fetchAndDisplayInProcessSamples);
