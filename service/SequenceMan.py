from contextlib import contextmanager
from typing import Optional, List, Tuple, Union

from tornado import gen

from handlers.websocket import WebSocketHandler
from logic.patterns.templates.GifPattern import GifPattern
from logic.patterns.pattern import Pattern, PatternType
from model.state import SequenceState
from model.setup import PixelSegment, ControllerSetup
from service.UdpSender import UdpSender
from service.RunState import RunState

CONTROLLER_HOST = "192.168.178.60"  # is wled1.local (would that name work? we'll see later)
CONTROLLER_PORT = 65506
# for Hyperion protoclol
# CONTROLLER_PORT = 19446  # is that undocumented RGB port that you cannot change via the WLED UI ;)


class SequenceMan:
    """
    This is (currently) the main service of the application.
    It's called Man because of Manager, not because of gender delusions ;)
    """

    state: SequenceState
    sender: Optional[UdpSender] = None
    run: RunState

    def __init__(self, verbose=False):
        self.setup = ControllerSetup(
            host=CONTROLLER_HOST,
            port=CONTROLLER_PORT,
            segments=[
                PixelSegment(66)
            ]
        )
        self.state = SequenceState.make(self.setup, verbose)
        self.run = RunState()

    def make_sender(self):
        return UdpSender.make(self.setup)

    def broadcast_colors(self):
        no_previous_sender = self.sender is None
        if no_previous_sender:
            self.sender = self.make_sender()
        self.sender.send_drgb(
            self.state.rgb_value_list,
            close=no_previous_sender
        )
        WebSocketHandler.send_message({"rgbValues": self.state.rgb_value_list})
        if no_previous_sender:
            self.sender = None

    def get_state_json(self):
        return {
            "running": self.running,
            "current_sec": self.run.current_sec,
            "delta_sec": self.run.delta_sec,
            "patterns": self.state.patterns,
            "instances": list(self.run.pattern_instances.values()),
            "values": self.state.rgb_value_list
        }

    def init_from(self, stored: dict):
        if self.running:
            raise RuntimeError("Cannot re-initialize when still running.")
        stored_setup = stored.get("setup")
        if stored_setup is not None:
            self.setup.update_from(stored_setup)
        stored_state = stored.get("state")
        if stored_state is not None:
            self.state = SequenceState.make(self.setup)
            self.state.update_from(stored_state)
            self.run = RunState()
        self.apply_setup_change()

    def shuffle_pattern_colors(self):
        print("shuffle pattern colors because it is fun.")
        for pattern, instance in self.state.patterns_with_instances(self.run):
            instance.state.color.randomize(
                h=pattern.template.hue_delta,
                s=pattern.template.sat_delta,
                v=pattern.template.val_delta,
            )

    @property
    def running(self):
        return self.run.process is not None

    def run_sequence_step(self):
        self.run.proceed(self.state)
        self.state.render(self.run)
        self.broadcast_colors()
        self.run.update_times()

    def start_sequence(self):
        self.shuffle_pattern_colors()
        if self.running:
            return
        self.sender = self.make_sender()
        self.run.initialize()
        self.run.start_sequence_process(self)

    def stop_sequence(self):
        if self.running:
            self.run.process.stop()
        self.run.initialize()
        if self.sender is not None:
            self.sender.close()
            self.sender = None

    @gen.coroutine
    def seek_in_sequence(self, second: float, broadcast: bool = True):
        if self.running:
            self.stop_sequence()
        self.state.seek_second = second
        reached_second = yield self.run.seek(self.state)
        self.state.render(self.run)
        if broadcast:
            self.broadcast_colors()
        return reached_second

    @gen.coroutine
    def render_single_pattern(self, pattern: Pattern, second: Union[float, str]):
        # is like a version of seek_in_sequence with separated state
        run = RunState()
        state = self.state.shallow_copy_reduced(pattern=pattern)
        state.seek_second = float(second)
        yield run.seek(state)
        state.render(run)
        return state.rgb_value_list

    @contextmanager
    def sequence_paused_if_running(self):
        # for usage as "with self.sequence_paused_if_running(): ..."
        was_running = self.running
        if was_running:
            self.run.process.stop()
        yield
        if was_running:
            self.run.start_sequence_process(self)

    def apply_setup_change(self, segments: Optional[List[PixelSegment]] = None):
        with self.sequence_paused_if_running():
            if segments is not None:
                self.setup.segments = segments
            self.state.apply_setup_change(self.setup)

    def upsert_pattern(self, json: dict):
        new_pattern = Pattern.from_json(json)
        with self.sequence_paused_if_running():
            for p, pattern in enumerate(self.state.patterns):
                if pattern.id == json.get("id"):
                    self.state.patterns[p] = new_pattern
                    break
            else:
                self.state.patterns.append(new_pattern)

    def delete_pattern(self, id: str):
        with self.sequence_paused_if_running():
            self.state.patterns = [
                p for p in self.state.patterns
                if p.id != id
            ]
            if id in self.run.pattern_instances:
                del self.run.pattern_instances[id]

    def apply_pattern_edits(self, edits: List[dict]) -> Tuple[List[Pattern], List[str]]:
        if not edits:
            return [], []
        with self.sequence_paused_if_running():
            return self.state.apply_pattern_edit_jsons(edits)

    @gen.coroutine
    def import_gif_pattern(self, filename):
        template = yield GifPattern.import_from(filename, self.state.geometry)
        pattern = Pattern(
            template=template,
            type=PatternType.Gif,
            name=filename,
            max_instances=1,
        )
        for index, p in enumerate(self.state.patterns):
            if p.type is PatternType.Gif and p.template.filename == filename:
                self.state.patterns[index] = pattern
                break
        else:
            self.state.patterns.append(pattern)
        return pattern
