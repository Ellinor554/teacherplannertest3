import { getSubjectColorForName } from './subjects.js';

export function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Returns the ISO week-year, which can differ from the calendar year on
// 29–31 Dec (already week 1 of next year) or 1–3 Jan (still week 52/53 of last year).
export function getISOWeekYear(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    return d.getUTCFullYear();
}

export function getSubjectColor(subject) {
    return getSubjectColorForName(subject);
}

export function getMonday(y, w) {
    const d = new Date(y, 0, 1 + (w - 1) * 7);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

export function isoWeeksInYear(year) {
    const jan1 = new Date(year, 0, 1).getDay();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return (jan1 === 4 || (isLeap && jan1 === 3)) ? 53 : 52;
}

export function getSortableTime(timeStr) {
    if (!timeStr) return '00:00';
    const match = timeStr.match(/\d{1,2}:\d{2}/);
    if (!match) return '00:00';
    const [hours, minutes] = match[0].split(':');
    return hours.padStart(2, '0') + ':' + minutes.padStart(2, '0');
}

export function checkIsPlanned(planText) {
    if (!planText) return false;
    if (planText.includes('<img')) return true;
    // Use the DOM to extract plain text so we don't need regex-based tag stripping
    const tmp = document.createElement('div');
    tmp.innerHTML = planText;
    return tmp.textContent.trim().length > 0;
}
