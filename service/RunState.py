import json
from collections import defaultdict
from dataclasses import dataclass, field
from enum import Enum
from time import perf_counter
from typing import Optional, List, TYPE_CHECKING

from tornado.ioloop import PeriodicCallback

from logic.color import apply_fade, HsvColorArray
from logic.patterns.templates.PointPattern import PointPatternState
from logic.patterns.instance import PatternInstance

if TYPE_CHECKING:
    from service.SequenceMan import SequenceMan
    from model.state import SequenceState
    from logic.patterns.pattern import Pattern


class RunMode(Enum):
    Run = "run"
    Seek = "seek"


@dataclass
class RunState:
    start_sec: Optional[float] = None
    current_sec: Optional[float] = None
    previous_sec: Optional[float] = None
    process: Optional[PeriodicCallback] = None
    pattern_instances: dict[str, List[PatternInstance]] = field(default_factory=lambda: defaultdict(list))
    mode: RunMode = field(default=RunMode.Run)

    def initialize(self, seek=False):
        self.mode = RunMode.Seek if seek else RunMode.Run
        self.start_sec = 0 if seek else perf_counter()
        self.current_sec = 0
        self.previous_sec = None
        self.process = None
        self.pattern_instances.clear()

    def update_times(self, second=None):
        if second is None:
            second = perf_counter()
        self.previous_sec = self.current_sec
        self.current_sec = second - self.start_sec

    @property
    def delta_sec(self):
        if self.previous_sec is None:
            return 0
        else:
            return self.current_sec - self.previous_sec

    def just_elapsed(self, second: float):
        if self.previous_sec is None:
            # float precision (maybe not needed here, we'll see)
            return abs(self.current_sec - second) < 1e-4
        else:
            return self.previous_sec < second <= self.current_sec

    def elapsed_beyond(self, stop_second: Optional[float]):
        return stop_second is not None and self.current_sec >= stop_second

    def to_json(self):
        return json.dumps(self.__dict__, default=str)

    def start_sequence_process(self, manager: "SequenceMan"):
        self.process = PeriodicCallback(manager.run_sequence_step, manager.state.update_ms)
        self.process.start()

    def proceed(self, state: "SequenceState"):
        for pattern in state.patterns:
            if self.elapsed_beyond(pattern.stop_sec):
                if self.pattern_instances[pattern.id]:
                    del self.pattern_instances[pattern.id]
                return

            if self.just_elapsed(pattern.start_sec):
                self.spawn_instance(pattern, state.new_pixel_array())

            # TODO: implement respawn_sec with respect to max_instances

            for instance in self.pattern_instances[pattern.id]:
                apply_fade(instance.pixels, pattern.fade)
                instance.proceed_motion(self)
                instance.render(state)

    def spawn_instance(self, pattern: "Pattern", empty_pixels: HsvColorArray):
        instances = self.pattern_instances[pattern.id]
        if len(instances) >= pattern.max_instances:
            return
        # TODO: would distinguish types here, but there is none other
        instance_state = PointPatternState.init_from(pattern.template)
        self.pattern_instances[pattern.id].append(
            PatternInstance(
                state=instance_state,
                template=pattern.template,
                pixels=empty_pixels,
                pattern_id=pattern.id,
                spawned_sec=self.current_sec,
            )
        )
