from app.handler import ManHandler
from logic.color import create_flat_rgb_gradient
from service.SequenceMan import SequenceMan


class SingleHandler(ManHandler):
    """
        was a very first draft that is just kept here for reference
    """

    def post(self):
        sender = self.man.make_sender()
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
            *create_flat_rgb_gradient(
                self.man.state.max_length,
                [255, 0, 128],
                [0, 180, 240],
            )
        ])
        self.write({"message": "thanks for the post"})
