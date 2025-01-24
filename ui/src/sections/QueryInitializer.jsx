import {useState, useEffect, Suspense} from "preact/compat";
import Loader from "../utils/Loader.jsx";
import {synchronizedPatterns, selectedPattern, selectedPatternId} from "../signals/pattern.js";
import {segmentEdits} from "../signals/segments.js";
import {synchronizedSetup, updateCurrentSetupFromEdits} from "../signals/setup.js";
import {useOverallState} from "../api/api.js";
import * as Lucide from "lucide-preact";
import {loadSetupFromStorage} from "../signals/storage.js";


const QueryInitializer = ({children}) =>
    <Suspense fallback={DoesThisEvenWork}>
        <QueryFetcher>
            {children}
        </QueryFetcher>
    </Suspense>;

export default QueryInitializer;


const QueryFetcher = ({children}) => {
    // because the <Suspense .../> way didn't quite work, we implement our own.
    const [initialized, setInitialized] = useState(false);
    const {state} = useOverallState();

    useEffect(() => {
        if (!state.patterns) {
            return;
        }
        synchronizedPatterns.value = state.patterns;
        if (!selectedPattern.value) {
            selectedPatternId.value = state.selected?.pattern ?? state.patterns[0]?.id ?? null;
        }
    }, [state.patterns])

    useEffect(() => {
        if (!state.setup) {
            return;
        }
        if (!loadSetupFromStorage(state.setup.id)) {
            synchronizedSetup.value = structuredClone(state.setup);
            segmentEdits.value = [];  // <-- ...want?
        }
        updateCurrentSetupFromEdits()
            .then(() => setInitialized(true));
    }, [state.setup]);

    if (!initialized) {
        return (
            <div class={"full-column m-auto"}>
                <Loader>
                    Initializing...
                </Loader>
            </div>
        );
    }

    return children;
};

const DoesThisEvenWork = () => {
    console.log("oh wow, the Suspense fallback is rendered (◍•ᴗ•◍)❤");
    return (
        <Lucide.Loader
            size={"50vh"}
            color={"var(--some-violet)"}
            className={"animate-spin-funny opacity-80"}
        />
    );
};
