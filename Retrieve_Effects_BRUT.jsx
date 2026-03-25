// === SCRIPT UXP : Retrieve Effects BRUT ===

const fs = require("uxp").storage.localFileSystem;

async function exportEffects() {
    // On propose d'enregistrer directement sous le nom Effects_BRUT.data
    const outFile = await fs.getFileForSaving("Effects_BRUT.data", {
        types: ["data", "txt"]
    });

    if (!outFile) {
        console.log("Export annulé par l'utilisateur.");
        return; 
    }

    const videoFactory = ppro.VideoFilterFactory;
    const audioFactory = ppro.AudioFilterFactory;
    const transitionFactory = ppro.TransitionFactory;
    
    // 1. Vidéo : On récupère les noms BRUTS (MatchNames)
    const videoEffects = await videoFactory.getMatchNames();
    
    // 2. Audio : On doit utiliser les DisplayNames car getMatchNames() n'existe pas encore en UXP pour l'audio
    const audioEffects = await audioFactory.getDisplayNames();
    
    // 3. Transitions Vidéo : Noms BRUTS
    let videoTransitions = [];
    if (transitionFactory && transitionFactory.getVideoTransitionMatchNames) {
        videoTransitions = await transitionFactory.getVideoTransitionMatchNames();
    }

    const audioTransitions = []; 

    let content = "";

    // --- 1. FX_V : EFFETS VIDÉO (BRUT) ---
    if (videoEffects && videoEffects.length > 0) {
        for (let i = 0; i < videoEffects.length; i++) {
            content += "[FX_V] - " + videoEffects[i] + "\n";
        }
    }

    // --- 2. FX_A : EFFETS AUDIO (DisplayNames par défaut) ---
    if (audioEffects && audioEffects.length > 0) {
        for (let j = 0; j < audioEffects.length; j++) {
            content += "[FX_A] - " + audioEffects[j] + "\n";
        }
    }

    // --- 3. TR_V : TRANSITIONS VIDÉO (BRUT, sans nettoyage) ---
    if (videoTransitions && videoTransitions.length > 0) {
        for (let k = 0; k < videoTransitions.length; k++) {
            // On ne fait plus le .replace("PR.ADBE ", "")
            content += "[TR_V] - " + videoTransitions[k] + "\n";
        }
    }

    // --- 4. TR_A : TRANSITIONS AUDIO ---
    if (audioTransitions && audioTransitions.length > 0) {
        for (let l = 0; l < audioTransitions.length; l++) {
            content += "[TR_A] - " + audioTransitions[l] + "\n";
        }
    }

    await outFile.write(content);

    alert("✅ Fichier BRUT généré ! (Note : Les effets audio utilisent encore leurs noms d'affichage à cause d'une limite de l'API Premiere).");
}

await exportEffects();