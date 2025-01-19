import {signal} from "@preact/signals";
import {updateCurrentSetupFromEdits} from "./setup.js";
import {submitPatternEdits} from "./pattern.js";

export const backendBroken = signal(false);

export const pendingOverlay = signal(false);


export const synchronize = async () => {
    pendingOverlay.value = true;
    await submitPatternEdits();
    await updateCurrentSetupFromEdits();
    pendingOverlay.value = false;
};
