from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import numpy as np

from logic.color import HsvColor, HsvColorArray
from logic.geometry.calculate import Geometry, GeometryMan
from logic.patterns.edits import EditMan
from logic.patterns.pattern import Pattern
from model.setup import ControllerSetup
from service.RunState import RunState


@dataclass
class SequenceState:
    update_ms: int = 50

    sequence_length: float = 10
    sequence_loops: bool = True
    sequence_frames: int = 20

    patterns: List[Pattern] = field(default_factory=list)
    selected_frame: Optional[int] = None
    selected_pos: List[Tuple[int, int]] = field(default_factory=list)
    selected_pattern: Optional[str] = None

    # actually derived from the setup, but live here for now
    max_length: int = 0
    n_segments: int = 0
    n_pixels: int = 0
    geometry: Optional[Geometry] = None

    verbose: bool = True

    def __init__(self, setup: ControllerSetup):
        self.patterns = []
        self.selected_pos = []
        self._pixel_indices = np.empty((0, 2), dtype=int)
        self._rgb_array = np.empty(0, dtype=float)
        self._rgb_list = []
        self.apply_setup_change(setup)
        pass

    def apply_setup_change(self, setup: ControllerSetup):
        self.max_length = max([seg.length for seg in setup.segments])
        self.n_segments = len(setup.segments)
        self.n_pixels = sum([seg.length for seg in setup.segments])
        self.geometry = GeometryMan.calculate_geometry(setup.segments)

        # these are auxliary quantities for intermediate calculation only
        self._pixel_indices = self.geometry.create_pixel_indices()
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
        array = self.geometry.create_object_array()
        for x, y in self._pixel_indices:
            array[x, y] = HsvColor()
        return array

    def new_rgb_array(self):
        return np.zeros(self.n_pixels * 3, dtype=np.float64)

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

    def proceed_and_render(self, run: RunState):
        for pattern in self.patterns:
            pattern.proceed_step(run, self)

        self._rgb_array = self.new_rgb_array()
        index = 0
        for x, y in self._pixel_indices:
            # index of each start value of the RGB-tuple (for DRGB)
            for pattern, instance in self.patterns_with_instances(run):
                pixel = instance.pixels[x, y]
                mix = 0.01 * pixel.v
                rgb = pixel.to_rgb()
                for c in range(3):
                    self._rgb_array[index + c] = mix * rgb[c] + (1 - mix) * self._rgb_array[index + c]
            index += 3

        self._rgb_array = np.clip(self._rgb_array, 0, 255).round()
        self._rgb_list = self._rgb_array.astype(np.uint8).tolist()

    @property
    def rgb_value_list(self):
        return self._rgb_list

    @property
    def pixel_indices(self):
        return self._pixel_indices

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
