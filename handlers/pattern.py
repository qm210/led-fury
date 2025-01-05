from app.handler import ManHandler


class PatternsHandler(ManHandler):
    # needed still? -> OverallStateHandler
    def get(self):
        self.write(self.man.state.patterns)


class PatternHandler(ManHandler):
    def get(self, id):
        print("pattern id", id)

    def post(self, id):
        body = self.body()
        print("pattern id", id)
        self.write(self.man.state.patterns)
