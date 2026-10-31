console.log("training-erstellen.js läuft");

let trainingChart;
let intervals = []; 

// Hilfsfunktion: Lokales Datum im Format YYYY-MM-DD erzeugen
function getLocalISODate(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --------------------------------------------------
// Sportart Modal Steuerung
// --------------------------------------------------
function openSportModal() {
    const modal = document.getElementById("sportModal");
    if (modal) modal.style.display = "flex";
}

function closeSportModal() {
    const modal = document.getElementById("sportModal");
    if (modal) modal.style.display = "none";
}

function closeSportModalOnOutsideClick(event) {
    if (event.target.id === "sportModal") {
        closeSportModal();
    }
}

function selectSport(value, label) {
    const hiddenInput = document.getElementById("sportart");
    const textSpan = document.getElementById("selectedSportText");
    if (hiddenInput) hiddenInput.value = value;
    if (textSpan) textSpan.innerText = label || value;
    closeSportModal();
}

// --------------------------------------------------
// Bereiche (Intervalle) rendern
// --------------------------------------------------
function renderIntervals(){
    const box = document.getElementById("intervals");
    if (!box) return;
    box.innerHTML = "";

    intervals.forEach((item, index) => {
        let div = document.createElement("div");
        div.className = "stat-box";

        div.innerHTML = `
        <h3>Bereich ${index + 1}</h3>
        <label>Zeit (Minuten)</label>
        <input type="number" value="${item.time}" onchange="updateInterval(${index},'time',this.value)">

        <label>Messwert</label>
        <select onchange="updateInterval(${index},'type',this.value)">
            <option ${item.type == "Watt" ? "selected" : ""}>Watt</option>
            <option ${item.type == "Puls" ? "selected" : ""}>Puls</option>
        </select>

        <label>Wert</label>
        <input type="number" value="${item.value}" onchange="updateInterval(${index},'value',this.value)">

        <button onclick="removeInterval(${index})" style="margin-top:10px; background:#d32f2f; color:white; border:none; padding:5px 10px; border-radius:5px;">Löschen</button>
        `;
        box.appendChild(div);
    });

    updateChart();
}

function addInterval(){
    intervals.push({
        time: 10,
        value: 250,
        type: "Watt"
    });

    renderIntervals();
    const box = document.getElementById("intervals");
    if (box) box.scrollTop = box.scrollHeight;
}

function updateInterval(index, key, value){
    intervals[index][key] = (key === 'time' || key === 'value') ? Number(value) : value;
    updateChart();
}

function removeInterval(index){
    intervals.splice(index, 1);
    renderIntervals();
}

function updateChart(){
    const data = [];
    let time = 0;

    intervals.forEach((item) => {
        data.push({ x: time, y: item.value });
        time += item.time;
        data.push({ x: time, y: item.value });
    });

    if (trainingChart) {
        trainingChart.destroy();
    }

    const ctx = document.getElementById("trainingChart");
    if (!ctx) return;

    trainingChart = new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                label: "Intensität",
                data: data,
                borderColor: "#ff7a00",
                backgroundColor: "rgba(255,122,0,0.2)",
                fill: false,
                stepped: true,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: "linear",
                    title: { display: true, text: "Zeit (min)" }
                },
                y: {
                    title: { display: true, text: "Wert (Watt / Puls)" }
                }
            }
        }
    });
}

// --------------------------------------------------
// 💾 Speicher-Logik
// --------------------------------------------------

// Hilfsfunktion: Trägt die neue ID in die Tages-Liste ein
async function appendItemToDayIndex(isoDate, itemId) {
    const indexId = `day_${isoDate}`;
    let dayIndex = await loadDocument("day_indexes", indexId);
    let itemIds = dayIndex ? (dayIndex.itemIds || []) : [];

    if (!itemIds.includes(itemId)) {
        itemIds.push(itemId);
        await saveDocument("day_indexes", indexId, { itemIds });
    }
}

// 💾 Training speichern
async function saveTraining() {
    const nameInput = document.getElementById("trainingName");
    const beschreibungInput = document.getElementById("beschreibung");
    const sportartInput = document.getElementById("sportart");
    const trainerInput = document.getElementById("trainer");
    const datumInput = document.getElementById("trainingDatum");

    const name = nameInput ? nameInput.value.trim() : "";
    const beschreibung = beschreibungInput ? beschreibungInput.value.trim() : "";
    const sportart = sportartInput ? sportartInput.value : "MTB";
    const trainer = trainerInput ? trainerInput.value.trim() : "";
    const datum = datumInput && datumInput.value ? datumInput.value : getLocalISODate();

    if (name === "") {
        alert("Bitte gib dem Training einen Namen.");
        return;
    }

    // 🔥 NEU: Eindeutige ID mit Zeitstempel
    const timestamp = Date.now();
    const workoutId = `workout_${datum}_${timestamp}`;
    
    const workoutData = {
        datum: datum,
        name: name,
        beschreibung: beschreibung,
        sportart: sportart,
        trainer: trainer,
        intervals: intervals,
        status: "GEPLANT",
        updatedAt: new Date().toISOString()
    };

    try {
        await saveDocument("workouts", workoutId, workoutData);
        await appendItemToDayIndex(datum, workoutId); // Im Kalender eintragen
        
        alert(`✅ Training '${name}' wurde gespeichert!`);
        window.location.href = `trainingbackup.html?date=${datum}`; // Zurückt zur Tagesansicht
    } catch (err) {
        console.error("Fehler beim Speichern:", err);
        alert("Fehler beim Speichern des Trainings.");
    }
}

// 💾 Notiz speichern
async function saveNote() {
    const notizInput = document.getElementById("Notiz");
    const datumInput = document.getElementById("trainingDatum");
    
    const text = notizInput ? notizInput.value.trim() : "";
    const datum = datumInput && datumInput.value ? datumInput.value : getLocalISODate();

    if (text === "") {
        alert("Bitte schreibe etwas in das Notiz-Feld.");
        return;
    }

    // 🔥 NEU: Eindeutige ID für die Notiz
    const timestamp = Date.now();
    const noteId = `note_${datum}_${timestamp}`;
    
    const noteData = {
        datum: datum,
        text: text,
        updatedAt: new Date().toISOString()
    };

    try {
        await saveDocument("notes", noteId, noteData);
        await appendItemToDayIndex(datum, noteId); // Im Kalender eintragen
        
        alert(`✅ Notiz wurde gespeichert!`);
        window.location.href = `trainingbackup.html?date=${datum}`; // Zurück zur Tagesansicht
    } catch (err) {
        console.error("Fehler beim Speichern der Notiz:", err);
        alert("Fehler beim Speichern der Notiz.");
    }
}

// Initialisierung beim Laden der Seite
document.addEventListener("DOMContentLoaded", () => {
    firebase.auth().onAuthStateChanged(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const dateFromUrl = urlParams.get("date");
        const datumInput = document.getElementById("trainingDatum");

        const targetDate = dateFromUrl || getLocalISODate();
        if (datumInput) datumInput.value = targetDate;

        // WICHTIG: Alte Trainings werden beim "Erstellen" nicht mehr automatisch geladen.
        // Das Formular ist jetzt frisch und leer, bereit für ein neues Training.
        
        renderIntervals();
    });
});