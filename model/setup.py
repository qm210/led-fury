from dataclasses import dataclass, field
from typing import List


@dataclass
class LedSegment:
    length: int
    start: int = 0  # TODO: not supported yet


@dataclass
class ControllerSetup:
    host: str
    port: int
    segments: List[LedSegment] = field(default_factory=list)

    def update_from(self, setup: dict):
        self.host = setup.get("host", self.host)
        self.port = setup.get("port", self.port)
        if setup.get("segments") is not None:
            self.segments = [LedSegment(
                length=segment["length"],
                start=segment.get("start", 0),
            ) for segment in setup["segments"]]
