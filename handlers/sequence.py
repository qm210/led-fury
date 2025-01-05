from app.handler import ManHandler


class StartSequenceHandler(ManHandler):
    def post(self):
        self.man.start_sample_sequence()
        self.write(self.man.get_state_json())


class StopSequenceHandler(ManHandler):
    def post(self):
        self.man.stop_sequence()
        self.write(self.man.get_state_json())


class SequenceInfoHandler(ManHandler):
    def get(self):
        self.write(self.man.get_state_json())
