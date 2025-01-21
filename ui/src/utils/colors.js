

export const calculateCssColor = (index, segment, values) => {
    if (index < segment.start || index > segment.start + segment.length) {
        return "none";
    }
    if (!values || values.length === 0) {
        return "black";
    }
    const rgb = values?.slice(3 * index, 3 * index + 3);
    return `rgba(${rgb.join(',')},1)`;
};

export const isColorBright = (rgbColorString) => {
    if (!rgbColorString) {
        return false;
    }
    const match = rgbColorString.match(/^rgba?\((\d+),(\d+),(\d+),/);
    if (!match) {
        return false;
    }
    const sum = match.slice(1, 4).reduce((sum, value) => sum + (+value), 0);
    return sum > 300;
};
