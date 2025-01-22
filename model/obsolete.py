from logic.color import HsvColor
from logic.patterns import PointMotion, BoundaryBehaviour
from logic.patterns.templates.PointPattern import PointPattern
from logic.patterns.pattern import Pattern, PatternType


def create_sample_pattern(self):
    # was used when there was no file persistence yet
    return [
        Pattern(
            name="Sample Point",
            type=PatternType.Point,
            template=PointPattern(
                pos=[0, 0],
                size=[1, 1],
                motion=[
                    PointMotion(15),
                    PointMotion()
                ],
                at_boundary=[
                    BoundaryBehaviour.Bounce,
                    BoundaryBehaviour.Wrap,
                ],
                color=HsvColor.RandomFull(),
                hue_delta=360,
                fade=0.95
            ),
        )
    ]
