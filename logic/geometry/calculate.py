from dataclasses import dataclass
from typing import List

import numpy as np

from logic.geometry.cursor import GeometryCursor
from model.geometry import PixelCoordinate, Rect, Area
from model.setup import PixelSegment


@dataclass
class Geometry:
    coordinates: List[PixelCoordinate]
    area: Area
    rect: Rect

    @property
    def shape(self):
        return int(self.rect.width), int(self.rect.height)

    def create_object_array(self):
        return np.empty(self.shape, dtype=object)

    def create_pixel_indices(self):
        w, h = self.shape
        return np.mgrid[0:w, 0:h].reshape(2, -1).T


class GeometryMan:
    """
    A static class that calculates the coordinates of every LED in your segments
    """

    @staticmethod
    def calculate_geometry(segments: [PixelSegment]) -> Geometry:
        coordinates = []
        area = Area()
        cursor = GeometryCursor()
        for segment in segments:
            cursor.init(segment)
            for i in range(segment.length):
                area.cover(cursor)
                coordinates.append(
                    PixelCoordinate.make(i, cursor)
                )
                cursor.move_next(segment, i)
        return Geometry(
            coordinates,
            area,
            Rect.from_area(area, extend=cursor.step),
        )
