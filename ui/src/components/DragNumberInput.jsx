import {useEffect, useState} from "react";
import {countDecimalPlaces} from "../utils/math.js";

const NUMERIC_REGEX = /^-?[0-9]+([,.][0-9]+)?$/;

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

    onChange = onChange ?? (() => {});

    const clamped = (value) => {
        let result = +value;
        if (min !== undefined && result < min) {
            result = min;
        }
        if (max !== undefined && result > max) {
            result = max;
        }
        return result;
    };

    const onKeyPress = (event) => {
        let newValue = event.target.value.replace(",", ".");
        const isNaN = !NUMERIC_REGEX.test(newValue);
        if (isNaN) {
            return;
        }
        newValue = clamped(newValue);
        setField(newValue);
        onChange(newValue);
    };

    const startDrag = (event) => {
        setDragState({
            initX: event.clientX,
            initValue: +field,
            step,
            decimalPlaces: countDecimalPlaces(step),
        });
    };

    useEffect(() => {
        let newValue;

        const onUpdate = (event) => {
            if (dragState?.initValue === undefined) {
                return;
            }
            newValue = dragState.initValue + dragState.step * (event.clientX - dragState.initX);
            newValue = clamped(newValue);
            if (dragState.decimalPlaces > 0) {
                newValue = +newValue.toFixed(dragState.decimalPlaces);
            }
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
            onFocus={e => e.target.select()}
            class={"w-full cursor-ew-resize text-center"}
            style={{
                border: "1px solid #ddd",
                borderRadius: 1,
            }}
        />
    )
};
