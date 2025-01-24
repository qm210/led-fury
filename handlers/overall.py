from app.handler import ManHandler
from logic.patterns import BoundaryBehaviour
from model.setup import SegmentShape
from model.utils import list_enum_options


class OverallStateHandler(ManHandler):
    def get(self):
        state = self.man.state
        selected = {
            "frame": state.selected_frame or 0,
            "pattern": state.selected_pattern,
            "pos": state.selected_pos or [0, 0],
            "soloPatternId": state.solo_pattern_id,
        }
        result = {
            "patterns": state.patterns,
            "setup": self.man.setup,
            "sequence": {
                "length": state.sequence_length,
                "loops": state.sequence_loops,
                "frames": state.sequence_frames,
            },
            "selected": selected
        }
        self.write(result)


class OverallRunHandler(ManHandler):
    def get(self):
        self.write(self.man.run.__dict__)


class OverallOptionsHandler(ManHandler):
    def get(self):
        self.write({
            "SegmentShape": list_enum_options(SegmentShape),
            "BoundaryBehaviour": list_enum_options(BoundaryBehaviour),
        })
