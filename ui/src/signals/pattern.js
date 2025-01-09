import {signal} from "@preact/signals";
import createEditFunctions from "./createEditFunctions.js";

export const patternEdits = signal([]);

export const selectedPattern = signal(null);

export const hoveredPattern = signal(null);


export const {
    matchingEdit,
    findEdit,
    applyEdit
} = createEditFunctions(patternEdits, selectedPattern);
