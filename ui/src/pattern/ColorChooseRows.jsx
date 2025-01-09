import {DragNumberInput} from "../components/DragNumberInput.jsx";
import {Colorful, hsvaToHex} from "@uiw/react-color";
import {useState} from "react";
import {Popover} from "react-tiny-popover";
import {applyEdit, findEdit, selectedPattern} from "../signals/pattern.js";
import {DELTA} from "../utils/constants.jsx";


const colorCellSize = {
    width: "4rem",
    height: "1.5rem"
};

export const ColorChooseRow = ({editKey, header, currentValue, defaultValue}) => {
    const currentColor = hsvaToHex(currentValue);
    const defaultColor = hsvaToHex(defaultValue);
    const [popupOpen, setPopupOpen] = useState(false);

    const onColorChange = (color) => {
        applyEdit(
            editKey,
            color !== null
                ? {
                    h: Math.round(color.hsv.h),
                    s: Math.round(color.hsv.s),
                    v: Math.round(color.hsv.v),
                }
                : defaultValue
            );
    };

    return (
        <tr>
            {header}
            <td>
                <Popover
                    isOpen={popupOpen}
                    onClickOutside={() => setPopupOpen(false)}
                    content={
                        <div class={"bg-white border-black border rounded-md p-2 opacity-60 flex flex-col items-center gap"}>
                            <div>
                                This is the old value.
                            </div>
                            <button
                                onClick = {() =>
                                    onColorChange(null)
                                }
                            >
                                Reset
                            </button>
                        </div>
                    }
                >
                    <div className="m-auto cursor-pointer"
                         onClick={() => setPopupOpen(state => !state)}
                         style={{
                             ...colorCellSize,
                             backgroundColor: defaultColor
                         }}
                    />
                </Popover>
            </td>
            <td>
                HSV = [{currentValue.h}, {currentValue.s}, {currentValue.v}]
            </td>
            <td>
                <Popover
                    isOpen={popupOpen}
                    onClickOutside={() => setPopupOpen(false)}
                    content={
                        <div className={"bg-white border-black border rounded-md p-4"}>
                            <Colorful
                                color={currentColor}
                                onChange={onColorChange}
                                disableAlpha={true}
                            />
                        </div>
                    }
                >
                    <div className="m-auto cursor-pointer"
                         onClick={() => setPopupOpen(state => !state)}
                         style={{
                             ...colorCellSize,
                             backgroundColor: currentColor
                         }}
                    />
                </Popover>
            </td>
        </tr>
    );
};

export const ColorVariationCell = () => {
    const p = selectedPattern.value;
    const defaultDeltaH = p.template.hue_delta;
    const currentDeltaH = findEdit("deltaHue")?.value ?? defaultDeltaH;
    const defaultDeltaS = p.template.sat_delta;
    const currentDeltaS = findEdit("deltaSat")?.value ?? defaultDeltaS;
    const defaultDeltaV = p.template.val_delta;
    const currentDeltaV = findEdit("deltaVal")?.value ?? defaultDeltaV;
    return (
        <div className={"flex-of-inputs short-inputs justify-evenly gap-4"}>
            <div>
                <div>{DELTA}H = {defaultDeltaH}</div>
                <DragNumberInput
                    value={currentDeltaH}
                    onChange={(value) =>
                        applyEdit("deltaHue", value)
                    }
                    resetValue={0}
                />
            </div>
            <div>
                <div>{DELTA}S = {defaultDeltaS}</div>
                <DragNumberInput
                    value={currentDeltaS}
                    onChange={(value) =>
                        applyEdit("deltaSat", value)
                    }
                    resetValue={0}
                />
            </div>
            <div>
                <div>{DELTA}V = {defaultDeltaV}</div>
                <DragNumberInput
                    value={currentDeltaV}
                    onChange={(value) =>
                        applyEdit("deltaVal", value)
                    }
                    resetValue={0}
                />
            </div>
        </div>
    );
};