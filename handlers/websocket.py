import tornado.websocket


class WebSocketHandler(tornado.websocket.WebSocketHandler):

    clients = set()

    def open(self):
        WebSocketHandler.clients.add(self)

    def on_close(self):
        WebSocketHandler.clients.remove(self)

    def on_message(self, message):
        print("WS message: ", message)
        self.write_message(message)

    @classmethod
    def send_message(cls, message: str):
        print("Send WS message", message)
        for client in cls.clients:
            client.write_message(message)
