import {signal} from "@preact/signals";
import createEditFunctions from "./createEditFunctions.js";
import {overwriteDebug} from "../sections/DebugConsole.jsx";
import {postPatternEdits} from "../api/api.js";

export const synchronizedPatterns = signal([]);

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
    synchronizedPatterns.value =
        synchronizedPatterns.value.map(pattern => {
            const update = updatedPatterns.find(p => p.id === pattern.id);
            return update ?? pattern;
        });
    patternEdits.value = [];
};

export const submitPatternEdits = async () => {
    const res = await postPatternEdits(patternEdits.value);
    if (!res.data) {
        console.warn("postPatternEdits() failed!", res);
        overwriteDebug("Backend Pattern Error", res);
        return;
    }

    updateLastSynchronizedPatterns(res.data.updatedPatterns);
    if (res.data.errors?.length > 0) {
        overwriteDebug("Pattern Update Errors", res.data.errors);
    }
};
