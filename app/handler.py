import json

import tornado

from app.json import JsonEncoder


class ManHandler(tornado.web.RequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.man = self.application.man

    def write(self, result):
        if result is not None and \
                not isinstance(result, (str, int, float, bool, bytes)):
            result = json.dumps(result, cls=JsonEncoder)
        print("WRITE", result)
        return super().write(result)

    def body(self):
        return json.loads(self.request.body)
