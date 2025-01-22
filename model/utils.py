from typing import Any


def list_enum_options(enum_class):
    return [
        {
            "name": enum.name,
            "value": enum.value,
        }
        for enum in enum_class
    ]


def factory2d(func_or_value: Any):
    if callable(func_or_value):
        return lambda: [func_or_value() for _ in range(2)]
    else:
        return lambda: [func_or_value for _ in range(2)]


def error_factory(error):
    def raiser():
        raise ValueError(error)
    return raiser
