import subprocess
import sys
from pathlib import Path

DATASETS = ["swell", "wesad"]
SEQ_LENS = [30, 60, 90]


def run_module(module: str, *args: str) -> None:
    cmd = [sys.executable, "-m", module, *args]
    print(f"\n{'#' * 70}")
    print(f"# Running: {' '.join(cmd)}")
    print(f"{'#' * 70}\n")
    result = subprocess.run(cmd, cwd=Path(__file__).resolve().parent.parent)
    if result.returncode != 0:
        msg = f"ERROR: {' '.join(cmd)} failed (exit code {result.returncode})"
        print(msg)
        sys.exit(result.returncode)


def main() -> None:
    for dataset in DATASETS:
        run_module(f"src.tuning.{dataset}_optimize")
        for seq_len in SEQ_LENS:
            run_module(f"src.{dataset}.train_xgboost", "--seq-len", str(seq_len))


if __name__ == "__main__":
    main()
