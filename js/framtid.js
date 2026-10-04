import { plannerData } from './state.js';
import { saveData } from './persistence.js';
import { getWeekNumber, getISOWeekYear } from './utils.js';
import { months } from './config.js';

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

let viewMonth = new Date().getMonth();
let viewYear  = new Date().getFullYear();

// ── Swedish public holidays ──────────────────────────────────────────────────

function easterSunday(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day   = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
}

function shiftDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

function firstSaturdayFrom(year, month, minDay) {
    const d = new Date(year, month, minDay);
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
    return d;
}

function dKey(d) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

const holidayCache = new Map();

function sweHolidays(year) {
    if (holidayCache.has(year)) return holidayCache.get(year);
    const map = new Map();
    const add = (d, name) => map.set(dKey(d), name);
    const easter = easterSunday(year);

    add(new Date(year, 0,  1),  'Nyårsdagen');
    add(new Date(year, 0,  6),  'Trettondedag jul');
    add(shiftDays(easter, -2),  'Långfredagen');
    add(shiftDays(easter, -1),  'Påskafton');
    add(easter,                  'Påskdagen');
    add(shiftDays(easter,  1),  'Annandag påsk');
    add(new Date(year, 4,  1),  'Första maj');
    add(shiftDays(easter, 39),  'Kristi himmelsfärdsdag');
    add(shiftDays(easter, 49),  'Pingstdagen');
    add(new Date(year, 5,  6),  'Nationaldagen');

    const midsommar = firstSaturdayFrom(year, 5, 20);
    add(shiftDays(midsommar, -1), 'Midsommarafton');
    add(midsommar,                 'Midsommardagen');

    const allaHelgon = firstSaturdayFrom(year, 9, 31);
    add(shiftDays(allaHelgon, -1), 'Allhelgonaafton');
    add(allaHelgon,                 'Alla helgons dag');

    add(new Date(year, 11, 24), 'Julafton');
    add(new Date(year, 11, 25), 'Juldagen');
    add(new Date(year, 11, 26), 'Annandag jul');
    add(new Date(year, 11, 31), 'Nyårsafton');

    holidayCache.set(year, map);
    return map;
}

// ── Calendar helpers ─────────────────────────────────────────────────────────

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

function buildCalendarWeeks(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7;
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

// ── Render ───────────────────────────────────────────────────────────────────

export function renderFramtid() {
    const container = document.getElementById('view-framtid');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();

    // Header
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

    // Grid
    const grid = document.createElement('div');
    grid.className = 'framtid-grid';

    const weekColHeader = document.createElement('div');
    weekColHeader.className = 'framtid-col-header';
    grid.appendChild(weekColHeader);
    DAY_LABELS.forEach(label => {
        const th = document.createElement('div');
        th.className = 'framtid-col-header';
        th.textContent = label;
        grid.appendChild(th);
    });

    buildCalendarWeeks(viewYear, viewMonth).forEach(weekDays => {
        const weekDate = weekDays[0];
        const weekNum  = getWeekNumber(weekDate);
        const weekYear = getISOWeekYear(weekDate);
        const weekKey  = `${weekYear}-W${weekNum}`;

        const weekBtn = document.createElement('button');
        weekBtn.className = 'framtid-week-btn';
        weekBtn.textContent = `v. ${weekNum}`;
        weekBtn.title = `Gå till vecka ${weekNum}`;
        weekBtn.addEventListener('click', () => window.changeWeekTo(weekNum, weekYear));
        grid.appendChild(weekBtn);

        weekDays.forEach((date, dayIdx) => {
            const inMonth = date.getMonth() === viewMonth && date.getFullYear() === viewYear;
            const isToday = date.toDateString() === today.toDateString();
            const holiday = sweHolidays(date.getFullYear()).get(dKey(date));

            const cell = document.createElement('div');
            cell.className = [
                'framtid-day-cell',
                !inMonth   ? 'framtid-other-month' : '',
                isToday    ? 'framtid-today'        : '',
                dayIdx > 4 ? 'framtid-weekend'      : '',
                holiday    ? 'framtid-holiday-cell' : '',
            ].filter(Boolean).join(' ');

            const dateEl = document.createElement('div');
            dateEl.className = 'framtid-date-num';
            dateEl.textContent = date.getDate();
            cell.appendChild(dateEl);

            if (holiday) {
                const holEl = document.createElement('div');
                holEl.className = 'framtid-holiday';
                holEl.textContent = holiday;
                cell.appendChild(holEl);
            }

            const noteEl = document.createElement('textarea');
            noteEl.className = 'framtid-note-area custom-scrollbar';
            noteEl.value = plannerData[weekKey]?.dayNotes?.[dayIdx] ?? '';
            noteEl.addEventListener('input', e => saveNote(weekKey, dayIdx, e.target.value));
            cell.appendChild(noteEl);

            cell.addEventListener('click', (e) => {
                if (e.target !== noteEl) noteEl.focus();
            });

            grid.appendChild(cell);
        });
    });

    container.appendChild(grid);
}
