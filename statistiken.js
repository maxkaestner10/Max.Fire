// =======================================
// Maximum Fire - statistiken.js
// =======================================

console.log("Statistik-Skript geladen.");

function openStatDetail(category) {
    const detailCard = document.getElementById("statDetailCard");
    const detailTitle = document.getElementById("statDetailTitle");
    const detailContent = document.getElementById("statDetailContent");

    detailCard.style.display = "block";

    switch(category) {
        case 'pr':
            detailTitle.textContent = "🏆 Personal Records (PR)";
            detailContent.innerHTML = `
                <ul style="margin: 15px 0 0 20px; line-height: 1.8;">
                    <li><strong>1 Min Max Watt:</strong> 450 W</li>
                    <li><strong>5 Min Max Watt:</strong> 320 W</li>
                    <li><strong>Längste Ausfahrt:</strong> 4:30 h (112 km)</li>
                    <li><strong>Höhenmeter an einem Tag:</strong> 2.400 hm</li>
                </ul>`;
            break;

        case 'aktivitaeten':
            detailTitle.textContent = "🚴 Aktivitäten";
            detailContent.innerHTML = `
                <p>Gesamtwerte der letzten 30 Tage:</p>
                <div class="load-box" style="margin-top: 15px;">
                    <div style="background:#fdfdfd; padding:15px; border-radius:12px;"><span>Gesamtzeit</span><br><strong>48:15 h</strong></div>
                    <div style="background:#fdfdfd; padding:15px; border-radius:12px;"><span>Strecke</span><br><strong>1.240 km</strong></div>
                    <div style="background:#fdfdfd; padding:15px; border-radius:12px;"><span>Einheiten</span><br><strong>18</strong></div>
                </div>`;
            break;

        case 'leistungszustand':
            detailTitle.textContent = "⚡ Leistungszustand";
            detailContent.innerHTML = `
                <p style="margin-top: 10px; font-size: 20px; font-weight: bold; color: #ff7a00;">CTL (Fitness): 84.5</p>
                <p style="color: #666; font-size: 14px; margin-top: 5px;">Steigerung um +3.2 zum Vormonat. Gute Form!</p>`;
            break;

        case 'gesundheit':
            detailTitle.textContent = "❤️ Gesundheit";
            detailContent.innerHTML = `
                <ul style="margin: 15px 0 0 20px; line-height: 1.8;">
                    <li><strong>Ruhepuls:</strong> 45 bpm (Stabil)</li>
                    <li><strong>HRV (Herzratenvariabilität):</strong> 80 ms (Sehr gut erholt)</li>
                    <li><strong>Schlaf:</strong> 85%</li>
                </ul>`;
            break;

        case 'zonen':
            detailTitle.textContent = "📈 Zonen";
            detailContent.innerHTML = `
                <ul style="margin: 15px 0 0 20px; line-height: 1.8;">
                    <li><strong>Z1 (Recovery):</strong> 20%</li>
                    <li><strong>Z2 (Grundlage):</strong> 55%</li>
                    <li><strong>Z3 (Tempo):</strong> 12%</li>
                    <li><strong>Z4-Z5 (Schwelle / VO2max):</strong> 13%</li>
                </ul>`;
            break;

        default:
            detailTitle.textContent = "Statistik";
            detailContent.innerHTML = "<p>Keine Daten verfügbar.</p>";
    }

    detailCard.scrollIntoView({ behavior: 'smooth' });
}