from contextlib import contextmanager
from typing import Optional, List, Tuple

from tornado import gen
from tornado.ioloop import PeriodicCallback

from handlers.websocket import WebSocketHandler
from logic.patterns.pattern import Pattern
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
        self.state = SequenceState(self.setup, verbose)
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
            self.state = SequenceState(self.setup)
            self.state.update_from(stored_state)
            self.run = RunState()
        self.apply_setup_change()

    def shuffle_pattern_colors(self):
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
        self.state.proceed(self.run)
        self.state.render(self.run)
        self.broadcast_colors()
        self.run.update_times()

    def start_process(self):
        self.run.process = PeriodicCallback(self.run_sequence_step, self.state.update_ms)
        self.run.process.start()

    def start_sequence(self):
        self.shuffle_pattern_colors()
        if self.running:
            return
        self.sender = self.make_sender()
        self.run.initialize()
        self.start_process()

    def stop_sequence(self):
        if self.running:
            self.run.process.stop()
        self.run = RunState()
        if self.sender is not None:
            self.sender.close()
            self.sender = None

    @gen.coroutine
    def seek_in_sequence(self, second: float):
        if self.running:
            self.stop_sequence()
        self.state.seek_second = second
        self.run.initialize(seek=True)

        cursor = 0
        while cursor < second:
            self.state.proceed(self.run)
            self.run.update_times(second=cursor)
            cursor += self.state.update_ms

        self.state.render(self.run)
        self.broadcast_colors()
        return self.state.rgb_value_list

    @contextmanager
    def sequence_paused_if_running(self):
        # for usage as "with self.sequence_paused_if_running(): ..."
        was_running = self.running
        if was_running:
            self.run.process.stop()
        yield
        if was_running:
            self.start_process()

    def apply_setup_change(self, segments: Optional[List[PixelSegment]] = None):
        with self.sequence_paused_if_running():
            if segments is not None:
                self.setup.segments = segments
            self.state.apply_setup_change(self.setup)

    def upsert_pattern(self, json: dict):
        new_pattern = Pattern.from_json(json)
        for p, pattern in enumerate(self.state.patterns):
            if pattern.id == json.get("id"):
                self.state.patterns[p] = new_pattern
                break
        else:
            self.state.patterns.append(new_pattern)

    def apply_pattern_edits(self, edits: List[dict]) -> Tuple[List[Pattern], List[str]]:
        if not edits:
            return [], []
        with self.sequence_paused_if_running():
            return self.state.apply_pattern_edit_jsons(edits)
