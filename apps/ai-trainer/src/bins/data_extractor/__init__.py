from __future__ import annotations

from pathlib import Path

from .core import (
    MESA_DATASET_SLUG,
    WESAD_DATASET_SLUG,
    extract_mesa,
    extract_wesad,
)


def main() -> int:
    base_dir = Path(__file__).resolve().parents[3]
    processed_root = base_dir / "processed-datasets"

    import kagglehub

    print("Downloading WESAD dataset...")
    wesad_source_path = Path(kagglehub.dataset_download(WESAD_DATASET_SLUG))

    print("Downloading MESA dataset...")
    mesa_source_path = Path(kagglehub.dataset_download(MESA_DATASET_SLUG))

    print("Extracting WESAD dataset...")
    extract_wesad(wesad_source_path, processed_root)

    print("Extracting MESA dataset...")
    extract_mesa(mesa_source_path, processed_root)
    return 0
