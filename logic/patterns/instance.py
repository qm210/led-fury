from dataclasses import dataclass
from math import exp
from typing import TYPE_CHECKING

from tornado.log import gen_log

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
        for x, y in state.pixel_indices:
            # exponential:
            x_power = abs(x - s.pos[0]) / s.size[0]
            y_power = abs(y - s.pos[1]) / s.size[1]
            power_exp = exp(-x_power-y_power)
            color = s.color.copy()
            color.scale_v(power_exp)

            try:
                self.pixels[x, y] = color
            except Exception as e:
                gen_log.warning(f"Could not render pixel ({x},{y}): {str(e)}")
                pass

            # TODO: try different modes:
            # power_theta = 1 if max(x_power, y_power) <= 1 else 0
            # power_gauss = exp(-x_power*x_power - y_power*y_power)

    def proceed_motion(self, run: "RunState"):
        self.state.proceed(run, self.template)
