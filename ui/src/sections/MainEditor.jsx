import {useOverallState} from "../api/apiHooks.js";
import {ControlButtons} from "./ControlButtons.jsx";
import {LiveView} from "./LiveView.jsx";
import {PatternEditor} from "../pattern/PatternEditor.jsx";
import {DebugConsole} from "./DebugConsole.jsx";
import {lastRetrievedSetup, updateCurrentSetupFromEdits} from "../signals/setup.js";
import {useEffect} from "preact/hooks";
import {EditSegments} from "./EditSegments.jsx";

const EditorPage = () => {
    const query = useOverallState({suspense: true});
    const {patterns, selected, setup} = query.data.data;

    useEffect(() => {
        lastRetrievedSetup.value = structuredClone(setup);
        // segmentEdits.value = [];  // <-- ...want?
        updateCurrentSetupFromEdits();
    }, [setup]);

    return <>
        <div class="flex-1 flex flex-row justify-center self-center">
            <div class="flex flex-col gap-2 bg-slate-50"
                 style={{
                     maxWidth: 2000,
                     minHeight: "5vh"
                 }}
            >
                <LiveView/>
                <ControlButtons/>
                <div className="flex flex-row gap-2 w-full justify-stretch items-stretch">
                    <PatternEditor
                        patterns={patterns}
                        selectedPatternId={selected.pattern}
                    />
                    <EditSegments/>
                </div>
            </div>
        </div>
        <DebugConsole/>
    </>;
};

export default EditorPage;
