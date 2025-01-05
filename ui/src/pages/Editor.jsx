import {useComponentDimensions} from "../components/useComponentDimensions.jsx";
import {useAllTheStuff, useSequence} from "../api/apiHooks.js";
import {ControlButtons} from "../components/ControlButtons.jsx";
import {useEffect, useMemo, useState} from "react";
import {useWebSocket} from "../api/useWebSocket.js";
import Slider from "rc-slider";


const EditorPage = () => {
    const query = useAllTheStuff({suspense: true});

    const data = query.data.data;
    console.log("Overall Query", data);

    return (
        <div
            className="flex flex-col gap-2 w-full h-full bg-slate-50 p-2"
            style={{
                minWidth: 1600,
                minHeight: 600,
            }}
        >
            <SequencePreview data={data}/>
            <ControlButtons data={data}/>
            <div className="flex flex-row gap-2 w-full justify-stretch items-stretch">
                <EditPatterns
                    patterns={data.patterns}
                    selectedId={data.selected.pattern}
                />
                <EditPattern
                    patterns={data.patterns}
                    selectedId={data.selected.pattern}
                    is2d={data.info.is2d}
                />
                <EditSegments
                    setup={data.setup}
                    info={data.info}
                />
            </div>
        </div>
    );
};

export default EditorPage;


const SequencePreview = ({data}) => {
    // TODO ... flexible sizing, somehow
    const {ref, dimensions} = useComponentDimensions();
    const width = 1600;
    const height = 400;

    const {current} = useSequence();

    return (
        <div className="flex-1 w-full bg-gray-700 text-white"
             ref={ref}
        >
            <div class={"w-full h-full"}>
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="xMidYMid"
                >
                    {data.setup.segments.map((segment, index) =>
                        <SegmentPreview
                            segment={segment}
                            maxLength={data.info.maxSegmentLength}
                            width={width}
                            height={height}
                            key={index}
                            initialValues={current?.values}
                        />
                    )}
                </svg>
            </div>
        </div>
    )
};

const SegmentPreview = ({segment, maxLength, width, height, initialValues}) => {
    const {message} = useWebSocket();
    const [values, setValues] = useState([]);

    useEffect(() => {
        setValues(initialValues)
    }, [initialValues]);

    useEffect(() => {
        if (message?.values) {
            setValues(message.values);
        }
    }, [message]);

    const margin = 16;
    const size = (width - 2 * margin) / maxLength;
    return Array(maxLength).fill(0).map((_, i) =>
        <PixelPreview
            index={i}
            x={0.5 * margin + (i + 0.5) * size}
            y={0.5 * (height - size)}
            radius={0.5 * size}
            segment={segment}
            values={values}
            key={i}
        />
    );
};

const PixelPreview = ({segment, values, index, x, y, radius}) => {
    const color = useMemo(() => {
        if (index < segment.start || index > segment.start + segment.length) {
            return "none";
        }
        if (!values) {
            return "black";
        }
        const rgb = values.slice(3 * index, 3 * index + 3);
        return `rgba(${rgb.join(',')},1)`;
    }, [segment, values, index]);

    return (
        <g transform={`translate(${x} ${y})`}>
            <circle
                cx={0}
                cy={0}
                r={radius}
                fill={color}
                stroke="none"
            />
            <text
                fill={"white"}
                fillOpacity={0.5}
                x={0}
                y={2.5 * radius}
                fontSize={11}
                textAnchor={"middle"}
            >
                {index + 1}
            </text>
        </g>
    );
}

const EditPatterns = ({patterns, selectedId}) => {
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
                            style={selectedId === p.id ? {
                                backgroundColor: "#FFF6",
                                fontWeight: "bold"
                            } : {}}
                        >
                            {p.name || p.id}
                        </li>
                    )
                }
            </ul>
        </div>
    );
};

const EditPattern = ({patterns, selectedId, is2d}) => {
    const pattern = patterns.find(p => p.id === selectedId) ?? patterns[0];

    if (!pattern) {
        return (
            <div class="flex-1 border-2 rounded-sm p-8 opacity-50">
                No Pattern Selected
            </div>
        )
    }

    // TODO: all parameters, and make editable

    const [fade, setFade] = useState(pattern.fade);

    return (
        <div class="flex-1 flex flex-col">
            <div>
                Selected Pattern: <b>{pattern.name ?? pattern.id}</b>
            </div>
            <table
                class="w-full border-2 rounded-sm border-gray-300"
                onClick={() => console.log(pattern)}
            >
                <tbody>
                {/* start_sec, stop_sec*/}
                <tr>
                    <td>Type</td>
                    <td>{pattern.type}</td>
                </tr>
                <tr>
                    <td>Fade Factor</td>
                    <td>{pattern.fade}</td>
                    <td width="80px" class={"pr-4"}>
                        <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={100 * fade}
                            onChange={e => setFade(0.01 * e)}
                        />
                    </td>
                </tr>
                <tr class="border-t border-2 border-gray-300">
                </tr>
                <tr>
                    <td>Start Position</td>
                    <td>{pattern.template.pos[0]}
                    </td>
                </tr>
                {/* TODO: Y stuff if is2d */}
                <tr>
                    <td>Start Velocity</td>
                    <td>
                        {pattern.template.motion[0].vel * pattern.template.motion[0].sign}
                    </td>
                </tr>
                <tr>
                    <td>Size</td>
                    <td>
                        {pattern.template.size[0]}
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

const formatSegment = (segment) => {
    let result = `${segment.length} Pixels`;
    if (segment.start > 0) {
        result += ` from Index ${segment.start}`
    }
    return result;
};

const EditSegments = ({setup, info}) => {
    return (
        <div class="flex-1 flex flex-col">
            <div>
                Setup
            </div>
            <table
                class="w-full border-2 rounded-sm border-gray-300"
                onClick={() => console.log(setup, info)}
            >
                <tbody>
                <tr>
                    <td
                        rowSpan={setup.segments.length}
                        class={"align-top"}
                    >
                        LED Segment{info.is2d ? "s" : ""}
                    </td>
                    <td>{formatSegment(setup.segments[0])}</td>
                </tr>
                {
                    setup.segments.slice(1).map((segment, index) =>
                        <tr key={index}>
                            <td>{formatSegment(segment)}</td>
                        </tr>
                    )
                }
                <tr class="border-t border-2 border-gray-300">
                    <td>WLED Host</td>
                    <td>{setup.host}{"\u2009:\u2009"}{setup.port}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};
