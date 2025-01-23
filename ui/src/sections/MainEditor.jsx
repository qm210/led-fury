import {ControlButtons} from "./ControlButtons.jsx";
import {LiveView} from "./LiveView.jsx";
import {PatternEditor} from "../pattern/PatternEditor.jsx";
import {DebugConsole} from "./DebugConsole.jsx";
import {EditSegments} from "./EditSegments.jsx";
import Loader from "../utils/Loader";
import {pendingOverlay} from "../signals/app.js";
import {PatternSelector} from "../pattern/PatternSelector.jsx";


const EditorPage = () => {
    return (
        <div className={"flex-1 flex flex-row w-full h-full relative bg-slate-100"}>
            <div className="flex-1 flex flex-row justify-stretch items-stretch">
                <div className={"flex flex-col gap-4 p-2 justify-start h-full"}>
                    <div className="flex flex-row gap-2 w-full justify-stretch items-stretch">
                        <PatternSelector/>
                        <EditSegments/>
                    </div>
                    <PatternEditor/>
                </div>
                <div className="flex flex-col gap-2 bg-slate-100 p-2 w-full h-full justify-stretch items-stretch">
                    <LiveView/>
                    <ControlButtons/>
                </div>
            </div>
            <DebugConsole/>
            <PendingOverlay/>
        </div>
    );
};

export default EditorPage;


const LeftPanel = () => {
    // these is none :) but there _could_ be!
    return null;
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
