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
            const response = await fetch('https://onebreathpilot.onrender.com/api/completed_samples');
            const allSamples = await response.json();
            completedSamples = allSamples.filter(sample => sample.status === "Complete");
            populateAxisOptions();
            createVisualization();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function populateAxisOptions() {
        const xAxis = document.getElementById('x-axis');
        const yAxis = document.getElementById('y-axis');
        const aggregation = document.getElementById('aggregation');
        if (!xAxis || !yAxis || !aggregation) return;

        const numericFields = ['final_volume', 'average_co2', 'batch_number'];
        const dateFields = ['timestamp', 'mfg_date'];
        const categoricalFields = ['location', 'patient_id', 'chip_id'];

        xAxis.innerHTML = '';
        yAxis.innerHTML = '';
        aggregation.innerHTML = '<option value="none">None</option>';

        numericFields.forEach(field => {
            xAxis.add(new Option(field, field));
            yAxis.add(new Option(field, field));
        });

        dateFields.forEach(field => {
            xAxis.add(new Option(field, field));
        });

        categoricalFields.forEach(field => {
            xAxis.add(new Option(field, field));
            aggregation.add(new Option(field, field));
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
            createD3BoxPlot(processedData, xAxis, yAxis, chartContainer);
        } else {
            createChartJsChart(chartType, processedData, xAxis, yAxis, chartContainer);
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
                processedData.labels.push(formatFieldValue(sample[xField], xField));
                processedData.data.push(parseFloat(sample[yField]) || 0);
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

    function formatFieldValue(value, field) {
        if (field === 'timestamp' || field === 'mfg_date') {
            return new Date(value).toLocaleDateString();
        }
        return value;
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