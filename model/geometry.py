import math
from dataclasses import dataclass, field


@dataclass
class Vec2d:
    x: float = 0
    y: float = 0

    @classmethod
    def from_json(cls, json: dict):
        return cls(
            x=json.get("x", 0),
            y=json.get("y", 0)
        )

    @classmethod
    def X(cls, factor=1):
        return cls(factor, 0)

    @classmethod
    def Y(cls, factor=1):
        return cls(0, factor)

    def length(self):
        return math.sqrt(self.x * self.x + self.y * self.y)

    def normalize(self):
        norm = self.length()
        if norm == 0:
            return
        self.x /= norm
        self.y /= norm
        return self

    def rotate(self, angle: float):
        # angle is to be given in radians
        c = math.cos(angle)
        s = math.sin(angle)
        x = self.x
        y = self.y
        self.x = c * x - s * y
        self.y = s * x + c * y


@dataclass
class PixelCoordinate(Vec2d):
    index: int = 0

    @classmethod
    def make(cls, index: int, point: Vec2d):
        pixel = cls(
            index=index
        )
        pixel.x = point.x
        pixel.y = point.y
        return pixel


@dataclass
class Range:
    min: float = 0
    max: float = 0

    def cover(self, point: float):
        if self.min > point:
            self.min = point
        if self.max < point:
            self.max = point


@dataclass
class Area:
    x: Range = field(default_factory=Range)
    y: Range = field(default_factory=Range)

    def cover(self, point: Vec2d):
        self.x.cover(point.x)
        self.y.cover(point.y)

    def get_axis(self, dimension_index: int):
        if dimension_index == 0:
            return self.x
        elif dimension_index == 1:
            return self.y
        else:
            raise ValueError(f"Area is only 2D, there is no index {dimension_index}")

@dataclass
class Rect:
    x: float = 0
    y: float = 0
    width: float = 0
    height: float = 0

    @classmethod
    def from_area(cls, area: Area, extend: float = 0):
        return cls(
            x=area.x.min,
            y=area.y.min,
            width=area.x.max - area.x.min + extend,
            height=area.y.max - area.y.min + extend,
        )
