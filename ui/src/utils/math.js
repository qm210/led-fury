

export const countDecimalPlaces = (number) => {
    const result = Math.floor(-Math.log10(number));
    return Math.max(result, 0);
};
