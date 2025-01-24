import abc
from dataclasses import dataclass
from typing import TYPE_CHECKING

from logic.color import HsvColor

if TYPE_CHECKING:
    from logic.patterns.template import PatternTemplate
    from service.RunState import RunState


@dataclass
class PatternInstanceState(abc.ABC):
    _reference: "PatternTemplate"

    @classmethod
    def init_from(cls, template: "PatternTemplate"):
        return cls(
            _reference=template
        )

    @abc.abstractmethod
    def proceed(self, run: "RunState", verbose: bool = False):
        pass

    @abc.abstractmethod
    def render(self, x: float, y: float) -> HsvColor:
        pass
