from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING

from tornado.log import app_log

from logic.color import HsvColorArray, HsvColor
from logic.patterns.state import PatternInstanceState
from logic.patterns.template import PatternTemplate
from logic.patterns.templates.PointPattern import PointPattern

if TYPE_CHECKING:
    from model.state import SequenceState
    from service.RunState import RunState


class MixMode(Enum):
    Replace = "replace"
    Add = "add"


@dataclass
class PatternInstance:
    template: PatternTemplate
    state: PatternInstanceState
    pixels: HsvColorArray
    # for debugging:
    pattern_id: str
    spawned_sec: float = 0

    # derived for now
    mix_mode: MixMode = field(default=MixMode.Replace)

    def __post_init__(self):
        self.mix_mode = (
            MixMode.Add
            if isinstance(self.template, PointPattern)
            else MixMode.Replace
        )

    def proceed_motion(self, run: "RunState"):
        self.state.proceed(run, self.template)

    def render(self, state: "SequenceState"):
        for index, x, y in state.geometry.iterate():
            try:
                color = self.state.render(x, y)
                self.mix(index, color)
            except Exception as e:
                app_log.warning(f"Could not render pixel ({x},{y}): {str(e)}")
                return

    def mix(self, index: int, color: HsvColor):
        match self.mix_mode:
            case MixMode.Replace:
                self.pixels[index] = color
            case MixMode.Add:
                self.pixels[index].add(color)
            case _:
                raise ValueError("Invalid Mixing Mode")
