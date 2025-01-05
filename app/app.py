import asyncio
import json

import tornado

from app.encoder import JsonEncoder
from handlers.main import MainHandler, ShutdownHandler, TestPageHandler, FileStoreHandler
from handlers.overall import OverallStateHandler
from handlers.pattern import PatternsHandler, PatternHandler
from handlers.single import SingleHandler
from handlers.sequence import StartSequenceHandler, StopSequenceHandler, SequenceInfoHandler
from handlers.websocket import WebSocketHandler
from logic.time import current_timestamp
from service.SequenceMan import SequenceMan


class Application(tornado.web.Application):
    def __init__(self, **kwargs):
        super().__init__(
            handlers=[
                (r"/", MainHandler),
                (r"/assets/(.*)", tornado.web.StaticFileHandler, {
                    "path": "./ui/dist/assets"
                }),
                (r"/ws", WebSocketHandler),
                (r"/shutdown", ShutdownHandler),
                (r"/store", FileStoreHandler),

                (r"/overall-state", OverallStateHandler),
                (r"/patterns", PatternsHandler),
                (r"/pattern/([a-zA-Z0-9_-]+)", PatternHandler),
                (r"/sequence/start", StartSequenceHandler),
                (r"/sequence/stop", StopSequenceHandler),
                (r"/sequence", SequenceInfoHandler),

                (r"/test", TestPageHandler),
                (r"/single", SingleHandler),
            ],
            # xsrf_cookies=True,  # not needed yet...
            **kwargs
        )
        self.man = SequenceMan.get_instance()
        self.shutdown_event = asyncio.Event()

    def load_state(self, filename):
        try:
            with open(filename, 'r') as f:
                stored = json.load(f)
        except FileNotFoundError:
            return
        except Exception as exc:
            print("cannot load state", filename, str(exc))
            raise exc

        self.man.init_state_from(stored)

    def store_state(self, filename=""):
        if filename == "":
            filename = f"store_{current_timestamp()}.fury"
        store = {
            "state": self.man.state,
            "setup": self.man.setup,
        }
        with open(filename, 'w') as f:
            json.dump(store, f, cls=JsonEncoder)
