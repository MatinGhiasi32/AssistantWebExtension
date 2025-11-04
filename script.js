const MAX_LINKS = 4;


function isRtlChar(ch) {
    if (!ch) return false;
    const code = ch.codePointAt(0);
    return (
        (code >= 0x0590 && code <= 0x08FF) ||  // Hebrew, Arabic and related blocks
        (code >= 0xFB1D && code <= 0xFEFC)     // Presentation forms
    );
}

/* set input direction based on first strong character of value or placeholder */
function updateSearchDirection(input) {
    const src = (input.value && input.value.trim()) ? input.value.trim() : (input.getAttribute('placeholder') || '');
    const first = src.trim().charAt(0);
    if (!first) {
        // default to RTL for placeholder in Farsi; keep placeholder styling as fallback too
        input.dir = 'rtl';
        input.style.textAlign = 'right';
        return;
    }
    if (isRtlChar(first)) {
        input.dir = 'rtl';
        input.style.textAlign = 'right';
    } else {
        input.dir = 'ltr';
        input.style.textAlign = 'left';
    }
}

// Extract domain name from a given URL
function domainFromUrl(input) {
    try {
        const url = new URL(input.includes('://') ? input : 'https://' + input);
        return url.hostname;
    } catch {
        return null;
    }
}

function faviconForDomain(domain) {
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}

// Create a Quick Access box
function makeQuickLink(url, title) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    const domain = domainFromUrl(url);
    const img = document.createElement('img');
    if (domain) img.src = faviconForDomain(domain);
    img.onerror = () => (img.style.display = 'none');

    const span = document.createElement('span');
    span.className = 'link-label';
    span.textContent = title || domain || url;

    const trash = document.createElement('button');
    trash.textContent = '🗑️';
    trash.className = 'delete-btn';
    trash.title = 'Remove link';
    trash.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        li.remove();
        updateAddBox();
    });

    a.appendChild(img);
    a.appendChild(span);
    li.appendChild(a);
    li.appendChild(trash);
    return li;
}

// Handle adding a new link
function addLink() {
    const url = prompt('Enter the URL (e.g. github.com or https://github.com):');
    if (!url) return;
    const name = prompt('Optional: name to display (leave blank to use domain):');

    const ul = document.getElementById('quick-links');
    const newLi = makeQuickLink(url, name);
    const addBox = document.getElementById('add-box');

    // Because of row-reverse, insert after addBox to appear on LEFT side visually
    ul.insertBefore(newLi, addBox.nextSibling);

    updateAddBox();
}

// Update the visibility of the Add box
function updateAddBox() {
    const ul = document.getElementById('quick-links');
    const addBox = document.getElementById('add-box');
    const linkCount = ul.querySelectorAll('li:not(#add-box)').length;

    addBox.style.display = linkCount >= MAX_LINKS ? 'none' : 'flex';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('search-bar');
    if (search) {
        // set initial direction based on placeholder or existing value
        updateSearchDirection(search);
        // update as the user types / pastes
        search.addEventListener('input', () => updateSearchDirection(search));
        // also update on focus in case user relies on placeholder
        search.addEventListener('focus', () => updateSearchDirection(search));
    }
    const addBtn = document.getElementById('add-link');
    addBtn.addEventListener('click', addLink);
    updateAddBox();

    // Simple search functionality
    document.getElementById('search-button').addEventListener('click', () => {
        const query = document.getElementById('search-bar').value.trim();
        if (query) {
            const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.open(url, '_blank');
        }
    });
});
