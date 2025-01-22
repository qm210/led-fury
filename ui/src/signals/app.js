import {signal} from "@preact/signals";
import {currentGeometry, updateCurrentSetupFromEdits} from "./setup.js";
import {submitPatternEdits} from "./pattern.js";
import {cloneDebug, logComparison} from "./debug.js";

export const backendBroken = signal(false);

export const pendingOverlay = signal(false);

export const synchronize = async (forceRecalcGeometry = false) => {
    const debugOld = cloneDebug();

    pendingOverlay.value = true;
    await submitPatternEdits();
    if (forceRecalcGeometry) {
        currentGeometry.value.geometry = null;
    }
    await updateCurrentSetupFromEdits();
    pendingOverlay.value = false;

    const debugNew = cloneDebug();
    logComparison("Synchronize", debugOld, debugNew);
};
