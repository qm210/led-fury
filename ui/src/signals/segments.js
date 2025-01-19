import {signal} from "@preact/signals";
import {keysMatch} from "./createEditFunctions.js";
import {currentSetup, synchronizedSetup, updateCurrentSetupFromEdits} from "./setup.js";


export const segmentEdits = signal([]);


const setupStorageKey = "led.fury.edits.setup";


// TODO: unify with crea
//  teEditFunctions / the pattern edit signals, but this is the more basic version.
export const applySegmentEdit = (key, value) => {
    if (key instanceof Array) {
        key = key.join(".");
    }
    const edit = {
        key,
        value
    };
    let unmatched = true;
    const edits = [...segmentEdits.value];
    for (let i = 0; i < edits.length; i++) {
        if (keysMatch(key, edits[i].key)) {
            edits[i] = edit;
            unmatched = false;
        }
    }
    if (unmatched) {
        edits.push(edit);
    }
    // need to assign new reference
    segmentEdits.value = edits;

    localStorage.setItem(setupStorageKey, JSON.stringify({
        edits,
        lastSetup: synchronizedSetup.value,
    }));

    return updateCurrentSetupFromEdits();
};

export const resetSetupEdits = () => {
    synchronizedSetup.value = currentSetup.value;
    segmentEdits.value = [];
    localStorage.removeItem(setupStorageKey);
};

export const loadSetupFromStorage = (id) => {
    try {
        const stored = localStorage.getItem(setupStorageKey);
        if (!stored) {
            return false;
        }
        const parsed = JSON.parse(stored);
        if (!parsed.lastSetup || !parsed.edits) {
            // old format
            return false;
        }
        if (parsed.lastSetup.id !== id) {
            localStorage.removeItem(setupStorageKey);
            return false;
        }
        synchronizedSetup.value = parsed.lastSetup;
        segmentEdits.value = parsed.edits;
        return true;
    } catch (err) {
        console.warn(err);
        return false;
    }
};
