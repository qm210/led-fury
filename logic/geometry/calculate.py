from dataclasses import dataclass
from typing import List

from logic.geometry.cursor import GeometryCursor
from model.geometry import PixelCoordinate, Rect, Area
from model.setup import PixelSegment


@dataclass
class Geometry:
    coordinates: List[PixelCoordinate]
    area: Area
    rect: Rect


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
