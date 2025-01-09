import {useSequenceApi} from "../api/apiHooks.js";
import {useWebSocket} from "../api/useWebSocket.js";
import {useEffect, useMemo, useState} from "react";
import {currentSetup} from "../signals/setup.js";
import Loader from "../utils/Loader.jsx";
import {calculatePixelPosition, calculatePixelPositions} from "./segmentShapes.js";
import {useSignal} from "@preact/signals";


export const LiveView = () => {
    // TODO ... flexible sizing, somehow
    const width = 1600;
    const height = 400;
    const area = useSignal({x:0, y:0, width, height});

    const {current} = useSequenceApi();

    // replaces the prop, let's see whether all is fine and dandy now.
    const setup = currentSetup.value;

    if (!setup) {
        return (
            <LiveViewArea>
                <div class={"flex justify-center items-center"}>
                    <Loader/>
                </div>
            </LiveViewArea>
        );
    }

    const viewbox = [
        area.value.x - 0.05 * area.value.width,
        area.value.y - 0.05 * area.value.height,
        area.value.width * 1.1,
        area.value.height * 1.1,
    ].join(" ");

    return (
        <LiveViewArea>
            <div className={"w-full h-full"}>
                <svg
                    width={width}
                    height={height}
                    viewBox={viewbox}
                    preserveAspectRatio="xMidYMid"
                    pointerEvents="all"
                >
                    {setup.segments.map((segment, index) =>
                        <SegmentLiveView
                            segment={segment}
                            maxLength={setup.derived.maxSegmentLength}
                            totalNumber={setup.derived.totalNumberPixels}
                            areaSignal={area}
                            key={index}
                            initialValues={current?.values}
                        />
                    )}
                </svg>
            </div>
        </LiveViewArea>
    );
};

const LiveViewArea = ({children, ...props}) =>
    <div className="flex-1 w-full bg-gray-700 text-white"
         {...props}
    >
        {children}
    </div>;


const SegmentLiveView = ({segment, totalNumber, maxLength, areaSignal, initialValues}) => {
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

    const {coordinates, area} = useMemo(() =>
        calculatePixelPositions(totalNumber, segment, 25)
    , [totalNumber, segment]);

    useEffect(() => {
        areaSignal.value = {
            x: area.minX,
            y: area.minY,
            width: area.width,
            height: area.height,
        };
        if (!areaSignal.value.height) {
            areaSignal.value.height = 20;
        }
    }, [area]);

    const radius = 10;

    return coordinates.map(c =>
        <Pixel
            index={c.index}
            x={c.x - radius}
            y={c.y - radius}
            radius={radius}
            segment={segment}
            values={values}
            key={c.index}
        />
    );
};

const Pixel = ({
    segment, values, index, x, y, radius
    }) => {
    const [hover, setHover] = useState(false);

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
        <g
            transform={`translate(${x} ${y})`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => console.log(segment, values, index)}
            cursor="pointer"
        >
            <circle
                cx={0}
                cy={0}
                r={radius}
                fill={color}
                stroke="none"
            />
            <text
                fill={"white"}
                fillOpacity={hover ? 1 : 0.3}
                x={0.5 * radius}
                y={radius}
                fontSize={11}
                textAnchor={"middle"}
            >
                {index + 1}
            </text>
        </g>
    );
};
