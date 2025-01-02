from tornado.web import RequestHandler

from SequenceMan import SequenceMan


class StartSequenceHandler(RequestHandler):

    def post(self):
        man = SequenceMan.get_instance()
        man.start_sequence()
        self.write(man.get_state_dict())


class StopSequenceHandler(RequestHandler):

    def post(self):
        man = SequenceMan.get_instance()
        man.stop_sequence()
        self.write(man.get_state_dict())
