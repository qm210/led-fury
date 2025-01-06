from app.handler import ManHandler


class OverallStateHandler(ManHandler):
    def get(self):
        state = self.man.state
        selected = {
            "frame": state.selected_frame or 0,
            "pattern": state.selected_pattern,
            "pos": state.selected_pos or [0, 0],
        }
        if not state.selected_pattern and len(state.patterns) > 0:
            selected["pattern"] = state.patterns[0].id
        result = {
            "patterns": state.patterns,
            "setup": self.man.setup,
            "info": {
                "maxSegmentLength": state.max_length,
                "numberSegments": state.n_segments,
                "totalNumberPixels": state.n_pixels,
                "is2d": state.is_2d,
            },
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
