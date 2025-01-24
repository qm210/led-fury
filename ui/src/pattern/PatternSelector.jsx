import {hoveredPatternId, selectedPattern, selectedPatternId, synchronizedPatterns} from "../signals/pattern.js";
import {ActionButtons} from "../components/ActionButtons.jsx";
import * as Lucide from "lucide-preact";
import {deletePattern, importGifPattern, invalidateOverall} from "../api/api.js";
import {TRIANGLE_RIGHT} from "../utils/constants.jsx";
import {useStorageForSelectedPatternId} from "../signals/storage.js";
import {currentRgbArray, currentSecond} from "../signals/sequence.js";

export const PatternSelector = () => {
    const patterns = synchronizedPatterns.value;

    useStorageForSelectedPatternId();

    return (
        <div className="flex flex-col h-full"
             style={{
                 flex: !selectedPattern.value ? 1 : undefined
             }}
        >
            <div>
                Patterns
            </div>
            <div class="pattern-list__container mb-2">
                <div class="pattern-list">
                    {
                        patterns.map(pattern =>
                            <PatternListEntry
                                key={pattern.id}
                                pattern={pattern}
                            />
                        )
                    }
                    {
                        patterns.length < 1 &&
                        <>
                            <div/>
                            <div>
                                there is none.
                            </div>
                        </>
                    }
                </div>
            </div>
            <div class={"flex-1"}>
                <ActionButtons
                    actions={[{
                        element: Lucide.CopyPlus,
                        tooltip: `Copy Pattern "${selectedPattern.value?.name}"`,
                        disabled: !selectedPattern.value,
                        onClick: () => {
                            alert("not implemented yet...")
                        }
                    }, {
                        element: Lucide.ImagePlus,
                        tooltip: "Add GIF Pattern",
                        onClick: async () => {
                            const res = await importGifPattern({
                                renderSecond: currentSecond.value

                            });
                            selectedPatternId.value = res?.id ?? null;
                            if (res.rgb_values) {
                                currentRgbArray.value = res.rgb_values; 
                            }
                            await invalidateOverall();
                        },
                    }, {
                        element: Lucide.Trash2,
                        tooltip: `Delete Pattern "${selectedPattern.value?.name}"`,
                        disabled: !selectedPattern.value || patterns.length < 2,
                        onClick: async () => {
                            const index = patterns.indexOf(selectedPattern.value);
                            await deletePattern(selectedPattern.value.id);
                            selectedPatternId.value =
                                patterns[index - 1]?.id
                                    ?? patterns[0]?.id
                                    ?? 0;
                        },
                        style: {
                            marginLeft: "auto"
                        }
                    }]}
                />
            </div>
        </div>
    );
};

const PatternListEntry = ({pattern}) => {
    const hovered = hoveredPatternId.value === pattern.id;
    const selected = selectedPatternId.value === pattern.id;

    const style = {
        backgroundColor:
            hovered
                ? "var(--hover-pink)"
                : selected
                    ? "var(--selected-color)"
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
                hoveredPatternId.value = pattern.id;
            }}
            onMouseLeave={() => {
                hoveredPatternId.value = null;
            }}
            onClick={() => {
                selectedPatternId.value = pattern.id;
            }}
        >
            {pattern.name}
        </div>
    </>;
};
