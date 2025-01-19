import json
from collections import defaultdict
from dataclasses import dataclass, field
from enum import Enum
from time import perf_counter
from typing import Optional, List

from tornado.ioloop import PeriodicCallback

from logic.patterns.instance import PatternInstance


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
        self.start_sec = perf_counter()
        self.current_sec = 0
        self.previous_sec = None
        self.mode = RunMode.Seek if seek else RunMode.Run

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
