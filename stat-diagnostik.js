// =======================================
// Maximum Fire - stat-diagnostik.js
// =======================================

let selectedTest = null;

const testConfigs = {
    cp20: {
        title: "CP 20 min Test",
        description: "20-Minuten All-Out Test zur Bestimmung der FTP / CP."
    },
    stufe3: {
        title: "3 min Stufentest",
        description: "Stufentest mit 3-minütiger Stufendauer zur Schwellenbestimmung."
    },
    stufe5: {
        title: "5 min Stufentest",
        description: "Stufentest mit 5-minütiger Stufendauer für tiefergehende physiologische Analysen."
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // Falls später Parameter über die URL übergeben werden sollen:
    const urlParams = new URLSearchParams(window.location.search);
    const testType = urlParams.get('test');

    if (testType && testConfigs[testType]) {
        selectTestType(testType);
    }
});

function selectTestType(type) {
    selectedTest = type;

    // Visuals der Karten zurücksetzen
    ['cp20', 'stufe3', 'stufe5'].forEach(t => {
        const card = document.getElementById(`card-${t}`);
        if (card) {
            card.style.borderColor = "#eee";
            card.style.background = "#fdfdfd";
        }
    });

    // Aktive Karte hervorheben
    const activeCard = document.getElementById(`card-${type}`);
    if (activeCard) {
        activeCard.style.borderColor = "#ff7a00";
        activeCard.style.background = "#fff3e6";
    }

    // Inhaltbereich anzeigen & vorbereiten
    const contentArea = document.getElementById("testContentArea");
    const title = document.getElementById("selectedTestTitle");
    const body = document.getElementById("selectedTestBody");

    contentArea.style.display = "block";
    title.innerText = testConfigs[type].title;
    
    // Platzhalter für den nächsten Schritt:
    body.innerHTML = `<p style="color: #666; font-size: 14px;"><em>${testConfigs[type].description}</em></p>`;

    // Sanftes Scrollen zum Auswertungsbereich
    contentArea.scrollIntoView({ behavior: 'smooth' });
}