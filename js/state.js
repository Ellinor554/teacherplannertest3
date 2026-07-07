import { getWeekNumber, getISOWeekYear } from './utils.js';

const today = new Date();

export let currentWeek = getWeekNumber(today);
export let currentYear = getISOWeekYear(today); // ISO week year, not Gregorian — differs on 29–31 Dec
export let activeView = 'oversikt';
export let activeDayIndex = 0;
export let activeLessonId = null;

function loadPlannerData() {
    try {
        return JSON.parse(localStorage.getItem('teacher_planner_data')) || {};
    } catch {
        console.warn('Kunde inte läsa sparad data – startar med tom planering.');
        return {};
    }
}
export let plannerData = loadPlannerData();

export let timerInterval = null;
export let timerSeconds = 0;
export let timerMaxSeconds = 600;

export let stopwatchInterval = null;
export let stopwatchSeconds = 0;
export let stopwatchRunning = false;

export let isSplitActive = false;
export let currentFileHandle = null;

// Setters — ES module exports are live bindings, so importers always read the latest value
export function setCurrentWeek(v)       { currentWeek = v; }
export function setCurrentYear(v)       { currentYear = v; }
export function setActiveView(v)        { activeView = v; }
export function setActiveDayIndex(v)    { activeDayIndex = v; }
export function setActiveLessonId(v)    { activeLessonId = v; }
export function setPlannerData(v)       { plannerData = v; }
export function setTimerInterval(v)     { timerInterval = v; }
export function setTimerSeconds(v)      { timerSeconds = v; }
export function setTimerMaxSeconds(v)   { timerMaxSeconds = v; }
export function setStopwatchInterval(v) { stopwatchInterval = v; }
export function setStopwatchSeconds(v)  { stopwatchSeconds = v; }
export function setStopwatchRunning(v)  { stopwatchRunning = v; }
export function setIsSplitActive(v)     { isSplitActive = v; }
export function setCurrentFileHandle(v) { currentFileHandle = v; }
