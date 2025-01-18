import {useOverallState} from "../api/apiHooks.js";
import {ControlButtons} from "./ControlButtons.jsx";
import {LiveView} from "./LiveView.jsx";
import {PatternEditor} from "../pattern/PatternEditor.jsx";
import {DebugConsole} from "./DebugConsole.jsx";
import {lastSynchronizedSetup, updateCurrentSetupFromEdits} from "../signals/setup.js";
import {useEffect} from "preact/hooks";
import {EditSegments} from "./EditSegments.jsx";
import {loadSetupFromStorage, segmentEdits} from "../signals/segments.js";
import {lastSynchronizedPatterns} from "../signals/pattern.js";


const EditorPage = () => {
    const query = useOverallState({suspense: true, timeout: 3000});
    const overall = query.data.data;

    useEffect(() => {
        if (!overall.patterns) {
            return;
        }
        lastSynchronizedPatterns.value = overall.patterns;
    }, [overall.patterns])

    useEffect(() => {
        if (!overall.setup) {
            return;
        }
        if (!loadSetupFromStorage(overall.setup.id)) {
            lastSynchronizedSetup.value = structuredClone(overall.setup);
            segmentEdits.value = [];  // <-- ...want?
        }
        updateCurrentSetupFromEdits();
    }, [overall.setup]);

    return <>
        <div class="flex-1 flex flex-row justify-center self-center">
            <div class="flex flex-col gap-2 bg-slate-50">
                <LiveView/>
                <ControlButtons/>
                <div className="flex flex-row gap-2 w-full justify-stretch items-stretch">
                    <PatternEditor
                        patterns={lastSynchronizedPatterns.value}
                        selectedPatternId={overall.selected?.pattern}
                    />
                    <EditSegments/>
                </div>
            </div>
        </div>
        <DebugConsole/>
    </>;
};

export default EditorPage;
