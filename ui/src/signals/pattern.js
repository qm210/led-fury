import {signal} from "@preact/signals";
import createEditFunctions from "./createEditFunctions.js";

export const lastSynchronizedPatterns = signal([]);

export const patternEdits = signal([]);

export const selectedPattern = signal(null);

export const hoveredPattern = signal(null);


export const {
    findEdit,
    applyEdit
} = createEditFunctions(patternEdits, selectedPattern);


export const updateLastSynchronizedPatterns = (updatedPatterns) => {
    if (!updatedPatterns) {
        return;
    }
    lastSynchronizedPatterns.value =
        lastSynchronizedPatterns.value.map(pattern => {
            const update = updatedPatterns.find(p => p.id === pattern.id);
            return update ?? pattern;
        });
    patternEdits.value = [];
};
