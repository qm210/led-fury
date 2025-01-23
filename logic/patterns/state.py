import abc
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from logic.patterns.template import PatternTemplate
    from service.RunState import RunState


@dataclass
class PatternInstanceState(abc.ABC):

    @classmethod
    def init_from(cls, json):
        pass

    def proceed(self, run: "RunState", template: "PatternTemplate", verbose=False):
        pass

    def get_intensity(self):
