from copy import deepcopy
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Tuple

from logic.color import HsvColor, HsvColorArray
from logic.patterns import PointMotion, BoundaryBehaviour, Boundary, MotionType

if TYPE_CHECKING:
    from model.state import SequenceState
    from service.sequence_run import RunState


@dataclass
class PointPattern:
    pos: Tuple[int, int] = field(default_factory=lambda: (0, 0))
    size: Tuple[int, int] = field(default_factory=lambda: (1, 1))
    motion: Tuple[PointMotion, PointMotion] = field(default_factory=lambda: (PointMotion(), PointMotion()))
    boundary: Tuple[Boundary, Boundary] = field(default_factory=lambda: (Boundary(), Boundary()))
    color: HsvColor = field(default_factory=HsvColor)
    hue_delta: int = 0

    @classmethod
    def init_from(cls, template: "PointPattern"):
        color = deepcopy(template.color)
        color.randomize_hue(template.hue_delta)
        return cls(
            pos=template.pos,
            size=template.size,
            motion=deepcopy(template.motion),
            boundary=deepcopy(template.boundary),
            color=color,
            hue_delta=template.hue_delta
        )

    @classmethod
    def from_json(cls, stored: dict):
        result = cls()
        if stored.get("pos") is not None:
            result.pos = tuple(stored["pos"])
        if stored.get("size") is not None:
            result.size = tuple(stored["size"])
        if stored.get("motion") is not None:
            result.motion = tuple([
                PointMotion(
                    vel=m["vel"],
                    sign=m["sign"],
                    acc=m["acc"],
                    type=m.get("type", MotionType.Linear)
                )
                for m in stored["motion"]
            ])
        if stored.get("boundary") is not None:
            result.boundary = tuple([
                Boundary(
                    min=b["min"],
                    max=b["max"],
                    behaviour=BoundaryBehaviour(b["behaviour"]),
                )
                for b in stored["boundary"]
            ])
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

    def render(self, pixels: HsvColorArray, state: "SequenceState"):
        for x, y in state._pixel_indices:
            if abs(x - self.pos[0]) < self.size[0] \
                    and abs(y - self.pos[1]) < self.size[1]:
                pixels[x, y] = self.color.copy()

    def proceed_motion(self, run: "RunState", state: "SequenceState"):
        if run.current_sec == 0:
            return

        pos = list(self.pos)
        for dim in range(2 if state.is_2d else 1):
            m = self.motion[dim]
            p = pos[dim] + m.vel * m.sign * run.delta_sec

            boundary = self.boundary[dim]
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

            pos[dim] = p

        self.pos = tuple(pos)
