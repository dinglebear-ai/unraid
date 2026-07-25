"""Application version helpers."""

from importlib.metadata import PackageNotFoundError, version


__all__ = ["VERSION"]

try:
    VERSION = version("unraid-mcp")
except PackageNotFoundError:
    VERSION = "0.0.0"
