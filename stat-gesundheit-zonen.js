// =======================================
// Maximum Fire - stat-gesundheit-zonen.js
// =======================================

let healthChart = null;
let currentHealthMetric = "ruhepuls";
let currentHealthTimeframe = "7d";
let healthTimeOffset = 0;

// Konfiguration um HRV erweitert
const healthConfig = {
    ruhepuls: { label: "Ruhepuls (bpm)", unit: "bpm", color: "#e74c3c", baseVal: 45, variance: 5 },
    gewicht:  { label: "Gewicht (kg)",  unit: "kg",  color: "#3498db", baseVal: 75, variance: 1.5 },
    hrv:      { label: "HRV (ms)",       unit: "ms",  color: "#2ecc71", baseVal: 65, variance: 10 }
};

// Stammdaten für Zonen
let zonesData = {
    leistung: [
        { name: "Zone 1: Aktive Erholung", range: "< 160 W", color: "#3498db" },
        { name: "Zone 2: Grundlagenausdauer", range: "160 - 215 W", color: "#2ecc71" },
        { name: "Zone 3: Tempo", range: "215 - 260 W", color: "#f1c40f" },
        { name: "Zone 4: Laktatschwelle", range: "260 - 305 W", color: "#e67e22" },
        { name: "Zone 5: VO₂max / Anaerob", range: "> 305 W", color: "#e74c3c" }
    ],
    hf: [
        { name: "Zone 1: Regeneration", range: "< 115 bpm", color: "#3498db" },
        { name: "Zone 2: Aerobe Basis", range: "115 - 135 bpm", color: "#2ecc71" },
        { name: "Zone 3: Aerobes Tempo", range: "135 - 155 bpm", color: "#f1c40f" },
        { name: "Zone 4: Schwellenbereich", range: "155 - 175 bpm", color: "#e67e22" },
        { name: "Zone 5: Maximalbereich", range: "> 175 bpm", color: "#e74c3c" }
    ]
};

let currentZoneMetric = "leistung";
let editingZoneIndex = null;

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ansicht = urlParams.get('ansicht');

    if (ansicht === 'zonen') {
        document.getElementById("viewZonen").style.display = "block";
        document.getElementById("pageTitle").innerText = "Maximum Fire - Zonen";
        renderZones();
    } else {
        document.getElementById("viewGesundheit").style.display = "block";
        document.getElementById("pageTitle").innerText = "Maximum Fire - Gesundheit";
        
        initHealthChart();
        updateHealthDashboard();
    }
});


// --- GESUNDHEIT LOGIK ---

function selectHealthMetric(metric) {
    currentHealthMetric = metric.toLowerCase();
    
    // Active Class von allen Buttons entfernen
    document.getElementById("btnRuhepuls").classList.remove("active");
    document.getElementById("btnGewicht").classList.remove("active");
    document.getElementById("btnHRV").classList.remove("active");
    
    // Active Class für den ausgewählten Button setzen
    if (currentHealthMetric === "ruhepuls") document.getElementById("btnRuhepuls").classList.add("active");
    if (currentHealthMetric === "gewicht") document.getElementById("btnGewicht").classList.add("active");
    if (currentHealthMetric === "hrv") document.getElementById("btnHRV").classList.add("active");

    updateHealthDashboard();
}

function changeHealthTimeframe() {
    currentHealthTimeframe = document.getElementById("healthTimeframe").value;
    healthTimeOffset = 0; 
    updateHealthDashboard();
}

function shiftHealthOffset(direction) {
    healthTimeOffset += direction;
    if (healthTimeOffset > 0) healthTimeOffset = 0; 
    updateHealthDashboard();
}

function updateHealthDashboard() {
    updateHealthNavigationUI();
    updateHealthChartData();
}

function updateHealthNavigationUI() {
    const nextBtn = document.getElementById("healthNextBtn");
    const rangeText = document.getElementById("healthDateText");
    const subText = document.getElementById("healthDateSubText");

    if (healthTimeOffset === 0) {
        nextBtn.disabled = true;
        nextBtn.style.background = "#ccc";
        nextBtn.style.cursor = "not-allowed";
    } else {
        nextBtn.disabled = false;
        nextBtn.style.background = "#ff7a00";
        nextBtn.style.cursor = "pointer";
    }

    const today = new Date();
    const monthNamesShort = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    const past = Math.abs(healthTimeOffset);

    if (currentHealthTimeframe === "7d") {
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + (healthTimeOffset * 7));
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);

        rangeText.innerText = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth()+1).toString().padStart(2, '0')}. – ${endDate.getDate().toString().padStart(2, '0')}.${(endDate.getMonth()+1).toString().padStart(2, '0')}.${endDate.getFullYear()}`;
        subText.innerText = (healthTimeOffset === 0) ? "Aktuelle 7 Tage" : `${past} Woche(n) zurück`;
    }
    else if (currentHealthTimeframe === "1m") {
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + (healthTimeOffset * 30));
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 29);

        rangeText.innerText = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth()+1).toString().padStart(2, '0')}. – ${endDate.getDate().toString().padStart(2, '0')}.${(endDate.getMonth()+1).toString().padStart(2, '0')}.${endDate.getFullYear()}`;
        subText.innerText = (healthTimeOffset === 0) ? "Aktueller Monat" : `${past} Monat(e) zurück`;
    }
    else if (currentHealthTimeframe === "1y") {
        const targetMonth = today.getMonth() + (healthTimeOffset * 12);
        const endDate = new Date(today.getFullYear(), targetMonth, 1);
        const startDate = new Date(today.getFullYear(), targetMonth - 11, 1);
        rangeText.innerText = `${monthNamesShort[startDate.getMonth()]} ${startDate.getFullYear()} – ${monthNamesShort[endDate.getMonth()]} ${endDate.getFullYear()}`;
        subText.innerText = (healthTimeOffset === 0) ? "Aktuelles Jahr" : `${past} Jahr(e) zurück`;
    }
    else if (currentHealthTimeframe === "10y") {
        const currentYear = today.getFullYear() + (healthTimeOffset * 10);
        rangeText.innerText = `${currentYear - 9} – ${currentYear}`;
        subText.innerText = (healthTimeOffset === 0) ? "Letzte 10 Jahre" : `Vor ${past * 10} Jahren`;
    }
    else if (currentHealthTimeframe === "all") {
        rangeText.innerText = `2021 – ${today.getFullYear()}`;
        subText.innerText = "Gesamter Zeitraum";
    }
}

function updateHealthChartData() {
    let labels = [];
    let dataPoints = 0;
    const today = new Date();

    if (currentHealthTimeframe === "7d") {
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + (healthTimeOffset * 7));
        const weekDays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
        for (let i = 6; i >= 0; i--) {
            let d = new Date(endDate);
            d.setDate(endDate.getDate() - i);
            labels.push(weekDays[d.getDay()]);
        }
        dataPoints = 7;
    } else if (currentHealthTimeframe === "1m") {
        labels = new Array(30).fill("");
        dataPoints = 30;
    } else if (currentHealthTimeframe === "1y") {
        const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
        const targetMonth = today.getMonth() + (healthTimeOffset * 12);
        for (let i = 11; i >= 0; i--) {
            let d = new Date(today.getFullYear(), targetMonth - i, 1);
            labels.push(monthNames[d.getMonth()]);
        }
        dataPoints = 12;
    } else if (currentHealthTimeframe === "10y") {
        let currentYear = today.getFullYear() + (healthTimeOffset * 10);
        for(let i=0; i<10; i++) labels.push((currentYear - 9 + i).toString());
        dataPoints = 10;
    } else if (currentHealthTimeframe === "all") {
        for(let y=2021; y<=today.getFullYear(); y++) labels.push(y.toString());
        dataPoints = labels.length;
    }

    const conf = healthConfig[currentHealthMetric] || healthConfig.ruhepuls;
    let demoData = [];
    for (let i = 0; i < dataPoints; i++) {
        let rand = (Math.random() * conf.variance * 2) - conf.variance;
        let val = conf.baseVal + rand + (healthTimeOffset * 0.5); 
        demoData.push(val.toFixed(1));
    }

    healthChart.data.labels = labels;
    healthChart.data.datasets[0].label = conf.label;
    healthChart.data.datasets[0].data = demoData;
    healthChart.data.datasets[0].borderColor = conf.color;
    healthChart.data.datasets[0].backgroundColor = conf.color + "33"; 
    healthChart.update();
}

function initHealthChart() {
    const ctx = document.getElementById('gesundheitChart').getContext('2d');
    healthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Wert',
                data: [],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                y: { beginAtZero: false },
                x: { grid: { display: false } }
            }
        }
    });
}

function openAddModal() {
    const modal = document.getElementById("addModal");
    const unitLabel = document.getElementById("modalUnit");
    const title = document.getElementById("modalTitle");
    const input = document.getElementById("measurementInput");
    
    const conf = healthConfig[currentHealthMetric] || healthConfig.ruhepuls;

    if (currentHealthMetric === "ruhepuls") {
        title.innerText = "Ruhepuls eintragen";
    } else if (currentHealthMetric === "gewicht") {
        title.innerText = "Gewicht eintragen";
    } else if (currentHealthMetric === "hrv") {
        title.innerText = "HRV eintragen";
    }

    unitLabel.innerText = conf.unit;
    unitLabel.style.color = conf.color;

    input.value = "";
    modal.style.display = "flex";
}

function closeAddModal() {
    document.getElementById("addModal").style.display = "none";
}

function saveMeasurement() {
    const val = document.getElementById("measurementInput").value;
    if (val === "") {
        alert("Bitte einen Wert eingeben!");
        return;
    }
    
    alert(`Erfolgreich gespeichert: ${val} ${document.getElementById("modalUnit").innerText}`);
    closeAddModal();
}


// --- ZONEN LOGIK ---

function selectZoneMetric(metric) {
    currentZoneMetric = metric;

    document.getElementById("btnLeistung").classList.remove("active");
    document.getElementById("btnHf").classList.remove("active");

    if (metric === "leistung") document.getElementById("btnLeistung").classList.add("active");
    if (metric === "hf") document.getElementById("btnHf").classList.add("active");

    renderZones();
}

function renderZones() {
    const container = document.getElementById("zonesContainer");
    container.innerHTML = "";

    const list = zonesData[currentZoneMetric];

    list.forEach((zone, index) => {
        const box = document.createElement("div");
        box.style.cssText = "background: #fdfdfd; padding: 18px 15px; border-radius: 14px; border: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; cursor: pointer; transition: background 0.2s;";

        box.onclick = () => openZoneEditModal(index);

        box.innerHTML = `
            <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: ${zone.color};"></div>

            <strong style="font-size: 15px; color: #111; padding-left: 8px;">${zone.name}</strong>

            <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 14px; color: #ff7a00; background: #fff3e6; padding: 6px 12px; border-radius: 8px; font-weight: bold; border: 1px solid #ffe0b2;">
                    ${zone.range} ✏️
                </span>
            </div>
        `;
        container.appendChild(box);
    });
}

function openZoneEditModal(index) {
    editingZoneIndex = index;
    const zone = zonesData[currentZoneMetric][index];

    document.getElementById("zoneEditTitle").innerText = `${zone.name} anpassen`;
    document.getElementById("zoneRangeInput").value = zone.range;
    document.getElementById("zoneEditModal").style.display = "flex";
}

function closeZoneEditModal() {
    document.getElementById("zoneEditModal").style.display = "none";
    editingZoneIndex = null;
}

function saveZoneRange() {
    const newValue = document.getElementById("zoneRangeInput").value;

    if (newValue.trim() === "") {
        alert("Bitte einen Wertebereich eingeben!");
        return;
    }

    if (editingZoneIndex !== null) {
        zonesData[currentZoneMetric][editingZoneIndex].range = newValue;
        renderZones();
    }

    closeZoneEditModal();
}