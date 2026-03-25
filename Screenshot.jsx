// === SCRIPT UXP : Screenshot.jsx ===

async function takeScreenshot() {
    const ppro = require("premierepro");
    const uxpFS = require("uxp").storage.localFileSystem;

    try {
        console.log("📸 Préparation du Screenshot...");

        // 1. On récupère le projet et la séquence active (Moniteur Programme)
        let proj = await ppro.Project.getActiveProject();
        if (!proj) {
            console.log("⚠️ Aucun projet actif.");
            return;
        }

        let seq = await proj.getActiveSequence();
        if (!seq) {
            console.log("⚠️ Aucune séquence active (Moniteur Programme vide).");
            return;
        }

        // 2. On récupère la position temporelle et la résolution maximale de la séquence
        let time = await seq.getPlayerPosition();
        let frameSize = await seq.getFrameSize();
        let width = frameSize.width;
        let height = frameSize.height;

        // 3. Génération du nom de fichier par défaut (Date et Heure exactes)
        let now = new Date();
        let pad = (num) => String(num).padStart(2, '0');
        let dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        let timeStr = `${pad(now.getHours())}h${pad(now.getMinutes())}m${pad(now.getSeconds())}`;
        let defaultName = `Screenshot_${dateStr}_a_${timeStr}.png`;

        // 4. Appel de l'explorateur de fichiers natif de ton système (Windows ou Mac)
        let file;
        try {
            file = await uxpFS.getFileForSaving(defaultName, {
                types: ["png", "jpg", "tif"] // Formats supportés par l'API Exporter
            });
        } catch (e) {
            console.log("⚠️ Export annulé par l'utilisateur.");
            return;
        }

        if (!file) {
            console.log("⚠️ Export annulé.");
            return;
        }

        // 5. L'API d'export de Premiere exige de séparer le dossier et le nom du fichier.
        // On sépare donc le chemin d'accès renvoyé par le File System UXP.
        let nativePath = file.nativePath;
        let separator = nativePath.includes('\\') ? '\\' : '/'; // Détecte Windows (\) ou Mac (/)
        let parts = nativePath.split(separator);
        let fileName = parts.pop();
        let folderPath = parts.join(separator) + separator;

        console.log(`⏳ Export en cours... (${width}x${height})`);

        // 6. On déclenche le moteur d'export C++
        let success = await ppro.Exporter.exportSequenceFrame(seq, time, fileName, folderPath, width, height);

        if (success) {
            console.log(`✅ Screenshot sauvegardé avec succès : ${nativePath}`);
        } else {
            console.error("❌ Échec de la sauvegarde. L'API a refusé l'export.");
        }

    } catch (error) {
        console.error("❌ Erreur Fatale : ", error);
    }
}

await takeScreenshot();
