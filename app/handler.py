import json
from json import JSONDecodeError
from traceback import print_exc

import tornado
from tornado.log import app_log

from app.json import JsonEncoder


class ManHandler(tornado.web.RequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.man = self.application.man

    def set_default_headers(self):
        origin = self.request.headers.get('Origin')
        if origin and origin.startswith("http://localhost"):
            self.set_header("Access-Control-Allow-Origin", origin)
            self.set_header("Access-Control-Allow-Headers", "x-requested-with, content-type")
            self.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def options(self):
        self.set_status(204)
        self.finish()

    def write(self, result):
        if result is not None and \
                not isinstance(result, (str, int, float, bool, bytes)):
            result = json.dumps(result, cls=JsonEncoder)
        return super().write(result)

    def body(self):
        body = self.request.body
        try:
            return json.loads(body)
        except JSONDecodeError as ex:
            app_log.error(f"Cannot parse body: \"{body}\"; {str(ex)}")
            return {}
