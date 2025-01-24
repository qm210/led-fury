import {useState} from "react";
import {CHECKMARK} from "../utils/constants.jsx";

export const Checkbox = ({checked, onChange, labelLeft, labelRight}) => {
    const [state, setState] = useState(() => checked);
    return (
        <div style={{display: "flex", gap: "0.25rem"}}>
            {
                labelLeft &&
                <label>
                    {labelLeft}
                </label>
            }
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
                    padding: "0.25rem",
                    userSelect: "none",
                    outline: 0,
                    border: "1px solid silver"
                }}
            />
            {
                labelRight &&
                <label>
                    {labelRight}
                </label>
            }
        </div>
    );
};
