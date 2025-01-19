from logic.color import HsvColor
from logic.patterns import PointMotion, Boundary, BoundaryBehaviour
from logic.patterns.PointPattern import PointPattern
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
                boundary=[
                    Boundary(
                        max=self.state.max_length - 1,
                        behaviour=BoundaryBehaviour.Bounce
                    ),
                    Boundary(
                        max=self.state.n_segments - 1,
                        behaviour=BoundaryBehaviour.Wrap,
                    )
                ],
                color=HsvColor.RandomFull(),
                hue_delta=360,
            ),
            fade=0.95
        )
    ]
