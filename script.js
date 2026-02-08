// Google Sheet published CSV URL
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

const table = document.getElementById('restaurantTable');
const tbody = table.querySelector('tbody');
const searchInput = document.getElementById('searchInput');

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

// Get salsa CSS class from salsa text
function salsaClass(salsa) {
    const lower = salsa.toLowerCase().trim();
    if (lower === 'extra hot') return 'extra-hot';
    if (lower === 'hot') return 'hot';
    if (lower === 'medium') return 'medium';
    if (lower === 'mild') return 'mild';
    return 'medium';
}

// Generate star HTML from a numeric rating
function starsHTML(rating) {
    const num = parseFloat(rating) || 0;
    const fullStars = Math.floor(num);
    const fraction = num - fullStars;
    const hasHalf = fraction >= 0.25 && fraction < 0.75;
    const roundedFull = fraction >= 0.75 ? fullStars + 1 : fullStars;
    const emptyStars = 5 - roundedFull - (hasHalf ? 1 : 0);

    let html = '\u2605'.repeat(roundedFull);
    if (hasHalf) html += '<span class="star-half">\u2605</span>';
    html += '\u2606'.repeat(emptyStars);
    return html;
}

// Render rows into the table body
function renderTable(data) {
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        const restaurant = row.restaurant || '';
        const location = row.location || '';
        const salsa = row.salsa || row.heat || '';
        const rating = parseFloat(row.rating) || 0;
        const color = row.color || '';
        const description = row.description || '';

        // Restaurant name cell (with tooltip from description)
        const tdName = document.createElement('td');
        tdName.className = 'restaurant-name';
        tdName.textContent = restaurant;
        if (description) tdName.title = description;

        // Location cell
        const tdLoc = document.createElement('td');
        tdLoc.textContent = location;

        // Salsa badge cell
        const tdSalsa = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'salsa-rating ' + salsaClass(salsa);
        badge.textContent = salsa;
        if (color) badge.style.backgroundColor = color;
        tdSalsa.appendChild(badge);

        // Rating cell
        const tdRating = document.createElement('td');
        const stars = document.createElement('span');
        stars.className = 'stars';
        stars.dataset.rating = rating;
        stars.innerHTML = starsHTML(rating);
        tdRating.appendChild(stars);
        tdRating.appendChild(document.createTextNode(' ' + rating.toFixed(1)));

        tr.appendChild(tdName);
        tr.appendChild(tdLoc);
        tr.appendChild(tdSalsa);
        tr.appendChild(tdRating);
        tbody.appendChild(tr);
    });

    // Re-attach row click animation
    tbody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', function() {
            this.style.transform = 'scale(1.01)';
            setTimeout(() => { this.style.transform = ''; }, 150);
        });
    });
}

// Sort data by rating, highest first
function sortByRating(data) {
    return data.slice().sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
}

// Fetch CSV from Google Sheets, fall back to hardcoded data
async function loadData() {
    try {
        const resp = await fetch(SHEET_CSV_URL + '&_t=' + Date.now());
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const text = await resp.text();
        const rows = parseCSV(text);
        if (rows.length === 0) throw new Error('Empty sheet');
        renderTable(sortByRating(rows));
    } catch (err) {
        console.warn('Failed to load Google Sheet, using fallback data:', err);
        renderTable(sortByRating(FALLBACK_DATA));
    }
}

loadData();

// Search functionality
searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Table sorting functionality
const headers = table.querySelectorAll('th');
let sortDirection = {};

headers.forEach((header, index) => {
    header.addEventListener('click', () => {
        const sortKey = header.dataset.sort;
        const direction = sortDirection[sortKey] === 'asc' ? 'desc' : 'asc';
        sortDirection[sortKey] = direction;

        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((a, b) => {
            let aValue = a.cells[index].textContent.trim();
            let bValue = b.cells[index].textContent.trim();

            if (sortKey === 'rating') {
                aValue = parseFloat(aValue.match(/[\d.]+$/)[0]);
                bValue = parseFloat(bValue.match(/[\d.]+$/)[0]);
            }

            if (sortKey === 'salsa') {
                const heatOrder = { 'Mild': 1, 'Medium': 2, 'Hot': 3, 'Extra Hot': 4 };
                aValue = heatOrder[aValue] || 0;
                bValue = heatOrder[bValue] || 0;
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        rows.forEach(row => tbody.appendChild(row));

        headers.forEach(h => {
            const icon = h.querySelector('.sort-icon');
            if (icon) icon.innerHTML = '&#8597;';
        });
        const currentIcon = header.querySelector('.sort-icon');
        if (currentIcon) {
            currentIcon.innerHTML = direction === 'asc' ? '&#8593;' : '&#8595;';
        }
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.background = '#ffffff';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});

console.log('BigRedHot - Restaurant Ratings Loaded');
