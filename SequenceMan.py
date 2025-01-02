from dataclasses import dataclass
from json import dumps
from random import randint
from time import perf_counter
from typing import Any, List, Optional

from tornado.ioloop import PeriodicCallback

from udp_sender import UdpSender


CONTROLLER_HOST = "192.168.178.60"  # is wled1.local (would that name work? we'll see later)
CONTROLLER_PORT = 65506
# for Hyperion protoclol
# CONTROLLER_PORT = 19446  # is that undocumented RGB port that you cannot change via the WLED UI ;)


UDP_MODE_WARLS = 1
UDP_MODE_DRGB = 2


@dataclass
class SequenceState:
    loop: Any = None
    leds: List[int] = 0
    elapsed_sec: Optional[int] = None

    # moving point pattern
    point_pos = 0
    point_color = (0, 0, 0)
    point_speed = 0
    point_width = 1
    point_fade = 0.9


@dataclass
class ControllerSetup:
    host: str = CONTROLLER_HOST
    port: str = CONTROLLER_PORT
    led_count: int = 66


class SequenceMan:
    """
    Managing the sequential UDP requests

    this implements the singleton pattern, instantiate it via get_instance()
    """

    instance = None
    state: SequenceState
    sender: UdpSender

    @classmethod
    def get_instance(cls):
        if cls.instance is None:
            cls.instance = SequenceMan()
            cls.state = SequenceState()
            cls.setup = ControllerSetup()
        return cls.instance

    def __call__(self):
        raise TypeError("The SequenceMan singleton needs to be accessed by get_instance()")

    def make_sender(self):
        return UdpSender(self.setup.host, self.setup.port)

    def get_state_dict(self):
        return {
            "running": self.sequence_running,
            "elapsed_sec": self.state.elapsed_sec
        }

    def get_state_json(self):
        return dumps(self.get_state_dict())

    def create_rgb_gradient(self, r1, g1, b1, r2, g2, b2):
        def interpolate(c1, c2, i):
            return int(c1 + (c2 - c1) * i / (self.setup.led_count - 1))
        return [
            col
            for i in range(self.setup.led_count)
            for col in [
                interpolate(r1, r2, i),
                interpolate(g1, g2, i),
                interpolate(b1, b2, i),
            ]
        ]

    @property
    def sequence_running(self):
        return self.state.loop is not None

    def start_sequence(self):
        if self.sequence_running:
            self.randomize_point_color()
            return

        sender = self.make_sender()
        start_sec = perf_counter()
        s = self.state
        self.init_leds()
        self.init_point()

        def run():
            s.elapsed_sec = perf_counter() - start_sec
            s.point_pos += s.point_speed * s.elapsed_sec
            if s.point_pos >= self.setup.led_count - 1:
                s.point_speed = -1
            if s.point_pos <= 0:
                s.point_speed = +1

            for p in range(self.setup.led_count):
                i = 3 * p
                # fade the current color
                for c in range(3):
                    self.state.leds[i+c] = int(s.point_fade * self.state.leds[i+c])
                # apply new point at current position
                if abs(p - s.point_pos < 0.5 * s.point_width):
                    self.state.leds[i:i+3] = s.point_color

            timeout_sec = 2
            sender.send([UDP_MODE_DRGB, timeout_sec, *self.state.leds])

        self.state.loop = PeriodicCallback(run, 200)
        self.state.loop.start()

    def stop_sequence(self):
        if not self.sequence_running:
            return
        self.state.loop.stop()
        self.state.loop = None
        self.state.elapsed_sec = None

    def init_leds(self):
        self.state.leds = [0 for _ in range(self.setup.led_count * 3)]

    def init_point(self):
        self.state.point_pos = 0
        self.state.point_speed = 0
        self.state.point_width = 1

    def randomize_point_color(self):
        self.state.point_color = (
            randint(0, 255),
            randint(0, 255),
            randint(0, 255),
        )
