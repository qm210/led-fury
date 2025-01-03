from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from logic.color import HsvColor
from logic.patterns import Pattern
from model.setup import ControllerSetup


@dataclass
class SequenceState:
    update_ms: int = 50

    sequence_length: float = 10
    sequence_loops: bool = True
    sequence_frames: int = 20

    patterns: List[Pattern] = field(default_factory=list)
    max_length: int = 0
    n_pixels: int = 0
    is_2d: bool = False
    pixels: List[List[HsvColor]] = field(default_factory=list)

    selected_frame: Optional[int] = None
    selected_pos: List[Tuple[int, int]] = field(default_factory=list)
    selected_pattern: Optional[int] = None

    def __init__(self, setup: ControllerSetup):
        self.max_length = max([seg.start + seg.length for seg in setup.segments])
        self.n_pixels = sum([seg.length for seg in setup.segments])
        self.is_2d = len(setup.segments) > 1
        self.pixels = [
            [HsvColor() for _ in range(seg.length)]
            for seg in setup.segments
        ]

    def reset_pixels(self):
        for line in self.pixels:
            for p in range(len(line)):
                line[p] = HsvColor()
