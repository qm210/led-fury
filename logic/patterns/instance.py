from dataclasses import dataclass
from typing import TYPE_CHECKING

from tornado.log import app_log

from logic.color import HsvColorArray
from logic.patterns.state import PatternInstanceState
from logic.patterns.template import PatternTemplate
from logic.patterns.templates.PointPattern import PointPattern

if TYPE_CHECKING:
    from model.state import SequenceState
    from service.RunState import RunState


VERBOSE = True


@dataclass
class PatternInstance:
    template: PatternTemplate
    state: PatternInstanceState
    pixels: HsvColorArray
    # for debugging:
    pattern_id: str
    spawned_sec: float = 0

    def render(self, state: "SequenceState"):
        if isinstance(self.template, PointPattern):
            self.render_point(state)
        elif isinstance(self.template, GifPattern):
            # -- TODO -- make that in good.
            self.render_gif(state)

    def render_point(self, state: "SequenceState"):
        s = self.state
        for index, x, y in state.geometry.iterate():
            intensity = self.state.get_intensity(x, y)
            old_color = self.pixels[index].copy()
            try:
                self.pixels[index].add(s.color, intensity)
            except Exception as e:
                app_log.warning(f"Could not render pixel ({x},{y}): {str(e)}")
                pass

            if VERBOSE:
                app_log.debug(f"Render Pixel {index} ({x},{y}): {old_color} + {intensity} x {s.color} -> {self.pixels[index]}")

    def proceed_motion(self, run: "RunState"):
        self.state.proceed(run, self.template)
