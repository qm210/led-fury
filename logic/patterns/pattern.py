from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Union, Optional, TYPE_CHECKING

from logic.color import HsvColorArray
from logic.patterns.PointPattern import PointPattern

if TYPE_CHECKING:
    from model.state import SequenceState
    from service.sequence_run import RunState


class PatternType(Enum):
    Point = "point"


def current_timestamp():
    return datetime.now().strftime("%Y%m%d-%H%M%S")


@dataclass
class Pattern:
    # extend this Union when more patterns exist
    template: Union[PointPattern]
    type: PatternType = PatternType.Point
    id: str = field(default_factory=current_timestamp)
    name: str = ""
    start_sec: float = 0
    stop_sec: Optional[float] = None
    respawn_sec: Optional[float] = None
    fade: float = 0.95
    max_instances: int = 10

    def proceed_step(self, run: "RunState", state: "SequenceState"):
        if run.elapsed_beyond(self.stop_sec):
            if run.pattern_instances[self.id]:
                del run.pattern_instances[self.id]
            return

        if run.just_elapsed(self.start_sec):
            self.spawn_instance(run, state)

        # TODO: implement respawn_sec with respect to max_instances

        for p in run.pattern_instances[self.id]:
            self.apply_fade(p.pixels)
            p.instance.proceed_motion(run, state)
            p.instance.render(p.pixels, state)

    def spawn_instance(self, run: "RunState", state: "SequenceState"):
        instances = run.pattern_instances[self.id]
        if len(instances) >= self.max_instances:
            return
        # TODO: would distinguish types here, but there is none other
        new_instance = PointPattern.init_from(self.template)
        run.pattern_instances[self.id].append(
            PatternInstance(
                instance=new_instance,
                pixels=state.new_pixel_array(),
                pattern_id=self.id,
                spawned_sec=run.current_sec,
            )
        )

    def apply_fade(self, pixels: HsvColorArray):
        for line in pixels:
            for color in line:
                color.scale_v(self.fade)


@dataclass
class PatternInstance:
    instance: PointPattern
    pixels: HsvColorArray
    # for debugging:
    pattern_id: str
    spawned_sec: float = 0
