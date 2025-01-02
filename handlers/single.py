import tornado

from SequenceMan import SequenceMan


class SingleHandler(tornado.web.RequestHandler):

    def post(self):
        man = SequenceMan.get_instance()
        sender = man.make_sender()
        # Hyperion
        # sender.send([
        #     col
        #     for i in range(66)
        #     for col in [255 - 3 * i, 0, 3 * i]
        # ])
        # UDP RT / DRGB
        sender.send([
            2,
            2,
            *man.create_rgb_gradient(
                255, 0, 128,
                0, 180, 240,
            )
        ])
        self.write({"message": "thanks for the post"})
