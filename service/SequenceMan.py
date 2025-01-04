from dataclasses import asdict
from itertools import chain
from json import dumps
from typing import Optional

import numpy as np
from tornado.ioloop import PeriodicCallback

from logic.color import HsvColor
from logic.patterns import LinearMotion, Boundary, BoundaryBehaviour
from logic.patterns.pattern import Pattern, PatternType, PointPattern
from model.state import SequenceState
from model.setup import LedSegment, ControllerSetup
from service.UdpSender import UdpSender
from service.sequence_run import RunState

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
                LedSegment(66)
            ]
        )
        self.state = SequenceState(self.setup)
        self.run = RunState()

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
        try:
            instance_iterator = chain.from_iterable(self.run.pattern_instances.values())
            first_instance = next(instance_iterator)
            first_pattern = self.state.patterns[0]
            first_instance = asdict(first_instance.instance)
        except StopIteration:
            first_instance = None
            first_pattern = None
        return {
            "running": self.run.process is not None,
            "current_sec": self.run.current_sec,
            "delta_sec": self.run.delta_sec,
            "first_instance": first_instance,
            "pattern": first_pattern,
            "values": self.state.rgb_value_list
        }

    def get_state_json(self):
        return dumps(self.get_state_dict(), default=str)

    def init_sample_pattern(self):
        self.state.patterns = [
            Pattern(
                name="Sample Point",
                type=PatternType.Point,
                template=PointPattern(
                    pos=[0, 0],
                    size=[1, 1],
                    motion=[
                        LinearMotion(15),
                        LinearMotion()
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

    def shuffle_pattern_colors(self):
        for pattern in self.state.patterns:
            for instance in self.run.pattern_instances[pattern.id]:
                instance.instance.color.randomize_hue(delta=pattern.template.hue_delta)

    def start_sample_sequence(self):
        self.shuffle_pattern_colors()
        if self.run.process is not None:
            return
        self.init_sample_pattern()
        self.start_sequence()

    def start_sequence(self):
        if self.run.process is not None:
            return
        self.sender = self.make_sender()
        self.run.init_times()
        self.run.process = PeriodicCallback(self.run_sequence_step, self.state.update_ms)
        self.run.process.start()

    def stop_sequence(self):
        if self.run.process is not None:
            self.run.process.stop()
        self.run = RunState()
        if self.sender is not None:
            self.sender.close()
            self.sender = None

    def run_sequence_step(self):
        self.state.proceed_and_render(self.run)
        self.run.update_times()
        self.sender.send_drgb(self.state.rgb_value_list, close=False)

        # check whether patterns should spawn instances
        # proceed each instance
        # -> apply movement
        # -> render colors
        # render all colors together to self.state.pixels

        # p_max = self.state.max_length - 1
        # p = s.point
        #
        # p.pos += p.speed * p.speed_sign * delta_sec
        # if p.pos >= p_max and p.speed_sign > 0:
        #     p.pos = p_max
        #     p.speed_sign = -1
        # if p.pos <= 0 and p.speed_sign < 0:
        #     p.pos = 0
        #     p.speed_sign = +1
        #
        # for pixel in range(self.setup.led_count):
        #     i = 3 * pixel
        #     # fade the current color
        #     for c in range(3):
        #         self.state.leds[i+c] = int(p.fade * self.state.leds[i+c])
        #     # apply new point at current position
        #     if abs(pixel - p.pos) < p.width:
        #         self.state.leds[i:i+3] = p.color
        #
        #
