import { plannerData, currentYear, currentFileHandle, setCurrentFileHandle, setPlannerData } from './state.js';
import { migrateData } from './data.js';

export async function saveData() {
    // Always keep localStorage as safety net (works everywhere, survives reloads)
    try {
        localStorage.setItem('teacher_planner_data', JSON.stringify(plannerData));
    } catch (err) {
        if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            alert('⚠️ Lagringsutrymmet är fullt!\n\nDatan kunde inte sparas. Ta bort några bilder från lektionsplaneringarna, eller ladda ner en backup och rensa.');
        } else {
            console.warn('Kunde inte spara till localStorage:', err);
        }
    }

    // If user has chosen a real JSON file on disk → auto-save there too
    if (currentFileHandle) {
        try {
            const writable = await currentFileHandle.createWritable();
            await writable.write(JSON.stringify(plannerData, null, 2));
            await writable.close();
        } catch (err) {
            console.warn('Disk-skrivning misslyckades (filen kanske låst):', err);
        }
    }
}

export async function savePlannerAs() {
    if (!('showSaveFilePicker' in window)) {
        alert("Din webbläsare stödjer inte direkt filsparande.\nAnvänd istället 'Ladda ner backup' nedan.");
        return;
    }
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: `lärarplaner-${currentYear}.json`,
            types: [{ description: 'Lärarplan JSON', accept: { 'application/json': ['.json'] } }]
        });
        setCurrentFileHandle(handle);
        await saveData();
        updateFileStatus(`💾 ${handle.name}`);
        alert(`✅ Planen sparas nu AUTOMATISKT till:\n${handle.name}\n\nDu kan stänga och öppna webbläsaren – filen ligger på din disk!`);
    } catch (err) {
        if (err.name !== 'AbortError') alert('Filval avbrutet.');
    }
}

export async function openPlannerFile(refreshUICallback) {
    if (!('showOpenFilePicker' in window)) {
        alert("Din webbläsare stödjer inte direkt filöppning.\nAnvänd 'Importera backup' istället.");
        return;
    }
    try {
        const [handle] = await window.showOpenFilePicker({
            types: [{ description: 'Lärarplan JSON', accept: { 'application/json': ['.json'] } }]
        });
        setCurrentFileHandle(handle);
        const file = await handle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            alert('Ogiltig fil: filen innehåller inte giltig planeringsdata.');
            return;
        }
        setPlannerData(parsed);
        migrateData();
        refreshUICallback();
        updateFileStatus(`📂 ${handle.name}`);
    } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
    }
}

export function downloadBackup() {
    const dataStr = JSON.stringify(plannerData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `lärarplaner-backup-${currentYear}.json`;
    link.click();
}

export function importBackup(e, refreshUICallback) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        try {
            const parsed = JSON.parse(ev.target.result);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                alert('Ogiltig fil: filen innehåller inte giltig planeringsdata.');
                return;
            }
            setPlannerData(parsed);
            migrateData();
            refreshUICallback();
            alert('✅ Backup importerad från disk!');
        } catch (err) {
            alert('Ogiltig JSON-fil.');
        }
    };
    reader.readAsText(file);
}

export function updateFileStatus(msg) {
    const el = document.getElementById('file-status');
    if (el) el.innerHTML = msg;
}
