import * as Lucide from "lucide-preact";
import {useOverallMutations, usePatternApi, useSequenceApi} from "../api/apiHooks.js";
import {patternEdits} from "./PatternEditor.jsx";


export const ControlButtons = () => {
    const {storeToFile} = useOverallMutations();
    const {start, stop, readCurrent} = useSequenceApi();
    const {postPatternEdits} = usePatternApi();

    return (
        <div class="flex flex-row gap-2 w-full justify-start">
            <button class="p-2"
                onClick = {() =>
                    postPatternEdits(patternEdits.value)
                        .then(() => start())
                }
                title = {"Start Sequence"}
            >
                <Lucide.Play/>
            </button>
            <button class="p-2"
                onClick = {() => stop()}
                title = {"Stop Sequence"}
            >
                <Lucide.Square/>
            </button>
            <button class="p-2"
                onClick = {() => readCurrent()}
                title = {"Refresh Pixel Colors"}
            >
                <Lucide.ListRestart/>
            </button>
            <div class="flex-1"/>
            <button class="p-2"
                onClick = {() =>
                    storeToFile("test.fury")
                }
                title = {"store pattern to file"}
            >
                <Lucide.FileInput/>
            </button>
        </div>
    );
};
