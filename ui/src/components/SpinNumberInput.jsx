import {TRIANGLE_LEFT, TRIANGLE_RIGHT} from "../utils/constants.jsx";
import {countDecimalPlaces} from "../utils/math.js";

export const SpinNumberInput = ({
    value,
    onChange,
    min = undefined,
    max = undefined,
    step = 1,
    resetValue = undefined,
    style = undefined
}) => {

    const valuePlus = (delta) => {
        let result = (+value) + delta;
        if (min !== undefined && result < min) {
            return min;
        }
        if (max !== undefined && result > max) {
            return max;
        }
        return +(result.toFixed(3));
    };

    return (
        <div class={"number-input-spinner"} style={style}>
            <button
                onClick = {() => onChange(valuePlus(-step))}
                disabled = {value <= min}
            >
                {TRIANGLE_LEFT}
            </button>
            <input
                type={"number"}
                value={value}
                onChange={
                    (event) =>
                        onChange(+event.target.value)
                }
                min={min}
                max={max}
                step={step}
                onDblClick={
                    resetValue !== undefined
                        ? () => onChange(resetValue)
                        : undefined
                }
                onFocus={e => e.target.select()}
            />
            <button
                onClick = {() => onChange(valuePlus(step))}
                disabled = {value >= max}
            >
                {TRIANGLE_RIGHT}
            </button>
        </div>
    );
};
