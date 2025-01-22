from copy import deepcopy
from dataclasses import dataclass, field
from math import exp, sqrt
from typing import List, TYPE_CHECKING

from logic.color import HsvColor
from logic.patterns import PointMotion, BoundaryBehaviour, MotionType
from logic.patterns.template import PatternTemplate
from model.utils import factory2d

if TYPE_CHECKING:
    from service.RunState import RunState


@dataclass
class PointPattern(PatternTemplate):
    pos: List[float] = field(default_factory=factory2d(0))
    size: List[float] = field(default_factory=factory2d(1))
    motion: List[PointMotion] = field(default_factory=factory2d(PointMotion))
    at_boundary: List[BoundaryBehaviour] = field(default_factory=factory2d(BoundaryBehaviour.Ignore))
    color: HsvColor = field(default_factory=HsvColor)
    hue_delta: int = 0
    sat_delta: int = 0
    val_delta: int = 0

    @classmethod
    def from_json(cls, stored: dict):
        result = super().from_json(stored)
        if stored.get("pos") is not None:
            result.pos = stored["pos"][:]
        if stored.get("size") is not None:
            result.original_size = stored["size"][:]
        if stored.get("motion") is not None:
            result.motion = [
                PointMotion(
                    vel=m["vel"],
                    sign=m["sign"],
                    acc=m["acc"],
                    type=m.get("type", MotionType.Linear)
                )
                for m in stored["motion"]
            ]
        if stored.get("at_boundary") is not None:
            result.at_boundary = [
                BoundaryBehaviour(b)
                for b in stored["at_boundary"]
            ]
        color = stored.get("color")
        if color is not None:
            result.color = HsvColor(
                h=color["h"],
                s=color["s"],
                v=color["v"]
            )
        if stored.get("hue_delta") is not None:
            result.hue_delta = stored["hue_delta"]
        return result


@dataclass
class PointPatternState:
    pos: List[float]
    vel: List[float]
    acc: List[float]
    size: List[float]
    color: HsvColor

    @classmethod
    def init_from(cls, template: "PointPattern"):
        color = deepcopy(template.color)
        color.randomize(
            h=template.hue_delta,
            s=template.sat_delta,
            v=template.val_delta,
        )
        return cls(
            pos=deepcopy(template.pos),
            size=deepcopy(template.size),
            vel=[
                m.vel * m.sign
                for m in template.motion
            ],
            acc=[
                m.acc
                for m in template.motion
            ],
            color=color,
        )

    @staticmethod
    def debug(verbose, *messages):
        if not verbose:
            return
        print(*messages)

    def proceed(self, run: "RunState", template: "PointPattern", verbose=False):
        if run.current_sec == 0:
            return

        # should all be 2D by now
        for dim in range(len(self.pos)):
            m = template.motion[dim]
            shift = m.vel * m.sign * run.delta_sec
            p = self.pos[dim] + shift
            boundary = template.boundary[dim]

            if verbose:
                print("Movement Dim", dim, p, m, shift, boundary, end="")

            if boundary.behaviour is BoundaryBehaviour.Wrap:
                if not boundary.min <= p <= boundary.max:
                    span = boundary.max - boundary.min + 1
                    p = boundary.min + (p % span)
                    print(" -- Boundary Wrap", p, span, end="")
            elif boundary.behaviour is BoundaryBehaviour.Bounce:
                if p > boundary.max:
                    p = boundary.max
                    m.sign = -1
                    print(" -- Boundary Bounce (Max)", p, m, end="")
                elif p < boundary.min:
                    p = boundary.min
                    m.sign = +1
                    print(" -- Boundary Bounce (Min)", p, m, end="")

            self.pos[dim] = p

            if verbose:
                print("->", self.pos[dim])

    def get_intensity(self, x, y):
        def delta(dim):
            coord = y if dim == 1 else x
            return sqrt(abs(coord - self.pos[dim]) / self.size[dim])

        power = [
            delta(dim)
            for dim in range(len(self.pos))
        ]
        return exp(-sum(power))

        # TODO: offer different modes:
        # power_theta = 1 if max(x_power, y_power) <= 1 else 0
        # power_gauss = exp(-x_power*x_power - y_power*y_power)
