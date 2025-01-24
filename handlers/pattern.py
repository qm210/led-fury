from time import perf_counter

from tornado import gen
from tornado.httpclient import HTTPError

from app.handler import ManHandler


class PatternHandler(ManHandler):
    def delete(self, id):
        self.man.delete_pattern(id)

    @gen.coroutine
    def patch(self, id):
        body = self.body()
        try:
            self.man.state.update_pattern_visibility(
                id,
                show_solo=body.get('showSolo'),
                hidden=body.get('hidden'),
            )
            if 'seekSecond' in body:
                # TODO: would it be confusing not to await the result?
                yield self.man.seek_in_sequence(
                    second=body["seekSecond"],
                    broadcast=True,
                )
        except KeyError as exc:
            return HTTPError(404, str(exc))


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
        arrived_sec = perf_counter()
        # this is obviously a super awesome fallback
        files = self.request.files.get(
            "files",
            ["./sample_files/supergif.gif"]
        )
        render_second = self.get_argument("renderSecond")
        result = yield self.man.handle_gif_import(files, render_second)
        result["tookSeconds"] = perf_counter() - arrived_sec
        self.write(result)
