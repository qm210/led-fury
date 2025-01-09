import {useEffect} from "preact/hooks";
import {EditRow} from "../components/EditRow.jsx";
import {ColorVariationCell} from "./ColorChooseRows.jsx";
import {hoveredPattern, patternEdits, selectedPattern} from "../signals/pattern.js";
import {currentSetup} from "../signals/setup.js";
import * as Lucide from "lucide-preact";
import {ActionButtonRow} from "../components/ActionButtonRow.jsx";
import {TRIANGLE_RIGHT} from "../utils/constants.jsx";


export const PatternEditor = ({patterns, selectedPatternId}) => {

    useEffect(() => {
        selectedPattern.value = patterns
            .find(p => p.id === selectedPatternId)
            ?? patterns[0];
    }, [selectedPatternId]);

    return <>
        <EditPatterns
            patterns={patterns}
        />
        <EditPattern/>
    </>
};

const EditPatterns = ({patterns}) => {
    return (
        <div className="flex flex-col">
            <div>
                Patterns
            </div>
            <div class="pattern-list border-2 rounded-sm border-gray-300 cursor-not-allowed mb-2"
                style={{
                    backgroundColor: "#8883",
                    minHeight: 140,
                }}
            >
                {
                    patterns.map(pattern =>
                        <PatternListEntry
                            key={pattern.id}
                            pattern={pattern}
                        />
                    )
                }
                {
                    patterns.length < 4 &&
                    <>
                        <div/>
                        <div/>
                    </>
                }
            </div>
            <ActionButtonRow
                actions={[{
                    element: Lucide.CopyPlus,
                    tooltip: `Copy Pattern "${selectedPattern.value?.name}"`,
                    disabled: !selectedPattern.value
                }, {
                    element: Lucide.Trash2,
                    tooltip: `Delete Pattern "${selectedPattern.value?.name}"`,
                    disabled: !selectedPattern.value || patterns.length < 2,
                    onClick: () => {
                        alert("hey!");
                    }
                }]}
            />
        </div>
    );
};

const PatternListEntry = ({pattern}) => {
    const hovered = hoveredPattern.value?.id === pattern.id;
    const selected = selectedPattern.value?.id === pattern.id;
    console.log(pattern);

    const style = {
        backgroundColor:
            hovered
                ? "var(--hover-pink)"
                : selected
                    ? "white"
                    : undefined,
        fontWeight:
            selected ? "bold" : undefined,
        transition:
            hovered
                ? "0ms"
                : "background-color 200ms ease-out"
    };

    return <>
        <div style={style}>
            {selected ? (TRIANGLE_RIGHT + " ") : ""}
        </div>
        <div
            className={"cursor-pointer px-6"}
            style={style}
            onMouseEnter={() => {
                hoveredPattern.value = pattern;
            }}
            onMouseLeave={() => {
                hoveredPattern.value = null;
            }}
        >
            {pattern.name}
        </div>
    </>;
};

const EditPattern = () => {
    const pattern = hoveredPattern.value ?? selectedPattern.value;

    if (!pattern) {
        return (
            <div class="flex-1 border-2 rounded-sm p-8 opacity-50">
                No Pattern Selected
            </div>
        );
    }

    const maxLength = currentSetup.value?.derived?.maxSegmentLength;

    if (!maxLength) {
        // not loaded yet
        return null;
    }

    return (
        <div class="flex-1 flex flex-col">
            <div>
                Selected Pattern <b>{TRIANGLE_RIGHT}{" "}{pattern.name}</b>
            </div>
            <table
                class="w-full border-2 rounded-sm border-gray-300"
                onClick={() => console.log(pattern, patternEdits.value)}
            >
                <tbody>
                {/* start_sec, stop_sec*/}
                <tr>
                    <td>Type</td>
                    <td/>
                    <td>{pattern.type}</td>
                    <td width={"30%"}>
                        <span class={"opacity-30 text-sm"}>
                            (there is no other)
                        </span>
                    </td>
                    <td width={"0"}/>
                </tr>
                <EditRow
                    label={"Fade Factor"}
                    editKey={"fade"}
                    getDefault={p => p.fade}
                    numeric={{
                        min: 0,
                        max: 100,
                        scale: 100,
                        display: x => x.toFixed(2)
                    }}
                />
                <tr class="border-t border-2 border-gray-300"/>
                <EditRow
                    label={"Start Position"}
                    editKey={"pos"}
                    isVector
                    getDefault={(p, d) => p.template.pos[d]}
                    numeric={{
                        min: 0,
                        max: maxLength,
                    }}
                />
                <EditRow
                    label={"Start Velocity"}
                    editKey={"vel"}
                    isVector
                    getDefault={(p, d) =>
                        p.template.motion[d].vel * p.template.motion[d].sign
                    }
                    numeric={{
                        step: 0.01
                    }}
                />
                <EditRow
                    label={"Point Size"}
                    editKey={"size"}
                    isVector
                    getDefault={(p, d) => p.template.size[d]}
                    numeric={{
                        min: 1,
                        max: Math.floor(maxLength / 2)
                    }}
                />
                <EditRow
                    label={"Color"}
                    editKey={"color"}
                    getDefault={(p) => p.template.color}
                    color={{
                        mode: "hsv",
                        withRanges: true
                    }}
                />
                <tr>
                    <td>
                        Color Randomness
                    </td>
                    <td/>
                    <td colSpan={3}>
                        <ColorVariationCell/>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};
