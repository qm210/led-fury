from copy import deepcopy
from dataclasses import dataclass, field
from typing import List, TYPE_CHECKING

from logic.color import HsvColor
from logic.patterns import PointMotion, BoundaryBehaviour, Boundary, MotionType

if TYPE_CHECKING:
    from service.RunState import RunState


@dataclass
class PointPattern:
    pos: List[int] = field(default_factory=lambda: [0, 0])
    size: List[int] = field(default_factory=lambda: [1, 1])
    motion: List[PointMotion] = field(default_factory=lambda: [PointMotion(), PointMotion()])
    boundary: List[Boundary] = field(default_factory=lambda: [Boundary(), Boundary()])
    color: HsvColor = field(default_factory=HsvColor)
    hue_delta: int = 0
    sat_delta: int = 0
    val_delta: int = 0

    @classmethod
    def from_json(cls, stored: dict):
        result = cls()
        if stored.get("pos") is not None:
            result.pos = stored["pos"][:]
        if stored.get("size") is not None:
            result.size = stored["size"][:]
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
        if stored.get("boundary") is not None:
            result.boundary = [
                Boundary(
                    min=b["min"],
                    max=b["max"],
                    behaviour=BoundaryBehaviour(b["behaviour"]),
                )
                for b in stored["boundary"]
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

    def proceed(self, run: "RunState", template: "PointPattern"):
        if run.current_sec == 0:
            return

        # should all be 2D by now
        for dim in range(len(self.pos)):
            m = template.motion[dim]
            p = self.pos[dim] + m.vel * m.sign * run.delta_sec

            boundary = template.boundary[dim]
            if boundary.behaviour is BoundaryBehaviour.Wrap:
                if p > boundary.max:
                    p = boundary.min
                elif p < boundary.min:
                    p = boundary.max
            elif boundary.behaviour is BoundaryBehaviour.Bounce:
                if p > boundary.max and m.sign > 0:
                    p = boundary.max
                    m.sign = -1
                elif p < boundary.min and m.sign < 0:
                    p = boundary.min
                    m.sign = +1

            self.pos[dim] = p
