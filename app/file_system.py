from pathlib import Path
from tempfile import mkdtemp


def ensure_path(path: str, temp_prefix=None) -> Path:
    if not path:
        tempdir = mkdtemp(prefix=temp_prefix)
        return Path(tempdir)
    result = Path(path).resolve()
    result.mkdir(parents=True, exist_ok=True)
    return result
