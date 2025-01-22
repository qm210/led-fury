from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Any

from logic.color import HsvColor
from logic.patterns import BoundaryBehaviour
from logic.patterns.template import PatternTemplate
from logic.patterns.templates.GifPattern import GifPattern
from logic.patterns.templates.PointPattern import PointPattern
from logic.time import current_timestamp


class PatternType(Enum):
    Point = "point"
    Gif = "gif"


@dataclass
class Pattern:
    template: PatternTemplate
    type: PatternType

    id: str = field(default_factory=current_timestamp)
    name: str = ""

    start_sec: float = 0
    stop_sec: Optional[float] = None
    respawn_sec: Optional[float] = None
    max_instances: int = 10

    @classmethod
    def from_json(cls, stored: dict):
        type = PatternType(stored["type"])
        if type == PatternType.Point:
            template = PointPattern.from_json(stored["template"])
        elif type == PatternType.Gif:
            template = GifPattern.from_json(stored["template"])
        else:
            raise TypeError(f"Pattern.from_json() does not understand type \"{str(type)}\"")
        result = cls(
            type=type,
            template=template,
            start_sec=stored.get("start_sec", 0),
            stop_sec=stored.get("stop_sec"),
            respawn_sec=stored.get("respawn_sec"),
        )
        if stored.get("id") is not None:
            result.id = stored["id"]
            result.name = result.name or result.id
        if stored.get("name") is not None:
            result.name = stored["name"]
        if stored.get("max_instances") is not None:
            result.max_instances = stored["max_instances"]
        return result

    def update_from_edit_json(self, key: str, dim: int = 0, subkeys: list = None, value: Any = None):
        if self.type is not PatternType.Point:
            raise ValueError(f"Cannot Update Pattern of unknown type: {self.type.value}")
        template = self.template
        match key:
            case "pos":
                template.pos[dim] = float(value)
            case "vel":
                template.motion[dim].vel = abs(float(value))
                template.motion[dim].sign = -1 if float(value) < 0 else +1
            case "acc":
                template.motion[dim].acc = float(value)
            case "size":
                template.size[dim] = float(value)
            case "color":
                template.color = HsvColor.from_json(value)
            case "deltaHue":
                template.hue_delta = int(value)
            case "deltaSat":
                template.sat_delta = int(value)
            case "deltaVal":
                template.val_delta = int(value)
            case "fade":
                template.fade = float(value)
            case "at_behaviour":
                template.at_boundary[dim] = BoundaryBehaviour(value)
            case _:
                raise KeyError(f"Unknown Key: {key} {dim} {subkeys} => {value}")
