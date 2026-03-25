// === SCRIPT UXP : Grave Robber v12.1 (Full Extraction & Collision Fix) ===

async function unnestAndUnmerge() {
    const ppro = require("premierepro");

    try {
        console.log("🔍 Démarrage de l'extraction (Grave Robber v12.1 - Radar Fix)...");
        
        let proj = await ppro.Project.getActiveProject();
        let seq = await proj.getActiveSequence();
        let sel = await seq.getSelection();
        let trackItems = await sel.getTrackItems();

        if (!trackItems || trackItems.length === 0) {
            console.log("⚠️ Aucune sélection trouvée.");
            return;
        }

        let indicesOfNests = []; 
        let blueprints = [];

        // ==========================================
        // PHASE 1 : RADAR CIBLÉ (Bounding Box)
        // ==========================================
        let mainTimelineBlocks = [];
        let zoneMinTicks = Infinity;
        let zoneMaxTicks = -Infinity;
        
        for (let item of trackItems) {
            let s = Number((await item.getStartTime()).ticks);
            let e = Number((await item.getEndTime()).ticks);
            if (s < zoneMinTicks) zoneMinTicks = s;
            if (e > zoneMaxTicks) zoneMaxTicks = e;
        }

        let safeZoneMin = zoneMinTicks - 10000000000000; 
        let safeZoneMax = zoneMaxTicks + 10000000000000; 

        let vCountMain = await seq.getVideoTrackCount();
        for (let i = 0; i < vCountMain; i++) {
            let t = await seq.getVideoTrack(i);
            if (!t) continue;
            let items = t.getTrackItems(ppro.Constants.TrackItemType.CLIP, false);
            for (let item of items) {
                if (await item.getIsSelected()) continue;
                let start = Number((await item.getStartTime()).ticks);
                let end = Number((await item.getEndTime()).ticks);
                if (end <= safeZoneMin) continue; 
                if (start >= safeZoneMax) break; 
                mainTimelineBlocks.push({ type: "VIDEO", trackIndex: i, start: start, end: end });
            }
        }

        let aCountMain = await seq.getAudioTrackCount();
        for (let i = 0; i < aCountMain; i++) {
            let t = await seq.getAudioTrack(i);
            if (!t) continue;
            let items = t.getTrackItems(ppro.Constants.TrackItemType.CLIP, false);
            for (let item of items) {
                if (await item.getIsSelected()) continue;
                let start = Number((await item.getStartTime()).ticks);
                let end = Number((await item.getEndTime()).ticks);
                if (end <= safeZoneMin) continue; 
                if (start >= safeZoneMax) break;
                mainTimelineBlocks.push({ type: "AUDIO", trackIndex: i, start: start, end: end });
            }
        }

        // 🌟 LE CORRECTIF EST ICI : J'ai remis inT et outT !
        function hasCollision(type, trackIndex, inTicks, outTicks) {
            let inT = Number(inTicks);
            let outT = Number(outTicks);
            for (let block of mainTimelineBlocks) {
                if (block.type === type && block.trackIndex === trackIndex) {
                    if (block.start < outT && block.end > inT) return true;
                }
            }
            return false;
        }

        // ==========================================
        // PHASE 2 : DÉTERRAGE GLOBAL ET MATHÉMATIQUES
        // ==========================================
        for (let i = 0; i < trackItems.length; i++) {
            let item = trackItems[i];
            let projItem = await item.getProjectItem();
            if (!projItem) continue;
            let clipItem = ppro.ClipProjectItem.cast(projItem);
            if (!clipItem || !(await clipItem.isSequence())) continue;

            indicesOfNests.push(i);
            
            let nestStartTicks = Number((await item.getStartTime()).ticks);
            let nestInTicks = Number((await item.getInPoint()).ticks);
            let nestTrackIndex = await item.getTrackIndex();
            
            let nestedSeq = await clipItem.getSequence();
            if (!nestedSeq) continue;

            let nestBlueprints = [];
            
            let offsetTicks = nestStartTicks - nestInTicks; 

            const processTrack = async (track, trackOffset, trackType) => {
                if (!track) return;
                let innerItems = track.getTrackItems(ppro.Constants.TrackItemType.CLIP, false);

                for (let innerItem of innerItems) {
                    let innerStartTicks = Number((await innerItem.getStartTime()).ticks);
                    let innerEndTicks = Number((await innerItem.getEndTime()).ticks);

                    let cloneStartTicks = innerStartTicks + offsetTicks;
                    let cloneEndTicks = innerEndTicks + offsetTicks;

                    nestBlueprints.push({
                        name: await innerItem.getName(),
                        originalTrackItem: innerItem, 
                        type: trackType,
                        internalTrack: trackOffset,
                        cloneStartTicks: cloneStartTicks,
                        cloneEndTicks: cloneEndTicks,
                        tOffsetTicks: String(offsetTicks),
                        originalTrackIndex: await innerItem.getTrackIndex()
                    });
                }
            };

            let vCount = await nestedSeq.getVideoTrackCount();
            for (let v = 0; v < vCount; v++) await processTrack(await nestedSeq.getVideoTrack(v), v, "VIDEO");

            let aCount = await nestedSeq.getAudioTrackCount();
            for (let a = 0; a < aCount; a++) await processTrack(await nestedSeq.getAudioTrack(a), a, "AUDIO");

            // --- RÉSOLUTION DES COLLISIONS ---
            if (nestBlueprints.length > 0) {
                let baseVTrack = nestTrackIndex;
                let vCollision = true;
                while(vCollision) {
                    vCollision = false;
                    for (let bp of nestBlueprints) {
                        if (bp.type === "VIDEO" && hasCollision("VIDEO", baseVTrack + bp.internalTrack, bp.cloneStartTicks, bp.cloneEndTicks)) {
                            vCollision = true;
                            baseVTrack++;
                            break;
                        }
                    }
                }

                let baseATrack = 0; 
                let aCollision = true;
                while(aCollision) {
                    aCollision = false;
                    for (let bp of nestBlueprints) {
                        if (bp.type === "AUDIO" && hasCollision("AUDIO", baseATrack + bp.internalTrack, bp.cloneStartTicks, bp.cloneEndTicks)) {
                            aCollision = true;
                            baseATrack++;
                            break;
                        }
                    }
                }

                for (let bp of nestBlueprints) {
                    bp.vTrack = Math.floor(bp.type === "VIDEO" ? baseVTrack + bp.internalTrack : 0);
                    bp.aTrack = Math.floor(bp.type === "AUDIO" ? baseATrack + bp.internalTrack : 0);
                    
                    bp.vOffset = Math.floor(bp.vTrack - bp.originalTrackIndex);
                    bp.aOffset = Math.floor(bp.aTrack - bp.originalTrackIndex);
                    
                    blueprints.push(bp);

                    mainTimelineBlocks.push({
                        type: bp.type,
                        trackIndex: bp.type === "VIDEO" ? bp.vTrack : bp.aTrack,
                        start: bp.cloneStartTicks,
                        end: bp.cloneEndTicks
                    });
                }
            }
        }

        if (blueprints.length === 0) return;

        // ==========================================
        // PHASE 3 : LE CLONAGE PUR ET DUR
        // ==========================================
        console.log(`📋 Déterrage de ${blueprints.length} clips en cours...`);
        
        let fProj = await ppro.Project.getActiveProject();
        let fSeq = await fProj.getActiveSequence();
        let fSel = await fSeq.getSelection(); 
        let fTis = await fSel.getTrackItems();
        let fEditor = ppro.SequenceEditor.getEditor(fSeq);

        fProj.executeTransaction(compound => {
            for (let i = 0; i < fTis.length; i++) {
                if (!indicesOfNests.includes(i)) fSel.removeItem(fTis[i]);
            }
            compound.addAction(fEditor.createRemoveItemsAction(fSel, false, ppro.Constants.MediaType.ANY));
        }, "Grave Robber : Remove Nest");

        fProj.executeTransaction(compound => {
            for (let bp of blueprints) {
                try {
                    let tOffset = ppro.TickTime.createWithTicks(bp.tOffsetTicks);
                    let cloneAction = fEditor.createCloneTrackItemAction(bp.originalTrackItem, tOffset, bp.vOffset, bp.aOffset, false, false);
                    compound.addAction(cloneAction);
                } catch (err) {
                    console.error(`❌ Échec clonage pour ${bp.name}`);
                }
            }
        }, "Grave Robber : Clone All");

        console.log("🏁 EXÉCUTION TERMINÉE ! La tombe a été entièrement vidée.");

    } catch (error) {
        console.error("❌ Erreur Fatale : ", error);
    }
}

await unnestAndUnmerge();