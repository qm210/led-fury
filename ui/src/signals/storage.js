import {useEffect} from "preact/hooks";
import {synchronizedSetup} from "./setup.js";
import {segmentEdits} from "./segments.js";
import {findPatternById, selectedPatternId, synchronizedPatterns} from "./pattern.js";
import {useCallback, useRef} from "react";
import {useState} from "preact/compat";


export const selectedPatternStorageKey = "led.fury.selected.pattern";
export const setupStorageKey = "led.fury.edits.setup";
export const debugCollapsedKey = "led.fury.debug.collapsed";


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

export const loadFromStorage = (key, storage = localStorage) => {
    const stored = storage.getItem(key);
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
        if (stored && findPatternById(stored)) {
            selectedPatternId.value = stored;
        }
        initialized.current = true;
    }, []);

};

export const useSessionStoredState = (key, initialValue) => {
    const [state, setStateInternally] = useState(initialValue);
    const initialized = useRef(false);
    const wasTouched = useRef(false);

    const setState = useCallback((arg) => {
        setStateInternally(arg);
        wasTouched.current = true;
    }, []);

    const setStateWhenPreviouslyTouched = useCallback((arg) => {
        if (!wasTouched.current) {
            return;
        }
        setStateInternally(arg);
    }, [])

    useEffect(() => {
        if (!initialized.current) {
            return;
        }
        sessionStorage.setItem(key, JSON.stringify(state));
    }, [state]);

    useEffect(() => {
        const stored = loadFromStorage(key, sessionStorage);
        if (stored) {
            setStateInternally(stored);
        }
        initialized.current = true;
    }, []);

    return [state, setState, setStateWhenPreviouslyTouched];
};
