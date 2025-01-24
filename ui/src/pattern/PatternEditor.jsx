import {EditRow} from "../components/EditRow.jsx";
import {ColorVariationCell} from "./ColorChooseRows.jsx";
import {currentGeometry, geometryArea} from "../signals/setup.js";
import {formatBoundary} from "../utils/format.js";
import {visiblePattern} from "../signals/pattern.js";

export const PatternEditor = () => {
    if (!currentGeometry.value?.geometry) {
        return null;
    }

    const pattern = visiblePattern.value;

    if (!pattern) {
        return (
            <div class="flex-1 border-2 rounded-sm p-8 opacity-50">
                No Pattern Selected
            </div>
        );
    }

    return (
        <div class="flex flex-col items-center">
            <div>
                Selected Pattern: <b>{pattern.name}</b>
            </div>
            <table class="pattern-editor border-2 rounded-sm border-gray-300">
                <tbody>
                <tr>
                    <td>Type</td>
                    <td/>
                    <td>{pattern.type}</td>
                    <td class={"text-left"}>
                        {formatBoundary(pattern.template.boundary)}
                    </td>
                    <td width={"0"}/>
                </tr>
                <TypeSpecificInfo
                    pattern = {pattern}
                />
                <EditRow
                    label={"Opacity"}
                    editKey={"alpha"}
                    getDefault={p => p.opacity}
                    numeric={{
                        min: 0,
                        max: 200,
                        scale: 100,
                        display: x => x.toFixed(2)
                    }}
                />
                <EditRow
                    label={"Fade Factor"}
                    editKey={"fade"}
                    getDefault={p => p.template.fade}
                    numeric={{
                        min: 0,
                        max: 100,
                        scale: 100,
                        display: x => x.toFixed(2)
                    }}
                />
                <tr class="border-t border-gray-300 mb-2" style={{height: 2}}/>
                <TypeSpecificEditRows
                    pattern = {pattern}
                />
                </tbody>
            </table>
        </div>
    );
};

const TypeSpecificInfo = ({pattern}) => {
    switch (pattern.type) {
        case "gif":
            return <>
                <tr>
                    <td>Original Info</td>
                    <td colSpan={2}/>
                    <td colSpan={2} class={"text-left"}>
                        <span>
                            Frames: {pattern.template.n_frames}
                        </span>
                        <span>
                            , Size: {pattern.template.original_width} x {pattern.template.original_height}
                        </span>
                    </td>
                </tr>
            </>;
        default:
            return null;
    }
};

const TypeSpecificEditRows = () => {
    const pattern = visiblePattern.value;
    const Rows = {
        "point": PointPatternRows,
        "gif": GifPatternRows,
    }[pattern?.type];

    if (!Rows) {
        console.warn("Pattern Editor does not know type of pattern:", pattern);
        return null;
    }

    return (
        <Rows area={geometryArea.value}/>
    );
};

const PointPatternRows = ({area}) => <>
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
            max: area.width
        }}
        numericY={{
            min: 1,
            max: area.height
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
        label={"At Boundary"}
        editKey={"at_behaviour"}
        isVector
        getDefault={(p, d) => p.template.at_boundary[d]}
        select={{
            optionsKey: "BoundaryBehaviour"
        }}
        onClickHeader={p => console.log(...p.template.boundary)}
    />
</>;

const GifPatternRows = () => {
    return <>
        <EditRow
            label={"Frame Delay (sec)"}
            editKey={"delay"}
            getDefault={(p, d) =>
                p.template.frame_delay_sec
            }
            numeric={{
                min: 0.05,
                step: 0.05,
            }}
            resetValue = {1}
        />
        <tr>
            <td colSpan={99} className={"opacity-20"}>Küche ist dein TODO</td>
        </tr>
    </>
};
