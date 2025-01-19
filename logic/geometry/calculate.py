from dataclasses import dataclass
from typing import List, Callable, Optional

import numpy as np

from logic.geometry.cursor import GeometryCursor
from model.geometry import PixelCoordinate, Rect, Area
from model.setup import PixelSegment


@dataclass
class Geometry:
    coordinates: List[PixelCoordinate]
    area: Area
    rect: Rect

    def create_object_array(self, factory: Optional[Callable] = None):
        if factory is None:
            shape = (len(self.coordinates), )
            return np.empty(shape, dtype=object)
        else:
            return np.array([factory() for _ in self.coordinates])

    def iterate(self):
        for coordinate in self.coordinates:
            yield coordinate.index, coordinate.x, coordinate.y


class GeometryMan:
    """
    A static class that calculates the coordinates of every LED in your segments.

    Doesn't really have to be a class. But now it is! (´_¨｀)9
    """

    @staticmethod
    def calculate_geometry(segments: [PixelSegment]) -> Geometry:
        coordinates = []
        area = Area()
        cursor = GeometryCursor()
        i = 0
        for segment in segments:
            cursor.init(segment)
            for _ in range(segment.length):
                area.cover(cursor)
                coordinates.append(
                    PixelCoordinate.make(i, cursor)
                )
                cursor.move_next(segment, i)
                i += 1
        return Geometry(
            coordinates,
            area,
            Rect.from_area(area, extend=cursor.step),
        )
