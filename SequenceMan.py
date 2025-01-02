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
class PointPattern:
    pos = 0
    color = [0, 0, 0]
    speed = 0
    speed_sign = +1
    width = 1
    fade = 0.95

    def randomize_color(self):
        for i in range(len(self.color)):
            self.color[i] = randint(0, 255)

    def init_movement(self, width=1):
        # speed is amount of pixels per second
        self.pos = 0
        self.speed = 15
        self.width = width

    def to_json(self):
        return {
            "pos": self.pos,
            "color": dumps(self.color),
            "speed": self.speed_sign * self.speed,
            "width": self.width,
            "fade": self.fade,
        }


@dataclass
class SequenceState:
    loop: Any = None
    leds: List[int] = 0
    step: Optional[int] = None
    elapsed_sec: Optional[int] = None

    point = PointPattern()


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
    sender: Optional[UdpSender] = None

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
            "elapsed_sec": self.state.elapsed_sec,
            "leds": self.state.leds,
            "point": self.state.point.to_json(),
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
        self.state.point.randomize_color()
        if self.sequence_running:
            return

        self.sender = self.make_sender()
        start_sec = perf_counter()
        self.init_leds()
        s = self.state
        s.elapsed_sec = 0
        s.point.init_movement()
        period_ms = 50

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

        print("Start a loop, currently", self.state.loop, "; milliseconds:", period_ms)
        self.state.loop = PeriodicCallback(run, period_ms)
        self.state.loop.start()

    def stop_sequence(self):
        if not self.sequence_running:
            return
        self.state.loop.stop()
        self.state.loop = None
        self.state.elapsed_sec = None
        if self.sender is not None:
            self.sender.close()
            self.sender = None

    def init_leds(self):
        self.state.leds = [0 for _ in range(self.setup.led_count * 3)]
