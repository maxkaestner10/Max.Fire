// =======================================
// Maximum Fire - stat-aktivitaeten.js
// Dynamisch basierend auf dem aktuellen Datum
// =======================================

let chartInstance = null;
let currentMetric = "distanz";
let currentTimeframe = "7d";
let timeOffset = 0; // 0 = aktuell, -1 = ein Schritt zurück etc.

// Konfiguration der verschiedenen Metriken
const metricsConfig = {
    distanz:  { label: "Distanz (km)", color: "#3498db",  maxVal: 120 },
    zeit:     { label: "Zeit (h)",      color: "#f1c40f",  maxVal: 5 },
    tss:      { label: "TSS",           color: "#e74c3c",  maxVal: 150 },
    anstieg:  { label: "Anstieg (hm)",  color: "#2ecc71",  maxVal: 2000 },
    kalorien: { label: "Kalorien (kcal)",color: "#ff7a00", maxVal: 3000 }
};

document.addEventListener("DOMContentLoaded", () => {
    initChart();
    updateDashboard();
});

// Klick auf eine Metrik (Distanz, Zeit, TSS etc.)
function selectMetric(metric) {
    currentMetric = metric;

    document.querySelectorAll('.chart-buttons .chart-btn').forEach(btn => btn.classList.remove('active'));
    
    if(metric === 'distanz') document.getElementById("btnDistanz").classList.add('active');
    if(metric === 'zeit') document.getElementById("btnZeit").classList.add('active');
    if(metric === 'tss') document.getElementById("btnTSS").classList.add('active');
    if(metric === 'anstieg') document.getElementById("btnAnstieg").classList.add('active');
    if(metric === 'kalorien') document.getElementById("btnKalorien").classList.add('active');

    updateDashboard();
}

// Klick auf das Zeitraum-Dropdown
function changeTimeframe() {
    currentTimeframe = document.getElementById("timeframeSelect").value;
    timeOffset = 0; // Beim Wechsel des Zeitraums zurück zur Gegenwart
    updateDashboard();
}

// Klick auf die Pfeile (Zurück / Vor)
function shiftOffset(direction) {
    timeOffset += direction;
    if (timeOffset > 0) timeOffset = 0; // Zukunft sperren
    updateDashboard();
}

// Zentrales Update für UI und Chart
function updateDashboard() {
    updateNavigationUI();
    updateChartData();
}

// Passt die Hauptzeile (Datum) und Unterzeile (blasser Hinweis) an
function updateNavigationUI() {
    const nextBtn = document.getElementById("nextBtn");
    const rangeText = document.getElementById("dateRangeText");
    const subText = document.getElementById("dateSubText");

    // Vor-Button aktivieren/deaktivieren
    if (timeOffset === 0) {
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
    const past = Math.abs(timeOffset);

    // 1. 7 TAGE
    if (currentTimeframe === "7d") {
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + (timeOffset * 7));
        
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);

        const startStr = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth()+1).toString().padStart(2, '0')}.`;
        const endStr = `${endDate.getDate().toString().padStart(2, '0')}.${(endDate.getMonth()+1).toString().padStart(2, '0')}.${endDate.getFullYear()}`;
        
        rangeText.innerText = `${startStr} – ${endStr}`;
        subText.innerText = (timeOffset === 0) ? "Aktuelle 7 Tage" : `${past} Woche(n) zurück`;
    }
    // 2. 1 MONAT / 30 TAGE
    else if (currentTimeframe === "1m") {
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + (timeOffset * 30));

        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 29);

        const startStr = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth()+1).toString().padStart(2, '0')}.`;
        const endStr = `${endDate.getDate().toString().padStart(2, '0')}.${(endDate.getMonth()+1).toString().padStart(2, '0')}.${endDate.getFullYear()}`;

        rangeText.innerText = `${startStr} – ${endStr}`;
        subText.innerText = (timeOffset === 0) ? "Aktueller Monat" : `${past} Monat(e) zurück`;
    }
    // 3. 1 JAHR
    else if (currentTimeframe === "1y") {
        const currentMonthIndex = today.getMonth();
        const currentYear = today.getFullYear();

        const endMonthIndex = currentMonthIndex + (timeOffset * 12);
        const endDate = new Date(currentYear, endMonthIndex, 1);
        const startDate = new Date(currentYear, endMonthIndex - 11, 1);

        const startLabel = `${monthNamesShort[startDate.getMonth()]} ${startDate.getFullYear()}`;
        const endLabel = `${monthNamesShort[endDate.getMonth()]} ${endDate.getFullYear()}`;

        rangeText.innerText = `${startLabel} – ${endLabel}`;
        subText.innerText = (timeOffset === 0) ? "Aktuelles Jahr" : `${past} Jahr(e) zurück`;
    }
    // 4. 10 JAHRE
    else if (currentTimeframe === "10y") {
        const currentYear = today.getFullYear() + (timeOffset * 10);
        const startYear = currentYear - 9;
        rangeText.innerText = `${startYear} – ${currentYear}`;
        subText.innerText = (timeOffset === 0) ? "Letzte 10 Jahre" : `Vor ${past * 10} Jahren`;
    }
    // 5. GESAMT
    else if (currentTimeframe === "all") {
        const currentYear = today.getFullYear();
        const startYear = 2021;
        rangeText.innerText = `${startYear} – ${currentYear}`;
        subText.innerText = "Gesamter Zeitraum";
    }
}

// Generiert die Achsen-Namen DYNAMISCH basierend auf dem heutigen Datum
function updateChartData() {
    let labels = [];
    let dataPoints = 0;

    const today = new Date();

    // 1. DYNAMISCH: 7 TAGE
    if (currentTimeframe === "7d") {
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + (timeOffset * 7));

        const weekDaysShort = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
        
        for (let i = 6; i >= 0; i--) {
            let d = new Date(endDate);
            d.setDate(endDate.getDate() - i);
            labels.push(weekDaysShort[d.getDay()]);
        }
        dataPoints = 7;
    } 
    // 2. DYNAMISCH: 1 MONAT (30 Tage)
    else if (currentTimeframe === "1m") {
        labels = new Array(30).fill("");
        dataPoints = 30;
    } 
    // 3. DYNAMISCH: 1 JAHR (12 Monate rollend)
    else if (currentTimeframe === "1y") {
        const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
        const currentMonthIndex = today.getMonth();
        const currentYear = today.getFullYear();

        let targetMonth = currentMonthIndex + (timeOffset * 12);

        for (let i = 11; i >= 0; i--) {
            let d = new Date(currentYear, targetMonth - i, 1);
            labels.push(monthNames[d.getMonth()]);
        }
        dataPoints = 12;
    } 
    // 4. DYNAMISCH: 10 JAHRE
    else if (currentTimeframe === "10y") {
        const currentYear = today.getFullYear() + (timeOffset * 10);
        const startYear = currentYear - 9;
        
        for (let y = startYear; y <= currentYear; y++) {
            labels.push(y.toString());
        }
        dataPoints = 10;
    } 
    // 5. DYNAMISCH: GESAMT
    else if (currentTimeframe === "all") {
        const currentYear = today.getFullYear();
        const startYear = 2021;
        
        for (let y = startYear; y <= currentYear; y++) {
            labels.push(y.toString());
        }
        dataPoints = labels.length;
    }

    // Demodaten generieren
    const conf = metricsConfig[currentMetric];
    let demoData = [];
    for (let i = 0; i < dataPoints; i++) {
        let val = Math.random() * conf.maxVal;
        val = val * (1 + (timeOffset * 0.05)); 
        if (val < 0) val = 0;

        if(currentMetric === "zeit") {
            demoData.push(val.toFixed(1));
        } else {
            demoData.push(Math.round(val));
        }
    }

    // Diagramm aktualisieren
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].label = conf.label;
    chartInstance.data.datasets[0].data = demoData;
    chartInstance.data.datasets[0].backgroundColor = conf.color;
    
    chartInstance.update();
}

// Chart.js initialisieren
function initChart() {
    const ctx = document.getElementById('aktivitaetenChart').getContext('2d');
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Wert',
                data: [],
                backgroundColor: '#ff7a00',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}