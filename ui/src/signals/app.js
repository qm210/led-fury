import {signal} from "@preact/signals";
import {currentGeometry, updateCurrentSetupFromEdits} from "./setup.js";
import {patternEdits, submitPatternEdits, synchronizedPatterns} from "./pattern.js";

export const backendBroken = signal(false);

export const pendingOverlay = signal(false);

const debugVerbose = true;

const cloneDebug = () => {
    if (!debugVerbose) {
        return {lel: "debugVerbose === false"};
    }
    return {
        patternEdits: [...patternEdits.value],
        synchronizedPatterns: [...synchronizedPatterns.value],
    };
};

const logComparison = (title, oldState, newState) => {
    if (!oldState) {
        if (newState) {
            console.log(oldState, "->", newState);
        }
        return;
    }
    const args = [title];
    for (const key in oldState) {
        args.push(`; ${key}:`);
        args.push(oldState[key]);
        args.push("->");
        args.push(newState[key]);
    }
    console.log(...args);
};

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
