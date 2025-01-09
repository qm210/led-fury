import {signal} from "@preact/signals";
import {keysMatch} from "./createEditFunctions.js";
import {updateCurrentSetupFromEdits} from "./setup.js";


export const segmentEdits = signal([]);


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
};
