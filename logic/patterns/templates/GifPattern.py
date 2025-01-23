from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from PIL import Image, ImageSequence
from numpy.typing import NDArray
from tornado import gen

from logic.geometry.calculate import Geometry
from logic.patterns.state import PatternInstanceState
from logic.patterns.template import PatternTemplate
from model.utils import error_factory


@dataclass
class GifPattern(PatternTemplate):
    filename: str = field(default_factory=error_factory("filename required"))
    _original_frames: NDArray = field(default_factory=lambda: np.empty((0, 0, 0)))
    resized_frames: Optional[NDArray] = field(default=None)

    @classmethod
    @gen.coroutine
    def import_from(cls, filename: str, geometry=None):
        with Image.open(filename) as image:
            if image.format != "GIF":
                raise TypeError(f"GifPattern must import from an actual GIF, not {image.format}")
            frames = list(ImageSequence.Iterator(image))
        result = cls(
            filename=filename,
            _original_frames=np.array(frames),
            resized_frames=None,
        )
        if geometry is not None:
            result.apply_geometry(geometry)
        return result

    @property
    def frames(self):
        return self.resized_frames or self._original_frames

    def apply_geometry(self, geometry: Geometry):
        super().apply_geometry(geometry)
        width, height = geometry.area.size
        n_frames, original_width, original_height, n_channels = self._original_frames.shape

        def interpolate_resize(array4d):
            flat_array = array4d.reshape(n_frames, -1)
            n_frame_values = flat_array.shape[1]
            resized = np.interp(
                np.linspace(0, n_frame_values - 1, width),
                np.arange(n_frame_values),
                flat_array
            )
            return resized.reshape(n_frames, width, -1, n_channels)

        # self.resized_frames = interpolate_resize(self.original_frames)

        self.resized_frames = np.zeros((n_frames, width, height, n_channels))
        for f in range(n_frames):
            for ch in range(n_channels):
                frame = self._original_frames[f, :, :, ch]
                # for testing reasons, just cut off
                self.resized_frames[f, :, :, ch] = frame[:width, :height]

                # moar testing
                for x in range(width):
                    for y in range(height):
                        self.resized_frames[f, x, y, ch] = 255 if x % 2 != y % 2 else 0

        print("Resized frames, nbytes are", self._original_frames.nbytes, "resized:", self.resized_frames.nbytes)


@dataclass
class GifPatternState(PatternInstanceState):
    pass
