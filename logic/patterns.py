from dataclasses import dataclass, field
from enum import Enum
from json import dumps
from typing import Union, Optional, List
from uuid import uuid4

from logic.color import HsvColor


class BorderBehaviour(Enum):
    Leave = "leave"
    Wrap = "wrap"
    Bounce = "bounce"


@dataclass
class LinearMotion:
    # velocity unit is amount of pixels per second
    vel: float = 0
    sign: int = +1
    acc: float = 0
    at_border: BorderBehaviour = BorderBehaviour.Leave


@dataclass
class PointPattern:
    pos: field(default=[0, 0])
    size: field(default=[0, 0])
    motion: field(default_factory=lambda: [LinearMotion(), LinearMotion()])
    color: field(default_factory=HsvColor)
    hue_delta: int = 0

    def init_movement(self, width=1):
        # speed is amount of pixels per second
        self.pos = [0, 0]
        self.size = [width, width]
        self.motion = [
            LinearMotion(15),
            LinearMotion()
        ]

    def to_json(self):
        return {
            "pos": self.pos,
            "color": dumps(self.color),
            "motion": self.motion,
            "size": self.size,
        }


class PatternType(Enum):
    Point = "point"


@dataclass
class PatternInstance:
    pattern: PointPattern
    pixels: List[List[HsvColor]]


@dataclass
class Pattern:
    # extend this when more patterns exist
    template: Union[PointPattern, None] = None
    type: PatternType = PatternType.Point
    id: str = field(default_factory=uuid4)
    name: str = ""
    start_sec: float = 0
    stop_sec: Optional[float] = None
    respawn_sec: Optional[float] = None
    fade: float = 0.95
    max_instances: int = 10
