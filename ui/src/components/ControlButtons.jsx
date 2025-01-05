import * as Lucide from "lucide-preact";
import {useOverallMutations, useSequence} from "../api/apiHooks.js";

export const ControlButtons = ({data}) => {
    const {storeToFile} = useOverallMutations();
    const {start, stop, readCurrent} = useSequence();

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
            <button
                className="p-2"
                onClick = {() => readCurrent()}
                title={"Refresh Pixel Colors"}
            >
                <Lucide.ListRestart/>
            </button>
            <div className="flex-1"/>
            <button
                className="p-2"
                onClick={() => storeToFile("test.fury")}
            >
                <Lucide.FileInput/>
            </button>
        </div>
    );
};
