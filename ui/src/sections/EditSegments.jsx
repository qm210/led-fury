import {currentSetup, synchronizedSetup} from "../signals/setup.js";
import {applySegmentEdit} from "../signals/segments.js";
import {Checkbox} from "../components/Checkbox.jsx";
import {SpinNumberInput} from "../components/SpinNumberInput.jsx";
import {OptionSelector} from "../components/OptionSelector.jsx";


const isNonlinear = s => s.shape !== "linear";

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
            <table class="setup-table w-full border-2 rounded-sm border-gray-300">
                <tbody>
                <tr className="border-t border-2 border-gray-300">
                    <td class={"whitespace-nowrap text-left"}>
                        WLED Host:
                    </td>
                    <td colSpan={3}>
                        {setup.host}{"\u2009:\u2009"}{setup.port}
                    </td>
                </tr>
                <tr>
                    <td class={"whitespace-nowrap text-left"} colSpan={2}>
                        LED Segments:
                    </td>
                </tr>
                {
                    setup.segments.map((segment, index) =>
                        <SegmentEditor
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

const SegmentEditor = ({segment, index, segments}) => {

    const makeKey = (...args) => ["seg", index, ...args];

    const rowSpan = segments.length + segments.filter(isNonlinear).length;

    return <>
        <tr class={"segment-row"}>
            {
                segments.length > 1 &&
                <td rowSpan={rowSpan}>
                    #{index + 1}
                </td>
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
                    resetValue={synchronizedSetup.value?.segments[index].length}
                />
            </td>
            <td>
                <OptionSelector
                    optionsKey={"SegmentShape"}
                    value={segment.shape}
                    onChange={value =>
                        applySegmentEdit(makeKey("shape"), value)
                    }
                />
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
                    <Checkbox
                        checked={segment.alternating}
                        onChange={checked =>
                            applySegmentEdit(makeKey("alt"), checked)
                        }
                        labelLeft = {"Alternating?"}
                    />
                </td>
            </tr>
        }
    </>;
};

