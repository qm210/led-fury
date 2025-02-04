const joinedKey = (keys) => {
    if (!(keys instanceof Array)) {
        return keys;
    }
    return keys
        .filter(x => x !== null && x !== undefined)
        .join(".");
};

export const keysMatch = (key1, key2) => {
    if (key1 === key2) {
        return true;
    }
    return joinedKey(key1) === joinedKey(key2);
};

const createEditFunctions = (editsSignal, selectedIdSignal) => {
    /*
        Pass this function one or two signals:
            - one for the target list where all the edits of this kind are stored
            - optional: one for the currently selected entity being edited
              (don't need if you manage all via the key, but whatever you're up to...)
        and get all the helper functions you ever wet-dreamed of \o/\o/\o/
     */

    const matchingEdit = key => edit =>
        edit.patternId === selectedIdSignal.value
        && keysMatch(edit.key, key);

    const findEdit = (key) =>
        editsSignal.value.find(matchingEdit(key));

    const applyEdit = (key, value) => {
        key = joinedKey(key);
        const patternId = selectedIdSignal.value;
        const edit = {
            id: [patternId, key].join("."),
            patternId,
            key,
            value,
            at: Date.now(),
        };
        let unmatched = true;
        const edits = [...editsSignal.value];
        for (let i = 0; i < edits.length; i++) {
            if (matchingEdit(key)(edits[i])) {
                edits[i] = edit;
                unmatched = false;
            }
        }
        if (unmatched) {
            edits.push(edit);
        }
        // need to assign new reference, that's how signals work.
        editsSignal.value = edits;
    };

    return {
        matchingEdit,
        findEdit,
        applyEdit,
    };
};

export default createEditFunctions;
