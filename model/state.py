from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import numpy as np

from logic.color import HsvColor, HsvColorArray
from logic.patterns.pattern import Pattern
from model.setup import ControllerSetup
from service.sequence_run import RunState


@dataclass
class SequenceState:
    update_ms: int = 50

    sequence_length: float = 10
    sequence_loops: bool = True
    sequence_frames: int = 20

    patterns: List[Pattern] = field(default_factory=list)
    max_length: int = 0
    n_segments: int = 0
    n_pixels: int = 0
    is_2d: bool = False
    # pixels: List[List[HsvColor]] = field(default_factory=list)
    # pixel_indices: ArrayIndices = field(default_factory=list)  # no idea how to default_factory this
    # rgb_array: NDArray[int] = field(default_factory=list)

    selected_frame: Optional[int] = None
    selected_pos: List[Tuple[int, int]] = field(default_factory=list)
    selected_pattern: Optional[int] = None

    def __init__(self, setup: ControllerSetup):
        self.max_length = max([seg.start + seg.length for seg in setup.segments])
        self.n_segments = len(setup.segments)
        self.n_pixels = sum([seg.length for seg in setup.segments])
        self.is_2d = len(setup.segments) > 1
        self.pixel_indices = np.mgrid[0:self.max_length, 0:self.n_segments].reshape(2, -1).T
        self.rgb_array = self.new_rgb_array()
        # self.pixel_array = self.new_pixel_array()
        # self.pixels = [
        #     [HsvColor() for _ in range(seg.length)]
        #     for seg in setup.segments
        # ]
        self.patterns = []
        self.selected_pos = []

    # def reset_pixels(self):
    #     for segment in self.pixels:
    #         for p in range(len(segment)):
    #             segment[p] = HsvColor()

    def new_pixel_array(self) -> HsvColorArray:
        # TODO: does not support segment.start != 0 yet -> all lines need to have the same length!
        w = self.max_length
        h = self.n_segments
        array = np.empty((w, h), dtype=object)
        for x, y in self.pixel_indices:
            array[x, y] = HsvColor()
        return array

    def new_rgb_array(self):
        return np.zeros(self.n_segments * self.max_length * 3, dtype=np.float64)

    def proceed_and_render(self, run: RunState):
        for pattern in self.patterns:
            pattern.proceed_step(run, self)

        self.rgb_array = self.new_rgb_array()
        for x, y in self.pixel_indices:
            # index of each start value of the RGB-tuple (for DRGB)
            index = 3 * (y * self.max_length + x)
            for pattern in self.patterns:
                for instance in run.pattern_instances[pattern.id]:
                    pixel = instance.pixels[x, y]
                    mix = 0.01 * pixel.v
                    rgb = pixel.to_rgb()
                    for c in range(3):
                        self.rgb_array[index + c] = mix * rgb[c] + (1 - mix) * self.rgb_array[index + c]

        self.rgb_array = np.clip(self.rgb_array, 0, 255).round()

    @property
    def rgb_value_list(self):
        return self.rgb_array.astype(np.uint8).tolist()
