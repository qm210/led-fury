import {useWebSocket} from "../api/useWebSocket.js";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import Loader from "../utils/Loader.jsx";
import {signal} from "@preact/signals";
import {currentGeometry} from "../signals/setup.js";
import {calculateCssColor, isColorBright} from "../utils/colors.js";
import {currentRgbArray, updateRgbArray} from "../signals/sequence.js";
import {HoverInfo, RenderInfo} from "./LiveInfos.jsx";


const hover = signal({
    segment: null,
    pixel: {
        index: null,
        color: null,
        isBright: false,
    },
});

const setHover = (segment = null, index = null, color = null) => {
    hover.value = {
        segment,
        pixel: {
            index,
            color,
            isBright: isColorBright(color),
        }
    };
};

const useHeightResponsiveRef = () => {
    const [dimensions, setDimensions] = useState({
        initialized: false,
        height: null,
    });
    const ref = useRef(null);

    const adjustHeight = useCallback(() => {
        const rect = ref.current?.getBoundingClientRect();
        setDimensions({
            height: rect?.height ?? null,
            initialized: true
        });
    }, []);

    useEffect(() => {
        if (!ref.current || dimensions.initialized) {
            return;
        }
        adjustHeight();
        window.addEventListener("resize", adjustHeight);
        return () => {
            window.removeEventListener("resize", adjustHeight);
        }
    }, [adjustHeight, dimensions.initialized]);

    return {
        ...dimensions,
        ref
    };
};

export const LiveView = () => {
    const {geometry, segments} = currentGeometry.value;
    const {ref, height} = useHeightResponsiveRef();

    if (!geometry) {
        return (
            <LiveViewArea style={{background: "white"}}>
                <div class={"flex justify-center items-center"}>
                    <Loader/>
                </div>
            </LiveViewArea>
        );
    }

    return (
        <LiveViewArea>
            <div class={"flex flex-row w-full h-full items-start justify-center"}
                ref={ref}
            >
                {
                    height &&
                    <PixelSvg
                        segments={segments}
                        geometry={geometry}
                        height={height}
                    />
                }
            </div>
            <HoverInfo
                segments={segments}
                hover={hover.value}
            />
            <RenderInfo/>
        </LiveViewArea>
    );
};

const PixelSvg = ({segments, geometry, height}) => {

    const viewBox = useMemo(() => {
        const rect = geometry.rect;
        return [
            rect.x - 1.5,
            rect.y - 1.5,
            rect.width + 2,
            rect.height + 2,
        ].join(" ");
    }, [geometry.rect])

    return (
        <svg
            width={"100%"}
            height={height}
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            pointerEvents="all"
        >
            {segments.map((segment, index) =>
                <SegmentLiveView
                    segment={segment}
                    geometry={geometry}
                    key={index}
                />
            )}
        </svg>
    );
};

const LiveViewArea = ({children, ...props}) =>
    <div className={"flex-1 w-full h-full bg-gray-700 text-white relative"}
         {...props}
    >
        {children}
    </div>;


const SegmentLiveView = ({segment, geometry}) => {
    const {message} = useWebSocket();

    useEffect(() => {
        updateRgbArray(message);
    }, [message]);

    return <>
        {geometry.coordinates.map(c =>
            <Pixel
                pixel={c}
                segment={segment}
                values={currentRgbArray.value}
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

const Pixel = ({segment, values, pixel}) => {
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
                hide={pixel.index === hover.value?.pixel.index}
            />
        </g>
    );
};

const PixelLabel = ({pixel, isHovered, hide}) => {
    if (!pixel || hide) {
        return null;
    }
    return (
        <text
            fill={"white"}
            stroke={"grey"}
            strokeWidth={0.02}
            fillOpacity={isHovered ? 1 : 0.4}
            strokeOpacity={isHovered ? 0.8 : 0}
            x={pixel.x + 0.25}
            y={pixel.y - 0.5 + 0.95}
            fontSize={isHovered ? 0.45 : 0.3}
            textAnchor={"middle"}
        >
            {pixel.index + 1}
        </text>
    );
};
