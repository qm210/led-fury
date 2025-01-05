from app.handler import ManHandler


class MainHandler(ManHandler):
    def get(self):
        self.render("../ui/dist/index.html")


class TestPageHandler(ManHandler):
    def get(self):
        sequence_json = self.man.get_state_json()
        self.render("../template/index.html", state=sequence_json)


class ShutdownHandler(ManHandler):
    def post(self):
        print("Shutdown triggered via endpoint.")
        self.application.shutdown_event.set()


class FileStoreHandler(ManHandler):
    def post(self):
        filename = self.body().get("filename", "")
        self.application.store_state(filename)
