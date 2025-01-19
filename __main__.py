import asyncio

from tornado.options import define, options

from app.app import Application

define('port', default=8888, help='run on the given port', type=int)
define('file', default='./sample.fury', help='load from file', type=str)
define('verbose', default=False, help="Konsole volblubbern zum Entkäfern", type=bool)


async def main():
    app = Application(debug=True, verbose=options.verbose)
    app.listen(options.port)
    app.load_state(options.file)
    await app.shutdown_event.wait()


if __name__ == "__main__":
    asyncio.run(main())
