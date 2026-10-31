// =======================================
// Maximum Fire - auth-helper.js
// =======================================

/**
 * Gibt den aktuell eingeloggten Nutzer zurück.
 * Liefert null, wenn kein Nutzer angemeldet ist oder es sich um einen anonymen Gast handelt.
 * @returns {firebase.User|null}
 */
function getAuthenticatedUser() {
    const user = firebase.auth().currentUser;
    if (user && !user.isAnonymous) {
        return user;
    }
    return null;
}

/**
 * Überwacht den Login-Status und führt entsprechende Callbacks aus.
 * @param {Function} onLoggedIn - Wird aufgerufen, wenn ein Nutzer angemeldet ist (erhält user-Objekt)
 * @param {Function} onLoggedOut - Optionaler Callback, wenn der Nutzer unangemeldet/Gast ist
 */
function initAuthObserver(onLoggedIn, onLoggedOut) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user && !user.isAnonymous) {
            console.log("🔥 Eingeloggt als Cloud-Nutzer:", user.uid);
            if (onLoggedIn) onLoggedIn(user);
        } else {
            console.log("💾 Nicht angemeldet: Lokaler Modus aktiv.");
            if (onLoggedOut) onLoggedOut();
        }
    });
}