import {signal} from "@preact/signals";
import {keysMatch} from "./createEditFunctions.js";
import {currentSetup, lastRetrievedSetup, updateCurrentSetupFromEdits} from "./setup.js";


export const segmentEdits = signal([]);


const setupStorageKey = "led.fury.edits.setup";


export const findSegmentEdit = (key) =>
    segmentEdits.value.find(edit => keysMatch(edit.key, key));


// TODO: unify with createEditFunctions / the pattern edit signals, but this is the more basic version.
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

    updateCurrentSetupFromEdits();

    localStorage.setItem(setupStorageKey, JSON.stringify({
        edits,
        lastSetup: lastRetrievedSetup.value,
    }));
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
        lastRetrievedSetup.value = parsed.lastSetup;
        segmentEdits.value = parsed.edits;
        return true;
    } catch (err) {
        console.warn(err);
        return false;
    }
};
