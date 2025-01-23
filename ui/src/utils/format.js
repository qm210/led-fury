import {INFINITY, IS_ELEMENT, PLUSMINUS, THIN_SPACE} from "./constants.jsx";

const formatOptionalNumber = (value) => {
    if (value === undefined || value === null) {
        return "";
    }
    const digits = 1;
    const result = value.toFixed(digits);
    if (result.endsWith('.' + "0".repeat(digits))) {
        return result.slice(0, -digits - 1);
    }
    return result;
};

export const formatBoundary = (boundary) => [
    ["x", formatRange(boundary.x)],
    ["y", formatRange(boundary.y)]
].map(([label, result]) =>
    [label, IS_ELEMENT, result].join(THIN_SPACE)
).join("; ");

const formatRange = (boundary) => {
    const min = formatOptionalNumber(boundary.min);
    const max = formatOptionalNumber(boundary.max);
    const range = !min && !max
        ? `${PLUSMINUS}${INFINITY}`
        : [min, "..", max].filter(x => !!x).join(THIN_SPACE);
    return `[${range}]`;
};
