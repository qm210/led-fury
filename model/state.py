from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import numpy as np
from tornado.log import app_log

from logic.color import HsvColor, HsvColorArray
from logic.geometry.calculate import Geometry, GeometryMan
from logic.patterns.edits import EditMan
from logic.patterns.pattern import Pattern
from model.setup import ControllerSetup
from service.RunState import RunState

# DRGB: each pixel is identifies by a 3-byte tuple (RGB with 0..255 each)
DRGB_BYTES = 3


@dataclass
class SequenceState:
    update_ms: int = 50
    bytesize: int = field(default=DRGB_BYTES)

    sequence_length: float = 10
    sequence_loops: bool = True
    sequence_frames: int = 20
    seek_second: float = 0

    patterns: List[Pattern] = field(default_factory=list)
    selected_frame: Optional[int] = None
    selected_pos: List[Tuple[int, int]] = field(default_factory=list)
    selected_pattern: Optional[str] = None

    # actually derived from the setup, but live here for now
    max_length: int = 0
    n_segments: int = 0
    n_pixels: int = 0
    geometry: Optional[Geometry] = None

    verbose: bool = False

    def __init__(self, setup: ControllerSetup, verbose: bool = False):
        self.patterns = []
        self.selected_pos = []
        self._rgb_array = np.empty(0, dtype=float)
        self._rgb_list = []
        self.apply_setup_change(setup)
        self.verbose = verbose

    def apply_setup_change(self, setup: ControllerSetup):
        # these are auxliary quantities for intermediate calculations
        self.max_length = max([seg.length for seg in setup.segments])
        self.n_segments = len(setup.segments)
        self.n_pixels = sum([seg.length for seg in setup.segments])
        self.geometry = GeometryMan.calculate_geometry(setup.segments)
        self._rgb_array = self.new_rgb_array()
        self._rgb_list = []

        for pattern in self.patterns:
            for dim in range(2):
                boundary = pattern.template.boundary[dim]
                if boundary.resize_on_segment_change:
                    axis = self.geometry.area.get_axis(dim)
                    boundary.min = axis.min
                    boundary.max = axis.max

    def update_from(self, stored: dict):
        def read(attr: str, key: str = ""):
            if not key:
                key = attr
            value = stored.get(key)
            if value is not None:
                setattr(self, attr, value)
        read("update_ms")
        read("sequence_length")
        read("sequence_loops")
        read("sequence_frames")
        read("selected_frame")
        read("selected_pattern")
        read("selected_pos")
        if stored.get("patterns"):
            self.patterns = [
                Pattern.from_json(p)
                for p in stored["patterns"]
            ]

    def new_pixel_array(self) -> HsvColorArray:
        return self.geometry.create_object_array(factory=HsvColor)

    def new_rgb_array(self):
        return np.zeros(self.n_pixels * self.bytesize, dtype=np.float64)

    def get_pattern(self, id: str) -> Optional[Pattern]:
        return next((
            pattern
            for pattern in self.patterns
            if pattern.id == id
        ), None)

    def patterns_with_instances(self, run: RunState):
        for pattern in self.patterns:
            for instance in run.pattern_instances[pattern.id]:
                yield pattern, instance

    def proceed(self, run: RunState):
        for pattern in self.patterns:
            pattern.proceed_step(run, self)

    def render(self, run: RunState):
        self._rgb_array[:] = 0
        for coordinate in self.geometry.coordinates:
            pixel_index = coordinate.index
            index = self.bytesize * pixel_index
            for _, instance in self.patterns_with_instances(run):
                pixel = instance.pixels[pixel_index]
                mix = 0.01 * pixel.v
                rgb = pixel.to_rgb()
                for b in range(self.bytesize):
                    try:
                        self._rgb_array[index + b] = (
                            mix * rgb[b] +
                            (1 - mix) * self._rgb_array[index + b]
                        )
                    except Exception as exc:
                        app_log.warn(f"Could not fill... blabla... due to {str(exc)}")

                if self.verbose:
                    print(f"-- Fill into RGB array: Pixel {pixel_index} => index {index}: color={rgb}, " +
                                  f"mix {mix}, result={self._rgb_array[index:index + self.bytesize]}")

        self._rgb_array = np.clip(self._rgb_array, 0, 255).round()
        self._rgb_list = self._rgb_array.astype(np.uint8).tolist()

    @property
    def rgb_value_list(self):
        return self._rgb_list

    def apply_pattern_edit_jsons(self, edits: List[dict]):
        edit_man = EditMan(self, edits)
        updated_patterns = {}
        for pattern_id, edit_key, value in edit_man.iterate():
            pattern = self.get_pattern(pattern_id)
            if pattern is None:
                edit_man.log_error(
                    f"Could not apply Pattern Edit because no pattern found with id {pattern_id}"
                )
                continue
            key, dim, subkeys = edit_man.parse(edit_key)
            try:
                pattern.update_from_edit_json(key, dim, subkeys, value)
                updated_patterns[pattern_id] = pattern
            except Exception as exc:
                edit_man.log_error(f"Could not apply edit \"{edit_key}\" to pattern \"{pattern_id}\": {str(exc)}")
        return [
            list(updated_patterns.values()),
            edit_man.errors
        ]
