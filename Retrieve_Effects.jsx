// === SCRIPT UXP : Retrieve Effects (Format Effects.data) ===

const fs = require("uxp").storage.localFileSystem;

async function exportEffects() {
    // On propose d'enregistrer directement sous le nom Effects.data
    const outFile = await fs.getFileForSaving("Effects.data", {
        types: ["data", "txt"]
    });

    if (!outFile) {
        console.log("Export annulé par l'utilisateur.");
        return; 
    }

    // On appelle les "Factories" officielles de l'API UXP
    const videoFactory = ppro.VideoFilterFactory;
    const audioFactory = ppro.AudioFilterFactory;
    const transitionFactory = ppro.TransitionFactory;
    
    // On récupère les listes des effets (ce qui fonctionnait déjà très bien)
    const videoEffects = await videoFactory.getDisplayNames();
    const audioEffects = await audioFactory.getDisplayNames();
    
    // Pour les transitions vidéo, seule la méthode MatchNames existe pour le moment
    let videoTransitions = [];
    if (transitionFactory && transitionFactory.getVideoTransitionMatchNames) {
        videoTransitions = await transitionFactory.getVideoTransitionMatchNames();
    }

    // Les transitions audio ne sont pas encore exposées par l'API UXP, on prépare un tableau vide
    const audioTransitions = []; 

    let content = "";

    // --- 1. FX_V : EFFETS VIDÉO ---
    if (videoEffects && videoEffects.length > 0) {
        for (let i = 0; i < videoEffects.length; i++) {
            content += "[FX_V] - " + videoEffects[i] + "\n";
        }
    }

    // --- 2. FX_A : EFFETS AUDIO ---
    if (audioEffects && audioEffects.length > 0) {
        for (let j = 0; j < audioEffects.length; j++) {
            content += "[FX_A] - " + audioEffects[j] + "\n";
        }
    }

    // --- 3. TR_V : TRANSITIONS VIDÉO ---
    if (videoTransitions && videoTransitions.length > 0) {
        for (let k = 0; k < videoTransitions.length; k++) {
            let tName = videoTransitions[k];
            // Nettoyage du préfixe interne système d'Adobe pour que ça ressemble à un DisplayName
            if(tName.startsWith("PR.ADBE ")) {
                 tName = tName.replace("PR.ADBE ", "");
            }
            content += "[TR_V] - " + tName + "\n";
        }
    }

    // --- 4. TR_A : TRANSITIONS AUDIO ---
    if (audioTransitions && audioTransitions.length > 0) {
        for (let l = 0; l < audioTransitions.length; l++) {
            content += "[TR_A] - " + audioTransitions[l] + "\n";
        }
    }

    // Écrire le contenu brut sans en-tête ni fioritures
    await outFile.write(content);

    // --- CORRECTION ICI ---
    // On utilise window.alert de manière explicite, et on log dans la console en backup
    console.log("✅ PARFAIT ! Le fichier a été généré au format strict de l'ancien Effects.data !");
    if (typeof window !== "undefined" && window.alert) {
        window.alert("✅ PARFAIT ! Le fichier a été généré au format strict de l'ancien Effects.data !");
    }
}

await exportEffects();