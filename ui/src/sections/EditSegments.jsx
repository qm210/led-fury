import {DragNumberInput} from "../components/DragNumberInput.jsx";
import {currentSetup, lastRetrievedSetup} from "../signals/setup.js";
import {applySegmentEdit} from "../signals/segments.js";
import {isNonlinear, SEGMENT_SHAPES} from "./segmentShapes.js";
import {Checkbox} from "../components/Checkbox.jsx";

const formatSegment = (segment) => {
    let result = `${segment.length} Pixels`;
    if (segment.start > 0) {
        result += ` from Index ${segment.start}`
    }
    return result;
};

export const EditSegments = () => {
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
                            segment={segment}
                            segments={setup.segments}
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

const EditSegmentRows = ({segment, index, segments}) => {

    const makeKey = (...args) => ["seg", index, ...args];

    const onChangeSegmentShape = (event) => {
        const newShape = event.target.value;
        if (segment.shape === newShape) {
            return;
        }
        applySegmentEdit(makeKey("shape"), newShape);
    };

    const rowSpan = segments.length + segments.filter(isNonlinear).length;

    return <>
        <tr>
            {
                index === 0
                    ? (
                        <td
                            rowSpan={rowSpan}
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
                    value={segment.shape}
                    onChange={onChangeSegmentShape}
                >
                    {SEGMENT_SHAPES.map(kv =>
                        <option value={kv.value}>
                            {kv.name}
                        </option>
                    )}
                </select>
            </td>
        </tr>
        {
            isNonlinear(segment) &&
            <tr>
                <td/>
                <td colSpan={3}>
                    <div class={"flex-of-inputs"}>
                        <div>
                            <div>
                                Divisions:
                            </div>
                            <div>
                                <input
                                    type={"number"}
                                    value={segment.divisions}
                                    onChange={(event) => {
                                        applySegmentEdit(makeKey("div"), +event.target.value);
                                    }}
                                    min={0}
                                    style={{width: "4rem", textAlign: "center"}}
                                />
                            </div>
                        </div>
                        <div>
                            <div>
                                Alternating?
                            </div>
                            <div>
                                <Checkbox
                                    checked={segment.alternating}
                                    onChange={checked =>
                                        applySegmentEdit(makeKey("alt"), checked)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        }
    </>;
};

