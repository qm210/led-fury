from dataclasses import dataclass, field
from time import perf_counter
from typing import List, Tuple

import numpy as np
import plotly.express as px

from logic.color import HsvColor
from logic.patterns.pattern import PatternType
from model.state import SequenceState
from service.RunState import RunState


@dataclass
class DataPoints:
    x: List[float] = field(default_factory=list)
    y: List[float] = field(default_factory=list)
    r: List[int] = field(default_factory=list)
    g: List[int] = field(default_factory=list)
    b: List[int] = field(default_factory=list)
    rgb: List[List[int]] = field(default_factory=list)
    h: List[float] = field(default_factory=list)
    s: List[float] = field(default_factory=list)
    v: List[float] = field(default_factory=list)

    def append(self, x, y, color: HsvColor):
        self.x.append(x)
        self.y.append(y)
        self.h.append(color.h)
        self.s.append(color.s)
        self.v.append(color.v)
        rgb = color.to_rgb()
        self.rgb.append(rgb)
        self.r.append(rgb[0])
        self.g.append(rgb[1])
        self.b.append(rgb[2])


class Investigator:
    state: SequenceState
    run: RunState

    def __init__(self, state: SequenceState, run: RunState):
        self.state = state
        self.run = run
        # might need as np.array? we'll see.
        self.coordinates = np.array(self.state.geometry.coordinates)

    def investigate_point_patterns(self):
        # remember: that is an iterator, can only be traversed once :)
        point_patterns_with_instances = self.state.patterns_with_instances(
            run=self.run,
            only_visible=False,
            only_pattern_type=PatternType.Point
        )
        result = []
        for pattern, instance in point_patterns_with_instances:
            output_obj = {
                "patternId": pattern.id,
                "error": None,
                "output": None,
            }
            try:
                output = self.plot_distribution(pattern, instance)
                output_obj["output"] = output
            except Exception as e:
                output_obj["error"] = str(e)
                pass
            result.append(output_obj)
        return result

    def coordinates_at(self, x=None, y=None):
        for c in self.state.geometry.coordinates:
            if x is not None and int(c.x) != int(x):
                continue
            if y is not None and int(c.y) != int(y):
                continue
            yield c.index, c.x, c.y

    def plot_distribution(self, pattern, instance):
        # as a quick check, plot the distribution of the RGB values in x-direction
        # for the LEDs at the points y position
        point_y = int(instance.state.pos[1])
        data = DataPoints()
        time_start = perf_counter()
        for index, x, y in self.coordinates_at(y=point_y):
            data.append(
                x=x,
                y=y,
                color=instance.pixels[index]
            )

        x_def = data.x
        plot_values = data.v

        time_gather = perf_counter() - time_start
        fig = px.line(
            x=x_def,
            y=plot_values,
            labels={
                'x': f"X-Axis through Y=${point_y}",
                'y': f"Color V (HSV value)"
            },
            title=f"Value Distribution of Pattern {pattern.id} instance {instance.instance_id}"
        )
        time_prepare = perf_counter() - time_start - time_gather
        fig.show()
        time_show = perf_counter() - time_start - time_gather - time_prepare
        time_total = time_gather + time_prepare + time_show
        measure_ms = {
            "gather": 0.001 * time_gather,
            "prepare": 0.001 * time_prepare,
            "show": 0.001 * time_show,
            "total": 0.001 * time_total,
        }

        max_value = max(data.v)
        half_value = max_value / 2
        n_values = len(plot_values)
        half_value_rise_x = None
        half_value_fall_x = None
        half_width = None
        for i in range(n_values - 1):
            x_lower = x_def[i]
            x_upper = x_def[i+1]
            dx = x_upper - x_lower

            v_lower = plot_values[i]
            v_upper = plot_values[i+1]
            if v_upper == v_lower:
                continue

            r = (half_value - v_lower) / (v_upper - v_lower)
            if v_lower <= half_value <= v_upper:
                half_value_rise_x = x_lower + r * dx
            if v_lower >= half_value >= v_upper:
                half_value_fall_x = x_lower + r * dx

        if half_value_rise_x is not None and half_value_fall_x is not None:
            half_width = half_value_fall_x - half_value_rise_x
        analysis = {
            "max": max_value,
            "half_value_rise_x": half_value_rise_x,
            "half_value_fall_x": half_value_fall_x,
            "half_width": half_width
        }
        return {
            "timingMs": measure_ms,
            "analysis": analysis,
        }
