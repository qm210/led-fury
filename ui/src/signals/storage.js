import {useEffect} from "preact/hooks";
import {synchronizedSetup} from "./setup.js";
import {segmentEdits} from "./segments.js";
import {selectedPatternId} from "./pattern.js";
import {useRef} from "react";


export const selectedPatternStorageKey = "led.fury.selected.pattern";
export const setupStorageKey = "led.fury.edits.setup";


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

export const loadFromStorage = (key) => {
    const stored = localStorage.getItem(key);
    if (!stored) {
        return undefined;
    }
    try {
        return JSON.parse(stored);
    } catch (err) {
        return undefined;
    }
};


export const useStorageForSelectedPatternId = () => {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            return;
        }
        localStorage.setItem(
            selectedPatternStorageKey,
            JSON.stringify(selectedPatternId.value)
        );
    }, [selectedPatternId.value]);

    useEffect(() => {
        const stored = loadFromStorage(selectedPatternStorageKey);
        if (stored) {
            selectedPatternId.value = stored;
        }
        initialized.current = true;
    }, []);

};
