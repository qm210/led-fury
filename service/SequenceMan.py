from contextlib import contextmanager
from dataclasses import asdict
from datetime import datetime
from itertools import chain
from json import dumps
from typing import Optional, List

from tornado.ioloop import PeriodicCallback

from handlers.websocket import WebSocketHandler
from logic.color import HsvColor
from logic.patterns import PointMotion, Boundary, BoundaryBehaviour
from logic.patterns.pattern import Pattern, PatternType, PointPattern
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
    Managing the sequential UDP requests

    this implements the singleton pattern, instantiate it via get_instance()
    """

    instance = None

    state: SequenceState
    sender: Optional[UdpSender] = None
    run: RunState

    def __init__(self):
        self.setup = ControllerSetup(
            host=CONTROLLER_HOST,
            port=CONTROLLER_PORT,
            segments=[
                PixelSegment(66)
            ]
        )
        self.state = SequenceState(self.setup)
        self.run = RunState()

    @classmethod
    def get_instance(cls):
        if cls.instance is None:
            cls.instance = SequenceMan()
        return cls.instance

    def make_sender(self):
        return UdpSender(self.setup.host, self.setup.port)

    def get_state_json(self):
        try:
            instance_iterator = chain.from_iterable(self.run.pattern_instances.values())
            first_instance = next(instance_iterator)
            first_pattern = self.state.patterns[0]
            first_instance = asdict(first_instance.instance)
        except StopIteration:
            first_instance = None
            first_pattern = None
        return {
            "running": self.running,
            "current_sec": self.run.current_sec,
            "delta_sec": self.run.delta_sec,
            "first_instance": first_instance,
            "pattern": first_pattern,
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

    def init_sample_pattern(self):
        self.state.patterns = [
            Pattern(
                name="Sample Point",
                type=PatternType.Point,
                template=PointPattern(
                    pos=[0, 0],
                    size=[1, 1],
                    motion=[
                        PointMotion(15),
                        PointMotion()
                    ],
                    boundary=[
                        Boundary(
                            max=self.state.max_length - 1,
                            behaviour=BoundaryBehaviour.Bounce
                        ),
                        Boundary(
                            max=self.state.n_segments - 1,
                            behaviour=BoundaryBehaviour.Wrap,
                        )
                    ],
                    color=HsvColor.RandomFull(),
                    hue_delta=360,
                ),
                fade=0.95
            )
        ]

    def zipped_pattern_instances(self):
        for pattern in self.state.patterns:
            for instance in self.run.pattern_instances[pattern.id]:
                yield pattern, instance.instance

    def shuffle_pattern_colors(self):
        # usage example of self.zipped_pattern_instances()
        for pattern, instance in self.zipped_pattern_instances():
            instance.color.randomize(
                h=pattern.template.hue_delta,
                s=pattern.template.sat_delta,
                v=pattern.template.val_delta,
            )

    @property
    def running(self):
        return self.run.process is not None

    def run_sequence_step(self):
        self.state.proceed_and_render(self.run)
        self.run.update_times()
        self.sender.send_drgb(self.state.rgb_value_list, close=False)
        WebSocketHandler.send_message({"values": self.state.rgb_value_list})

    def start_process(self):
        self.run.process = PeriodicCallback(self.run_sequence_step, self.state.update_ms)
        self.run.process.start()

    def start_sequence(self):
        self.shuffle_pattern_colors()
        if self.running:
            return
        self.sender = self.make_sender()
        self.run.init_times()
        self.start_process()

    def stop_sequence(self):
        if self.running:
            self.run.process.stop()
        self.run = RunState()
        if self.sender is not None:
            self.sender.close()
            self.sender = None

    @contextmanager
    def sequence_paused_if_running(self):
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

    def get_pattern(self, id: str) -> Optional[Pattern]:
        return next((
            pattern
            for pattern in self.state.patterns
            if pattern.id == id
        ), None)

    def apply_pattern_edits(self, edits):
        if not edits:
            return
        pass
