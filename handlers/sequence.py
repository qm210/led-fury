from app.handler import ManHandler


class StartSequenceHandler(ManHandler):
    def post(self):
        self.man.start_sequence()
        self.write(self.man.get_state_json())


class StopSequenceHandler(ManHandler):
    def post(self):
        self.man.stop_sequence()
        self.write(self.man.get_state_json())


class SequenceInfoHandler(ManHandler):
    # needed still? -> OverallStateHandler
    def get(self):
        self.write(self.man.get_state_json())
