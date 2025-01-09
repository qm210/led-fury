from dataclasses import dataclass, field
from enum import Enum
from typing import List


class SegmentShape(Enum):
    Linear = "linear"
    Rectangle = "rect"
    Star = "star"


@dataclass
class LedSegment:
    length: int
    # TODO: these are all not supported yet
    start: int = 0
    alternating: bool = False
    shape: SegmentShape = SegmentShape.Linear
    divisions: int = 1


@dataclass
class ControllerSetup:
    host: str
    port: int
    segments: List[LedSegment] = field(default_factory=list)

    def update_from(self, setup: dict):
        self.host = setup.get("host", self.host)
        self.port = setup.get("port", self.port)
        if setup.get("segments") is not None:
            self.segments = []
            for seg in setup["segments"]:
                segment = LedSegment(length=seg["length"])
                segment.start = seg.get("start", segment.start)
                segment.alternating = seg.get("alternating", segment.alternating)
                segment.shape = seg.get("shape", segment.shape)
                segment.divisions = seg.get("divisions", segment.divisions)
                self.segments.append(segment)
