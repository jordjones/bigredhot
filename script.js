// Generate star display from data-rating attributes
document.querySelectorAll('.stars').forEach(el => {
    const rating = parseFloat(el.dataset.rating);
    const fullStars = Math.floor(rating);
    const fraction = rating - fullStars;
    const hasHalf = fraction >= 0.25 && fraction < 0.75;
    const roundedFull = fraction >= 0.75 ? fullStars + 1 : fullStars;
    const emptyStars = 5 - roundedFull - (hasHalf ? 1 : 0);

    let html = '\u2605'.repeat(roundedFull);
    if (hasHalf) html += '<span class="star-half">\u2605</span>';
    html += '\u2606'.repeat(emptyStars);
    el.innerHTML = html;
});

// Search functionality
const searchInput = document.getElementById('searchInput');
const table = document.getElementById('restaurantTable');
const tbody = table.querySelector('tbody');

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

            // Handle numeric sorting for ratings
            if (sortKey === 'rating') {
                aValue = parseFloat(aValue.match(/[\d.]+$/)[0]);
                bValue = parseFloat(bValue.match(/[\d.]+$/)[0]);
            }

            // Handle salsa heat level sorting
            if (sortKey === 'salsa') {
                const heatOrder = { 'Mild': 1, 'Medium': 2, 'Hot': 3, 'Extra Hot': 4 };
                aValue = heatOrder[aValue] || 0;
                bValue = heatOrder[bValue] || 0;
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Clear and re-append sorted rows
        rows.forEach(row => tbody.appendChild(row));

        // Update sort icons
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

// Row click animation
tbody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', function() {
        this.style.transform = 'scale(1.01)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
    });
});

console.log('BigRedHot - Restaurant Ratings Loaded');
