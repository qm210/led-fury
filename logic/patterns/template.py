import abc
from dataclasses import field, dataclass

from logic.geometry.calculate import Geometry
from model.geometry import Area, Range


@dataclass
class PatternTemplate(abc.ABC):
    boundary: Area = field(default_factory=Area.zero_to_inf)
    resize_on_segment_change: bool = field(default=True)
    fade: float = field(default=0)

    @classmethod
    def from_json(cls, stored: dict):
        result = cls()
        if "boundary" in stored:
            result.boundary = Area.from_json(stored["boundary"])
        if "resize_on_segment_change" in stored:
            result.resize_on_segment_change = stored["resize_on_segment_change"]
        if "fade" in stored:
            result.fade = stored["fade"]
        return result

    def apply_geometry(self, geometry: Geometry):
        if self.resize_on_segment_change:
            self.boundary = Area(
                x=Range.copy(geometry.area.x),
                y=Range.copy(geometry.area.y)
            )

    def spawn_instance_state(self):
        pass
