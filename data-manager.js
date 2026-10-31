// =======================================
// Maximum Fire - data-manager.js
// =======================================

// Dokument in Firestore oder LocalStorage speichern
async function saveDocument(collectionName, docId, data) {
    const user = getAuthenticatedUser();

    if (user) {
        // ☁️ CLOUD-SPEICHERUNG (Firestore)
        try {
            await firebase.firestore()
                .collection("users")
                .doc(user.uid)
                .collection(collectionName)
                .doc(docId)
                .set(data, { merge: true });
            console.log(`☁️ Cloud: ${collectionName}/${docId} erfolgreich gespeichert.`);
        } catch (error) {
            console.error("❌ Fehler beim Cloud-Speichern:", error);
            alert("Fehler beim Speichern in der Cloud: " + error.message);
        }
    } else {
        // 💾 LOKALE SPEICHERUNG (Browser)
        const localKey = `mf_${collectionName}_${docId}`;
        localStorage.setItem(localKey, JSON.stringify(data));
        console.log(`💾 Lokal: ${localKey} gespeichert.`);
    }
}

// Dokument aus Firestore oder LocalStorage laden
async function loadDocument(collectionName, docId) {
    const user = getAuthenticatedUser();

    if (user) {
        // ☁️ CLOUD-ABFRAGE
        try {
            const doc = await firebase.firestore()
                .collection("users")
                .doc(user.uid)
                .collection(collectionName)
                .doc(docId)
                .get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error("❌ Fehler beim Laden aus der Cloud:", error);
            return null;
        }
    } else {
        // 💾 LOKALE ABFRAGE
        const localKey = `mf_${collectionName}_${docId}`;
        const saved = localStorage.getItem(localKey);
        return saved ? JSON.parse(saved) : null;
    }
}
    