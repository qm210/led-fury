import * as Lucide from "lucide-preact";
import {useOverallMutations, useSequence} from "../api/apiHooks.js";

export const ControlButtons = ({sequence}) => {
    const {storeToFile} = useOverallMutations();
    const {start, stop} = useSequence();

    return (
        <div className="flex flex-row gap-2 w-full justify-start">
            <button
                className="p-2"
                onClick = {() => start()}
            >
                <Lucide.Play/>
            </button>
            <button
                className="p-2"
                onClick = {() => stop()}
            >
                <Lucide.Square/>
            </button>
            <div className="flex-1"/>
            <button
                className="p-2"
                onClick={() => storeToFile("test.fury")}
            >
                <Lucide.Save/>
            </button>
        </div>
    );
};
