import Slider from "rc-slider";
import {DragNumberInput} from "./DragNumberInput.jsx";
import {ColorChooseRow} from "../pattern/ColorChooseRows.jsx";
import {applyEdit, findEdit, visiblePattern} from "../signals/pattern.js";
import {OptionSelector} from "./OptionSelector.jsx";
import {is1d} from "../signals/setup.js";


export const EditRow = ({
        label,
        editKey,
        getDefault,
        numeric,
        numericY,
        color,
        select,
        isVector,
        onClickHeader,
        getExtra
    }) => {

    const dimensions = isVector && !is1d() ? 2 : 1;

    const onClickHeaderCell =
        onClickHeader === undefined
            ? undefined
            : () => onClickHeader(visiblePattern.value);

    return Array(dimensions).fill(0).map((_, dim) =>
        <EditRowForDimension
            dimIndex={dim}
            key={dim}
            editKey={[editKey, isVector ? dim : null]}
            getDefault={getDefault}
            getExtra={getExtra}
            header={
                dim === 0
                    ? <td
                        rowSpan={dimensions}
                        onClick={onClickHeaderCell}
                    >
                        {label}
                    </td>
                    : null
            }
            numeric={
                numericY !== undefined && dim === 1
                ? numericY
                : numeric
            }
            color={color}
            select={select}
            hideCoordinate={dimensions === 1}
        />
    );
};

const defaultDisplayFunc = (x) =>
    typeof x === "object"
        ? JSON.stringify(x)
        : typeof x === "number"
            ? +(x.toFixed(3))
            : x;

const EditRowForDimension = ({
        dimIndex,
        header,
        editKey,
        getDefault,
        getExtra,
        numeric,
        color,
        select,
        hideCoordinate
    }) => {

    const defaultValue = getDefault(visiblePattern.value, dimIndex);
    const currentValue = findEdit(editKey)?.value ?? defaultValue;
    const coordinate = hideCoordinate ? "" : (["X", "Y"][dimIndex]);
    const displayFunc = numeric?.display ?? defaultDisplayFunc;
    const extraInfo = getExtra ? getExtra(visiblePattern.value, dimIndex): null;

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
            {
                <td>{coordinate}</td>
            }
            <td>
                <span>
                    {displayFunc(defaultValue)}
                </span>
                <span className={"text-xs p-1"}>
                    {extraInfo}
                </span>
            </td>
            <td>
                {
                    select
                    ? <OptionSelector
                        optionsKey={select.optionsKey}
                        value={currentValue}
                        onChange={value =>
                            applyEdit(editKey, value)
                        }
                    />
                    : numeric.max
                        ? <Slider
                            min={numeric.min ?? 0}
                            max={numeric.max}
                            step={numeric.step ?? 1}
                            value={currentValue * (numeric.scale ?? 1)}
                            onChange={value =>
                                applyEdit(editKey, value / (numeric.scale ?? 1))
                            }
                            resetValue={defaultValue}
                        />
                        : <DragNumberInput
                            value={currentValue}
                            onChange={(value) =>
                                applyEdit(editKey, value)
                            }
                            min={numeric.min}
                            max={numeric.max}
                            step={numeric.step}
                            resetValue={defaultValue}
                        />
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
