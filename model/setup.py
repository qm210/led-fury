from dataclasses import dataclass, field
from enum import Enum
from typing import List

from model.geometry import Vec2d


class SegmentShape(Enum):
    Linear = "linear"
    Rectangle = "rect"
    Star = "star"


@dataclass
class PixelSegment:
    length: int
    distance: int = 1
    shape: SegmentShape = SegmentShape.Linear
    alternating: bool = False
    divisions: int = 1

    origin: Vec2d = field(default_factory=Vec2d)
    direction: Vec2d = field(default_factory=Vec2d.X)

    @classmethod
    def from_json(cls, json: dict):
        result = cls(
            length=json["length"]
        )
        if json.get("distance") is not None:
            result.distance = json["distance"]
        if json.get("shape") is not None:
            result.shape = SegmentShape(json["shape"])
        if json.get("alternating") is not None:
            result.alternating = json["alternating"]
        if json.get("divisions") is not None:
            result.divisions = json["divisions"]
        if json.get("origin") is not None:
            result.origin = Vec2d.from_json(json["origin"])
        if json.get("direction") is not None:
            result.direction = Vec2d.from_json(json["direction"])
        return result


@dataclass
class ControllerSetup:
    host: str
    port: int
    segments: List[PixelSegment] = field(default_factory=list)
    id: str = field(default="unnamed_setup")

    def update_from(self, setup: dict):
        self.host = setup.get("host", self.host)
        self.port = setup.get("port", self.port)
        if setup.get("segments") is not None:
            self.segments = []
            for seg in setup["segments"]:
                segment = PixelSegment(length=seg["length"])
                segment.distance = seg.get("distance", segment.distance)
                segment.alternating = seg.get("alternating", segment.alternating)
                segment.shape = seg.get("shape", segment.shape)
                segment.divisions = seg.get("divisions", segment.divisions)
                self.segments.append(segment)
