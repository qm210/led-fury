from collections import defaultdict
from dataclasses import dataclass, field
from time import perf_counter
from typing import Optional, List

from tornado.ioloop import PeriodicCallback

from logic.patterns.pattern import PatternInstance


@dataclass
class RunState:
    start_sec: Optional[float] = None
    current_sec: Optional[float] = None
    previous_sec: Optional[float] = None
    process: Optional[PeriodicCallback] = None
    pattern_instances: dict[str, List[PatternInstance]] = field(default_factory=lambda: defaultdict(list))

    def init_times(self):
        self.start_sec = perf_counter()
        self.current_sec = 0
        self.previous_sec = None

    def update_times(self):
        self.previous_sec = self.current_sec
        self.current_sec = perf_counter() - self.start_sec

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
