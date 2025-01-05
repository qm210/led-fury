import {useComponentDimensions} from "../components/useComponentDimensions.jsx";
import {useAllTheStuff} from "../api/apiHooks.js";
import {ControlButtons} from "../components/ControlButtons.jsx";


const EditorPage = () => {
    const query = useAllTheStuff({suspense: true});

    const data = query.data.data;

    return (
        <div
            className="flex flex-col gap-2 w-full h-full bg-slate-50 p-2"
            style={{
                minWidth: 800,
                minHeight: 600,
            }}
        >
            <div className="flex-1 w-full bg-gray-700 text-white">
                <SequencePreview sequence={data}/>
            </div>
            <ControlButtons sequence={data}/>
            <div className="flex flex-row gap-2 w-full justify-stretch items-stretch">
                {/*<div className="flex-1 border-2 rounded-sm">*/}
                {/*    <EditPatterns sequence={sequence}/>*/}
                {/*</div>*/}
                <div className="flex-1 border-2 rounded-sm">
                    <EditPattern sequence={data}/>
                </div>
                <div className="flex-1 border-2 rounded-sm">
                    <EditSegments sequence={data}/>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;


const SequencePreview = ({sequence}) => {
    const {ref, dimensions} = useComponentDimensions();
    console.log("Sequence Preview", sequence, ref, dimensions);

    return (
        <div ref={ref}>
            <div class={"w-full h-full"}>
                ... preview ...
            </div>
        </div>
    )
};

const EditPatterns = ({sequence}) => {
    return (
        <div>
            edit patterns
        </div>
    );
};

const EditPattern = ({sequence}) => {
    return (
        <div>
            edit pattern
        </div>
    );
};

const EditSegments = ({sequence}) => {
    return (
        <div>
            edit segments
        </div>
    );
};
