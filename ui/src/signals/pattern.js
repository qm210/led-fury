import {computed, signal} from "@preact/signals";
import createEditFunctions from "./createEditFunctions.js";
import {overwriteDebug} from "../sections/DebugConsole.jsx";
import {postPatternEdits} from "../api/api.js";

export const synchronizedPatterns = signal([]);

export const patternEdits = signal([]);

export const selectedPatternId = signal(null);
export const hoveredPatternId = signal(null);

export const visiblePatternId = computed(() =>
    hoveredPatternId.value ?? selectedPatternId.value
);

export const {
    findEdit,
    applyEdit
} = createEditFunctions(patternEdits, visiblePatternId);

export const selectedPattern = computed(() =>
    synchronizedPatterns.value.find(
        p => p.id === selectedPatternId.value
    )
);

export const visiblePattern = computed(() =>
    synchronizedPatterns.value.find(
        p => p.id === visiblePatternId.value
    )
);

export const mergeUpdatesIntoSynchronizedPatterns = (updatedPatterns) => {
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
    if (patternEdits.value.length === 0) {
        return;
    }
    const res = await postPatternEdits(patternEdits.value);
    if (!res.data) {
        overwriteDebug("Backend Pattern Error", res);
        return;
    }
    mergeUpdatesIntoSynchronizedPatterns(res.data.updatedPatterns);
    if (res.data.errors?.length > 0) {
        overwriteDebug("Pattern Update Errors", res.data.errors);
    }
};

export const findPatternById = (id) =>
    synchronizedPatterns.value.find(p => p.id === id);
