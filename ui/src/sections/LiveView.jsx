import {useSequenceApi} from "../api/apiHooks.js";
import {useWebSocket} from "../api/useWebSocket.js";
import {useEffect, useMemo, useState} from "react";
import {currentSetup} from "../signals/setup.js";
import Loader from "../utils/Loader.jsx";


export const LiveView = () => {
    // TODO ... flexible sizing, somehow
    const width = 1600;
    const height = 400;

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

    return (
        <LiveViewArea>
            <div className={"w-full h-full"}>
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="xMidYMid"
                    pointerEvents="all"
                >
                    {setup.segments.map((segment, index) =>
                        <SegmentLiveView
                            segment={segment}
                            maxLength={setup.derived.maxSegmentLength}
                            width={width}
                            height={height}
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


const SegmentLiveView = ({segment, maxLength, width, height, initialValues}) => {
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
    return Array(maxLength).fill(0)
        .map((_, i) =>
            <Pixel
            index={i}
             x={margin + (i + 0.5) * size}
             y={0.5 * (height - size)}
             radius={0.5 * size}
             segment={segment}
             values={values}
             key={i}
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
                fillOpacity={hover ? 1 : 0.5}
                x={0}
                y={2.1 * radius}
                fontSize={11}
                textAnchor={"middle"}
            >
                {index + 1}
            </text>
        </g>
    );
};
