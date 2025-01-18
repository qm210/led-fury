from dataclasses import dataclass, field
from math import floor, pi

import tornado

from model.geometry import Vec2d
from model.setup import PixelSegment, SegmentShape


@dataclass
class GeometryCursor(Vec2d):
    direction: Vec2d = field(default_factory=Vec2d.X)
    step: float = 1
    payload: dict = field(default_factory=dict)

    def init(self, segment: PixelSegment):
        self.x = segment.origin.x
        self.y = segment.origin.y
        self.direction = segment.direction.normalize()
        self.step = segment.distance
        stretch = floor(segment.length / segment.divisions)
        if segment.shape is SegmentShape.Rectangle:
            self.payload["stretch"] = stretch
        elif segment.shape is SegmentShape.Star:
            self.payload["stretch"] = stretch
            self.payload["angle"] = 2 * pi / segment.divisions

    def move_next(self, segment: PixelSegment, index: int):
        next = index + 1
        match segment.shape:
            case SegmentShape.Linear:
                self.x += self.step
            case SegmentShape.Rectangle:
                if next % self.payload["stretch"] == 0:
                    if segment.alternating:
                        self.direction.x *= -1
                    else:
                        self.x = 0
                    self.y += self.step
                else:
                    self.advance()
            case SegmentShape.Star:
                if next % self.payload["stretch"] == 0:
                    self.x = 0
                    self.y = 0
                    self.advance(-1)
                    self.direction.rotate(self.payload["angle"])
                    self.advance()
                else:
                    self.x += self.direction.x
                    self.y += self.direction.y

    def advance(self, factor=1):
        self.x += self.direction.x * self.step * factor
        self.y += self.direction.y * self.step * factor
