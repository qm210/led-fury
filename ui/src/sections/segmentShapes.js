const SEGMENT_SHAPE = {
    Line: "linear",
    Rect: "rect",
    Star: "star"
};

export const SEGMENT_SHAPES = [{
    name: "Line",
    value: SEGMENT_SHAPE.Line
}, {
    name: "Rectangle",
    value: SEGMENT_SHAPE.Rect
}, {
    name: "Star",
    value: SEGMENT_SHAPE.Star
}];

export const isNonlinear = s => s.shape !== SEGMENT_SHAPE.Line;
export const calculatePixelPosition = (segment, index, radius, distance) => {
    console.log("Calculate", segment, index, radius, distance);
    switch(segment.shape) {
        case SEGMENT_SHAPE.Line:
            return {
                x: -radius + distance * index,
                y: -radius
            };
        case SEGMENT_SHAPE.Rect:
            return {
                x: -radius + distance * index,
                y: -radius + Math.random() * 10
            };
        case SEGMENT_SHAPE.Star:
            return {
                x: Math.floor(Math.random() * 100),
                y: Math.floor(Math.random() * 100),
            };
        default:
            throw Error(`calculatePixelPosition() got unknown segment shape "${segment.shape}"`);
    }
};

const movePixelCursor = (cursor, segment, i, distance) => {
    switch (segment.shape) {
        case SEGMENT_SHAPE.Line:
            cursor.x += distance;
            return;
        case SEGMENT_SHAPE.Rect:
            if ((i + 1) % cursor.state.subLength === 0) {
                if (segment.alternating) {
                    cursor.state.sign *= -1;
                } else {
                    cursor.x = 0;
                }
                cursor.y += distance;
            } else {
                cursor.x += distance * cursor.state.sign;
            }
            return;
        case SEGMENT_SHAPE.Star:
            cursor.x = Math.random() * 100;
            cursor.y = Math.random() * 40;
            return;
        default:
            throw Error(`calculatePixelPosition() got unknown segment shape "${segment.shape}"`);
    }
};

const initCursorState = (n, segment) => {
    const subLength = Math.floor(n / segment.divisions);
    switch (segment.shape) {
        case SEGMENT_SHAPE.Rect:
            return {
                subLength,
                sign: +1,
            };
        case SEGMENT_SHAPE.Star:
            return {
                subLength: Math.floor(n / segment.divisions),
                vector: [1, 0],
            };
        default:
            return {};
    }
};

export const calculatePixelPositions = (totalNumber, segment, distance) => {
    const coordinates = [];
    const area = {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
    };
    const cursor = {
        x: 0,
        y: 0,
        state: initCursorState(totalNumber, segment),
    };
    for (let i = 0; i < totalNumber; i++) {
        coordinates.push({index: i, ...cursor});
        movePixelCursor(cursor, segment, i, distance);

        if (cursor.x < area.minX) {
            area.minX = cursor.x;
        }
        if (cursor.x > area.maxX) {
            area.maxX = cursor.x;
        }
        if (cursor.y < area.minY) {
            area.minY = cursor.y;
        }
        if (cursor.y > area.maxY) {
            area.maxY = cursor.y;
        }
    }
    area.width = area.maxX - area.minX;
    area.height = area.maxY - area.minY;
    return {coordinates, area};
};
