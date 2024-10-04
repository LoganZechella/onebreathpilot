(function () {
    let completedSamples = [];
    let currentChart = null;
    let currentD3Chart = null;

    function init() {
        const chartType = document.getElementById('chart-type');
        const xAxis = document.getElementById('x-axis');
        const yAxis = document.getElementById('y-axis');
        const aggregation = document.getElementById('aggregation');

        if (chartType && xAxis && yAxis && aggregation) {
            // Only add labels if they don't already exist
            if (!chartType.previousElementSibling || chartType.previousElementSibling.tagName !== 'LABEL') {
                addLabelForSelect(chartType, 'Chart Type:');
                addLabelForSelect(xAxis, 'X-Axis:');
                addLabelForSelect(yAxis, 'Y-Axis:');
                addLabelForSelect(aggregation, 'Aggregation:');
            }

            chartType.addEventListener('change', createVisualization);
            xAxis.addEventListener('change', createVisualization);
            yAxis.addEventListener('change', createVisualization);
            aggregation.addEventListener('change', createVisualization);
            fetchData();
        } else {
            console.error('One or more required elements are missing from the DOM');
        }
    }

    async function fetchData() {
        try {
            const response = await fetch('https://onebreathpilot.onrender.com/analyzed');
            const allSamples = await response.json();
            completedSamples = allSamples.filter(sample => sample.status === "Complete");
            populateAxisOptions();
            createVisualization();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function addLabelForSelect(selectElement, labelText) {
        const label = document.createElement('label');
        label.htmlFor = selectElement.id;
        label.textContent = labelText;
        selectElement.parentNode.insertBefore(label, selectElement);
    }

    function formatFieldName(fieldName) {
        const formattingRules = {
            'chip_id': 'Chip ID',
            'batch_number': 'Batch Number',
            'mfg_date': 'Manufacturing Date',
            'location': 'Location',
            'timestamp': 'Date',
            'patient_id': 'Patient ID',
            'average_co2': 'Average CO2 (%)',
            'final_volume': 'Final Volume (mL)',
            '2-Butanone': '2-Butanone (nmole/L breath)',
            'Pentanal': 'Pentanal (nmole/L breath)',
            'Decanal': 'Decanal (nmole/L breath)',
            '2-hydroxy-acetaldehyde': '2-hydroxy-acetaldehyde (nmole/L breath)',
            '2-hydroxy-3-butanone': '2-hydroxy-3-butanone (nmole/L breath)',
            '4-HHE': '4-HHE (nmole/L breath)',
            '4HNE': '4HNE (nmole/L breath)',
            'Dx': 'Diagnosis'
        };

        return formattingRules[fieldName] || fieldName;
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const options = {
            timeZone: 'America/Kentucky/Louisville',
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        return date.toLocaleString('en-US', options).replace(',', '');
    }

    function formatFieldValue(value, field) {
        if (field === 'timestamp') {
            return formatTimestamp(value);
        }
        if (field === 'average_co2' && typeof value === 'object') {
            return parseFloat(value.$numberDecimal);
        }
        if (field === 'final_volume') {
            return parseInt(value);
        }
        return value;
    }

    function populateAxisOptions() {
        const xAxis = document.getElementById('x-axis');
        const yAxis = document.getElementById('y-axis');
        const aggregation = document.getElementById('aggregation');
        if (!xAxis || !yAxis || !aggregation) return;

        const numericFields = [
            'final_volume', 'average_co2', 'batch_number',
            '2-Butanone', 'Pentanal', 'Decanal', '2-hydroxy-acetaldehyde',
            '2-hydroxy-3-butanone', '4-HHE', '4HNE'
        ];
        const dateFields = ['timestamp', 'mfg_date'];
        const categoricalFields = ['location', 'patient_id', 'chip_id', 'Dx'];

        xAxis.innerHTML = '';
        yAxis.innerHTML = '';
        aggregation.innerHTML = '<option value="none">None</option>';

        numericFields.forEach(field => {
            xAxis.add(new Option(formatFieldName(field), field));
            yAxis.add(new Option(formatFieldName(field), field));
        });

        dateFields.forEach(field => {
            xAxis.add(new Option(formatFieldName(field), field));
        });

        categoricalFields.forEach(field => {
            xAxis.add(new Option(formatFieldName(field), field));
            aggregation.add(new Option(formatFieldName(field), field));
        });
    }

    function createVisualization() {
        const chartType = document.getElementById('chart-type').value;
        const xAxis = document.getElementById('x-axis').value;
        const yAxis = document.getElementById('y-axis').value;
        const aggregation = document.getElementById('aggregation').value;
        const chartContainer = document.getElementById('chart-container');

        if (!chartType || !xAxis || !yAxis || !aggregation || !chartContainer) {
            console.error('One or more required elements are missing for visualization');
            return;
        }

        // Clear previous chart
        chartContainer.innerHTML = '';

        let processedData = processData(completedSamples, xAxis, yAxis, aggregation);

        if (chartType === 'boxplot') {
            createD3BoxPlot(processedData, formatFieldName(xAxis), formatFieldName(yAxis), chartContainer);
        } else {
            createChartJsChart(chartType, processedData, formatFieldName(xAxis), formatFieldName(yAxis), chartContainer);
        }
    }

    function createChartJsChart(chartType, processedData, xAxis, yAxis, container) {
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        if (currentChart) {
            currentChart.destroy();
        }

        const config = {
            type: chartType,
            data: {
                labels: processedData.labels,
                datasets: [{
                    label: yAxis,
                    data: processedData.data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: xAxis
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxis
                        }
                    }
                }
            }
        };

        currentChart = new Chart(ctx, config);
    }

    function createD3BoxPlot(processedData, xAxis, yAxis, container) {
        // Clear any existing D3 chart
        if (currentD3Chart) {
            currentD3Chart.selectAll("*").remove();
        }

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        currentD3Chart = svg;

        // Debug: Log processed data
        console.log("Processed Data:", processedData);

        // Compute quartiles, median, inter quantile range min and max --> these info are then used to draw the box.
        const sumstat = d3.rollup(processedData.data, q => {
            const sorted = d3.sort(q);
            return {
                q1: d3.quantile(sorted, .25),
                median: d3.quantile(sorted, .5),
                q3: d3.quantile(sorted, .75),
                interQuantileRange: d3.quantile(sorted, .75) - d3.quantile(sorted, .25),
                min: d3.min(sorted),
                max: d3.max(sorted)
            };
        }, (d, i) => processedData.labels[i]);

        // Debug: Log sumstat
        console.log("Sumstat:", sumstat);

        // Show the X scale
        const x = d3.scaleBand()
            .range([0, width])
            .domain(processedData.labels)
            .paddingInner(1)
            .paddingOuter(.5);
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Show the Y scale
        const y = d3.scaleLinear()
            .domain([d3.min(processedData.data), d3.max(processedData.data)])
            .range([height, 0]);
        svg.append("g").call(d3.axisLeft(y));

        // Show the main vertical line
        svg
            .selectAll("vertLines")
            .data(Array.from(sumstat))
            .join("line")
            .attr("x1", d => {
                const xValue = x(d[0]);
                if (isNaN(xValue)) console.log("NaN x value for:", d);
                return xValue;
            })
            .attr("x2", d => x(d[0]))
            .attr("y1", d => y(d[1].min))
            .attr("y2", d => y(d[1].max))
            .attr("stroke", "black")
            .style("width", 40);

        // rectangle for the main box
        const boxWidth = 50;
        svg
            .selectAll("boxes")
            .data(Array.from(sumstat))
            .join("rect")
            .attr("x", d => {
                const xValue = x(d[0]) - boxWidth / 2;
                if (isNaN(xValue)) console.log("NaN x value for:", d);
                return xValue;
            })
            .attr("y", d => y(d[1].q3))
            .attr("height", d => y(d[1].q1) - y(d[1].q3))
            .attr("width", boxWidth)
            .attr("stroke", "black")
            .style("fill", "#69b3a2");

        // Show the median
        svg
            .selectAll("medianLines")
            .data(Array.from(sumstat))
            .join("line")
            .attr("x1", d => {
                const xValue = x(d[0]) - boxWidth / 2;
                if (isNaN(xValue)) console.log("NaN x value for:", d);
                return xValue;
            })
            .attr("x2", d => x(d[0]) + boxWidth / 2)
            .attr("y1", d => y(d[1].median))
            .attr("y2", d => y(d[1].median))
            .attr("stroke", "black")
            .style("width", 80);

        // Add axis labels
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + margin.top + 20)
            .text(xAxis);

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 20)
            .attr("x", -margin.top)
            .text(yAxis);

        const fontSize = Math.max(10, Math.min(14, width / 50)); // Responsive font size

        svg.selectAll("text")
            .style("font-size", `${fontSize}px`);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    }

    function processData(samples, xField, yField, aggregationField) {
        let processedData = { labels: [], data: [] };

        if (aggregationField === 'none') {
            samples.forEach(sample => {
                let xValue = formatFieldValue(sample[xField], xField);
                let yValue = parseFloat(sample[yField]);

                processedData.labels.push(xValue);
                processedData.data.push(yValue || 0);
            });
        } else {
            let aggregatedData = {};
            samples.forEach(sample => {
                let key = sample[aggregationField];
                if (!aggregatedData[key]) {
                    aggregatedData[key] = [];
                }
                aggregatedData[key].push(parseFloat(sample[yField]) || 0);
            });

            for (let key in aggregatedData) {
                processedData.labels.push(key);
                processedData.data.push(average(aggregatedData[key]));
            }
        }

        return processedData;
    }

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    // Wait for the DOM to be fully loaded before initializing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

function toggleMenu() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('responsive');
}

document.addEventListener('DOMContentLoaded', function () {
    const aiAnalysisBtn = document.getElementById('ai-analysis-btn');
    const aiInsightsModal = document.getElementById('ai-insights-modal');
    const closeModal = aiInsightsModal.querySelector('.close');
    const aiInsightsContent = document.getElementById('ai-insights-content');
    const visualizationSection = document.getElementById('visualization-section');
    const insightsOverlay = document.getElementById('insights-overlay');
    const closeInsights = document.getElementById('close-insights');

    if (aiAnalysisBtn) {
        aiAnalysisBtn.style.display = window.user ? 'block' : 'none';

        aiAnalysisBtn.addEventListener('click', function () {
            aiInsightsModal.style.display = 'block';
            aiInsightsContent.innerHTML = '<div class="loader"></div>';

            fetch('https://onebreathpilot.onrender.com/ai_analysis')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const formattedInsights = formatInsights(data.insights);
                        aiInsightsModal.style.display = 'none';
                        insightsOverlay.innerHTML = formattedInsights;
                        visualizationSection.style.display = 'none';
                        insightsOverlay.style.display = 'block';
                    } else {
                        aiInsightsContent.innerHTML = `<p>Error: ${data.error}</p>`;
                    }
                })
                .catch(error => {
                    aiInsightsContent.innerHTML = `<p>Error: ${error.message}</p>`;
                });
        });
    }

    closeModal.addEventListener('click', function () {
        aiInsightsModal.style.display = 'none';
    });

    closeInsights.addEventListener('click', function () {
        insightsOverlay.style.display = 'none';
        visualizationSection.style.display = 'block';
    });
});

function formatInsights(insights) {
    // Split the insights into sections
    const sections = insights.split('###').filter(section => section.trim() !== '');

    // Format each section
    const formattedSections = sections.map(section => {
        const [title, ...content] = section.split('\n');
        return `
            <div class="insight-section">
                <h3>${title.trim()}</h3>
                ${formatContent(content.join('\n'))}
            </div>
        `;
    });

    return formattedSections.join('');
}

function formatContent(content) {
    // Format lists
    content = content.replace(/- /g, '<li>').replace(/\n/g, '</li>\n');
    content = '<ul>' + content + '</ul>';

    // Format bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Format italics
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');

    return content;
}