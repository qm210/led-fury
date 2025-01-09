import tornado.websocket


class WebSocketHandler(tornado.websocket.WebSocketHandler):

    clients = set()

    def check_origin(self, origin: str) -> bool:
        legit = super().check_origin(origin)
        return legit or origin.startswith("http://localhost")

    def open(self):
        WebSocketHandler.clients.add(self)

    def on_close(self):
        WebSocketHandler.clients.remove(self)

    def on_message(self, message):
        print("Websocket received: ", message)
        self.write_message(message)

    @classmethod
    def send_message(cls, message: str | dict):
        for client in cls.clients:
            client.write_message(message)
