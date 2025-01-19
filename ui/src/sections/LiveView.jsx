import {useSequenceApi} from "../api/api.js";
import {useWebSocket} from "../api/useWebSocket.js";
import {useEffect, useMemo, useState} from "react";
import Loader from "../utils/Loader.jsx";
import {signal} from "@preact/signals";
import {currentGeometry} from "../signals/setup.js";


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
    const {current} = useSequenceApi();
    const {geometry, segments} = currentGeometry.value;

    if (!geometry) {
        return (
            <LiveViewArea style={{background: "white"}}>
                <div class={"flex justify-center items-center"}>
                    <Loader/>
                </div>
            </LiveViewArea>
        );
    }

    const viewbox = useMemo(() => {
        const rect = geometry.rect;
        return [
            rect.x - 1.5,
            rect.y - 1.5,
            rect.width + 2,
            rect.height + 2,
        ].join(" ");
    }, [geometry.rect])

    return (
        <LiveViewArea>
            <svg
                width={"100%"}
                height={"50vh"}
                viewBox={viewbox}
                preserveAspectRatio="xMidYMid"
                pointerEvents="all"
            >
                {segments.map((segment, index) =>
                    <SegmentLiveView
                        segment={segment}
                        geometry={geometry}
                        initialValues={current?.values}
                        key={index}
                    />
                )}
            </svg>
            <HoverInfo
                segments={segments}
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
        if (message?.rgbValues) {
            setValues(message.rgbValues);
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
            fontSize={0.3}
            textAnchor={"middle"}
        >
            {pixel.index + 1}
        </text>
    );
};
