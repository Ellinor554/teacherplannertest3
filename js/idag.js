import { plannerData } from './state.js';
import { getWeekNumber, getISOWeekYear, getSubjectColor, checkIsPlanned } from './utils.js';
import { days, months } from './config.js';

const TODO_KEY      = 'teacherplanner_todos';
const IDAG_SEEN_KEY = 'teacherplanner_idag_seen';

function todayInfo() {
    const today    = new Date();
    const dow      = today.getDay(); // 0=Sun … 6=Sat
    const dayIndex = dow - 1;        // Mon=0 … Fri=4
    return { today, dow, dayIndex };
}

export function isWeekend() {
    const dow = new Date().getDay();
    return dow === 0 || dow === 6;
}

export function checkIdagAutoShow(changeView) {
    if (isWeekend()) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(IDAG_SEEN_KEY) !== todayStr) {
        localStorage.setItem(IDAG_SEEN_KEY, todayStr);
        changeView('idag');
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function renderIdag() {
    const { today, dayIndex } = todayInfo();

    const weekNum = getWeekNumber(today);
    const weekKey = `${getISOWeekYear(today)}-W${weekNum}`;

    // ── Header ──
    const hour = today.getHours();
    const greeting = hour >= 12 ? 'God eftermiddag!' : hour >= 10 ? 'God förmiddag!' : 'God morgon!';
    document.querySelector('.idag-greeting').textContent = greeting;

    document.getElementById('idag-week').textContent = `Vecka ${weekNum}`;
    document.getElementById('idag-date').textContent =
        `${days[dayIndex]} ${today.getDate()} ${months[today.getMonth()]}`;

    // ── Lektioner ──
    const lessons = plannerData[weekKey]?.lessons?.[dayIndex] ?? [];
    const lessonsEl = document.getElementById('idag-lessons-content');
    if (lessons.length === 0) {
        lessonsEl.innerHTML = '<p class="idag-empty">Inga lektioner idag</p>';
    } else {
        lessonsEl.innerHTML = lessons.map(lesson => {
            const color   = getSubjectColor(lesson.subject);
            const dotStyle = color ? `style="background-color:${color.bg}"` : '';
            const planned  = checkIsPlanned(lesson.plan);
            return `
                <div class="idag-lesson-item">
                    <span class="idag-lesson-time">${escapeHtml(lesson.time)}</span>
                    <span class="idag-lesson-dot" ${dotStyle}></span>
                    <span class="idag-lesson-subject">${escapeHtml(lesson.subject)}</span>
                    ${planned ? '<span class="idag-planned-badge">Planerad</span>' : ''}
                </div>`;
        }).join('');
    }

    // ── Kom ihåg (day note) ──
    const dayNote  = plannerData[weekKey]?.dayNotes?.[dayIndex] ?? '';
    const notesEl  = document.getElementById('idag-notes-content');
    if (!dayNote.trim()) {
        notesEl.innerHTML = '<p class="idag-empty">Inga anteckningar för idag</p>';
    } else {
        notesEl.innerHTML = escapeHtml(dayNote).replace(/\n/g, '<br>');
    }

    // ── Att göra ──
    let todos = [];
    try {
        const raw = localStorage.getItem(TODO_KEY);
        todos = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(todos)) todos = [];
    } catch { todos = []; }

    const active  = todos.filter(t => !t.done);
    const todosEl = document.getElementById('idag-todos-content');
    if (active.length === 0) {
        todosEl.innerHTML = '<p class="idag-empty">Inget att göra!</p>';
    } else {
        todosEl.innerHTML = active.map(t => `
            <div class="idag-todo-item">
                <span class="idag-todo-dot"></span>
                <span class="idag-todo-text">${escapeHtml(t.text)}</span>
            </div>`).join('');
    }
}
