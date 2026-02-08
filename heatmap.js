// Google Sheet published CSV URL (same as script.js)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS_tew-CY6ctXwsBS6XRxsjZl3z0GVf9JC1rMKA3oMFFp98O3O4na234teft8kNX0OQnOTpmDPA7Snr/pub?output=csv';

// Fallback data if CSV fetch fails
const FALLBACK_DATA = [
    { restaurant: 'Jalapeno Tree', location: 'Mount Pleasant, TX', salsa: '', rating: 4.5 },
    { restaurant: 'Restaurante Mexico', location: 'Mount Pleasant, TX', salsa: '', rating: 4.7 },
    { restaurant: 'Tierra Y Mar Grill', location: 'Mount Pleasant, TX', salsa: '', rating: 4.6 },
    { restaurant: "Jorge's Mexican Restaurant", location: 'Mount Pleasant, TX', salsa: '', rating: 4.3 },
    { restaurant: "Gabby's Tacos", location: 'Mount Pleasant, TX', salsa: '', rating: 4.4 },
    { restaurant: "Lala's Mexican Food", location: 'Mount Pleasant, TX', salsa: '', rating: 4.8 },
    { restaurant: 'Pupuseria El Tamarindo', location: 'Mount Pleasant, TX', salsa: '', rating: 4.2 },
    { restaurant: 'Pollo Bueno', location: 'Mount Pleasant, TX', salsa: '', rating: 4.0 },
    { restaurant: 'Two Senoritas', location: 'Mount Pleasant, TX', salsa: '', rating: 4.1 },
    { restaurant: 'Taqueria Monterrey', location: 'Mount Pleasant, TX', salsa: '', rating: 4.3 },
    { restaurant: 'Don Juan (on the Square)', location: 'Tyler, TX', salsa: '', rating: 5.0, description: 'Best hot sauce in East Texas!' },
    { restaurant: 'Juan Pablos', location: 'Sulphur Springs, TX', salsa: '', rating: 4.0 },
];

// Real coordinates for known restaurants (geocoded from actual addresses)
const COORDINATES = {
    'Jalapeno Tree':              [33.1672, -94.9981],  // 2506 W Ferguson Rd
    'Restaurante Mexico':         [33.1541, -94.9740],  // 301 W Ferguson Rd
    'Tierra Y Mar Grill':         [33.1666, -94.9673],  // 305 E 12th St
    "Jorge's Mexican Restaurant": [33.1694, -94.9702],  // 1406 N Jefferson Ave
    "Gabby's Tacos":              [33.1600, -94.9684],  // 502 N Jefferson Ave
    "Lala's Mexican Food":        [33.2188, -94.8430],  // 1649 Farm Road 1001
    'Pupuseria El Tamarindo':     [33.1498, -94.9685],  // 811 S Jefferson Ave
    'Pollo Bueno':                [33.1541, -94.9741],  // 315 W Ferguson Rd
    'Two Senoritas':              [33.1713, -95.0015],  // 2601 W Ferguson Rd
    'Taqueria Monterrey':         [33.1664, -94.9742],  // 721 W 12th St
    'Don Juan (on the Square)':    [32.3511, -95.2850],  // 113 E Erwin St, Tyler
};

// Heat level → marker color
const HEAT_COLORS = {
    'mild':      '#4caf50',
    'medium':    '#ff9800',
    'hot':       '#f44336',
    'extra hot': '#9c27b0',
};

// Parse a CSV line handling quoted fields
function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                fields.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
    }
    fields.push(current.trim());
    return fields;
}

// Parse full CSV text into array of objects using header row
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
    });
}

// Get salsa CSS class
function salsaClass(salsa) {
    const lower = salsa.toLowerCase().trim();
    if (lower === 'extra hot') return 'extra-hot';
    if (lower === 'hot') return 'hot';
    if (lower === 'medium') return 'medium';
    if (lower === 'mild') return 'mild';
    return 'medium';
}

// Generate star string from a numeric rating
function starsText(rating) {
    const num = parseFloat(rating) || 0;
    const fullStars = Math.floor(num);
    const fraction = num - fullStars;
    const hasHalf = fraction >= 0.25 && fraction < 0.75;
    const roundedFull = fraction >= 0.75 ? fullStars + 1 : fullStars;
    const emptyStars = 5 - roundedFull - (hasHalf ? 1 : 0);
    return '\u2605'.repeat(roundedFull) + (hasHalf ? '\u00BD' : '') + '\u2606'.repeat(emptyStars);
}

// Look up coordinates for a restaurant name
function findCoords(name) {
    if (COORDINATES[name]) return COORDINATES[name];
    // Try partial match
    const lower = name.toLowerCase();
    for (const key of Object.keys(COORDINATES)) {
        if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
            return COORDINATES[key];
        }
    }
    return null;
}

// Initialize map
const map = L.map('map');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
}).addTo(map);

// Place markers on the map
function plotRestaurants(data) {
    const markers = [];

    data.forEach(row => {
        const name = row.restaurant || '';
        const location = row.location || '';
        const salsa = row.salsa || row.heat || '';
        const rating = parseFloat(row.rating) || 0;
        const description = row.description || '';
        const coords = findCoords(name);

        if (!coords) return;

        const color = HEAT_COLORS[salsa.toLowerCase().trim()] || '#ff9800';

        const marker = L.circleMarker(coords, {
            radius: 10,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85,
        }).addTo(map);

        const popupHTML = `
            <div class="map-popup">
                <strong class="map-popup-name">${name}</strong>
                <div class="map-popup-location">${location}</div>
                <div class="map-popup-heat">
                    <span class="salsa-rating ${salsaClass(salsa)}">${salsa}</span>
                </div>
                <div class="map-popup-rating">
                    <span class="stars">${starsText(rating)}</span> ${rating.toFixed(1)}
                </div>
                ${description ? `<div class="map-popup-desc">${description}</div>` : ''}
            </div>
        `;
        marker.bindPopup(popupHTML);
        markers.push(marker);
    });

    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.15));
    } else {
        // Default to Mount Pleasant area
        map.setView([33.157, -94.968], 14);
    }
}

// Fetch data and plot
async function loadData() {
    try {
        const resp = await fetch(SHEET_CSV_URL + '&_t=' + Date.now());
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const text = await resp.text();
        const rows = parseCSV(text);
        if (rows.length === 0) throw new Error('Empty sheet');
        plotRestaurants(rows);
    } catch (err) {
        console.warn('Failed to load Google Sheet, using fallback data:', err);
        plotRestaurants(FALLBACK_DATA);
    }
}

loadData();
