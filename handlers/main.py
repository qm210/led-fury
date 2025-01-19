from app.handler import ManHandler


class MainHandler(ManHandler):
    def get(self):
        self.render("../ui/dist/index.html")


class ShutdownHandler(ManHandler):
    def post(self):
        print("Shutdown triggered via endpoint.")
        self.application.shutdown_event.set()


class FileStoreHandler(ManHandler):
    def post(self):
        filename = self.body().get("filename", "")
        self.application.store_state(filename)
