// =======================================
// Maximum Fire - Tagesansicht & Details
// =======================================

let currentDateIso = null;
let dayItems = []; // Enthält alle Trainings & Notizen des Tages
let selectedItemId = null;
let currentWorkout = null;

let trainingChart = null;
let currentChartType = "power";

let selectionStart = null;
let selectionEnd = null;

const sportIcons = {
    "Kraft": "🏋️", "Athletik": "🤸", "MTB": "🚵", "Rennrad": "🚴", "Schwimmen": "🏊", "Wandern": "🥾", "Laufen": "🏃"
};

const chartConfig = {
    power: { label: "Watt", unit: "W", color: "#ff7a00", bg: "rgba(255, 122, 0, 0.2)" },
    hr: { label: "Puls", unit: "bpm", color: "#e53935", bg: "rgba(229, 57, 53, 0.2)" },
    height: { label: "Höhe", unit: "m", color: "#8e24aa", bg: "rgba(142, 36, 170, 0.2)" },
    speed: { label: "Geschwindigkeit", unit: "km/h", color: "#1e88e5", bg: "rgba(30, 136, 229, 0.2)" },
    cadence: { label: "Kadenz", unit: "rpm", color: "#43a047", bg: "rgba(67, 160, 71, 0.2)" }
};

function getUrlDate() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("date") || new Date().toISOString().split("T")[0];
}

function formatDateDE(isoDateStr) {
    const parts = isoDateStr.split("-");
    if (parts.length !== 3) return isoDateStr;
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" }).format(dateObj);
}

// 🔥 NEU: Robuste Funktion zum Laden und automatischen Reparieren der Tages-Liste
async function getRobustDayIndex(isoDate) {
    let dayIndex = null;
    if (typeof loadDocument === "function") {
        try {
            dayIndex = await loadDocument("day_indexes", `day_${isoDate}`);
        } catch(e) { console.warn(e); }
    }

    let itemIds = (dayIndex && dayIndex.itemIds) ? dayIndex.itemIds : [];

    // 🔥 SELBSTHEILUNG: Holt das "alte" verschwundene Training zurück!
    const legacyWorkoutId = `workout_${isoDate}`;
    try {
        const legacyWorkout = await loadDocument("workouts", legacyWorkoutId);
        // Wenn es das alte Training gibt, es aber in der Liste fehlt -> Einfügen!
        if (legacyWorkout && !itemIds.includes(legacyWorkoutId)) {
            itemIds.unshift(legacyWorkoutId); // Fügt es ganz oben (als erstes) ein
            if (typeof saveDocument === "function") {
                await saveDocument("day_indexes", `day_${isoDate}`, { itemIds });
            }
        }
    } catch(e) { console.warn(e); }

    return itemIds;
}

// 1. Alle Einträge für den Tag laden (Trainings + Notizen)
async function loadDayData() {
    currentDateIso = getUrlDate();
    document.getElementById("dayDateDisplay").innerText = formatDateDE(currentDateIso);

    // Die kugelsichere Liste laden
    let itemIds = await getRobustDayIndex(currentDateIso);

    dayItems = [];
    for (const id of itemIds) {
        if (id.startsWith("workout_")) {
            const w = await loadDocument("workouts", id);
            if (w) dayItems.push({ ...w, id, itemType: "workout" });
        } else if (id.startsWith("note_")) {
            const n = await loadDocument("notes", id);
            if (n) dayItems.push({ ...n, id, itemType: "note" });
        }
    }

    renderDayOverview();

    // Wählt standardmäßig das erste Element in der Liste aus (oder das, was man zuletzt offen hatte)
    if (dayItems.length > 0) {
        const stillExists = dayItems.find(i => i.id === selectedItemId);
        selectItem(stillExists ? selectedItemId : dayItems[0].id);
    } else {
        showEmptyState();
    }
}

// 2. Tagesübersicht (oben) rendern
function renderDayOverview() {
    const listContainer = document.getElementById("dayOverviewList");
    if (!listContainer) return;

    if (dayItems.length === 0) {
        listContainer.innerHTML = `<p style="color: #777; text-align: center; margin: 15px 0;">Keine Trainings oder Notizen für diesen Tag vorhanden.</p>`;
        return;
    }

    let html = "";
    dayItems.forEach((item, index) => {
        const isActive = item.id === selectedItemId ? "active" : "";

        if (item.itemType === "workout") {
            const status = item.status || "GEPLANT";
            const isAbsolviert = status === "ABSOLVIERT";
            const statusBg = isAbsolviert ? "#2e7d32" : "#ff7a00";
            const icon = sportIcons[item.sportart] || "🚴";

            html += `
                <div class="overview-item-card ${isActive}" style="border-left: 5px solid ${statusBg};" onclick="selectItem('${item.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 11px; font-weight: bold; color: #888;">#${index + 1} • TRAINING</span>
                        <span style="background: ${statusBg}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold;">
                            ${status}
                        </span>
                    </div>
                    <h3 style="margin: 0 0 4px 0; font-size: 17px; color: #111;">
                        ${icon} ${item.name || "Unbenanntes Training"}
                    </h3>
                    <div style="font-size: 13px; color: #666;">
                        <span><strong>Sportart:</strong> ${item.sportart || "Sport"}</span>
                        ${item.trainer ? `<span style="margin-left: 10px;"><strong>Trainer:</strong> ${item.trainer}</span>` : ""}
                    </div>
                </div>
            `;
        } else if (item.itemType === "note") {
            html += `
                <div class="overview-item-card ${isActive}" style="border-left: 5px solid #7f8c8d;" onclick="selectItem('${item.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 11px; font-weight: bold; color: #888;">#${index + 1} • NOTIZ</span>
                    </div>
                    <h3 style="margin: 0; font-size: 15px; color: #222;">📝 Notiz</h3>
                    <div class="note-preview-text">${item.text || "Kein Text..."}</div>
                </div>
            `;
        }
    });

    listContainer.innerHTML = html;
}

// 3. Ausgewähltes Element aktivieren und Details darunter laden
function selectItem(id) {
    selectedItemId = id;
    renderDayOverview();

    const item = dayItems.find(i => i.id === id);
    if (!item) return;

    const workoutSection = document.getElementById("workoutDetailSection");
    const noteSection = document.getElementById("noteDetailSection");

    if (item.itemType === "workout") {
        if (noteSection) noteSection.style.display = "none";
        if (workoutSection) workoutSection.style.display = "block";
        currentWorkout = item;
        renderWorkoutDetails();
    } else if (item.itemType === "note") {
        if (workoutSection) workoutSection.style.display = "none";
        if (noteSection) noteSection.style.display = "block";
        document.getElementById("fullNoteContent").innerText = item.text || "";
    }
}

function showEmptyState() {
    document.getElementById("workoutDetailSection").style.display = "none";
    document.getElementById("noteDetailSection").style.display = "none";
}

// 4. Workout Detail rendering & Chart
function renderWorkoutDetails() {
    if (!currentWorkout) return;

    const icon = sportIcons[currentWorkout.sportart] || "🚴";
    document.getElementById("trainingTitle").innerText = `${icon} ${currentWorkout.name || "Training"}`;
    document.getElementById("trainingDate").innerText = formatDateDE(currentDateIso);
    document.getElementById("trainingSport").innerText = currentWorkout.sportart || "Sport";

    const beschreibungBox = document.getElementById("beschreibungText");
    if (beschreibungBox) {
        beschreibungBox.innerHTML = currentWorkout.beschreibung ? `<p>${currentWorkout.beschreibung.replace(/\n/g, '<br>')}</p>` : `<p>Keine Beschreibung hinterlegt.</p>`;
    }

    const statusBtn = document.getElementById("statusBtn");
    const status = currentWorkout.status || "GEPLANT";

    if (status === "ABSOLVIERT") {
        statusBtn.innerText = "ABSOLVIERT";
        statusBtn.className = "status-btn status-absolviert";
        showStatsSections(true);
        fillStatsData();
    } else {
        statusBtn.innerText = "GEPLANT";
        statusBtn.className = "status-btn status-geplant";
        showStatsSections(false);
    }

    if (!currentWorkout.intervals || currentWorkout.intervals.length === 0) {
        currentWorkout.intervals = [
            { time: 10, value: 160, type: "Watt" }, { time: 8, value: 260, type: "Watt" },
            { time: 4, value: 150, type: "Watt" }, { time: 8, value: 260, type: "Watt" }
        ];
    }

    renderChart();
    resetIntervalSelection();
}

function showStatsSections(visible) {
    document.querySelectorAll(".stats-section").forEach(card => card.style.display = visible ? "block" : "none");
}

function fillStatsData() {
    const setVal = (id, val, unit = "") => {
        const el = document.getElementById(id);
        if (el) el.innerText = val ? `${val} ${unit}`.trim() : "-";
    };

    setVal("valDistanz", currentWorkout.distanz, "km");
    setVal("valDauer", currentWorkout.dauer);
    setVal("valBewegung", currentWorkout.bewegungszeit);
    setVal("valKalorien", currentWorkout.kalorien, "kcal");
    setVal("valLeistung", currentWorkout.leistung, "W");
    setVal("valPuls", currentWorkout.puls, "bpm");
    setVal("valSpeed", currentWorkout.speed, "km/h");
    setVal("valTemp", currentWorkout.temp, "°C");
    setVal("valTSS", currentWorkout.tss);
    setVal("valIF", currentWorkout.ifVal);
    setVal("valLast", currentWorkout.trainingslast);
    setVal("valErholung", currentWorkout.erholung);
}

// 5. Neue Notiz anlegen & Speichern (Direkt aus der Tagesansicht)
function toggleAddNoteForm() {
    const form = document.getElementById("newNoteForm");
    form.style.display = form.style.display === "none" ? "block" : "none";
}

async function saveNewNote() {
    const textEl = document.getElementById("newNoteText");
    const text = textEl.value.trim();
    if (!text) return;

    const timestamp = Date.now();
    const noteId = `note_${currentDateIso}_${timestamp}`;

    const newNote = {
        id: noteId,
        datum: currentDateIso,
        text: text,
        createdAt: timestamp,
        itemType: "note"
    };

    if (typeof saveDocument === "function") {
        await saveDocument("notes", noteId, newNote);

        // 🔥 NEU: Liste sicher aufrufen, Notiz hinten dranhängen und abspeichern
        let itemIds = await getRobustDayIndex(currentDateIso);
        if (!itemIds.includes(noteId)) {
            itemIds.push(noteId);
            await saveDocument("day_indexes", `day_${currentDateIso}`, { itemIds });
        }
    }

    textEl.value = "";
    toggleAddNoteForm();
    await loadDayData(); // Seite neu laden, jetzt ist alles da!
}

// Weiterleitung zu Training erstellen mit Datum
function goToCreateWorkout() {
    window.location.href = `training-erstellen.html?date=${currentDateIso}`;
}

// Status Umschalten
async function toggleStatus() {
    if (!currentWorkout) return;

    currentWorkout.status = (currentWorkout.status === "ABSOLVIERT") ? "GEPLANT" : "ABSOLVIERT";
    if (typeof saveDocument === "function") {
        await saveDocument("workouts", currentWorkout.id, currentWorkout);
    }
    renderWorkoutDetails();
    renderDayOverview();
}

// Element löschen
async function deleteCurrentItem() {
    if (!selectedItemId || !confirm("Möchtest du diesen Eintrag wirklich löschen?")) return;

    const item = dayItems.find(i => i.id === selectedItemId);
    
    // 🔥 NEU: Sicher aus der Liste entfernen
    let itemIds = await getRobustDayIndex(currentDateIso);
    itemIds = itemIds.filter(id => id !== selectedItemId);
    await saveDocument("day_indexes", `day_${currentDateIso}`, { itemIds });

    selectedItemId = null;
    await loadDayData();
}

// Chart Render-Logik
function changeChart(type) {
    if (!chartConfig[type]) return;
    currentChartType = type;
    document.querySelectorAll(".chart-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("onclick").includes(`'${type}'`));
    });
    renderChart();
}

function renderChart() {
    const ctx = document.getElementById("trainingChart");
    if (!ctx) return;
    if (trainingChart) trainingChart.destroy();

    const intervals = currentWorkout?.intervals || [];
    const config = chartConfig[currentChartType] || chartConfig.power;
    const chartData = [];

    let time = 0;
    intervals.forEach((item) => {
        const val = item.value || 0;
        const duration = Number(item.time) || 0;
        chartData.push({ x: time, y: val });
        time += duration;
        chartData.push({ x: time, y: val });
    });

    trainingChart = new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                label: config.label,
                data: chartData,
                borderColor: config.color,
                backgroundColor: config.bg,
                fill: true,
                stepped: true,
                borderWidth: 3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { type: "linear", title: { display: true, text: "Zeit (Minuten)" } },
                y: { title: { display: true, text: `${config.label} (${config.unit})` }, beginAtZero: true }
            }
        }
    });
}

function resetIntervalSelection() {
    selectionStart = null;
    selectionEnd = null;
    const box = document.getElementById("intervalBox");
    if (box) box.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof firebase !== "undefined" && firebase.auth) {
        firebase.auth().onAuthStateChanged(() => loadDayData());
    } else {
        loadDayData();
    }
});