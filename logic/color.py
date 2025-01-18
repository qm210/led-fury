from colorsys import hsv_to_rgb
from dataclasses import dataclass
from random import randint
from typing import Tuple, Self

import numpy as np
from numpy.typing import NDArray

from logic.math import clamp

hsv_dtype = np.dtype([
    ('hue', np.float64),
    ('sat', np.float64),
    ('val', np.float64)
])

HsvColorArray = NDArray[hsv_dtype]
ArrayIndices = NDArray[Tuple[int, int]]


@dataclass
class HsvColor:
    h: float = 0
    s: float = 0
    v: float = 0

    @classmethod
    def Random(cls, h=None, s=None, v=None):
        if h is None:
            h = randint(0, 360)
        if s is None:
            s = randint(0, 100),
        if v is None:
            v = randint(0, 100)
        return cls(h, s, v)

    @classmethod
    def RandomFull(cls):
        return cls.Random(s=100, v=100)

    def randomize(self, h=None, s=0, v=0):
        if h is None:
            self.h = randint(0, 360)
        else:
            self.h += randint(-h, h)
        if s < 0:
            self.s += randint(s, 0)
        elif s > 0:
            self.s += randint(0, s)
        if v < 0:
            self.v += randint(v, 0)
        elif v > 0:
            self.v += randint(0, v)
        self.sanitize()

    def sanitize(self):
        self.h = self.h % 360
        self.s = clamp(self.s, 0, 100)
        self.v = clamp(self.v, 0, 100)

    def scale_v(self, factor: float):
        self.v = factor * self.v
        if self.v < 0:
            self.v = 0
        if self.v > 100:
            self.v = 100

    def copy(self):
        return HsvColor(self.h, self.s, self.v)

    def to_rgb(self):
        r, g, b = hsv_to_rgb(self.h/360, self.s/100, self.v/100)
        return [255 * r, 255 * g, 255 * b]


def create_flat_rgb_gradient(length, rgb1, rgb2):
    def interpolate(c1, c2, i):
        return int(c1 + (c2 - c1) * i / (length - 1))
    return [
        col
        for i in range(length)
        for col in [
            interpolate(rgb1[c], rgb2[c], i)
            for c in range(3)
        ]
    ]
