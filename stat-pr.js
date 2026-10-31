// =======================================
// Maximum Fire - stat-pr.js
// =======================================

let currentMetric = "power"; // Standard: Leistung

// Beispiel-Datenstruktur für die verschiedenen Zeiträume & Metriken
// (Später können diese Werte live aus Firebase Firestore geladen werden)
const prDatabase = {
    power: {
        unit: "W",
        intervals: [
            { time: "3s", value: 980 },
            { time: "10s", value: 850 },
            { time: "30s", value: 620 },
            { time: "1min", value: 480 },
            { time: "4min", value: 360 },
            { time: "10min", value: 310 },
            { time: "20min", value: 285 },
            { time: "1h", value: 250 },
            { time: "3h", value: 210 }
        ]
    },
    hr: {
        unit: "bpm",
        intervals: [
            { time: "3s", value: 192 },
            { time: "10s", value: 191 },
            { time: "30s", value: 189 },
            { time: "1min", value: 186 },
            { time: "4min", value: 182 },
            { time: "10min", value: 178 },
            { time: "20min", value: 175 },
            { time: "1h", value: 168 },
            { time: "3h", value: 155 }
        ]
    },
    speed: {
        unit: "km/h",
        intervals: [
            { time: "3s", value: 62.4 },
            { time: "10s", value: 58.1 },
            { time: "30s", value: 51.0 },
            { time: "1min", value: 44.5 },
            { time: "4min", value: 38.2 },
            { time: "10min", value: 34.0 },
            { time: "20min", value: 32.5 },
            { time: "1h", value: 29.8 },
            { time: "3h", value: 26.4 }
        ]
    }
};

// Wechsel zwischen Leistung, Herzfrequenz und Geschwindigkeit
function selectMetric(metric) {
    currentMetric = metric;

    // Button-Styling anpassen
    document.getElementById("btnPower").classList.remove("active");
    document.getElementById("btnHR").classList.remove("active");
    document.getElementById("btnSpeed").classList.remove("active");

    if (metric === "power") document.getElementById("btnPower").classList.add("active");
    if (metric === "hr") document.getElementById("btnHR").classList.add("active");
    if (metric === "speed") document.getElementById("btnSpeed").classList.add("active");

    updatePRData();
}

// Rekordwerte basierend auf der Auswahl rendern
function updatePRData() {
    const prList = document.getElementById("prList");
    const selectedTimeframe = document.getElementById("timeframeSelect").value;
    const data = prDatabase[currentMetric];

    if (!prList || !data) return;

    prList.innerHTML = "";

    // Faktor berechnen, um bei kürzeren Zeiträumen leicht geänderte Demowerte anzuzeigen
    let factor = 1.0;
    if (selectedTimeframe === "1d") factor = 0.88;
    else if (selectedTimeframe === "7d") factor = 0.92;
    else if (selectedTimeframe === "30d") factor = 0.95;
    else if (selectedTimeframe === "100d") factor = 0.98;

    data.intervals.forEach(item => {
        const row = document.createElement("div");
        row.className = "stat-box";
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 12px; background: #fdfdfd; box-shadow: 0 2px 6px rgba(0,0,0,0.05);";

        // Wert berechnen
        let calcValue = item.value * factor;
        let formattedValue = (currentMetric === "speed") ? calcValue.toFixed(1) : Math.round(calcValue);

        row.innerHTML = `
            <span style="font-weight: bold; font-size: 16px; color: #555;">${item.time}</span>
            <strong style="font-size: 18px; color: #ff7a00;">${formattedValue} ${data.unit}</strong>
        `;

        prList.appendChild(row);
    });
}

// Initial beim Laden der Seite aufrufen
document.addEventListener("DOMContentLoaded", () => {
    updatePRData();
});