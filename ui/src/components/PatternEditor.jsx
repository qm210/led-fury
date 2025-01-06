import Slider from "rc-slider";
import {replacedAt} from "../utils/array.js";
import {signal} from "@preact/signals";
import {useEffect} from "preact/hooks";
import {useState} from "react";


export const patternEdits = signal([]);
export const selectedPattern = signal(null);


const keysMatch = (key1, key2) => {
    if (key1 instanceof Array) {
        key1 = key1.join(".");
    }
    if (key2 instanceof Array) {
        key2 = key2.join(".");
    }
    return key1 === key2;
};

const matchingEdit = key => edit =>
    edit.patternId === selectedPattern.value?.id
    && keysMatch(edit.key, key);

const findEdit = (key) =>
    patternEdits.value.find(matchingEdit(key));

const applyEdit = (key, value) => {
    if (key instanceof Array) {
        key = key.join(".");
    }
    const patternId = selectedPattern.value.id;
    const edit = {
        id: [patternId, key].join("."),
        patternId,
        key,
        value
    };
    let unmatched = true;
    const edits = [...patternEdits.value];
    for (let i = 0; i < edits.length; i++) {
        if (matchingEdit(key)(edits[i])) {
            edits[i] = edit;
            unmatched = false;
        }
    }
    if (unmatched) {
        edits.push(edit);
    }
    // need to assign new reference
    patternEdits.value = edits;
};


export const PatternEditor = ({patterns, selectedPatternId, info}) => {

    useEffect(() => {
        selectedPattern.value = patterns
            .find(p => p.id === selectedPatternId)
            ?? patterns[0];
    }, [selectedPatternId]);

    return <>
        <EditPatterns
            patterns={patterns}
        />
        <EditPattern
            info={info}
        />
    </>
};

const EditPatterns = ({patterns}) => {
    return (
        <div className="flex-1 flex flex-col">
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
                            class="cursor-pointer hover:bg-white"
                            style={selectedPattern.value?.id === p.id ? {
                                backgroundColor: "#FFF6",
                                fontWeight: "bold"
                            } : {}}
                        >
                            {p.name}
                        </li>
                    )
                }
            </ul>
        </div>
    );
};

const EditPattern = ({info}) => {
    const pattern = selectedPattern.value;

    if (!pattern) {
        return (
            <div class="flex-1 border-2 rounded-sm p-8 opacity-50">
                No Pattern Selected
            </div>
        )
    }

    const fade = findEdit("fade")?.value ?? pattern.fade;

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
                    <td width={"30%"}/>
                    <td width={"0"}/>
                </tr>
                <tr>
                    <td>Fade Factor</td>
                    <td>{pattern.fade.toFixed(2)}</td>
                    <td>
                        <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={100 * fade}
                            onChange={e => {
                                applyEdit("fade", 0.01 * e);
                            }}
                        />
                    </td>
                    <td>
                        <span style={{
                            opacity: fade === pattern.fade ? 0.3 : 1
                        }}>
                            {fade.toFixed(2)}
                        </span>
                    </td>
                </tr>
                <tr class="border-t border-2 border-gray-300">
                </tr>
                {/*<EditRow*/}
                {/*    is2d={info.is2d}*/}
                {/*    label={"Start Position"}*/}
                {/*    getValue={(p, d) => p.template.pos[d]}*/}
                {/*    setValue={(p, d, value) => ({*/}
                {/*        ...p,*/}
                {/*        template: {*/}
                {/*            ...p.template,*/}
                {/*            pos: replacedAt(p.template.pos, d, value)*/}
                {/*        }*/}
                {/*    })}*/}
                {/*    original={pattern}*/}
                {/*    copy={copy}*/}
                {/*    setCopy={setCopy}*/}
                {/*    numeric={{*/}
                {/*        min: 0,*/}
                {/*        max: info.maxSegmentLength*/}
                {/*    }}*/}
                {/*/>*/}
                <tr>
                    <td>Start Velocity</td>
                    <td>
                        {pattern.template.motion[0].vel * pattern.template.motion[0].sign}
                    </td>
                    <td/>
                </tr>
                <tr>
                    <td>Size</td>
                    <td>
                        {pattern.template.size[0]}
                    </td>
                    <td/>
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

const EditRow = ({is2d, label, getValue, setValue, original, copy, setCopy, numeric}) => {
    const rows = is2d ? 2 : 1;
    return Array(rows).fill().map((_, dim) =>
        <tr key={dim}>
            {
                dim === 0
                    ? <td colSpan={rows}>{label}</td>
                    : <td/>
            }
            <td>{getValue(original, dim)}</td>
            <td>
                {
                    numeric &&
                    <Slider
                        min={numeric.min ?? 0}
                        max={numeric.max}
                        step={numeric.step ?? 1}
                        value={getValue(copy, dim)}
                        onChange={e =>
                            setCopy(state => setValue(state, dim, e))
                        }
                    />
                }
            </td>
            <td>{getValue(copy, dim)}</td>
        </tr>
    );
};
