import {useOverallState} from "../api/apiHooks.js";
import {ControlButtons} from "../components/ControlButtons.jsx";
import {LiveView} from "../components/LiveView.jsx";
import {PatternEditor} from "../components/PatternEditor.jsx";
import {DebugConsole} from "../components/DebugConsole.jsx";

const EditorPage = () => {
    const query = useOverallState({suspense: true});
    const {patterns, selected, info, setup} = query.data.data;

    return <>
        <div class="flex-1 flex flex-row justify-center self-center">
            <div class="flex flex-col gap-2 bg-slate-50"
                 style={{
                     maxWidth: 2000,
                     minHeight: 600
                 }}
            >
                <LiveView
                    setup={setup}
                    info={info}
                />
                <ControlButtons/>
                <div className="flex flex-row gap-2 w-full justify-stretch items-stretch">
                    <PatternEditor
                        patterns={patterns}
                        selectedPatternId={selected.pattern}
                        info={info}
                    />
                    <EditSegments
                        setup={setup}
                        info={info}
                    />
                </div>
            </div>
        </div>
        <DebugConsole/>
    </>;
};

export default EditorPage;


const formatSegment = (segment) => {
    let result = `${segment.length} Pixels`;
    if (segment.start > 0) {
        result += ` from Index ${segment.start}`
    }
    return result;
};

const EditSegments = ({setup, info}) => {
    return (
        <div class="flex-1 flex flex-col">
            <div>
                Setup
            </div>
            <table
                class="w-full border-2 rounded-sm border-gray-300"
                onClick={() => console.log(setup, info)}
            >
                <tbody>
                <tr>
                    <td
                        rowSpan={setup.segments.length}
                        class={"align-top"}
                    >
                        LED Segment{info.is2d ? "s" : ""}
                    </td>
                    <td>{formatSegment(setup.segments[0])}</td>
                </tr>
                {
                    setup.segments.slice(1).map((segment, index) =>
                        <tr key={index}>
                            <td>{formatSegment(segment)}</td>
                        </tr>
                    )
                }
                <tr class="border-t border-2 border-gray-300">
                    <td>WLED Host</td>
                    <td>{setup.host}{"\u2009:\u2009"}{setup.port}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};
