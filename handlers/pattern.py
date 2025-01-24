from tornado import gen
from tornado.httpclient import HTTPError

from app.handler import ManHandler


class PatternsHandler(ManHandler):
    # needed still? -> OverallStateHandler
    def get(self):
        self.write(self.man.state.patterns)

    def post(self):
        args = self.get_arguments()
        body = self.body()
        print("TODO: Add new pattern / copy, args:", args, "; body:", body)
        raise HTTPError(501, "POST not yet implemented.")

    def delete(self):
        args = self.get_arguments()
        body = self.body()
        print("TODO: Delete pattern, args:", args, "; body:", body)
        raise HTTPError(501, "DELETE not yet implemented.")


class PatternEditHandler(ManHandler):
    def post(self):
        edits = self.body()
        result = self.man.apply_pattern_edits(edits)
        self.write({
            "updatedPatterns": result[0],
            "errors": result[1],
        })


class PatternGifHandler(ManHandler):
    @gen.coroutine
    def post(self):
        body = self.body()
        files = self.request.files
        file = files = self.request.files.get("file", None)
        render_second = self.get_argument("renderSecond")
        # TODO: get file from upload

        test_filename = "./sample_files/supergif.gif"

        pattern = yield self.man.import_gif_pattern(test_filename)
        if render_second is not None and not self.man.running:
            rgb_array = yield self.man.render_single_pattern(
                second=render_second,
                pattern=pattern
            )
            # just monkey-patch the values on there for now... =´)
            pattern.rgb_values = rgb_array
        self.write(pattern)


class PatternHandler(ManHandler):
    # def post(self, _id):
    #     body = self.body()
    #     self.man.upsert_pattern(body)

    def delete(self, id):
        self.man.delete_pattern(id)
