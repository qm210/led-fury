import {useEffect, useState} from "react";
import {countDecimalPlaces} from "../utils/math.js";

const NUMERIC_REGEX = /^-?[0-9]+([,.][0-9]+)?$/;

const sensitivity = 0.1;


export const DragNumberInput = ({
    value,
    onChange,
    min = undefined,
    max = undefined,
    step = 1,
    resetValue = undefined
}) => {
    const [field, setField] = useState(value);
    const [dragState, setDragState] = useState(null);
    const [disableDrag, setDisableDrag] = useState(false);

    const onKeyPress = (event) => {
        let newValue = event.target.value.replace(",", ".");
        const isNaN = !NUMERIC_REGEX.test(newValue);
        if (isNaN) {
            return;
        }
        newValue = clamped(newValue, min, max);
        setField(newValue);
        onChange(newValue);
    };

    const startDrag = (event) => {
        if (disableDrag) {
            return;
        }
        setDragState({
            initX: event.clientX,
            initValue: +field,
            step,
            decimalPlaces: countDecimalPlaces(step),
            min,
            max
        });
    };

    useEffect(() => {
        let newValue;

        const onUpdate = (event) => {
            if (dragState?.initValue === undefined) {
                return;
            }
            newValue = getValueFromShift(dragState, event.clientX);
            setField(newValue);
        };

        const onEnd = () => {
            if (!dragState) {
                return;
            }
            setDragState(null);
            if (newValue !== undefined) {
                onChange(newValue);
            }
            newValue = undefined;
        }

        document.addEventListener("mousemove", onUpdate);
        document.addEventListener("mouseup", onEnd);
        return () => {
            document.removeEventListener("mousemove", onUpdate);
            document.removeEventListener("mouseup", onEnd);
        };
    }, [dragState]);

    const onDoubleClick = resetValue !== undefined
        ? () => {
            setField(resetValue);
            onChange(resetValue);
        }
        : undefined

    return (
        <input
            value={field}
            onKeyUp={onKeyPress}
            onMouseDown={startDrag}
            onDblClick={onDoubleClick}
            onBlur={() => setDisableDrag(false)}
            onClick={e => {
                setDisableDrag(true);
                e.target.select();
            }}
            class={"w-full text-center"}
            style={{
                border: "1px solid #ddd",
                borderRadius: 1,
                userSelect: "none",
                cursor: disableDrag ? "text" : "ew-resize"
            }}
        />
    )
};

const clamped = (value, min, max) => {
    let result = +value;
    if (min !== undefined && result < min) {
        result = min;
    }
    if (max !== undefined && result > max) {
        result = max;
    }
    return result;
};

const getValueFromShift = (dragState, eventX) => {
    const shift = Math.round(sensitivity * (eventX - dragState.initX));
    let result = dragState.initValue + shift * dragState.step;
    result = clamped(result, dragState.min, dragState.max);
    const backup = result;
    if (dragState.decimalPlaces > 0) {
        result = +result.toFixed(dragState.decimalPlaces);
    }
    return result;
};
