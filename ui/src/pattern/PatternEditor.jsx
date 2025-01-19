import {EditRow} from "../components/EditRow.jsx";
import {ColorVariationCell} from "./ColorChooseRows.jsx";
import {hoveredPattern, synchronizedPatterns, patternEdits, selectedPattern} from "../signals/pattern.js";
import * as Lucide from "lucide-preact";
import {ActionButtons} from "../components/ActionButtons.jsx";
import {INFINITY, PLUSMINUS, THIN_SPACE, TRIANGLE_RIGHT} from "../utils/constants.jsx";
import {currentGeometry} from "../signals/setup.js";


export const PatternEditor = () =>
    <>
        <EditPatterns/>
        <EditPattern/>
    </>;

const EditPatterns = () => {
    const patterns = synchronizedPatterns.value;

    if (!selectedPattern.value) {
        return null;
    }

    return (
        <div className="flex flex-col"
            style={{
                flex: !selectedPattern.value ? 1 : undefined
            }}
        >
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
            <ActionButtons
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
        <div style={style} class={"pl-2"}>
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
    if (!currentGeometry.value?.geometry) {
        return null;
    }

    const {area, rect: {width, height}} = currentGeometry.value.geometry;
    const pattern = hoveredPattern.value ?? selectedPattern.value;

    if (!pattern) {
        return (
            <div class="flex-1 border-2 rounded-sm p-8 opacity-50">
                No Pattern Selected
            </div>
        );
    }

    return (
        <div class="flex-1 flex flex-col">
            <div
                onClick = {() => console.log(pattern, patternEdits.value)}
            >
                Selected Pattern: <b>{pattern.name}</b>
            </div>
            <table class="w-full border-2 rounded-sm border-gray-300">
                <tbody>
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
                        min: area.x.min,
                        max: area.x.max,
                        step: 0.5,
                    }}
                    numericY={{
                        min: area.y.min,
                        max: area.y.max,
                        step: 0.5,
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
                        step: 0.1
                    }}
                />
                <EditRow
                    label={"Point Size"}
                    editKey={"size"}
                    isVector
                    getDefault={(p, d) => p.template.size[d]}
                    numeric={{
                        min: 1,
                        max: width
                    }}
                    numericY={{
                        min: 1,
                        max: height
                    }}
                />
                {/* TODO: Color Behavior might be outside the PointPattern -- later. */}
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
                        Color Spawn Variation
                    </td>
                    <td colSpan={1}/>
                    <td colSpan={3}>
                        <ColorVariationCell/>
                    </td>
                </tr>
                <EditRow
                    label={"Boundary Behaviour"}
                    editKey={"boundary_behaviour"}
                    isVector
                    getDefault={(p, d) => p.template.boundary[d].behaviour}
                    getExtra={formatBoundary}
                    select={{
                        optionsKey: "BoundaryBehaviour"
                    }}
                    onClickHeader={p => console.log(...p.template.boundary)}
                />
                </tbody>
            </table>
        </div>
    );
};

const formatOptionalNumber = (value) => {
    if (value === undefined || value === null) {
        return "";
    }
    const digits = 1;
    const result = value.toFixed(digits);
    if (result.endsWith('.' + "0".repeat(digits))) {
        return result.slice(0, -digits-1);
    }
    return result;
};

const formatBoundary = (pattern, dim) => {
    const boundary = pattern.template.boundary[dim];
    const min = formatOptionalNumber(boundary.min);
    const max = formatOptionalNumber(boundary.max);
    const range = !min && !max
        ? `${PLUSMINUS}${INFINITY}`
        : [min, "..", max].filter(x => !!x).join(THIN_SPACE);
    return `[${range}]`;
};
