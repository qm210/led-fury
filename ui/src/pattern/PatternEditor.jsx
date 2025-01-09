import {useEffect} from "preact/hooks";
import {EditRow} from "../components/EditRow.jsx";
import {ColorVariationCell} from "./ColorChooseRows.jsx";
import {hoveredPattern, patternEdits, selectedPattern} from "../signals/pattern.js";
import {currentSetup} from "../signals/setup.js";


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
            <ul class="border-2 rounded-sm border-gray-300 cursor-not-allowed"
                style={{
                    background: "#8883",
                    minHeight: 140,
                }}
            >
                {
                    patterns.map((p) =>
                        <li key={p.id}
                            class={"cursor-pointer px-6"}
                            onMouseEnter = {() => {
                                hoveredPattern.value = p;
                            }}
                            onMouseLeave = {() => {
                                hoveredPattern.value = null;
                            }}
                            style = {{
                                backgroundColor:
                                    hoveredPattern.value?.id === p.id ? "var(--hover-pink)" :
                                    selectedPattern.value?.id === p.id ? "white" : undefined,
                                fontWeight:
                                    selectedPattern.value?.id === p.id ? "bold" : undefined,
                                transition:
                                    hoveredPattern.value?.id === p.id
                                        ? "0ms"
                                        : "background-color 200ms ease-out"
                            }}
                        >
                            {p.name}
                        </li>
                    )
                }
            </ul>
        </div>
    );
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

    const maxLength = currentSetup.value.derived.maxSegmentLength;

    return (
        <div class="flex-1 flex flex-col">
            <div>
                Selected Pattern: <b>{pattern.name}</b>
            </div>
            <table
                class="w-full border-2 rounded-sm border-gray-300"
                onClick={() => console.log(pattern, patternEdits.value)}
            >
                <tbody>
                {/* start_sec, stop_sec*/}
                <tr>
                    <td>Type</td>
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
                    getDefault={(p, d) => p.template.pos[d]}
                    numeric={{
                        min: 0,
                        max: maxLength,
                    }}
                />
                <EditRow
                    label={"Start Velocity"}
                    editKey={"vel"}
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
                    <td colSpan={3}>
                        <ColorVariationCell/>
                    </td>
                </tr>
                </tbody>
            </table>
            {/*<div class="flex flex-row pt-2">*/}
            {/*    <button class="p-2"*/}
            {/*        disabled={pattern === workingCopy}*/}
            {/*        onClick = {() => postPattern(workingCopy)}*/}
            {/*    >*/}
            {/*        <Lucide.Check/>*/}
            {/*    </button>*/}
            {/*</div>*/}
        </div>
    );
};
