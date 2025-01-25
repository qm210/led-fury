import {signal} from "@preact/signals";

export const currentSecond = signal(0);

export const lastRgbUpdateInfo = signal({
    receivedAt: undefined,
    renderedSecond: undefined,
    instances: undefined,
});

export const currentRgbArray = signal([]);

export const updateRgbArray = (message) => {
    if (!message) {
        return;
    }
    const updateInfo = {
        receivedAt: new Date(),
    };
    let rgbArray = message;
    if (message.rgbValues) {
        rgbArray = message.rgbValues;
        updateInfo.renderedSecond = message.second;
    }
    if (!(rgbArray instanceof Array)) {
        console.warn("That RGB Array Update looks fishy and is ignored", rgbArray);
        return;
    }
    updateInfo.instances = message.instances;

    currentRgbArray.value = rgbArray;
    lastRgbUpdateInfo.value = updateInfo;
};
