from app.handler import ManHandler


class OverallStateHandler(ManHandler):
    def get(self):
        result = {
            "patterns": self.man.state.patterns,
            "setup": self.man.setup,
        }
        self.write(result)
