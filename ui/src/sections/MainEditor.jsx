import {ControlButtons} from "./ControlButtons.jsx";
import {LiveView} from "./LiveView.jsx";
import {PatternEditor} from "../pattern/PatternEditor.jsx";
import {DebugConsole} from "./DebugConsole.jsx";
import {EditSegments} from "./EditSegments.jsx";
import Loader from "../utils/Loader";
import {pendingOverlay} from "../signals/app.js";


const EditorPage = () => {
    return <>
        <div class="flex-1 flex flex-row justify-center self-center">
            <div class="flex flex-col gap-2 bg-slate-100 p-2 relative">
                <LiveView/>
                <ControlButtons/>
                <EditorPanels/>
                <PendingOverlay/>
            </div>
        </div>
        <DebugConsole/>
    </>;
};

export default EditorPage;

const EditorPanels = () => {
    return (
        <div className="flex flex-row gap-2 w-full justify-stretch items-stretch">
            <PatternEditor/>
            <EditSegments/>
        </div>
    );
};

const PendingOverlay = () => {
    if (!pendingOverlay.value) {
        return null;
    }

    return (
        <div class={"absolute left-0 right-0 top-0 bottom-0 h-9/12 pointer-events-none"}>
            <Loader
                size={"100%"}
            />
        </div>
    );
};
