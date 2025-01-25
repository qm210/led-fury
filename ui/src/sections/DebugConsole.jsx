import {useOverallState} from "../api/api.js";
import {useEffect, useState, useCallback} from "react";
import {segmentEdits} from "../signals/segments.js";
import {currentSetup, synchronizedSetup} from "../signals/setup.js";
import {signal} from "@preact/signals";
import * as Lucide from "lucide-preact";
import {debugCollapsedKey, useSessionStoredState} from "../signals/storage.js";


const debugOverwrite = signal({
    source: null,
    content: {}
});

export const overwriteDebug = (source, content) => {
    debugOverwrite.value = {
        source,
        content
    };
};


const compactJson = (obj) =>
    JSON.stringify(obj, null, 2)
        .replace(/([\]}])[\n\r\s]*,[\n\r\s]*([\[{])/g, '$1, $2')
        .replace(/([\]\[{}])\s*([\]\[{}])/g, "$1$2");

const asLog = (r) => {
    if (r === undefined) {
        return "--";
    }
    if (typeof r !== "object") {
        return r;
    }
    const data = r.data?.data ?? r.data ?? r;
    return compactJson(data);
};


export const DebugConsole = () => {
    const {refetch, fetchRuns} = useOverallState({enabled: false});
    const [log, setLog] = useState("");
    const [enabled, setEnabled] =
        useState({
            segments: false
        });
    const [collapsed, setCollapsed, setCollapsedIfTouchedBefore] =
        useSessionStoredState(debugCollapsedKey, true);

    useEffect(() => {
        if (log) {
            setCollapsedIfTouchedBefore(false);
        }
    }, [log]);

    const updateLog = (title) => (r) => {
        debugOverwrite.value = null;
        const prefix = title ? `${title} = ` : "";
        setLog(prefix + asLog(r));
        setCollapsed(false);
    };


    const logSegments = useCallback(() => {
        console.log(
            synchronizedSetup.value,
            currentSetup.value,
            segmentEdits.value
        );
        let log = "Current Setup:\n" +
            asLog(currentSetup.value) + "\n\n" +
            "Segment Edits:\n";
        let segmentLog = "";
        for (const edit of segmentEdits.value) {
            segmentLog += compactJson(edit) + "\n";
        }
        segmentLog ||= asLog(undefined);
        log += segmentLog;
        setLog(log);
    }, []);

    useEffect(() => {
        if (enabled.segments) {
            logSegments();
        }
    }, [enabled.segments, currentSetup.value]);

    useEffect(() => {
        if (debugOverwrite.value) {
            setLog(
                JSON.stringify(
                    debugOverwrite.value.content,
                    null,
                    2
                )
            );
        }
    }, [debugOverwrite.value]);

    return (
        <div class="self-stretch p-2 flex flex-col gap-2"
             style={{
                 minWidth: "17vw",
                 position: collapsed ? "absolute" : undefined,
                 right: 0,
                 backgroundColor: "#FFFFFF55",
             }}
        >
            <div class={"flex flex-row items-center gap-2 text"}>
                <div>
                    Debug:
                </div>
                {
                    debugOverwrite.value &&
                    <span className={"text-black font-bold"}>
                        {debugOverwrite.value.source}
                    </span>
                }
                <span
                    className={"debug-link"}
                    onClick={() =>
                        refetch()
                            .then(updateLog("state"))
                    }
                >
                    State
                </span>
                <span
                    className={"debug-link"}
                    onClick={() =>
                        fetchRuns()
                            .then(updateLog("runs"))
                    }
                >
                    Runs
                </span>
                <span
                    className={"debug-link"}
                    onClick={() => {
                        logSegments();
                        setEnabled(state => ({segments: !state.segments}));
                    }}
                    style={{
                        color: enabled.segments ? "magenta" : undefined
                    }}
                >
                    Segments
                </span>
                <button
                    class={"ml-auto small-icon-button"}
                    onClick = {() =>
                        setCollapsed(state => !state)
                    }
                >
                    {
                        collapsed
                            ? <Lucide.PanelTopOpen/>
                            : <Lucide.PanelTopClose/>
                    }
                </button>
            </div>
            {
                !collapsed &&
                <textarea
                    class="flex-1 w-full font-mono resize-none border-2 border-gray-300 bg-zinc-100"
                    style={{
                        fontSize: 14,
                    }}
                    wrap="off"
                    value={log}
                    disabled
                />
            }
        </div>
    )
};
