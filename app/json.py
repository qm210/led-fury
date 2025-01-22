import json
from dataclasses import is_dataclass
from enum import Enum


def is_dict_values(obj):
    # no idea where I would import dict_values from
    return type(obj).__name__ == 'dict_values'


def recursive_asdict(obj):
    if isinstance(obj, Enum):
        return obj.value
    if isinstance(obj, dict):
        return {
            k: recursive_asdict(v)
            for k, v in obj.items()
        }
    if hasattr(obj, '__iter__') and not isinstance(obj, str):
        return [recursive_asdict(o) for o in obj]
    if is_dataclass(obj):
        return {
            k: recursive_asdict(v)
            for k, v in vars(obj).items()
            if not k.startswith('__')
        }
    return obj


class JsonEncoder(json.JSONEncoder):
    def default(self, obj):
        try:
            return super().default(obj)
        except TypeError:
            obj_dict = recursive_asdict(obj)
            if obj_dict != obj:
                return obj_dict
            return str(obj)
