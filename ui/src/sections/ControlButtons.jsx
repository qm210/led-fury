import * as Lucide from "lucide-preact";
import {storeToFile, useSequenceApi} from "../api/api.js";

import {synchronizedPatterns} from "../signals/pattern.js";
import {ActionButton, ActionButtons} from "../components/ActionButtons.jsx";
import {SpinNumberInput} from "../components/SpinNumberInput.jsx";
import {signal} from "@preact/signals";
import {useState} from "react";
import {synchronize} from "../signals/app.js";


const currentSecond = signal(0);


export const ControlButtons = () => {
    const {start, stop} = useSequenceApi();

    if (!synchronizedPatterns.value.length) {
        return null;
    }

    return (
        <div class={"flex w-full justify-stretch items-stretch"}>
            <ActionButtons
                actions={[
                    {
                        element: Lucide.ListRestart,
                        onClick: synchronize,
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
                <TimeSeeker/>
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

const TimeSeeker = () => {
    const {seekTime} = useSequenceApi();
    const [second, setSecond] = useState(currentSecond.value);

    return (
        <div class={"flex gap-2 items-center"}>
            <div>
                Seek:
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
                    seekTime(second)
                        .then(second => {
                            currentSecond.value = second;
                        })
                }
                tooltip={"Jump to given second."}
            >
                <Lucide.Goal/>
            </ActionButton>
        </div>
    )
};
