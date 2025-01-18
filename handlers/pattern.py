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


class PatternHandler(ManHandler):
    def get(self, id):
        self.write(
            self.man.state.get_pattern(id)
        )

    def post(self, _id):
        body = self.body()
        self.man.upsert_pattern(body)
