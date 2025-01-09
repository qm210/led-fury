import * as Lucide from "lucide-preact";
import {useOverallMutations, usePatternApi, useSequenceApi} from "../api/apiHooks.js";

import {patternEdits} from "../signals/pattern.js";
import {ActionButtonRow} from "../components/ActionButtonRow.jsx";


export const ControlButtons = () => {
    const {storeToFile} = useOverallMutations();
    const {start, stop, readCurrent} = useSequenceApi();
    const {postPatternEdits} = usePatternApi();
    const storeFilename = "test.fury";

    return (
        <ActionButtonRow
            actions={[{
                element: Lucide.Play,
                onClick: () =>
                    postPatternEdits(patternEdits.value)
                        .then(() => start()),
                tooltip: "Start Sequence",
            }, {
                element: Lucide.Square,
                onClick: stop,
                tooltip: "Stop Sequence",
            }, {
                element: Lucide.ListRestart,
                onClick: readCurrent,
                tooltip: "Refresh Pixel Colors",
            }, {
                element: Lucide.FileInput,
                onClick: () => storeToFile("test.fury"),
                tooltip: `Store Pattern to File ("${storeFilename}")`,
                style: {marginLeft: "auto"}
            }]}
        />
    );
};

