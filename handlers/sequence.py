from tornado.web import RequestHandler

from service.SequenceMan import SequenceMan


class StartSequenceHandler(RequestHandler):
    def post(self):
        man = SequenceMan.get_instance()
        man.start_sample_sequence()
        self.write(man.get_state_json())


class StopSequenceHandler(RequestHandler):
    def post(self):
        man = SequenceMan.get_instance()
        man.stop_sequence()
        self.write(man.get_state_json())


class SequenceInfoHandler(RequestHandler):
    def get(self):
        man = SequenceMan.get_instance()
        self.write(man.get_state_json())
