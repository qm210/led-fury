import {hoveredPatternId, selectedPattern, selectedPatternId, synchronizedPatterns} from "../signals/pattern.js";
import {ActionButtons} from "../components/ActionButtons.jsx";
import * as Lucide from "lucide-preact";
import {importGifPattern, invalidateOverall, useOverallState, usePatternApi} from "../api/api.js";
import {useStorageForSelectedPatternId} from "../signals/storage.js";
import {currentRgbArray, currentSecond} from "../signals/sequence.js";
import {usePendingState} from "../api/usePendingState.jsx";
import {openFileDialog} from "../utils/fileDialog.js";

export const PatternSelector = () => {
    const patterns = synchronizedPatterns.value;
    const {deletePattern} = usePatternApi();

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
                            <div/>
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
                        onClick: async (event) => {
                            let files;
                            if (!event.ctrlKey) {
                                // CTRL + Click for my test import (=
                                files = await openFileDialog(["gif"]);
                                if (!files) {
                                    return;
                                }
                            }
                            const res = await importGifPattern({
                                files,
                                renderSecond: currentSecond.value
                            });
                            console.log("Response from GIF import", res);
                            if (!res.patterns?.length) {
                                return;
                            }
                            selectedPatternId.value = res.patterns.pop().id;
                            if (res.rgbArrays) {
                                currentRgbArray.value = res.rgbArrays[selectedPatternId.value];
                                console.log("RGB array now", currentRgbArray.value);
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
    const {state} = useOverallState();
    const [pending, withPending] = usePendingState();
    const {patch} = usePatternApi(pattern.id);

    const showSolo = state.selected.soloPatternId === pattern.id;
    const isActuallySolo = showSolo || state.patterns.length === 1;
    const isActuallyHidden = pattern.hidden || (
         state.selected.soloPatternId !== null && !showSolo
    );

    const toggleVisibility = async () => {
        // order: normal -> solo -> hidden -> normal -> ...
        const patchBody = {
            showSolo: !pattern.hidden && !isActuallySolo,
            hidden: isActuallySolo,
            seekSecond: currentSecond.value,
        };
        await withPending(() =>
            patch(patchBody)
        );
    };

    const visibility = {
        icon: isActuallySolo
            ? Lucide.ScanEye
            : pattern.hidden
                ? Lucide.EyeOff
                : Lucide.Eye,
        fixed: state.patterns.length === 1,
        color: hovered
            ? "var(--hover-pink)"
            : undefined
    };

    const style = {
        backgroundColor:
            hovered
                ? "var(--hover-pink)"
                : selected
                    ? "var(--selected-color)"
                    : undefined,
        color:
            selected ? "black" : "#0008",
        opacity:
            isActuallyHidden ? 0.5 : 1,
        transition:
            hovered
                ? "0ms"
                : "background-color 200ms ease-out",
    };

    return <>
        <div style={style} class={"pl-2"}>
            {
                pending
                    ? <Lucide.LoaderCircle class={"animate-spin-funny duration-[500ms]"}/>
                    : selected
                        ? <Lucide.ChevronRight/>
                        : null
            }
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
        <div
            onClick={toggleVisibility}
            className={"hover:text-[var(--hover-pink)] transition-colors duration-300 pr-2"}
            style={{
                ...style,
                pointerEvents: visibility.fixed ? "none" : "all",
                cursor: "pointer",
                color: visibility.fixed ? "silver" : undefined,
            }}
        >
            <visibility.icon/>
        </div>
    </>;
};
