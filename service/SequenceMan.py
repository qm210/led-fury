from contextlib import contextmanager
from pathlib import Path
from tempfile import mkdtemp
from typing import Optional, List, Tuple, Union

from tornado import gen
from tornado.httputil import HTTPFile

from app.file_system import ensure_path
from handlers.websocket import WebSocketHandler
from logic.patterns.templates.GifPattern import GifPattern
from logic.patterns.pattern import Pattern, PatternType
from model.state import SequenceState
from model.setup import PixelSegment, ControllerSetup
from service.UdpSender import UdpSender
from service.RunState import RunState

# CONTROLLER_HOST = "192.168.178.60"  # is wled1.local (would that name work? we'll see later)
CONTROLLER_HOST = "192.168.178.46"  # is wled.local, the Vorhang
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

    gif_store_path: Path

    def __init__(self, verbose=False, gif_store_path: str = ""):
        self.setup = ControllerSetup(
            host=CONTROLLER_HOST,
            port=CONTROLLER_PORT,
            segments=[
                PixelSegment(66)
            ]
        )
        self.state = SequenceState.make(
            self.setup,
            verbose=verbose,
        )
        self.run = RunState()
        self.gif_store_path = ensure_path(gif_store_path, "led_fury_gif_store")

    def make_sender(self):
        return UdpSender.make(self.setup)

    def broadcast_colors(self, **extra_args):
        no_previous_sender = self.sender is None
        if no_previous_sender:
            self.sender = self.make_sender()
        self.sender.send_drgb(
            self.state.rgb_value_list,
            close=no_previous_sender
        )
        websocket_message = {
            "rgbValues": self.state.rgb_value_list,
            **extra_args
        }
        WebSocketHandler.send_message(websocket_message)
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

    def apply_desired_randomization(self):
        for pattern, instance in self.state.patterns_with_instances(self.run):
            if pattern.type is PatternType.Point:
                print(f"Pattern {pattern.id}: shuffle pattern colors because it is fun.")
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
        self.broadcast_colors(
            **self.run.collect_broadcast_info(self.state)
        )
        self.run.update_times()

    def start_sequence(self):
        self.apply_desired_randomization()
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
            self.broadcast_colors(
                second=second
            )
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
    def import_gif_pattern(self, filepath: Path):
        template = yield GifPattern.import_from(filepath, self.state.geometry)
        pattern = Pattern(
            template=template,
            type=PatternType.Gif,
            name=filepath.name,
            max_instances=1,
        )
        for index, p in enumerate(self.state.patterns):
            if p.type is PatternType.Gif and p.template.filename == filepath.name:
                self.state.patterns[index] = pattern
                break
        else:
            self.state.patterns.append(pattern)
        return pattern

    @gen.coroutine
    def handle_file_import(self, file: HTTPFile):
        destination = self.gif_store_path / file.filename
        with open(destination, "wb") as fh:
            fh.write(file.body)
        return destination

    @gen.coroutine
    def handle_gif_import(self, files, render_second = None):
        patterns = []
        for file in files:
            if isinstance(file, HTTPFile):
                local_filepath = yield self.handle_file_import(file)
            elif isinstance(file, str):
                local_filepath = Path(file)
            else:
                raise ValueError(f"GIF Import failed due to not knowing what format that is: {file}")
            try:
                pattern = yield self.import_gif_pattern(local_filepath)
                patterns.append(pattern)
            except Exception as exc:
                raise FileNotFoundError(f"GIF Import failed: {local_filepath}, error: {str(exc)}") from exc

        rgb_arrays = None
        if render_second is not None and not self.running:
            rgb_arrays = {}
            # if ever important - find out how to do that in parallel.
            for pattern in patterns:
                rgb_arrays[pattern.id] = \
                    yield self.render_single_pattern(
                        second=render_second,
                        pattern=pattern
                    )

        return {'patterns': patterns, 'rgbArrays': rgb_arrays}
