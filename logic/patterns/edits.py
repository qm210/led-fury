from typing import List, Tuple, TYPE_CHECKING

if TYPE_CHECKING:
    from model.state import SequenceState


class EditMan:
    """
        Is an aux class for the SequenceState for updating the patterns
    """

    def __init__(self, state: "SequenceState", edits: List[dict]):
        self.errors = []
        self.state = state
        self.edits = edits

    def log_error(self, message: str):
        self.errors.append(message)

    def read_or_log_error(self, edit: dict, attribute: str):
        if attribute not in edit:
            self.log_error(f"Edit is missing '{attribute}': {edit}")
            return None
        return edit[attribute]

    def iterate(self):
        for edit in self.edits:
            pattern_id = self.read_or_log_error(edit, "patternId")
            edit_key = self.read_or_log_error(edit, "key")
            value = self.read_or_log_error(edit, "value")
            if pattern_id is None or edit_key is None or value is None:
                return
            yield pattern_id, edit_key, value

    @staticmethod
    def parse(edit_key: str) -> Tuple[str, int, List]:
        dim = 0
        subkeys = []
        if not edit_key:
            return "", dim, subkeys
        parsed = edit_key.split('.')
        if len(parsed) > 2:
            subkeys = parsed[2:]
        if len(parsed) > 1:
            dim = int(parsed[1])
        return parsed[0], dim, subkeys
