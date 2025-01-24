from colorsys import hsv_to_rgb, rgb_to_hsv
from dataclasses import dataclass
from random import randint
from typing import Tuple, Self, Union, List

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

    def __repr__(self):
        return f"[H{round(self.h)} S{round(self.s)} V{round(self.v, 1)}]"

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

    def copy(self, scale_v: float = 1):
        return HsvColor(self.h, self.s, scale_v * self.v)

    def read_float_rgb(self, r: float, g: float, b: float):
        h, s, v = rgb_to_hsv(r, g, b)
        self.h = 360 * h
        self.s = 100 * s
        self.v = 100 * v

    def add(self, color: Self, factor: float = 1):
        r0, g0, b0 = self.to_float_rgb()
        r1, g1, b1 = color.to_float_rgb()
        self.read_float_rgb(
            r0 + factor * r1,
            g0 + factor * g1,
            b0 + factor * b1
        )

    def to_float_rgb(self):
        # this returns the [R, G, B] in values 0..1 each
        return hsv_to_rgb(self.h/360, self.s/100, self.v/100)

    def to_rgb(self):
        r, g, b = self.to_float_rgb()
        return [255 * r, 255 * g, 255 * b]

    @classmethod
    def from_rgb(cls, r, g, b, scale: float = 255):
        result = cls()
        result.read_float_rgb(
            r / scale,
            g / scale,
            b / scale
        )
        return result

    @classmethod
    def from_json(cls, json: dict):
        result = cls(
            json.get("h", 0),
            json.get("s", 100),
            json.get("v", 100)
        )
        result.sanitize()
        return result


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


def apply_fade(pixels: HsvColorArray, fade_factor: float):
    for color in pixels:
        color.scale_v(fade_factor)
