import {DragNumberInput} from "../components/DragNumberInput.jsx";
import {currentSetup, lastRetrievedSetup} from "../signals/setup.js";
import {applySegmentEdit} from "../signals/segments.js";
import {isNonlinear, SEGMENT_SHAPES} from "./segmentShapes.js";
import {Checkbox} from "../components/Checkbox.jsx";
import {SpinNumberInput} from "../components/SpinNumberInput.jsx";

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
                    <td colSpan={2}>
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
        <tr class={"segment-row"}>
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
            <td>
                Pixels:
            </td>
            <td>
                <SpinNumberInput
                    value={segment.length}
                    onChange={(value) =>
                        applySegmentEdit(makeKey("len"), value)
                    }
                    min={1}
                    resetValue={lastRetrievedSetup.value.segments[index].length}
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
            <tr className={"segment-row details"}>
                <td>
                    Divisions:
                </td>
                <td>
                    <div>
                        <SpinNumberInput
                            value={segment.divisions}
                            onChange={(value) => {
                                applySegmentEdit(makeKey("div"), value);
                            }}
                            min={1}
                        />
                    </div>
                </td>
                <td>
                    Alternating?
                </td>
                <td style={{textAlign: "left"}}>
                    <Checkbox
                        checked={segment.alternating}
                        onChange={checked =>
                            applySegmentEdit(makeKey("alt"), checked)
                        }
                    />
                </td>
            </tr>
        }
    </>;
};

