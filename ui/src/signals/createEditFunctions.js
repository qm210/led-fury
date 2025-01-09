export const keysMatch = (key1, key2) => {
    if (key1 instanceof Array) {
        key1 = key1.join(".");
    }
    if (key2 instanceof Array) {
        key2 = key2.join(".");
    }
    return key1 === key2;
};

const createEditFunctions = (editsSignal, selectedSignal) => {
    /*
        Pass this function one or two signals:
            - one for the target list where all the edits of this kind are stored
            - optional: one for the currently selected entity being edited
              (don't need if you manage all via the key, but whatever you're up to...)
        and get all the helper functions you ever wet-dreamed of \o/\o/\o/
     */

    const matchingEdit = key => edit =>
        edit.patternId === selectedSignal.value?.id
        && keysMatch(edit.key, key);

    const findEdit = (key) =>
        editsSignal.value.find(matchingEdit(key));

    const applyEdit = (key, value) => {
        if (key instanceof Array) {
            key = key.join(".");
        }
        const patternId = selectedSignal.value.id;
        const edit = {
            id: [patternId, key].join("."),
            patternId,
            key,
            value
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
        // need to assign new reference
        editsSignal.value = edits;
    };

    return {
        matchingEdit,
        findEdit,
        applyEdit,
    };
};

export default createEditFunctions;
