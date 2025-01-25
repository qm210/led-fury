from copy import deepcopy
from dataclasses import dataclass, field
from math import exp, sqrt, pi
from typing import List, TYPE_CHECKING, Dict

from logic.color import HsvColor
from logic.patterns import PointMotion, BoundaryBehaviour, MotionType
from logic.patterns.state import PatternInstanceState
from logic.patterns.template import PatternTemplate
from model.utils import factory2d

if TYPE_CHECKING:
    from service.RunState import RunState


sqrt2pi2 = 2 * sqrt(2 * pi)
tau = 2 * pi


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

    def spawn_instance_state(self):
        return PointPatternState.init_from(self)


@dataclass
class PointPatternState(PatternInstanceState):
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
            _reference=template,
        )

    @staticmethod
    def debug(verbose, *messages):
        if not verbose:
            return
        print(*messages)

    def proceed(self, run: "RunState", verbose=False):
        if run.current_sec == 0:
            return

        t = self._reference
        # should all be 2D by now
        for dim in range(len(self.pos)):
            m = t.motion[dim]
            shift = m.vel * m.sign * run.delta_sec
            p = self.pos[dim] + shift
            min, max = t.boundary.get_axis(dim).interval

            if verbose:
                print("Movement Dim", dim, p, m, shift, (min, max), end="")

            match t.at_boundary[dim]:
                case BoundaryBehaviour.Wrap:
                    if not min <= p <= max:
                        span = max - min + 1
                        p = min + (p % span)
                case BoundaryBehaviour.Bounce:
                    if p > max:
                        p = max
                        m.sign = -1
                    elif p < min:
                        p = min
                        m.sign = +1

            self.pos[dim] = p

            if verbose:
                print("->", self.pos[dim])

    def gauss_intensity(self, x, y):
        def square_delta(dim):
            coord = y if dim == 1 else x
            w = max(1e-4, self.size[dim] / 4)
            diff = coord - self.pos[dim]
            return diff * diff / (w * w)

        power = [
            square_delta(dim)
            for dim in range(len(self.pos))
        ]
        return exp(-sqrt(sum(power)))

        # TODO: might offer different modes. one day.
        # power_theta = 1 if max(x_power, y_power) <= 1 else 0
        # power_gauss = exp(-x_power*x_power - y_power*y_power)

    def render(self, x: float, y: float) -> HsvColor:
        intensity = self.gauss_intensity(x, y)
        return self.color.copy(scale_v=intensity)

    def collect_broadcast_info(self) -> Dict:
        return {
            "pos": self.pos,
            "vel": self.vel,
            "acc": self.acc,
            "size": self.size,
            "color": self.color.to_rgb()
        }
