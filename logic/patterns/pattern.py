from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Any

from logic.color import HsvColor
from logic.patterns import BoundaryBehaviour
from logic.patterns.instance import PatternInstance
from logic.patterns.template import PatternTemplate
from logic.patterns.templates.GifPattern import GifPattern
from logic.patterns.templates.PointPattern import PointPattern
from logic.time import current_timestamp, precise_timestamp


class PatternType(Enum):
    Point = "point"
    Gif = "gif"


@dataclass
class Pattern:
    template: PatternTemplate
    type: PatternType

    id: str = field(default_factory=precise_timestamp)
    name: str = ""

    start_sec: float = 0
    stop_sec: Optional[float] = None
    respawn_sec: Optional[float] = None
    max_instances: int = 10

    opacity: float = 1
    hidden: bool = None

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
        if "id" in stored:
            result.id = stored["id"]
            result.name = result.name or result.id
        if "name" in stored:
            result.name = stored["name"]
        if "opacity" in stored:
            result.opacity = stored["opacity"]
        if "hidden" in stored:
            result.hidden = stored["hidden"]
        if "max_instances" in stored:
            result.max_instances = stored["max_instances"]
        return result

    def update_from_edit_json(self, key: str, dim: int = 0, subkeys: list = None, value: Any = None):
        if self.type is not PatternType.Point:
            raise ValueError(f"Cannot Update Pattern of unknown type: {self.type.value}")
        t = self.template
        match key:
            case "alpha":
                self.opacity = float(value)
            case "pos":
                t.pos[dim] = float(value)
            case "vel":
                t.motion[dim].vel = abs(float(value))
                t.motion[dim].sign = -1 if float(value) < 0 else +1
            case "acc":
                t.motion[dim].acc = float(value)
            case "size":
                t.size[dim] = float(value)
            case "color":
                t.color = HsvColor.from_json(value)
            case "deltaHue":
                t.hue_delta = int(value)
            case "deltaSat":
                t.sat_delta = int(value)
            case "deltaVal":
                t.val_delta = int(value)
            case "fade":
                t.fade = float(value)
            case "at_behaviour":
                t.at_boundary[dim] = BoundaryBehaviour(value)
            case "delay":
                t.frame_delay_sec = float(value)
            case _:
                raise KeyError(f"Unknown Key: {key} {dim} {subkeys} => {value}")
