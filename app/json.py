import dataclasses
import json
from enum import Enum


def is_dict_values(obj):
    # no idea where the import dict_values from
    return type(obj).__name__ == 'dict_values'


class JsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.value
        if dataclasses.is_dataclass(obj):
            return dataclasses.asdict(obj)
        try:
            return super().default(obj)
        except TypeError:
            if is_dict_values(obj):
                return self.default(list(obj))
            return str(obj)
