import asyncio

from tornado.web import RequestHandler

from service.SequenceMan import SequenceMan


class MainHandler(RequestHandler):
    def get(self):
        sequence_json = SequenceMan.get_instance().get_state_json()
        self.render("../template/index.html", state=sequence_json)


# TODO: not as lazily as a global var. anyhow.
global_stop_event = asyncio.Event()


class ShutdownHandler(RequestHandler):
    def get(self):
        if global_stop_event.is_set():
            return
        global_stop_event.set()
