from __future__ import annotations

import sys

_USE_COLOR = hasattr(sys.stdout, "isatty") and sys.stdout.isatty()

if _USE_COLOR:
    _INFO = "\033[36m  \u25b8\033[0m "
    _OK = "\033[32m  \u2713\033[0m "
    _WARN = "\033[33m  \u26a0\033[0m "
    _ERR = "\033[31m  \u2717\033[0m "
    _DIM = "\033[2m"
    _CYAN = "\033[36m"
    _RESET = "\033[0m"
else:
    _INFO = "  > "
    _OK = "  * "
    _WARN = "  ! "
    _ERR = "  x "
    _DIM = ""
    _CYAN = ""
    _RESET = ""


def info(msg: str) -> None:
    sys.stdout.write(f"{_INFO}{msg}\n")


def ok(msg: str) -> None:
    sys.stdout.write(f"{_OK}{msg}\n")


def warn(msg: str) -> None:
    sys.stdout.write(f"{_WARN}{msg}\n")


def err(msg: str) -> None:
    sys.stdout.write(f"{_ERR}{msg}\n")


def detail(msg: str) -> None:
    sys.stdout.write(f"{_DIM}  \u00b7 {msg}{_RESET}\n")


def raw(text: str) -> None:
    sys.stdout.write(f"{text}\n")


def header(title: str) -> None:
    line = "=" * 60
    sys.stdout.write(f"{_CYAN}{line}\n{title}\n{line}{_RESET}\n")
