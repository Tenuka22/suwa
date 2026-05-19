from pathlib import Path

from .core import visualize_dataset


def _candidate_datasets(processed_dir: Path) -> list[Path]:
    candidates = sorted(processed_dir.glob("*.parquet"))
    if candidates:
        return candidates
    return sorted(processed_dir.glob("*.csv"))


def main() -> int:
    base_dir = Path(__file__).resolve().parents[3]
    processed_dir = base_dir / "processed-datasets"

    candidate_files = _candidate_datasets(processed_dir)

    if not candidate_files:
        print(f"No processed datasets found under {processed_dir}.")
        return 0

    for data_file in sorted(set(candidate_files)):
        print(f"Visualizing {data_file.relative_to(base_dir)}")
        visualize_dataset(data_file, data_file.parent / "plots")
    return 0
