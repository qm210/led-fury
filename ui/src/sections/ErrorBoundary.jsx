import {useErrorBoundary} from "preact/hooks";
import {backendBroken} from "../signals/app.js";
import * as Lucide from "lucide-preact";
import {patternEdits, selectedPattern} from "../signals/pattern.js";
import {currentGeometry, currentSetup, synchronizedSetup} from "../signals/setup.js";
import {segmentEdits} from "../signals/segments.js";


const ErrorBoundary = ({children}) => {
    const [error, resetError] = useErrorBoundary();

    if (backendBroken.value) {
        return (
            <div className={"full-column"}>
                <Lucide.CandyOff size={"10vh"}/>
                <div className={"m-auto text-4xl font-bold p-4"}>
                    Backend does not respond.
                </div>
                <div className={"text-xs"}>
                    is it broken or just Gen Z?
                </div>
                <button onClick={() => location.reload(true)}>
                    <Lucide.RotateCw/>{" Reload"}
                </button>
            </div>
        );
    }

    if (error) {
        console.log(
            "Signals:",
            "selectedPattern =", selectedPattern.value,
            "patternEdits =", patternEdits.value,
            "currentSetup =", currentSetup.value,
            "currentGeometry =", currentGeometry.value,
            "segmentEdits =", segmentEdits.value,
            "synchronizedSetup =", synchronizedSetup.value,
        );
        return (
            <div className={"full-column"}>
                <Lucide.FishOff size={"10vh"}/>
                <div className={"m-auto text-4xl font-bold"}>
                    Bad bad error goin' on.
                </div>
                <div className={"text-sm opacity-70"}>
                    This is commonly known as a <i>"stooly situation".</i>
                </div>
                <div className={"text-xl mt-8 border-2 border-black p-2 shadow"}>
                    <span className={"font-bold"}>
                        {error.name}:
                    </span>
                    {" "}
                    <span className={"font-bold text-red-800"}>
                        {error.message}
                    </span>
                </div>
                <button onClick={resetError}>
                    <Lucide.RotateCcw/>{" Reset"}
                </button>
                <div className={"my-8 mx-auto border border-grey-500 shadow"}
                     style={{
                         width: "fit-content",
                     }}
                >
                    <pre className={"p-4 text-left"}>
                        {error.stack}
                    </pre>
                </div>
            </div>
        );
    }

    return children;
};

export default ErrorBoundary;
