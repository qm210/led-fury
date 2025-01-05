import dataclasses
import json


class JsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if dataclasses.is_dataclass(obj):
            return dataclasses.asdict(obj)
        else:
            return super().default(obj)
