import {useSegmentGeometry, useSequenceApi} from "../api/apiHooks.js";
import {useWebSocket} from "../api/useWebSocket.js";
import {useEffect, useMemo, useState} from "react";
import {currentSetup} from "../signals/setup.js";
import Loader from "../utils/Loader.jsx";
import {signal} from "@preact/signals";
import {debugFromOutside} from "./DebugConsole.jsx";


const hover = signal({
    segment: null,
    pixel: null,
});

const setHover = (segment = null, index = null, color = null) => {
    hover.value = {
        segment,
        pixel: {index, color}
    };
};


export const LiveView = () => {
    // TODO ... flexible sizing, somehow
    const height = 400;

    const {current} = useSequenceApi();

    const view = useSegmentGeometry(currentSetup.value?.segments);

    useEffect(() => {
        if (view.geometry) {
            debugFromOutside.value = {
                source: "Geometry",
                content: view
            };
        }
    }, [view.geometry]);

    if (!view.geometry) {
        return (
            <LiveViewArea>
                <div class={"flex justify-center items-center"}>
                    <Loader/>
                </div>
            </LiveViewArea>
        );
    }

    const viewbox = useMemo(() => {
        const rect = view.geometry.rect;
        return [
            rect.x - 1,
            rect.y - 1,
            rect.width + 1,
            rect.height + 1,
        ].join(" ");
    }, [view.geometry.rect])

    return (
        <LiveViewArea style={{
            minWidth: "66vw"
        }}>
            <svg
                width={"100%"}
                height={"50vh"}
                viewBox={viewbox}
                preserveAspectRatio="xMidYMid"
                pointerEvents="all"
            >
                {view.segments.map((segment, index) =>
                    <SegmentLiveView
                        segment={segment}
                        geometry={view.geometry}
                        initialValues={current?.values}
                        key={index}
                    />
                )}
            </svg>
            <HoverInfo
                segments={view.segments}
            />
        </LiveViewArea>
    );
};

const LiveViewArea = ({children, ...props}) =>
    <div className={"flex-1 w-full h-full bg-gray-700 text-white relative"}
         {...props}
    >
        {children}
    </div>;


const HoverInfo = ({segments}) => {
    const info = useMemo(() => {
        if (!hover.value?.segment) {
            return "";
        }
        let result = `Pixel ${hover.value.pixel.index + 1}`;
        if (segments.length > 1) {
            result = `Segment 0, ` + result;
        }
        return result;
    }, [hover.value]);

    if (!info) {
        return null;
    }

    return (
        <div className={"absolute right-0 bottom-0 p-4"}>
             <span className={"p-2"}
                   style={{
                       backgroundColor: hover.value.pixel?.color ?? "magenta"
                   }}
             >
                {info}
             </span>
        </div>
    );
};


const SegmentLiveView = ({segment, geometry, initialValues}) => {
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

    return <>
        {geometry.coordinates.map(c =>
            <Pixel
                pixel={c}
                segment={segment}
                values={values}
                key={c.index}
            />
        )}
        {
            hover.value.pixel?.index !== undefined &&
            <PixelLabel
                pixel={geometry.coordinates[hover.value.pixel.index]}
                isHovered
            />
        }
    </>;
};

const calculateCssColor = (index, segment, values) => {
    if (index < segment.start || index > segment.start + segment.length) {
        return "none";
    }
    if (!values || values.length === 0) {
        return "black";
    }
    const rgb = values?.slice(3 * index, 3 * index + 3);
    return `rgba(${rgb.join(',')},1)`;
};

const Pixel = ({
                   segment, values, pixel
               }) => {

    const color = calculateCssColor(pixel.index, segment, values);

    return (
        <g
            onMouseEnter={() => setHover(segment, pixel.index, color)}
            onMouseLeave={() => setHover()}
            onClick={() => console.log(segment, values, pixel)}
            cursor="pointer"
        >
            <circle
                cx={pixel.x}
                cy={pixel.y}
                r={0.5}
                fill={color}
                stroke="none"
            />
            <PixelLabel
                pixel={pixel}
            />
        </g>
    );
};

const PixelLabel = ({pixel, isHovered}) => {

    if (!pixel) {
        return null;
    }

    return (
        <text
            fill={"white"}
            stroke={"grey"}
            strokeWidth={0.03}
            fillOpacity={isHovered ? 1 : 0.4}
            strokeOpacity={isHovered ? 0.5 : 0}
            x={pixel.x + 0.15}
            y={pixel.y - 0.5 + 0.95}
            fontSize={0.6}
            textAnchor={"middle"}
        >
            {pixel.index + 1}
        </text>
    );
};
