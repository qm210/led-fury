from dataclasses import dataclass
from enum import Enum


class BoundaryBehaviour(Enum):
    Unbounded = "undefined"
    Wrap = "wrap"
    Bounce = "bounce"


@dataclass
class Boundary:
    min: int = 0
    max: int = 0
    behaviour: BoundaryBehaviour = BoundaryBehaviour.Unbounded


@dataclass
class LinearMotion:
    # velocity unit is amount of pixels per second
    vel: float = 0
    sign: int = +1
    acc: float = 0
