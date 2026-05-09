const stops = [
    { name: "Castletownbere", km: 0, type: "start", clock: "08:00 Fri", elapsed: "0h", food: "Start Line", db: null },
    { name: "Allihies Village (1)", km: 14.5, type: "main", clock: null, elapsed: null, food: "T/C, W, Snacks, Coke, Sweets", db: "DB 1" },
    { name: "Firkeel Gap (1)", km: 25.5, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Dursey Cable Car", km: 31, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Firkeel Gap (2)", km: 36.5, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Allihies Village (2)", km: 44.5, type: "main", clock: null, elapsed: null, food: "T/C, W, Snacks, Coke, Sweets", db: "DB 1" },
    { name: "Eyeries Village", km: 59.5, type: "main", clock: "19:00 Fri", elapsed: "11h", food: "T/C, W, Snacks, Coke, Sweets", db: "DB 2" },
    { name: "Ardgroom Village", km: 73, type: "water", clock: null, elapsed: null, food: "Water / Pubs", db: null },
    { name: "Lauragh Church", km: 87, type: "main", clock: "02:00 Sat", elapsed: "18h", food: "Hot Food, Snacks, Drinks", db: "DB 3" },
    { name: "Gleninchaquin", km: 96, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Dromoghty", km: 104, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Glengarriff Village", km: 121.5, type: "main", clock: "12:00 Sat", elapsed: "28h", food: "T/C, W, Snacks, Coke, Sweets", db: "DB 3" },
    { name: "Adrigole (Hungry Hill)", km: 139, type: "main", clock: "16:00 Sat", elapsed: "32h", food: "T/C, W, Snacks, Coke, Sweets", db: "DB 3" },
    { name: "Rossmackowen", km: 149.5, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Castletownbere", km: 161, type: "finish", clock: "21:00 Sat", elapsed: "37h", food: "Sambos, Tea/Coffee", db: null }
];

let map;

function initMap() {
    map = L.map('map').setView([51.65, -9.9], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let latlngs = [];
    routeData.forEach(p => {
        latlngs.push([p.lat, p.lon]);
    });

    const polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
    map.fitBounds(polyline.getBounds());

    addAidStationMarkers();
    renderElevationChart();
}

function renderElevationChart() {
    const sampledData = routeData.filter((_, index) => index % 10 === 0);

    const distances = sampledData.map(d => d.dist.toFixed(1));
    const elevations = sampledData.map(d => d.ele);

    const ctx = document.getElementById('elevationChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                label: 'Elevation (m)',
                data: elevations,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderWidth: 1,
                fill: true,
                pointRadius: 0,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Distance (km)'
                    },
                    ticks: {
                        maxTicksLimit: 20
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Elevation (m)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Elevation: ${context.parsed.y} m`;
                        }
                    }
                }
            }
        }
    });
}

function addAidStationMarkers() {
    stops.forEach(stop => {
        // Find closest point in GPX data by distance
        let closestPoint = routeData[0];
        let minDiff = Math.abs(routeData[0].dist - stop.km);

        for (let i = 1; i < routeData.length; i++) {
            let diff = Math.abs(routeData[i].dist - stop.km);
            if (diff < minDiff) {
                minDiff = diff;
                closestPoint = routeData[i];
            }
        }

        let markerColor = 'blue';
        if (stop.type === 'start' || stop.type === 'finish') {
            markerColor = 'green';
        } else if (stop.type === 'water') {
             markerColor = 'blue';
        } else {
             markerColor = 'red';
        }

        // Custom icon styling using SVG
        const svgIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${markerColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="background-color: white; border-radius: 50%; padding: 2px;"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3" fill="${markerColor}"></circle></svg>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });


        const marker = L.marker([closestPoint.lat, closestPoint.lon], {icon: svgIcon}).addTo(map);
        marker.bindPopup(`<b>${stop.name}</b><br>Distance: ${stop.km}km<br>Type: ${stop.type}<br>Amenities: ${stop.food}`);
    });
}

function populateTable() {
    let currentRoutePointIndex = 0;
    const sections = [];

    for (let i = 0; i < stops.length - 1; i++) {
        const startStop = stops[i];
        const endStop = stops[i+1];

        let eleGain = 0;
        let eleLoss = 0;

        let endIndex = currentRoutePointIndex;
        while (endIndex < routeData.length - 1 && routeData[endIndex].dist < endStop.km) {
            endIndex++;
            const diff = routeData[endIndex].ele - routeData[endIndex-1].ele;
            if (diff > 0) eleGain += diff;
            if (diff < 0) eleLoss += Math.abs(diff);
        }

        currentRoutePointIndex = endIndex;

        sections.push({
            section: i + 1,
            startEnd: startStop.name + ' - ' + endStop.name,
            distance: endStop.km - startStop.km,
            elevationGain: Math.round(eleGain),
            elevationLoss: Math.round(eleLoss),
            cutoff: endStop.clock || '-',
            aidStations: endStop.food
        });
    }

    const tableBody = document.querySelector("#summaryTable tbody");
    let cumulativeDistance = 0;
    let cumulativeGain = 0;
    let cumulativeLoss = 0;

    sections.forEach(section => {
        cumulativeDistance += section.distance;
        cumulativeGain += section.elevationGain;
        cumulativeLoss += section.elevationLoss;
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${section.section}</td>
            <td>${section.startEnd}</td>
            <td>${section.distance.toFixed(1)}</td>
            <td>${cumulativeDistance.toFixed(1)}</td>
            <td>${section.elevationGain}</td>
            <td>${cumulativeGain}</td>
            <td>${section.elevationLoss}</td>
            <td>${cumulativeLoss}</td>
            <td>${section.cutoff}</td>
            <td>${section.aidStations}</td>
        `;
        tableBody.appendChild(row);
    });
}

function initCalculator() {
    const calcBtn = document.getElementById('calc-btn');
    calcBtn.addEventListener('click', () => {
        const d1 = parseFloat(document.getElementById('d1').value);
        const t1 = parseFloat(document.getElementById('t1').value);
        const d2 = parseFloat(document.getElementById('d2').value);

        if (isNaN(d1) || isNaN(t1) || isNaN(d2) || d1 <= 0 || t1 <= 0) {
            alert("Please enter valid positive numbers for known distance and time.");
            return;
        }

        // Riegel's formula with fatigue factor of 1.07 (as per memory info)
        const c = 1.07;
        const t2 = t1 * Math.pow((d2 / d1), c);

        const hours = Math.floor(t2);
        const minutes = Math.round((t2 - hours) * 60);

        document.getElementById('projected-time').textContent = `${hours} hours and ${minutes} minutes`;
    });
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    populateTable();
    initCalculator();
});
