

export const countDecimalPlaces = (number) => {
    const result = Math.ceil(-Math.log10(number));
    return Math.max(result, 0);
};
