

export const replacedAt = (list, index, value) =>
    [...list.slice(0, index), value, ...list.slice(index + 1)];

export const shallowEqualLists = (list1, list2) => {
    if (list1 === list2) {
        return true;
    }
    if (list1.length !== list2.length) {
        return false;
    }
    return list1.all((elem, index) => shallowEqualLists(elem, list2[index]))
};
