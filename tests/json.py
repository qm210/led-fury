import json

from app.json import JsonEncoder
from model.setup import ControllerSetup, PixelSegment


if __name__ == '__main__':
    test_setup = ControllerSetup(
        host="test",
        port=0,
        segments=[PixelSegment(5)]
    )
    result = json.dumps(test_setup, cls=JsonEncoder)
    print(result)
