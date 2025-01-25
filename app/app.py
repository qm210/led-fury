import asyncio
import json
import os
from json import JSONDecodeError
from logging import DEBUG

import tornado

from app.json import JsonEncoder
from handlers.geometry import GeometryHandler

from handlers.main import MainHandler, ShutdownHandler, FileStoreHandler
from handlers.overall import OverallStateHandler, OverallRunHandler, OverallOptionsHandler
from handlers.pattern import PatternHandler, PatternEditHandler, GifPatternHandler
from handlers.single import SingleHandler
from handlers.sequence import StartSequenceHandler, StopSequenceHandler, SequenceInfoHandler, SequenceSeekHandler
from handlers.websocket import WebSocketHandler
from logic.time import current_timestamp
from service.SequenceMan import SequenceMan


class Application(tornado.web.Application):
    def __init__(self, options, **kwargs):
        verbose = options.verbose
        load_file = options.file
        gif_store = options.gif_store

        super().__init__(
            handlers=[
                (r"/", MainHandler),
                (r"/assets/(.*)", tornado.web.StaticFileHandler, {
                    "path": "./ui/dist/assets"
                }),
                (r"/favicon.svg", tornado.web.StaticFileHandler, {
                    "path": "./ui/dist/favicon.svg"
                }),
                (r"/ws", WebSocketHandler),

                (r"/api/shutdown", ShutdownHandler),
                (r"/api/store", FileStoreHandler),

                (r"/api/overall/state", OverallStateHandler),
                (r"/api/overall/run", OverallRunHandler),
                (r"/api/overall/options", OverallOptionsHandler),

                (r"/api/geometry", GeometryHandler),

                (r"/api/pattern/([a-zA-Z0-9_-]+)", PatternHandler),
                (r"/api/patterns/edits", PatternEditHandler),
                (r"/api/patterns/gif", GifPatternHandler),

                (r"/api/sequence/start", StartSequenceHandler),
                (r"/api/sequence/stop", StopSequenceHandler),
                (r"/api/sequence/seek", SequenceSeekHandler),
                (r"/api/sequence", SequenceInfoHandler),

                # these are old:
                (r"/api/single", SingleHandler),
            ],
            # static_path=os.path.join(os.path.dirname(__file__), "ui/dist/")
            **kwargs
        )
        self.man = SequenceMan(
            verbose=verbose,
            gif_store_path=gif_store
        )
        self.shutdown_event = asyncio.Event()
        self.recent_filename = ""

        tornado.log.enable_pretty_logging()
        tornado.log.app_log.setLevel(DEBUG)

        if load_file:
            self.load_state(options.file)

    def load_state(self, filename):
        try:
            with open(filename, 'r') as f:
                stored = json.load(f)
        except FileNotFoundError:
            return
        except JSONDecodeError as exc:
            print("State File seems broken:", filename, str(exc))
        except Exception as exc:
            print("Can't load State File", filename, str(exc))
            raise exc
        self.man.init_from(stored)
        self.recent_filename = filename

    def store_state(self, filename="", overwrite=False):
        if filename == "":
            filename = self.recent_filename
        if os.path.exists(filename) and not overwrite:
            os.rename(filename, f"{filename}.{current_timestamp()}")
        store = {
            "state": self.man.state,
            "setup": self.man.setup,
        }
        with open(filename, 'w') as f:
            json.dump(store, f, cls=JsonEncoder, indent=4)
        self.recent_filename = filename
