from dataclasses import dataclass
from math import exp
from typing import TYPE_CHECKING

from tornado.log import app_log

from logic.color import HsvColorArray
from logic.patterns.PointPattern import PointPattern, PointPatternState

if TYPE_CHECKING:
    from model.state import SequenceState
    from service.RunState import RunState


@dataclass
class PatternInstance:
    template: PointPattern
    state: PointPatternState
    pixels: HsvColorArray
    # for debugging:
    pattern_id: str
    spawned_sec: float = 0

    def render(self, state: "SequenceState"):
        # would distinguish different types, but there are none yet.. :)
        s = self.state
        for index, x, y in state.geometry.iterate():
            intensity = self.state.get_intensity(x, y)
            color = s.color.copy()
            color.scale_v(intensity)
            try:
                self.pixels[index] = color
            except Exception as e:
                app_log.warning(f"Could not render pixel ({x},{y}): {str(e)}")
                pass

    def proceed_motion(self, run: "RunState"):
        self.state.proceed(run, self.template)
