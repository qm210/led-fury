from dataclasses import dataclass, field
from typing import List

import numpy as np
from PIL import Image, ImageSequence
from numpy.typing import NDArray
from tornado import gen

from model.geometry import Vec2d


@dataclass
class GifPattern:
    filename: str
    size: Vec2d
    frames: List[NDArray] = field(default_factory=list)

    @classmethod
    @gen.coroutine
    def import_from(cls, filename: str):
        with Image.open(filename) as image:
            if image.format != "GIF":
                raise TypeError(f"GifPattern must import from an actual GIF, not {image.format}")
            frames = [
                np.array(frame)
                for frame in ImageSequence.Iterator(image)
            ]
        return cls(
            filename=filename,
            frames=frames,
            size=Vec2d(*image.size),
        )
