const stops = [
    { name: "Castletownbere", km: 0, type: "start", clock: "12:00 Fri", elapsed: "0h", food: "Start Line", db: null },
    { name: "Ballard/Tooreenbeg", km: 10, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Adrigole (Hungry Hill)", km: 22, type: "water", clock: null, elapsed: null, food: "Marshal, Water, Snacks / Shop", db: null },
    { name: "Glenlough Path", km: 30, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Glengarriff Village", km: 39.5, type: "main", clock: null, elapsed: null, food: "T/C, W, Snacks, Coke, Sweets / Shops, Pubs, Chipper", db: "DB 1" },
    { name: "Bonane cross roads", km: 50, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Dromoghty", km: 55, type: "water", clock: null, elapsed: null, food: "Marshal, Water, Snacks", db: null },
    { name: "Gleninchaquin", km: 65, type: "water", clock: null, elapsed: null, food: "Marshal, Water, Snacks", db: null },
    { name: "Lauragh Church", km: 73.8, type: "main", clock: "04:00 Sat", elapsed: "16h", food: "T/C, W, Snacks, Coke, Sweets / Fancy Restaurant", db: "DB 2" },
    { name: "Coolownig County Bounds", km: 81.5, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Ardgroom Village", km: 88, type: "water", clock: null, elapsed: null, food: "Marshal, Water, Snacks / Shops, Pubs", db: null },
    { name: "Faunkill road junction", km: 92, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Eyeries Village", km: 101.4, type: "main", clock: "11:00 Sat", elapsed: "23h", food: "T/C, W, Snacks, Coke, Sweets / Shops, Pubs", db: "DB 3" },
    { name: "Urhin Bridal Path", km: 108, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Allihies Village (1)", km: 115.8, type: "main", clock: "15:00 Sat", elapsed: "27h", food: "T/C, W, Snacks, Coke, Sweets / Shops, Pubs", db: "DB 4" },
    { name: "Firkeel Gap crossroads", km: 122, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Dursey Cable Car", km: 128.2, type: "water", clock: null, elapsed: null, food: "Marshal, Water, Snacks", db: null },
    { name: "Allihies Village (2)", km: 146.2, type: "main", clock: "21:00 Sat", elapsed: "33h", food: "T/C, W, Snacks, Coke, Sweets / Shops, Pubs", db: "DB 4" },
    { name: "Miskish Style", km: 156, type: "water", clock: null, elapsed: null, food: "Water", db: null },
    { name: "Castletownbere", km: 161, type: "finish", clock: "01:00 Sun", elapsed: "37h", food: "Sambos, Tea/Coffee", db: null }
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

    // Add Current Location Button
    const LocationControl = L.Control.extend({
        options: {
            position: 'topleft'
        },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.style.backgroundColor = 'white';
            container.style.width = '30px';
            container.style.height = '30px';
            container.style.cursor = 'pointer';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.title = 'Go to Current Location';

            // Add a simple SVG crosshair icon
            container.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>';

            container.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                map.locate({setView: true, maxZoom: 15});
            }

            return container;
        }
    });

    map.addControl(new LocationControl());

    let locationMarker;
    let locationCircle;

    map.on('locationfound', function(e) {
        const radius = e.accuracy / 2;

        if (locationMarker) {
            map.removeLayer(locationMarker);
            map.removeLayer(locationCircle);
        }

        locationMarker = L.marker(e.latlng).addTo(map)
            .bindPopup("You are within " + radius + " meters from this point").openPopup();

        locationCircle = L.circle(e.latlng, radius).addTo(map);
    });

    map.on('locationerror', function(e) {
        alert("Location access denied or unavailable: " + e.message);
    });

    addAidStationMarkers();
    renderElevationChart();
}

function renderElevationChart() {
    const sampledData = routeData.filter((_, index) => index % 10 === 0);

    const distances = sampledData.map(d => d.dist.toFixed(1));
    const elevations = sampledData.map(d => d.ele);

    // Plugin to draw vertical lines at section boundaries
    const verticalLinePlugin = {
        id: 'verticalLines',
        afterDraw: (chart) => {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;

            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);

            stops.forEach(stop => {
                if (stop.km > 0 && stop.km < 161) {
                    // Find closest label index to this distance
                    let closestIndex = 0;
                    let minDiff = Math.abs(parseFloat(chart.data.labels[0]) - stop.km);

                    for (let i = 1; i < chart.data.labels.length; i++) {
                        let diff = Math.abs(parseFloat(chart.data.labels[i]) - stop.km);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closestIndex = i;
                        }
                    }

                    const x = chart.getDatasetMeta(0).data[closestIndex].x;
                    ctx.moveTo(x, yAxis.top);
                    ctx.lineTo(x, yAxis.bottom);
                }
            });

            ctx.stroke();
            ctx.restore();
        }
    };

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
        },
        plugins: [verticalLinePlugin]
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

let cachedSections = [];

function getSectionsData() {
    if (cachedSections.length > 0) return cachedSections;

    let currentRoutePointIndex = 0;
    const sections = [];

    let cumulativeDistance = 0;
    let cumulativeGain = 0;
    let cumulativeLoss = 0;

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

        let sectionDistance = endStop.km - startStop.km;
        cumulativeDistance += sectionDistance;
        cumulativeGain += Math.round(eleGain);
        cumulativeLoss += Math.round(eleLoss);

        sections.push({
            section: i + 1,
            startEnd: startStop.name + ' - ' + endStop.name,
            distance: sectionDistance,
            cumDistance: cumulativeDistance,
            elevationGain: Math.round(eleGain),
            cumGain: cumulativeGain,
            elevationLoss: Math.round(eleLoss),
            cumLoss: cumulativeLoss,
            cutoff: endStop.clock || '-',
            aidStations: endStop.food,
            db: endStop.db || '-'
        });
    }
    cachedSections = sections;
    return cachedSections;
}

function formatTimeOfDay(hours) {
    const raceStartHour = 12; // Race starts at 12:00 Fri
    const totalHours = raceStartHour + hours;

    const days = ["Fri", "Sat", "Sun", "Mon"];
    let dayIndex = Math.floor(totalHours / 24);

    let h = Math.floor(totalHours % 24);
    let m = Math.round((totalHours - Math.floor(totalHours)) * 60);

    if (m === 60) {
        m = 0;
        h += 1;
        if (h === 24) {
            h = 0;
            dayIndex += 1;
        }
    }

    const dayStr = days[Math.min(dayIndex, days.length - 1)];

    const padH = h.toString().padStart(2, '0');
    const padM = m.toString().padStart(2, '0');

    return `${dayStr} ${padH}:${padM}`;
}

function formatElapsed(hours) {
    let h = Math.floor(hours);
    let m = Math.round((hours - h) * 60);
    if (m === 60) {
        m = 0;
        h += 1;
    }
    return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function populateTable(t2 = null) {
    const sections = getSectionsData();
    const tableBody = document.querySelector("#summaryTable tbody");
    tableBody.innerHTML = '';

    let D = 0;
    if (sections.length > 0) {
        const lastSec = sections[sections.length - 1];
        D = lastSec.cumDistance + (lastSec.cumGain / 100);
    }

    sections.forEach(section => {
        let estElapsedStr = "-";
        let estArrivalStr = "-";

        if (t2 !== null && D > 0) {
            let d = section.cumDistance + (section.cumGain / 100);
            let t = t2 * Math.pow((d / D), 1.07);
            estElapsedStr = formatElapsed(t);
            estArrivalStr = formatTimeOfDay(t);
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${section.section}</td>
            <td>${section.startEnd}</td>
            <td>${section.distance.toFixed(1)}</td>
            <td>${section.cumDistance.toFixed(1)}</td>
            <td>${section.elevationGain}</td>
            <td>${section.cumGain}</td>
            <td>${section.elevationLoss}</td>
            <td>${section.cumLoss}</td>
            <td>${estElapsedStr}</td>
            <td>${estArrivalStr}</td>
            <td>${section.cutoff}</td>
            <td>${section.db}</td>
            <td>${section.aidStations}</td>
        `;
        tableBody.appendChild(row);
    });
}

function initCalculator() {
    const calcBtn = document.getElementById('calc-btn');
    calcBtn.addEventListener('click', () => {
        const goalTime = parseFloat(document.getElementById('goalTime').value);

        if (isNaN(goalTime) || goalTime <= 0) {
            alert("Please enter a valid positive number for your goal finish time.");
            return;
        }

        populateTable(goalTime);
    });
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    populateTable();
    initCalculator();
});
