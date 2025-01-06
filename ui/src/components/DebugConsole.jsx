import {useOverallRuns, useOverallState} from "../api/apiHooks.js";
import {useState} from "react";

export const DebugConsole = () => {
    const {refetch: fetchOverall} = useOverallState({enabled: false});
    const {refetch: fetchRuns} = useOverallRuns({enabled: false});
    const [log, setLog] = useState("");

    const updateLog = (r) => {
        if (typeof r === "object") {
            const data = r.data?.data ?? r.data ?? r;
            setLog(JSON.stringify(data, null, 2));
        } else {
            setLog(r);
        }
    }

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
