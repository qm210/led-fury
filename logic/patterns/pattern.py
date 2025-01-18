from dataclasses import dataclass, field
from enum import Enum
from typing import Union, Optional, TYPE_CHECKING, Any

from logic.color import HsvColorArray, HsvColor
from logic.patterns import BoundaryBehaviour
from logic.patterns.PointPattern import PointPattern, PointPatternState
from logic.patterns.instance import PatternInstance
from logic.time import current_timestamp

if TYPE_CHECKING:
    from model.state import SequenceState
    from service.RunState import RunState


class PatternType(Enum):
    Point = "point"


@dataclass
class Pattern:
    # extend this Union when more pattern types exist
    template: Union[PointPattern]
    type: PatternType = PatternType.Point

    id: str = field(default_factory=current_timestamp)
    name: str = ""
    start_sec: float = 0
    stop_sec: Optional[float] = None
    respawn_sec: Optional[float] = None
    fade: float = 0.95
    max_instances: int = 10

    @classmethod
    def from_json(cls, stored: dict):
        type = PatternType(stored["type"])
        if type == PatternType.Point:
            template = PointPattern.from_json(stored["template"])
        else:
            raise TypeError(f"from_json() not yet implemented for \"{str(type)}\"")
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
        if stored.get("fade") is not None:
            result.fade = stored["fade"]
        if stored.get("max_instances") is not None:
            result.max_instances = stored["max_instances"]
        return result

    def proceed_step(self, run: "RunState", state: "SequenceState"):
        if run.elapsed_beyond(self.stop_sec):
            if run.pattern_instances[self.id]:
                del run.pattern_instances[self.id]
            return

        if run.just_elapsed(self.start_sec):
            self.spawn_instance(run, state)

        # TODO: implement respawn_sec with respect to max_instances

        for instance in run.pattern_instances[self.id]:
            self.apply_fade(instance.pixels)
            instance.proceed_motion(run)
            instance.render(state)

    def spawn_instance(self, run: "RunState", state: "SequenceState"):
        instances = run.pattern_instances[self.id]
        if len(instances) >= self.max_instances:
            return
        # TODO: would distinguish types here, but there is none other
        instance_state = PointPatternState.init_from(self.template)
        run.pattern_instances[self.id].append(
            PatternInstance(
                state=instance_state,
                template=self.template,
                pixels=state.new_pixel_array(),
                pattern_id=self.id,
                spawned_sec=run.current_sec,
            )
        )

    def apply_fade(self, pixels: HsvColorArray):
        for line in pixels:
            for color in line:
                color.scale_v(self.fade)

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
                self.fade = float(value)
            case "boundary_behaviour":
                template.boundary[dim].behaviour = BoundaryBehaviour(value)
            case _:
                raise KeyError(f"Unknown Key: {key} {dim} {subkeys} => {value}")
