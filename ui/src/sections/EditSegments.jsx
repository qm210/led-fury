import {DragNumberInput} from "../components/DragNumberInput.jsx";
import {currentSetup, lastRetrievedSetup, updateCurrentSetupFromEdits} from "../signals/setup.js";
import {applySegmentEdit, segmentEdits} from "../signals/segments.js";
import {useEffect} from "react";

const formatSegment = (segment) => {
    let result = `${segment.length} Pixels`;
    if (segment.start > 0) {
        result += ` from Index ${segment.start}`
    }
    return result;
};
const alternatingOption = {
    label: "Alternate:",
    type: "bool",
    value: false
};

export const EditSegments = () => {

    /*
    const [options, setOptions] = useState();
    const options = {
        "rect": [
            {
                label: "Length",
                type: "number",
                value: 999
            },
            alternatingOption
        ],
        "area": [
            {
                label: "Spikes",
                type: "number",
                value: 8
            },
            alternatingOption
        ]
    };
     */

    const setup = currentSetup.value;

    if (!setup) {
        return null;
    }

    return (
        <div class="flex-1 flex flex-col">
            <div>
                Setup
            </div>
            <table
                class="w-full border-2 rounded-sm border-gray-300"
            >
                <tbody>
                <tr className="border-t border-2 border-gray-300">
                    <td>
                        WLED Host
                    </td>
                    <td>
                        {setup.host}{"\u2009:\u2009"}{setup.port}
                    </td>
                </tr>
                {
                    setup.segments.map((segment, index) =>
                        <EditSegmentRows
                            setup={setup}
                            segment={segment}
                            index={index}
                            key={index}
                        />
                    )
                }
                </tbody>
            </table>
        </div>
    );
};

const SEGMENT_SHAPES = [{
    name: "Line",
    value: "linear"
}, {
    name: "Rectangle",
    value: "rect"
}, {
    name: "Star",
    value: "star"
}];

const EditSegmentRows = ({setup, segment, index}) => {

    const makeKey = (...args) => ["seg", index, ...args];

    const onChangeSegmentShape = (segmentIndex) => (event) => {
        const shape = event.target.value;
        applySegmentEdit(makeKey("shape"), shape);
    };

    return <>
        <tr>
            {
                index === 0
                    ? (
                        <td
                            rowSpan={setup.segments.length}
                            className={"align-top"}
                        >
                            LED Segments
                        </td>
                    ) : <td/>
            }
            <td>{formatSegment(segment)}</td>
            <td>
                <DragNumberInput
                    value={segment.length}
                    min={1}
                    resetValue={lastRetrievedSetup.value.segments[index].length}
                    onChange={(value) => applySegmentEdit(makeKey("len"), value)}
                />
            </td>
            <td>
                Shape:
            </td>
            <td>
                <select
                    defaultValue={"line"}
                    onChange={onChangeSegmentShape(index)}
                >
                    {SEGMENT_SHAPES.map(kv =>
                        <option value={kv.value}>
                            {kv.name}
                        </option>
                    )}
                </select>
            </td>
        </tr>
    </>;
};
