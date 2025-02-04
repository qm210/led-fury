from dataclasses import dataclass, field
from enum import Enum


class BoundaryBehaviour(Enum):
    Ignore = "ignore"
    Wrap = "wrap"
    Bounce = "bounce"


@dataclass
class Boundary:
    min: int = 0
    max: int = None
    behaviour: BoundaryBehaviour = field(default=BoundaryBehaviour.Ignore)
    resize_on_segment_change: bool = True


# might grow later on
class MotionType(Enum):
    Linear = "linear"


@dataclass
class PointMotion:
    # velocity unit is amount of pixels per second
    vel: float = 0
    sign: int = +1
    acc: float = 0
    type: MotionType = field(default=MotionType.Linear)
