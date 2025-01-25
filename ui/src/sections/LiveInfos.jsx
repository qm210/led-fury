import {lastRgbUpdateInfo} from "../signals/sequence.js";
import {useMemo} from "react";
import {visiblePattern} from "../signals/pattern.js";

export const HoverInfo = ({segments, hover}) => {

    const info = useMemo(() => {
        if (!hover?.segment) {
            return "";
        }
        let result = `Pixel ${hover.pixel.index + 1}`;
        if (segments.length > 1) {
            result = `Segment 0, ` + result;
        }
        return result;
    }, [hover]);

    if (!info) {
        return null;
    }

    return (
        <div className={"absolute right-0 bottom-0 p-4"}>
             <span className={"p-2"}
                   style={{
                       backgroundColor: hover.pixel?.color,
                       color: hover.pixel?.isBright ? "black" : "white"
                   }}
             >
                {info}
             </span>
        </div>
    );
};

export const RenderInfo = () => {
    const renderedSecond = lastRgbUpdateInfo.value.renderedSecond;

    if (renderedSecond === undefined) {
        return null;
    }

    return (
        <div className={"absolute left-0 bottom-0 p-6 flex flex-col items-start gap-4 font-mono "}>
            <RunInstanceInfo
                instances={lastRgbUpdateInfo.value.instances}
                pattern={visiblePattern.value}
            />
            <span>
                Rendered at {renderedSecond.toFixed(2)} sec.
             </span>
        </div>
    );
};

const RunInstanceInfo = ({instances, pattern}) => {
    const info = instances?.[pattern?.id];

    if (!info) {
        return null;
    }

    const messages = compileInstanceInfo(pattern, info);

    return (
        <div className={"flex flex-col items-start"}>
            {
                messages.map((msg, index) =>
                    <div key={index} class={"inline-block h-[1.2em]"}>
                        {msg}
                    </div>
                )
            }
        </div>
    );
};

const compileInstanceInfo = (pattern, instanceInfo) => {
    const canHaveMultipleInstances = pattern.type === "point";
    const singleInstance = instanceInfo.length === 1;

    const lines = [];
    switch (pattern.type) {
        case "point":
            lines.push(`${pattern.type} pattern (id ${pattern.id})`);
            break;
        case "gif":
            lines.push(`${pattern.template.filename} (id ${pattern.id})`);
            break;
    }

    if (canHaveMultipleInstances) {
        if (singleInstance) {
            lines.push("1 instance running.");
        } else {
            lines.push(`${instanceInfo.length} instances running.`);
        }
    }
    lines.push("");

    let instanceIndex = 1;
    for (const instance of instanceInfo) {
        if (canHaveMultipleInstances && !singleInstance) {
            lines.push(`Instance ${instanceIndex}:`);
        }

        switch (pattern.type) {
            case "point":
                push2d("pos", instance.pos);
                push2d("vel", instance.vel);
                push2d("size", instance.size);
                push("spawnedAt", instance.spawnedAt, "sec");
                break;
            case "gif":
                push("frame", instance.frameCursor.toFixed(2))
                push("#frames", instance.nFrames);
                push('#bytes', instance.nBytes);
                break;
            default:
                break;
        }

        instanceIndex++;
    }
    return lines;

    // helper functions

    function push(label, value, unit = "") {
        lines.push(`${label} = ${value} ${unit}`);
    }

    function push2d(label, field) {
        const values = [
            "(",
            field.map(f => f.toFixed(3)).join(', '),
            ")"
        ].join(" ");
        push(label, values);
    }
};
