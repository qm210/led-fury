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
