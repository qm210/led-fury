import Slider from "rc-slider";
import {DragNumberInput} from "./DragNumberInput.jsx";
import {ColorChooseRow} from "../pattern/ColorChooseRows.jsx";
import {applyEdit, findEdit, selectedPattern} from "../signals/pattern.js";
import {currentSetup} from "../signals/setup.js";


export const EditRow = ({label, editKey, getDefault, numeric, color}) => {
    const dimensions = currentSetup.value.derived.is1d ? 1 : 2;
    return Array(dimensions).fill(0).map((_, dim) =>
        <EditRowForDimension
            dimIndex={dim}
            key={dim}
            editKey={[editKey, dim]}
            getDefault={getDefault}
            header={
                dim === 0 &&
                <td colSpan={dimensions}>
                    {label}
                </td>
            }
            numeric={numeric}
            color={color}
        />
    );
};

const defaultDisplayFunc = (x) =>
    typeof x === "object"
        ? JSON.stringify(x)
        : x;
const EditRowForDimension = ({dimIndex, header, editKey, getDefault, numeric, color}) => {
    const defaultValue = getDefault(selectedPattern.value, dimIndex);
    const currentValue = findEdit(editKey)?.value ?? defaultValue;
    const displayFunc = numeric?.display ?? defaultDisplayFunc;

    if (color) {
        return (
            <ColorChooseRow
                editKey={editKey}
                defaultValue={defaultValue}
                currentValue={currentValue}
                header={header}
            />
        );
    }

    return (
        <tr>
            {header}
            <td>
                {displayFunc(defaultValue)}
            </td>
            <td>
                {
                    numeric
                        ? (
                            numeric.max
                                ? <Slider
                                    min={numeric.min ?? 0}
                                    max={numeric.max}
                                    step={numeric.step ?? 1}
                                    value={currentValue * (numeric.scale ?? 1)}
                                    onChange={value =>
                                        applyEdit(editKey, value / (numeric.scale ?? 1))
                                    }
                                />
                                : <DragNumberInput
                                    value={currentValue}
                                    onChange={(value) =>
                                        applyEdit(editKey, value)
                                    }
                                    step={numeric.step}
                                />
                        )
                        : null
                }
            </td>
            <td style={{
                opacity: currentValue === defaultValue ? 0.3 : 1
            }}>
                {displayFunc(currentValue)}
            </td>
        </tr>
    );
};

