from app.handler import ManHandler
from logic.geometry.calculate import GeometryMan
from model.setup import PixelSegment


class GeometryHandler(ManHandler):

    def post(self):
        """
            Pass a list of segments to this endpoint and receive the calculated pixel geometries
        """
        segments = [
            PixelSegment.from_json(segment)
            for segment in self.body()
        ]
        self.man.apply_setup_change(segments)
        self.write(self.man.state.geometry)
