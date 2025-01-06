from app.handler import ManHandler


class PatternsHandler(ManHandler):
    # needed still? -> OverallStateHandler
    def get(self):
        self.write(self.man.state.patterns)


class PatternEditHandler(ManHandler):
    def post(self):
        edits = self.body()
        self.man.apply_pattern_edits(edits)


class PatternHandler(ManHandler):
    def get(self, id):
        self.write(
            self.man.get_pattern(id)
        )

    def post(self, _id):
        body = self.body()
        self.man.upsert_pattern(body)
