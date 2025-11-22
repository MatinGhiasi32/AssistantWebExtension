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

function updateNotesDirection(input) {
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


// --- Notes feature ---
function addNote() {
    const textArea = document.getElementById('notes-area');
    const text = textArea.value.trim();
    if (!text) return;

    const li = document.createElement('li');
    li.className = 'note-item';

    // text container
    const textDiv = document.createElement('div');
    textDiv.className = 'note-text';
    textDiv.textContent = text;

    // buttons container (separate area)
    const buttons = document.createElement('div');
    buttons.className = 'note-buttons';
    
    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.title = 'Edit note';
    editBtn.addEventListener('click', () => {
        const newText = prompt('Edit note:', textDiv.textContent);
        if (newText !== null) textDiv.textContent = newText.trim();
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.title = 'Delete note';
    delBtn.addEventListener('click', () => li.remove());

    buttons.appendChild(editBtn);
    buttons.appendChild(delBtn);

    // assemble note item
    li.appendChild(textDiv);
    li.appendChild(buttons);

    document.getElementById('notes-list').appendChild(li);
    textArea.value = '';
    updateNotesDirection(textArea);
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
    const notesArea = document.getElementById('notes-area');
    if (notesArea) {
        // set initial direction based on placeholder or existing value
        updateNotesDirection(notesArea);
        // update as the user types / pastes
        notesArea.addEventListener('input', () => updateNotesDirection(notesArea));
        // also update on focus in case user relies on placeholder
        notesArea.addEventListener('focus', () => updateNotesDirection(notesArea));
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

    // Add notes functionality
    const addNoteBtn = document.getElementById('add-note');
    if (addNoteBtn) addNoteBtn.addEventListener('click', addNote);

    /* ------------------ Calendar init ------------------ */
    (function initCalendar() {
        // DOM refs
        const monthYearLabel = document.getElementById('month-year');
        const daysContainer = document.getElementById('calendar-days');
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');
        const prevYearBtn = document.getElementById('prev-year');
        const nextYearBtn = document.getElementById('next-year');

        // Start with today's date
        const today = new Date();
        let viewYear = today.getFullYear();
        let viewMonth = today.getMonth(); // 0-11
        let selectedDate = null;

        const monthNames = [
            'January','February','March','April','May','June',
            'July','August','September','October','November','December'
        ];

        function clearDays() {
            daysContainer.innerHTML = '';
        }

        function renderMonth(year, month) {
            clearDays();

            // Update label
            monthYearLabel.textContent = `${monthNames[month]} ${year}`;

            // First day of month (0=Sun..6=Sat)
            const first = new Date(year, month, 1).getDay();
            // Number of days in month
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Add placeholders for days before first
            for (let i = 0; i < first; i++) {
                const empty = document.createElement('div');
                empty.className = 'day day-empty';
                daysContainer.appendChild(empty);
            }

            // Add day cells
            for (let d = 1; d <= daysInMonth; d++) {
                const cell = document.createElement('div');
                cell.className = 'day';
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('tabindex', '0');
                cell.dataset.day = d;
                cell.dataset.month = month;
                cell.dataset.year = year;
                cell.textContent = d;

                // mark today
                if (year === today.getFullYear() && month === today.getMonth() && d === today.getDate()) {
                    cell.classList.add('day-today');
                    cell.setAttribute('aria-current', 'date');
                }

                // mark selected
                if (selectedDate &&
                    selectedDate.getFullYear() === year &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getDate() === d) {
                    cell.classList.add('day-selected');
                }

                // click/select behavior
                cell.addEventListener('click', () => {
                    // unselect previous
                    const prev = daysContainer.querySelector('.day-selected');
                    if (prev) prev.classList.remove('day-selected');

                    // select this
                    cell.classList.add('day-selected');
                    selectedDate = new Date(year, month, d);

                    // You can hook other behavior here (e.g., show events)
                    // console.log('Selected', selectedDate.toISOString());
                });

                // keyboard accessibility (Enter / Space)
                cell.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        cell.click();
                    }
                });

                daysContainer.appendChild(cell);
            }
        }

        // Navigation handlers
        function prevMonth() {
            viewMonth--;
            if (viewMonth < 0) {
                viewMonth = 11;
                viewYear--;
            }
            renderMonth(viewYear, viewMonth);
        }
        function nextMonth() {
            viewMonth++;
            if (viewMonth > 11) {
                viewMonth = 0;
                viewYear++;
            }
            renderMonth(viewYear, viewMonth);
        }
        function prevYear() {
            viewYear--;
            renderMonth(viewYear, viewMonth);
        }
        function nextYear() {
            viewYear++;
            renderMonth(viewYear, viewMonth);
        }

        // Hook buttons
        prevMonthBtn.addEventListener('click', prevMonth);
        nextMonthBtn.addEventListener('click', nextMonth);
        prevYearBtn.addEventListener('click', prevYear);
        nextYearBtn.addEventListener('click', nextYear);

        // Initial render
        renderMonth(viewYear, viewMonth);
    })();
    /* ---------------- end Calendar init --------------- */
});
