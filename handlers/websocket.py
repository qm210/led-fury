from json import dumps

import tornado.websocket

from app.json import JsonEncoder


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
    def send_message(cls, message: str | dict):
        for client in cls.clients:
            client.write_message(message)
