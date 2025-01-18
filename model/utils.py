
def list_enum_options(enum_class):
    return [
        {
            "name": enum.name,
            "value": enum.value,
        }
        for enum in enum_class
    ]
