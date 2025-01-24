from dataclasses import dataclass, field
from math import floor
from typing import Optional, TYPE_CHECKING

import numpy as np
import cv2
from PIL import Image, ImageSequence
from numpy.typing import NDArray
from tornado import gen

from logic.color import HsvColor
from logic.geometry.calculate import Geometry
from logic.patterns.state import PatternInstanceState
from logic.patterns.template import PatternTemplate
from model.utils import error_factory

if TYPE_CHECKING:
    from service.RunState import RunState


@dataclass
class GifPattern(PatternTemplate):
    filename: str = field(default_factory=error_factory("filename required"))
    _original_frames: NDArray = field(default_factory=lambda: np.empty((0, 0, 0)))
    resized_frames: Optional[NDArray] = field(default=None)

    frame_delay_sec: float = 0.1

    @classmethod
    @gen.coroutine
    def import_from(cls, filename: str, geometry=None):
        with Image.open(filename) as image:
            if image.format != "GIF":
                raise TypeError(f"GifPattern must import from an actual GIF, not {image.format}")
            frames = []
            for frame in ImageSequence.Iterator(image):
                width, height = frame.size
                frames.append(
                    np.array(
                        frame.copy().convert('RGB').getdata(),
                        dtype=np.uint8
                    ).reshape(width, height, 3)
                )
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
        return (
            self._original_frames
            if self.resized_frames is None
            else self.resized_frames
        )

    def apply_geometry(self, geometry: Geometry):
        super().apply_geometry(geometry)
        width, height = geometry.rect.size
        n_frames, original_width, original_height, n_channels = self._original_frames.shape

        self.resized_frames = np.zeros((n_frames, width, height, n_channels))
        for f in range(n_frames):
            for ch in range(n_channels):
                frame = self._original_frames[f, :, :, ch]
                resized_frame = cv2.resize(
                    frame,
                    dsize=(width, height),
                    interpolation=cv2.INTER_CUBIC
                )
                self.resized_frames[f, :, :, ch] = resized_frame

        print("Resized frames, nbytes are", self._original_frames.nbytes, "resized:", self.resized_frames.nbytes)

    def spawn_instance_state(self):
        return GifPatternState.init_from(self)


@dataclass
class GifPatternState(PatternInstanceState):
    frame_fractional: float = 0
    frame_index: int = 0

    def __post_init__(self):
        self.frame_fractional = 0
        self.frame_index = 0

    @classmethod
    def init_from(cls, template: GifPattern):
        return cls(
            frame_fractional=0,
            frame_index=0,
            _reference=template,
        )

    def proceed(self, run: "RunState", verbose: bool = False):
        # TODO: how to make clear that GifPatternState has a GifPattern as template (_reference)?
        if not self._reference.frame_delay_sec:
            return
        self.frame_fractional += run.delta_sec / self._reference.frame_delay_sec
        delta_frames = floor(self.frame_fractional)
        self.frame_fractional -= delta_frames
        self.frame_index += delta_frames

    def render(self, x: float, y: float) -> HsvColor:
        frames = self._reference.frames
        index = self.frame_index % len(frames)
        frame = frames[index]
        # TODO: for now, truncate coordinates -> improve by interpolating when necessary
        rgb = frame[int(x), int(y)]
        return HsvColor.from_rgb(*rgb, scale=255)
