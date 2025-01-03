from dataclasses import dataclass
from random import randint


@dataclass
class HsvColor:
    h: int = 0
    s: int = 0
    v: int = 0

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

    def randomize_hue(self, delta=None):
        if delta is None:
            self.h = randint(0, 360)
        else:
            self.h = (self.h + randint(-delta, delta)) % 360


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
