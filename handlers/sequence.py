from app.handler import ManHandler


class StartSequenceHandler(ManHandler):
    def post(self):
        self.man.start_sequence()


class StopSequenceHandler(ManHandler):
    def post(self):
        self.man.stop_sequence()


class SequenceInfoHandler(ManHandler):
    # needed still? -> OverallStateHandler
    def get(self):
        self.write(self.man.get_state_json())
