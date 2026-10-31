[sriptbackuo.js](https://github.com/user-attachments/files/34225349/sriptbackuo.js)# Max.Fire
.
[Uploading sriptbac// =======================================
// Wochentest & Chart Logik
// =======================================
let currentWeekOffset = 0;
console.log("Wochentest gestartet");

function getLocalISODate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getWeekDates(){
    let days = [];
    let today = new Date();

    let endDate = new Date(today);
    endDate.setDate(today.getDate() + (currentWeekOffset * 7));

    for(let i = 6; i >= 0; i--){
        let d = new Date(endDate);
        d.setDate(endDate.getDate() - i);
        days.push(d);
    }

    return days;
}

function nextWeek(){
    currentWeekOffset++;
    updateChartWeek();
}

function previousWeek(){
    currentWeekOffset--;
    updateChartWeek();
}

const ctx = document.getElementById("weekChart");
let chart;

if (ctx) {
    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: getWeekDates().map(day => {
                return day.toLocaleDateString("de-DE",{
                    day:"2-digit",
                    month:"2-digit"
                });
            }),
            datasets: [{
                data: [42, 65, 30, 80, 55, 95, 48],
                backgroundColor: "#ff7a00",
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Kilometer" }
                }
            }
        }
    });    
}

function updateChartWeek(){
    if(!chart) return;

    chart.data.labels = getWeekDates().map(day => {
        return day.toLocaleDateString("de-DE",{
            day:"2-digit",
            month:"2-digit"
        });
    });

    chart.update();
}

// =======================================
// 💾 Speicher-Hilfsfunktionen (Mehrfach-Einträge)
// =======================================

// Speichert ein neues Training für ein Datum ohne bestehende zu überschreiben
async function saveWorkoutForDate(isoDate, workoutData) {
    const timestamp = Date.now();
    const workoutId = `workout_${isoDate}_${timestamp}`;

    if (typeof saveDocument === "function") {
        await saveDocument("workouts", workoutId, {
            ...workoutData,
            isoDate: isoDate,
            createdAt: timestamp
        });
        await appendItemToDayIndex(isoDate, workoutId);
    }
}

// Speichert eine neue Notiz für ein Datum
async function saveNoteForDate(isoDate, noteData) {
    const timestamp = Date.now();
    const noteId = `note_${isoDate}_${timestamp}`;

    if (typeof saveDocument === "function") {
        await saveDocument("notes", noteId, {
            ...noteData,
            isoDate: isoDate,
            createdAt: timestamp
        });
        await appendItemToDayIndex(isoDate, noteId);
    }
}

// Hilfsfunktion: Fügt eine ID unten an die Liste des Tages an
async function appendItemToDayIndex(isoDate, itemId) {
    const indexId = `day_${isoDate}`;
    let dayIndex = await loadDocument("day_indexes", indexId);
    let itemIds = dayIndex ? (dayIndex.itemIds || []) : [];

    // Verhindert Duplikate, fügt neues Element HINTEN an (ältestes oben, neuestes unten)
    if (!itemIds.includes(itemId)) {
        itemIds.push(itemId);
    }

    await saveDocument("day_indexes", indexId, { itemIds });
}


// =======================================
// 📅 Kalender-Timeline
// =======================================
async function renderTimeline() {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;

    timeline.innerHTML = "<p style='text-align:center; color:#888; padding:20px;'>Kalender wird geladen...</p>";

    const heute = new Date();
    const formatter = new Intl.DateTimeFormat("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit"
    });

    const dayPromises = [];

    for (let i = -7; i <= 60; i++) {
        const datum = new Date();
        datum.setDate(heute.getDate() + i);
        const isoDate = getLocalISODate(datum);

        dayPromises.push(
            loadDocument("day_indexes", `day_${isoDate}`).then(async (dayIndex) => {
                let itemIds = dayIndex ? (dayIndex.itemIds || []) : [];
                
                // Fallback für alte Einzel-Trainings
                if (itemIds.length === 0) {
                    const legacy = await loadDocument("workouts", `workout_${isoDate}`);
                    if (legacy) itemIds = [`workout_${isoDate}`];
                }

                // Ersten Eintrag für die Vorschau holen
                let firstItemTitle = "Kein Training geplant";
                if (itemIds.length > 0) {
                    const firstId = itemIds[0];
                    if (firstId.startsWith("workout_")) {
                        const w = await loadDocument("workouts", firstId);
                        firstItemTitle = w ? `🚴 ${w.name || "Training"}` : "Training";
                    } else if (firstId.startsWith("note_")) {
                        firstItemTitle = `📝 Notiz`;
                    }
                }

                return { i, datum, isoDate, count: itemIds.length, firstItemTitle };
            })
        );
    }

    const daysData = await Promise.all(dayPromises);
    timeline.innerHTML = "";
    let todayCard = null;

    daysData.forEach(dayInfo => {
        const { i, datum, isoDate, count, firstItemTitle } = dayInfo;
        const card = document.createElement("div");
        card.className = "day";

        if (i === 0) {
            card.classList.add("today");
            todayCard = card;
        }

        card.onclick = function () {
            window.location.href = `trainingbackup.html?date=${isoDate}`;
        };

        let displayTitle = firstItemTitle;
        if (count > 1) {
            displayTitle += ` <span style="font-size:13px; color:#888; font-weight:normal;">(+ ${count - 1} weitere)</span>`;
        }

        card.innerHTML = `
        <div>
            <div class="date">
                ${formatter.format(datum)}
                ${i === 0 ? " • HEUTE" : ""}
            </div>
            <strong>${displayTitle}</strong>
        </div>
        <button class="plus" onclick="event.stopPropagation(); window.location.href='training-erstellen.html?date=${isoDate}'">
            +
        </button>
        `;

        timeline.appendChild(card);
    });

    setTimeout(() => {
        if (todayCard) {
            todayCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, 100);
}


// =======================================
// Startseite (Heutiges Training / Notizen)
// =======================================

function formatDateDE(isoDateStr) {
    const parts = isoDateStr.split("-");
    if (parts.length !== 3) return isoDateStr;
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" }).format(dateObj);
}

const sportIcons = {
    "Kraft": "🏋️", "Athletik": "🤸", "MTB": "🚵", "Rennrad": "🚴",
    "Schwimmen": "🏊", "Wandern": "🥾", "Laufen": "🏃"
};

async function loadTodayWorkout() {
    const todayStr = getLocalISODate(new Date());
    
    let dayIndex = null;
    if (typeof loadDocument === "function") {
        dayIndex = await loadDocument("day_indexes", `day_${todayStr}`);
    }

    let itemIds = dayIndex ? (dayIndex.itemIds || []) : [];

    if (itemIds.length === 0) {
        const legacyWorkout = await loadDocument("workouts", `workout_${todayStr}`);
        if (legacyWorkout) {
            itemIds = [`workout_${todayStr}`];
        }
    }

    let todayItems = [];
    for (const id of itemIds) {
        if (id.startsWith("workout_")) {
            const w = await loadDocument("workouts", id);
            if (w) todayItems.push({ ...w, id, itemType: "workout" });
        } else if (id.startsWith("note_")) {
            const n = await loadDocument("notes", id);
            if (n) todayItems.push({ ...n, id, itemType: "note" });
        }
    }

    renderTodayCard(todayItems, todayStr);
}

function renderTodayCard(items, todayStr) {
    const card = document.getElementById("todayWorkoutCard");
    if (!card) return;

    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h2 style="margin: 0; font-size: 18px;">📅 Heute</h2>
            <span style="color:#888; font-size:13px;">${formatDateDE(todayStr)}</span>
        </div>
    `;

    if (items.length === 0) {
        html += `
            <div style="background: rgba(0,0,0,0.03); padding: 15px; border-radius: 12px; text-align: center; margin-bottom: 15px;">
                <span style="background: #7f8c8d; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">RUHETAG</span>
                <p style="color: #666; font-size: 14px; margin-top: 10px;">Für heute ist noch nichts geplant.</p>
            </div>
        `;
    } else {
        // Items untereinander auflisten (altes zuerst oben, neues unten)
        items.forEach((item) => {
            if (item.itemType === "workout") {
                const status = item.status || "GEPLANT";
                const isAbsolviert = status === "ABSOLVIERT";
                const statusBg = isAbsolviert ? "#2e7d32" : "#ff7a00";
                const icon = sportIcons[item.sportart] || "🚴";

                html += `
                    <div style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 12px; border-left: 5px solid ${statusBg}; margin-bottom: 10px; cursor: pointer;" onclick="window.location.href='trainingbackup.html?date=${todayStr}'">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h3 style="margin: 0; font-size: 16px; color: #111;">
                                ${icon} ${item.name || "Unbenanntes Training"}
                            </h3>
                            <span style="background: ${statusBg}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;">
                                ${status}
                            </span>
                        </div>
                        <div style="font-size: 13px; color: #555;">
                            <span><strong>Sportart:</strong> ${item.sportart || "Sport"}</span>
                            ${item.trainer ? `<span style="margin-left: 10px;"><strong>Trainer:</strong> ${item.trainer}</span>` : ""}
                        </div>
                    </div>
                `;
            } else if (item.itemType === "note") {
                html += `
                    <div style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 12px; border-left: 5px solid #7f8c8d; margin-bottom: 10px; cursor: pointer;" onclick="window.location.href='trainingbackup.html?date=${todayStr}'">
                        <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #222;">📝 Notiz</h3>
                        <div style="font-size: 13px; color: #555; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                            ${item.text || ""}
                        </div>
                    </div>
                `;
            }
        });
    }

    html += `
        <button onclick="window.location.href='trainingbackup.html?date=${todayStr}'" 
                style="width: 100%; background: #ff7a00; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 15px; margin-top: 5px;">
            Tagesansicht öffnen
        </button>
    `;

    card.innerHTML = html;
}

// =======================================
// Initialisierung (Auth & Start)
// =======================================
function initApp() {
    if (document.getElementById("timeline")) {
        renderTimeline();
    }
    if (document.getElementById("todayWorkoutCard")) {
        loadTodayWorkout();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof firebase !== "undefined" && firebase.auth) {
        firebase.auth().onAuthStateChanged(() => {
            initApp();
        });
    } else {
        initApp();
    }
});kuo.js…]()
