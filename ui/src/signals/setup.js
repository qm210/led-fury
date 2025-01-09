import {signal} from "@preact/signals";
import {segmentEdits} from "./segments.js";

export const lastRetrievedSetup = signal(undefined);
export const currentSetup = signal(undefined);


export const updateCurrentSetupFromEdits = () => {
    const setup = structuredClone(lastRetrievedSetup.value);
    for (const edit of segmentEdits.value) {
        const [segKey, segIndex, key] = edit.key.split(".");
        if (segKey !== "seg") {
            continue;
        }
        if (key === "len") {
            setup.segments[segIndex].length = edit.value;
        } else if (key === "shape") {
            setup.segments[segIndex].shape = edit.value;
        } else if (key === "alt") {
            setup.segments[segIndex].alternating = edit.value;
        } else if (key === "div") {
            setup.segments[segIndex].divisions = edit.value;
        } else {
            console.warn("updateCurrentSetupFromEdits() can not yet handle", edit);
        }
    }
    setup.derived = deriveInfo(setup);
    currentSetup.value = setup;
};

const deriveInfo = (setup) => {
    // cf. what the backend calculates from the Setup for direct access
    let maxSegmentLength = 0;
    let totalNumberPixels = 0;
    for (const segment of setup.segments) {
        maxSegmentLength = Math.max(
            maxSegmentLength,
            segment.start + segment.length
        );
        totalNumberPixels += segment.length;
    }
    return {
        maxSegmentLength,
        totalNumberPixels,
        is1d: setup.segments.length === 1 && setup.segments[0].shape === "linear"
    };
};
