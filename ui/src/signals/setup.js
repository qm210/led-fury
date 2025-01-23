import {computed, signal} from "@preact/signals";
import {resetSetupEdits, segmentEdits} from "./segments.js";
import {updateGeometry} from "../api/api.js";
import {overwriteDebug} from "../sections/DebugConsole.jsx";

export const synchronizedSetup = signal(undefined);
export const currentSetup = signal(undefined);
export const currentGeometry = signal({
    segments: null,
    geometry: null,
    error: null
});

export const is1d = () =>
    currentGeometry.value?.geometry.area.y.max < 2;

export const geometryArea = computed(() => {
    if (!currentGeometry.value?.geometry) {
        return {
            x: {min: 0, max: 0},
            y: {min: 0, max: 0},
            width: 0,
            height: 0
        };
    }
    const {area, rect: {width, height}} = currentGeometry.value.geometry;
    return {
        x: area.x,
        y: area.y,
        width,
        height
    };
});

export const updateCurrentSetupFromEdits = async () => {
    if (segmentEdits.value.length === 0) {
        currentSetup.value = synchronizedSetup.value;
        if (!!currentGeometry.value.geometry) {
            return;
        }
    }

    const setup = structuredClone(synchronizedSetup.value);
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
    currentSetup.value = setup;
    resetSetupEdits();

    const res = await updateGeometry(setup.segments);
    currentGeometry.value =
        res.error
            ? {
                ...currentGeometry.value,
                error: res.error,
            }
        : {
            geometry: res.geometry,
            segments: res.segments,
            error: null,
        };
    if (res.error) {
        console.warn("Could not update Geometry", res);
    }
    overwriteDebug("currentGeometry", currentGeometry.value);
};
