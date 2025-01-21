from tornado import gen
from tornado.log import app_log
from tornado.web import HTTPError

from app.handler import ManHandler


class StartSequenceHandler(ManHandler):
    def post(self):
        if not self.man.running:
            app_log.info("Start Sequence.")
        self.man.start_sequence()


class StopSequenceHandler(ManHandler):
    def post(self):
        if self.man.running:
            app_log.info("Stop Sequence.")
        self.man.stop_sequence()


class SequenceSeekHandler(ManHandler):
    @gen.coroutine
    def post(self):
        body = self.body()
        if "second" not in body:
            return HTTPError(422, "\"second\" missing in request body.")
        second = yield self.man.seek_in_sequence(body["second"])
        self.write({
            "currentSecond": second,
            "rgbValues": self.man.state.rgb_value_list,
            "patternInstances": self.man.run.pattern_instances
        })


class SequenceInfoHandler(ManHandler):
    # needed still? -> OverallStateHandler
    def get(self):
        self.write(self.man.get_state_json())
