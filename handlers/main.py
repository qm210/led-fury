from tornado.web import RequestHandler

from SequenceMan import SequenceMan


class MainHandler(RequestHandler):
    def get(self):
        sequence_json = SequenceMan.get_instance().get_state_json()
        self.render("../template/index.html", state=sequence_json)
