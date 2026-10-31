// =======================================
// Maximum Fire - profil.js
// =======================================

document.addEventListener("DOMContentLoaded", () => {
    // Observer registrieren: Passt die UI an den Login-Status an
    firebase.auth().onAuthStateChanged((user) => {
        renderAuthSection(user);
        loadProfileData();
    });
});

/**
 * Rendert das Login-/Registrierungs-Formular oder den Status bei aktivem Login
 */
function renderAuthSection(user) {
    const authCard = document.getElementById("authCard");
    if (!authCard) return;

    if (user && !user.isAnonymous) {
        // Fall A: Nutzer ist angemeldet
        authCard.innerHTML = `
            <h2>🔑 Account Status</h2>
            <div style="background: #e8f5e9; border: 1px solid #a5d6a7; padding: 15px; border-radius: 12px; margin-bottom: 15px;">
                <p style="margin: 0; color: #2e7d32; font-weight: bold;">✅ Eingeloggt als:</p>
                <p style="margin: 5px 0 0 0; word-break: break-all; font-weight: bold; font-size: 16px;">${user.email}</p>
                <span style="font-size: 12px; color: #555; display: block; margin-top: 6px;">☁️ Deine Daten werden automatisch in der Cloud gesichert.</span>
            </div>
            <button onclick="handleLogout()" style="width: 100%; padding: 12px; background: #e74c3c; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                🚪 Abmelden
            </button>
        `;
    } else {
        // Fall B: Unangemeldet (Gast-Modus)
        authCard.innerHTML = `
            <h2>🔑 Account Login / Registrierung</h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
                Melde dich an, um deine Daten sicher in der Cloud zu speichern.
            </p>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">E-Mail:</label>
                    <input type="email" id="authEmail" placeholder="name@beispiel.de" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; font-size: 16px;">
                </div>

                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">Passwort:</label>
                    <input type="password" id="authPassword" placeholder="••••••••" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; font-size: 16px;">
                </div>

                <div style="display: flex; gap: 10px; margin-top: 5px;">
                    <button onclick="handleLogin()" style="flex: 1; padding: 12px; background: #ff7a00; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                        Anmelden
                    </button>
                    <button onclick="handleRegister()" style="flex: 1; padding: 12px; background: #34495e; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                        Registrieren
                    </button>
                </div>
                
                <p style="font-size: 12px; color: #888; text-align: center; margin-top: 5px;">
                    ℹ️ Nicht angemeldet? Deine Eingaben werden nur lokal im Browser gesichert.
                </p>
            </div>
        `;
    }
}

/**
 * Login mit E-Mail & Passwort
 */
async function handleLogin() {
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value.trim();

    if (!email || !password) {
        alert("Bitte gib E-Mail und Passwort ein.");
        return;
    }

    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        alert("✅ Erfolgreich angemeldet!");
    } catch (error) {
        console.error("Login-Fehler:", error);
        alert("Fehler beim Anmelden: " + error.message);
    }
}

/**
 * Account neu registrieren
 */
async function handleRegister() {
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value.trim();

    if (!email || !password) {
        alert("Bitte gib E-Mail und Passwort ein.");
        return;
    }

    if (password.length < 6) {
        alert("Das Passwort muss mindestens 6 Zeichen lang sein.");
        return;
    }

    try {
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        alert("🎉 Account erfolgreich erstellt!");
    } catch (error) {
        console.error("Registrierungs-Fehler:", error);
        alert("Fehler bei der Registrierung: " + error.message);
    }
}

/**
 * Nutzer abmelden
 */
async function handleLogout() {
    try {
        await firebase.auth().signOut();
        alert("Du wurdest abgemeldet.");
    } catch (error) {
        console.error("Logout-Fehler:", error);
    }
}

/**
 * Lädt bestehende Profil-Stammdaten (aus Firestore oder localStorage via data-manager.js)
 */
async function loadProfileData() {
    const data = await loadDocument("profile", "main");
    if (data) {
        if (data.gewicht) document.getElementById("inputGewicht").value = data.gewicht;
        if (data.ruhepuls) document.getElementById("inputRuhepuls").value = data.ruhepuls;
        if (data.ftp) document.getElementById("inputFTP").value = data.ftp;
        if (data.maxHR) document.getElementById("inputMaxHR").value = data.maxHR;
    }
}

/**
 * Speichert Stammdaten in Firestore (falls angemeldet) oder localStorage (falls unangemeldet)
 */
async function saveProfileData() {
    const gewicht = parseFloat(document.getElementById("inputGewicht").value) || null;
    const ruhepuls = parseInt(document.getElementById("inputRuhepuls").value) || null;
    const ftp = parseInt(document.getElementById("inputFTP").value) || null;
    const maxHR = parseInt(document.getElementById("inputMaxHR").value) || null;

    const profileData = {
        gewicht: gewicht,
        ruhepuls: ruhepuls,
        ftp: ftp,
        maxHR: maxHR,
        updatedAt: new Date().toISOString()
    };

    await saveDocument("profile", "main", profileData);

    const user = getAuthenticatedUser();
    const speicherort = user ? "in der Firebase Cloud" : "lokal im Browser";
    alert(`✅ Stammdaten wurden ${speicherort} gespeichert!`);
}