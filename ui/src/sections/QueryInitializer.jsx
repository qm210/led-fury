import {useState, useEffect, Suspense} from "preact/compat";
import Loader from "../utils/Loader.jsx";
import {synchronizedPatterns, selectedPattern} from "../signals/pattern.js";
import {loadSetupFromStorage, segmentEdits} from "../signals/segments.js";
import {synchronizedSetup, updateCurrentSetupFromEdits} from "../signals/setup.js";
import {useOverallState} from "../api/api.js";
import * as Lucide from "lucide-preact";


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
    const {data: {data}} = useOverallState();

    useEffect(() => {
        if (!data.patterns) {
            return;
        }
        synchronizedPatterns.value = data.patterns;
        selectedPattern.value = data.patterns.find(
            p => p.id === data.selected?.pattern
        ) ?? data.patterns[0];
    }, [data.patterns])

    useEffect(() => {
        if (!data.setup) {
            return;
        }
        if (!loadSetupFromStorage(data.setup.id)) {
            synchronizedSetup.value = structuredClone(data.setup);
            segmentEdits.value = [];  // <-- ...want?
        }
        updateCurrentSetupFromEdits()
            .then(() => setInitialized(true));
    }, [data.setup]);

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
