import asyncio
import tornado

from handlers.main import MainHandler
from handlers.single import SingleHandler
from handlers.sequence import StartSequenceHandler, StopSequenceHandler


def make_app():
    return tornado.web.Application(
        [
            (r"/", MainHandler),
            (r"/single", SingleHandler),
            (r"/start-sequence", StartSequenceHandler),
            (r"/stop-sequence", StopSequenceHandler),
        ],
        debug=True,
        # xsrf_cookies=True,  # not needed yet...
    )


async def main():
    app = make_app()
    app.listen(8888)
    # tornado.ioloop.IOLoop.current().start() # <-- not async
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
