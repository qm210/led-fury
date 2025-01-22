import {patternEdits, synchronizedPatterns} from "./pattern.js";

const debugVerbose = true;

export const cloneDebug = () => {
    if (!debugVerbose) {
        return {lel: "debugVerbose === false"};
    }
    return {
        patternEdits: [...patternEdits.value],
        synchronizedPatterns: [...synchronizedPatterns.value],
    };
};

export const logComparison = (title, oldState, newState) => {
    if (!oldState) {
        if (newState) {
            console.log(oldState, "->", newState);
        }
        return;
    }
    const args = [title];
    for (const key in oldState) {
        args.push(`; ${key}:`);
        args.push(oldState[key]);
        args.push("->");
        args.push(newState[key]);
    }
    console.log(...args);
};