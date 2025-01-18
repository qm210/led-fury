import {useOverallRuns, useOverallState} from "../api/apiHooks.js";
import {useEffect, useState, useCallback} from "react";
import {segmentEdits} from "../signals/segments.js";
import {currentSetup, lastSynchronizedSetup} from "../signals/setup.js";
import {signal} from "@preact/signals";


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


export const DebugConsole = () => {
    const {refetch: fetchOverall} = useOverallState({enabled: false});
    const {refetch: fetchRuns} = useOverallRuns({enabled: false});
    const [log, setLog] = useState("");
    const [enabled, setEnabled] = useState({
        segments: false
    })

    const asLog = (r) => {
        if (typeof r === "object") {
            const data = r.data?.data ?? r.data ?? r;
            return JSON.stringify(data, null, 2);
        }
        return r;
    };

    const updateLog = (r) => {
        debugOverwrite.value = null;
        setLog(asLog(r));
    };


    const logSegments = useCallback(() => {
        console.log(
            lastSynchronizedSetup.value,
            currentSetup.value,
            segmentEdits.value
        );
        let log = "Current Setup:\n" +
            asLog(currentSetup.value) + "\n\n" +
            "Segment Edits:\n";
        for (const edit of segmentEdits.value) {
            log += JSON.stringify(edit, null, 2) + "\n";
        }
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
        <div class="self-stretch p-2 flex flex-col"
             style={{
                 minWidth: "15vw",
                 minHeight: "50vh",
             }}
        >
            <div class={"flex flex-row gap-2 text-sm"}>
                <div>
                    Debug:
                </div>
                <span className={"link"}
                      onClick={() =>
                          fetchOverall().then(updateLog)
                      }
                >
                    State
                </span>
                <span className={"link"}
                      onClick={() =>
                          fetchRuns().then(updateLog)
                      }
                >
                    Runs
                </span>
                <span className={"link"}
                      onClick={() => {
                          logSegments();
                          setEnabled(state => ({segments: !state.segments}));
                      }}
                      style={{color: enabled.segments ? "magenta" : undefined}}
                >
                    Segments
                </span>
                {
                    debugOverwrite.value &&
                    <span className={"text-red-800 font-bold"}>
                        {debugOverwrite.value.source}
                    </span>
                }

            </div>
            <textarea
                class="flex-1 w-full font-mono resize-none border-2 border-gray-300 bg-zinc-100"
                style={{
                    fontSize: 11,
                }}
                wrap="off"
                value={log}
                disabled
            />
        </div>
    )
};
