import math
from dataclasses import dataclass, field
from typing import Optional, Union


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
    # Optional: "None" means unbounded, i.e. \pm\infty
    min: Optional[float] = 0
    max: Optional[float] = 0

    def cover(self, point: float):
        if self.min is not None and self.min > point:
            self.min = point
        if self.max is not None and self.max < point:
            self.max = point

    @classmethod
    def zero_to_inf(cls):
        return cls(min=0, max=None)

    @classmethod
    def from_json(cls, stored: Union[dict, list]):
        if isinstance(stored, list):
            return cls(
                min=stored[0],
                max=stored[1],
            )
        else:
            return cls(
                min=stored.get("min", 0),
                max=stored.get("max", 0)
            )

    @classmethod
    def copy(cls, range):
        return cls(min=range.min, max=range.max)


@dataclass
class Area:
    x: Range = field(default_factory=Range)
    y: Range = field(default_factory=Range)

    @classmethod
    def zero_to_inf(cls):
        return cls(
            x=Range.zero_to_inf(),
            y=Range.zero_to_inf(),
        )

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

    @classmethod
    def from_json(cls, stored: dict):
        if isinstance(stored, list):
            x_range, y_range = stored
        else:
            x_range = stored["x"]
            y_range = stored["y"]
        return cls(
            x=Range.from_json(x_range),
            y=Range.from_json(y_range)
        )

    @property
    def size(self):
        return (
            int(math.ceil(self.x.max - self.x.min)),
            int(math.ceil(self.y.max - self.y.min))
        )


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
