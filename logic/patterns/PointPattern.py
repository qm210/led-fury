from copy import deepcopy
from dataclasses import dataclass, field
from json import dumps
from typing import TYPE_CHECKING, List

from logic.color import HsvColor, HsvColorArray
from logic.patterns import LinearMotion, BoundaryBehaviour, Boundary

if TYPE_CHECKING:
    from model.state import SequenceState
    from service.sequence_run import RunState


@dataclass
class PointPattern:
    pos: field(default=[0, 0])
    size: field(default=[1, 1])
    motion: field(default_factory=lambda: [LinearMotion(), LinearMotion()])
    boundary: field(default_factory=lambda: [Boundary(), Boundary()])
    color: field(default_factory=HsvColor)
    hue_delta: int = 0

    @classmethod
    def init_from(cls, template: "PointPattern"):
        color = deepcopy(template.color)
        color.randomize_hue(template.hue_delta)
        return cls(
            pos=template.pos[:],
            size=template.size[:],
            motion=deepcopy(template.motion),
            boundary=deepcopy(template.boundary),
            color=color,
            hue_delta=template.hue_delta
        )

    def to_json(self):
        return {
            "pos": self.pos,
            "color": dumps(self.color),
            "motion": self.motion,
            "size": self.size,
        }

    def render(self, pixels: HsvColorArray, state: "SequenceState"):
        for x, y in state.pixel_indices:
            if abs(x - self.pos[0]) < self.size[0] \
                    and abs(y - self.pos[1]) < self.size[1]:
                pixels[x, y] = self.color.copy()

    def proceed_motion(self, run: "RunState", state: "SequenceState"):
        if run.current_sec == 0:
            return

        for dim in range(2 if state.is_2d else 1):
            m = self.motion[dim]
            p = self.pos[dim] + m.vel * m.sign * run.delta_sec

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

            self.pos[dim] = p
