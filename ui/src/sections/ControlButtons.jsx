import * as Lucide from "lucide-preact";
import {storeToFile, useSequenceApi} from "../api/api.js";

import {synchronizedPatterns} from "../signals/pattern.js";
import {ActionButton, ActionButtons} from "../components/ActionButtons.jsx";
import {SpinNumberInput} from "../components/SpinNumberInput.jsx";
import {useState} from "react";
import {synchronize} from "../signals/app.js";
import {currentSecond} from "../signals/sequence.js";


export const ControlButtons = () => {
    const {start, stop} = useSequenceApi();

    if (!synchronizedPatterns.value.length) {
        return null;
    }

    return (
        <div class={"flex justify-stretch items-stretch p-2"}>
            <ActionButtons
                actions={[
                    {
                        element: Lucide.ListRestart,
                        onClick: () => synchronize(true),
                        tooltip: "Synchronize with Backend",
                    }, {
                        element: Lucide.Play,
                        onClick: () =>
                            synchronize()
                                .then(start),
                        tooltip: "Start Sequence",
                    }, {
                        element: Lucide.Square,
                        onClick: stop,
                        tooltip: "Stop Sequence",
                    }]}
            />
            <div class={"flex-1"}>
                <TimeSeeker
                    label={"Seek:"}
                    tooltip={"Jump to given second."}
                />
            </div>
            <ActionButtons
                actions={[{
                    element: Lucide.FileInput,
                    onClick: () =>
                        synchronize()
                            .then(storeToFile),
                    tooltip: `Store Pattern to File`,
                    style: {
                        marginLeft: "Auto"
                    }
                }]}
            />
        </div>
    );
};

const TimeSeeker = ({label, tooltip}) => {
    const {seek} = useSequenceApi();
    const [second, setSecond] = useState(currentSecond.value);

    return (
        <div class={"flex gap-2 items-center border border-black pl-2"}>
            <div>
                {label}
            </div>
            <div class={"flex flex-col justify-stretch h-full"}>
                <SpinNumberInput
                    step={0.1}
                    value={second}
                    onChange={value => setSecond(value)}
                    min={0}
                />
            </div>
            <ActionButton
                onClick={() =>
                    synchronize()
                        .then(() =>
                            seek(second)
                        )
                        .then(res => {
                            console.log("Seek Response:", res.data);
                            currentSecond.value = second;
                        })
                }
                tooltip={tooltip}
                style={{borderWidth: "0 0 0 1px"}}
            >
                <Lucide.Goal/>
            </ActionButton>
        </div>
    )
};
