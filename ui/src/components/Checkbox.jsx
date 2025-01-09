import {useState} from "react";
import {CHECKMARK} from "../utils/constants.jsx";

export const Checkbox = ({checked, onChange}) => {
    const [state, setState] = useState(() => checked);
    return (
        <input
            type="text"
            value={state ? CHECKMARK : ""}
            onClick={() => {
                onChange && onChange(!state);
                setState(state => !state);
            }}
            readOnly
            style={{
                minWidth: "unset",
                width: "1.5rem",
                height: "1.5rem",
                cursor: "pointer",
                fontSize: "large",
                padding: 0,
                userSelect: "none",
                outline: 0,
            }}
        />
    );
};
