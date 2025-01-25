from app.handler import ManHandler
from service.Investigator import Investigator


class InvestigateStateHandler(ManHandler):
    def post(self):
        investigator = Investigator(self.man.state, self.man.run)
        with self.man.sequence_paused_if_running():
            result = {
                "points": investigator.investigate_point_patterns()
            }
        self.write(result)
