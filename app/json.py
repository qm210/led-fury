import dataclasses
import json
from enum import Enum


class JsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.value
        if dataclasses.is_dataclass(obj):
            return dataclasses.asdict(obj)
        else:
            return super().default(obj)

#
# class JsonDecoder(json.JSONDecoder):
#     def __init__(self, *args, **kwargs):
#         super().__init__(object_hook=self.object_hook, *args, **kwargs)
#
#     @staticmethod
#     def object_hook(obj):
#         if isinstance(obj, str):
#             # might be enum?
#             pass
#         return obj
