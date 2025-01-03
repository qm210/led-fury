from dataclasses import dataclass, asdict, field
from json import dumps
from time import perf_counter
from typing import Optional, List

from tornado.ioloop import PeriodicCallback

from logic.color import HsvColor
from logic.patterns import Pattern, PatternType, PointPattern, LinearMotion, BorderBehaviour, PatternInstance
from model.state import SequenceState
from model.setup import LedSegment, ControllerSetup
from service.UdpSender import UdpSender

CONTROLLER_HOST = "192.168.178.60"  # is wled1.local (would that name work? we'll see later)
CONTROLLER_PORT = 65506
# for Hyperion protoclol
# CONTROLLER_PORT = 19446  # is that undocumented RGB port that you cannot change via the WLED UI ;)


UDP_MODE_WARLS = 1
UDP_MODE_DRGB = 2


class SequenceMan:
    """
    Managing the sequential UDP requests

    this implements the singleton pattern, instantiate it via get_instance()
    """

    instance = None

    @dataclass
    class RunState:
        start_sec: Optional[int] = None
        elapsed_sec: Optional[int] = None
        process: Optional[PeriodicCallback] = None
        pattern_instances: dict[str, List[PatternInstance]] = field(default_factory=dict)

    state: SequenceState
    sender: Optional[UdpSender] = None
    run: RunState

    def __init__(self):
        self.setup = ControllerSetup(
            host=CONTROLLER_HOST,
            port=CONTROLLER_PORT,
            segments=[
                LedSegment(66)
            ]
        )
        self.state = SequenceState(self.setup)

    @classmethod
    def get_instance(cls):
        if cls.instance is None:
            cls.instance = SequenceMan()
        return cls.instance

    def __call__(self):
        # todo: find out whether this actually makes sense / is needed
        raise TypeError("The SequenceMan singleton needs to be accessed by get_instance()")

    def make_sender(self):
        return UdpSender(self.setup.host, self.setup.port)

    def get_state_dict(self):
        return {
            "running": self.run.process is not None,
            "elapsed_sec": self.run.elapsed_sec,
            "state": asdict(self.state)
        }

    def get_state_json(self):
        return dumps(self.get_state_dict())

    def init_sample_pattern(self):
        self.state.patterns = [
            Pattern(
                name="Sample Point",
                type=PatternType.Point,
                template=PointPattern(
                    pos=[0, 0],
                    size=[1, 1],
                    motion=[
                        LinearMotion(15, at_border=BorderBehaviour.Bounce),
                        LinearMotion()
                    ],
                    color=HsvColor.RandomFull(),
                    hue_delta=360,
                ),
                fade=0.95
            )
        ]

    def shuffle_pattern_colors(self):
        for pattern in self.state.patterns:
            for instance in self.run.pattern_instances[pattern.id]:
                instance.color.randomize_hue(delta=pattern.template.color.hue_delta)

    def start_sample_sequence(self):
        self.shuffle_pattern_colors()
        if self.process is not None:
            return
        self.init_sample_pattern()
        self.start_sequence()

    def start_sequence(self):
        if self.process is not None:
            return

        self.sender = self.make_sender()
        self.run.start_sec = perf_counter()
        self.run.elapsed_sec = 0
        self.state.reset_pixels()

        def run():
            p = s.point
            p_max = self.setup.led_count - 1

            last_elapsed_sec = s.elapsed_sec
            s.elapsed_sec = perf_counter() - start_sec
            delta_sec = s.elapsed_sec - last_elapsed_sec

            p.pos += p.speed * p.speed_sign * delta_sec
            if p.pos >= p_max and p.speed_sign > 0:
                p.pos = p_max
                p.speed_sign = -1
            if p.pos <= 0 and p.speed_sign < 0:
                p.pos = 0
                p.speed_sign = +1

            for pixel in range(self.setup.led_count):
                i = 3 * pixel
                # fade the current color
                for c in range(3):
                    self.state.leds[i+c] = int(p.fade * self.state.leds[i+c])
                # apply new point at current position
                if abs(pixel - p.pos) < p.width:
                    self.state.leds[i:i+3] = p.color

            timeout_sec = 1
            self.sender.send([UDP_MODE_DRGB, timeout_sec, *self.state.leds], close=False)

        print("Start a loop, currently", self.state._process, "; milliseconds:", self.update_ms)
        self.run.process = PeriodicCallback(run, self.state.update_ms)
        self.run.process.start()

    def stop_sequence(self):
        if self.process is not None:
            self.process.stop()
            self.process = None
        self.state.elapsed_sec = None
        if self.sender is not None:
            self.sender.close()
            self.sender = None
