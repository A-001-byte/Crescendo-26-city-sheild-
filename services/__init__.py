"""Compatibility package for tooling that imports `services` from workspace root."""

import sys
from pathlib import Path

_pkg_dir = Path(__file__).resolve().parent
_server_dir = _pkg_dir.parent / "server"
_server_services_dir = _server_dir / "services"

if _server_dir.exists():
    server_dir_str = str(_server_dir)
    if server_dir_str not in sys.path:
        sys.path.insert(0, server_dir_str)

if _server_services_dir.exists():
    __path__.append(str(_server_services_dir))
