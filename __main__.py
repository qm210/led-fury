import asyncio

from tornado.options import define, options

from app.app import Application

define('port', default=8888, help='run on the given port', type=int)
define('file', default='./state.fury', help='load state file', type=str)


async def main():
    app = Application(debug=True)
    app.listen(options.port)
    app.load_state(options.file)
    await app.shutdown_event.wait()


if __name__ == "__main__":
    asyncio.run(main())
