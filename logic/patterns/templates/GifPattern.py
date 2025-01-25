import dataclasses
from dataclasses import dataclass, field
from math import floor
from pathlib import Path
from typing import Optional, TYPE_CHECKING, Tuple

import numpy as np
import cv2
from PIL import Image, ImageSequence
from numpy.typing import NDArray
from tornado import gen
from tornado.log import app_log

from logic.color import HsvColor
from logic.geometry.calculate import Geometry
from logic.patterns.state import PatternInstanceState
from logic.patterns.template import PatternTemplate
from model.utils import error_factory

if TYPE_CHECKING:
    from service.RunState import RunState


# we aim at RGB; so...
n_channels = 3


@dataclass
class GifPattern(PatternTemplate):
    filename: str = field(default_factory=error_factory("filename required"))
    _original_frames: NDArray = field(default_factory=lambda: np.empty((0, 0, 0)))
    resized_frames: Optional[NDArray] = field(default=None)
    original_width: int = 0
    original_height: int = 0
    original_n_bytes: int = 0
    n_frames: int = 0
    n_bytes: int = 0

    frame_delay_sec: float = 0.1

    @classmethod
    @gen.coroutine
    def import_from(cls, file: Path, geometry=None):
        with Image.open(file) as image:
            if image.format != "GIF":
                raise TypeError(f"GifPattern must import from an actual GIF, not {image.format}")
            frames = []
            for frame in ImageSequence.Iterator(image):
                width, height = frame.size
                frames.append(
                    np.array(
                        frame.copy().convert('RGB').getdata(),
                        dtype=np.uint8
                    ).reshape(height, width, n_channels)
                )
        result = cls(
            filename=file.name,
            _original_frames=np.array(frames),
            resized_frames=None,
            original_width=width,
            original_height=height,
            n_frames=len(frames),
        )
        result.orignal_width = result._original_frames.nbytes
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
        try:
            self.update_resized(geometry.rect.size)
        except Exception as exc:
            app_log.error(f"Error resizing GIF: {str(exc)}")

    def update_resized(self, size: Tuple[int, int]):
        width, height = size
        self.resized_frames = np.zeros((self.n_frames, height, width, n_channels))
        for f in range(self.n_frames):
            for ch in range(n_channels):
                frame = self._original_frames[f, :, :, ch]
                resized_frame = cv2.resize(
                    frame,
                    dsize=(height, width),
                    interpolation=cv2.INTER_CUBIC
                )
                self.resized_frames[f, :, :, ch] = resized_frame
        self.n_bytes = self.resized_frames.nbytes

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
        rgb = frame[int(y), int(x)]
        return HsvColor.from_rgb(*rgb, scale=255)

    def collect_broadcast_info(self):
        return {
            "frameCursor": self.frame_index + self.frame_fractional,
            "nFrames": self._reference.n_frames,
            "nBytes": self._reference.n_bytes,
        }
