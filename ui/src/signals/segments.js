import {signal} from "@preact/signals";
import {keysMatch} from "./createEditFunctions.js";
import {currentSetup, synchronizedSetup, updateCurrentSetupFromEdits} from "./setup.js";
import {setupStorageKey} from "./storage.js";


export const segmentEdits = signal([]);


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

