import { plannerData } from './state.js';
import { saveData } from './persistence.js';
import { getWeekNumber, getISOWeekYear } from './utils.js';
import { months } from './config.js';

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

let viewMonth = new Date().getMonth();
let viewYear  = new Date().getFullYear();

export function initFramtid() {
    viewMonth = new Date().getMonth();
    viewYear  = new Date().getFullYear();
}

export function changeFramtidMonth(delta) {
    viewMonth += delta;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    if (viewMonth < 0)  { viewMonth = 11; viewYear--; }
    renderFramtid();
}

// Returns an array of 7-day arrays (Mon–Sun) covering the full month.
function buildCalendarWeeks(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
    const cursor   = new Date(year, month, 1 - startDow);
    const weeks    = [];
    while (cursor <= lastDay) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            week.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }
        weeks.push(week);
    }
    return weeks;
}

function getWeekKey(date) {
    return `${getISOWeekYear(date)}-W${getWeekNumber(date)}`;
}

function ensureDayData(weekKey) {
    if (!plannerData[weekKey]) {
        plannerData[weekKey] = { lessons: [[], [], [], [], []], dayNotes: ['', '', '', '', '', '', ''], dayEvents: ['', '', '', '', '', '', ''] };
    }
    if (!plannerData[weekKey].dayNotes)  plannerData[weekKey].dayNotes  = ['', '', '', '', '', '', ''];
    if (!plannerData[weekKey].dayEvents) plannerData[weekKey].dayEvents = ['', '', '', '', '', '', ''];
}

function saveNote(weekKey, dayIdx, value) {
    ensureDayData(weekKey);
    plannerData[weekKey].dayNotes[dayIdx] = value;
    saveData();
}

function saveEvent(weekKey, dayIdx, value) {
    ensureDayData(weekKey);
    plannerData[weekKey].dayEvents[dayIdx] = value;
    saveData();
}

export function renderFramtid() {
    const container = document.getElementById('view-framtid');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();

    // ── Header ──────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'framtid-header';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'framtid-nav-btn';
    prevBtn.innerHTML = '&#8249;';
    prevBtn.setAttribute('aria-label', 'Föregående månad');
    prevBtn.addEventListener('click', () => changeFramtidMonth(-1));

    const title = document.createElement('h2');
    title.className = 'framtid-month-title serif-title';
    title.textContent = `${months[viewMonth].toUpperCase()} ${viewYear}`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'framtid-nav-btn';
    nextBtn.innerHTML = '&#8250;';
    nextBtn.setAttribute('aria-label', 'Nästa månad');
    nextBtn.addEventListener('click', () => changeFramtidMonth(1));

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);
    container.appendChild(header);

    // ── Grid ────────────────────────────────────────────────────────────────
    const grid = document.createElement('div');
    grid.className = 'framtid-grid';

    // Column header row
    const weekColHeader = document.createElement('div');
    weekColHeader.className = 'framtid-col-header';
    grid.appendChild(weekColHeader);

    DAY_LABELS.forEach(label => {
        const th = document.createElement('div');
        th.className = 'framtid-col-header';
        th.textContent = label;
        grid.appendChild(th);
    });

    // Week rows
    buildCalendarWeeks(viewYear, viewMonth).forEach(weekDays => {
        const weekDate = weekDays[0]; // Monday of this week
        const weekNum  = getWeekNumber(weekDate);
        const weekYear = getISOWeekYear(weekDate);
        const weekKey  = `${weekYear}-W${weekNum}`;

        // Week number button
        const weekBtn = document.createElement('button');
        weekBtn.className = 'framtid-week-btn';
        weekBtn.textContent = `v. ${weekNum}`;
        weekBtn.title = `Gå till vecka ${weekNum}`;
        weekBtn.addEventListener('click', () => window.changeWeekTo(weekNum, weekYear));
        grid.appendChild(weekBtn);

        // Day cells (Mon=0 … Sun=6)
        weekDays.forEach((date, dayIdx) => {
            const inMonth = date.getMonth() === viewMonth && date.getFullYear() === viewYear;
            const isToday = date.toDateString() === today.toDateString();

            const cell = document.createElement('div');
            cell.className = [
                'framtid-day-cell',
                !inMonth       ? 'framtid-other-month' : '',
                isToday        ? 'framtid-today'       : '',
                dayIdx > 4     ? 'framtid-weekend'     : '',
            ].filter(Boolean).join(' ');

            // Date number
            const dateEl = document.createElement('div');
            dateEl.className = 'framtid-date-num';
            dateEl.textContent = date.getDate();
            cell.appendChild(dateEl);

            // Single note area — transparent until focused or has content
            const noteEl = document.createElement('textarea');
            noteEl.className = 'framtid-note-area custom-scrollbar';
            noteEl.value = plannerData[weekKey]?.dayNotes?.[dayIdx] ?? '';
            noteEl.addEventListener('input', e => saveNote(weekKey, dayIdx, e.target.value));
            cell.appendChild(noteEl);

            // Clicking anywhere in the cell focuses the textarea
            cell.addEventListener('click', (e) => {
                if (e.target !== noteEl) noteEl.focus();
            });

            grid.appendChild(cell);
        });
    });

    container.appendChild(grid);
}
