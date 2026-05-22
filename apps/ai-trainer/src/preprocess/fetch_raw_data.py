from pathlib import Path

import kagglehub

from preprocess import log

INTERIM = Path(__file__).resolve().parent.parent.parent.parent.parent / "dataset" / "0. interim"
DATA_ROOT = "dataset/2. final/datasets/hrv"

WESAD_CSV = (
    f"{DATA_ROOT}/wesad/combined/classification/"
    "wesad-chest-combined-classification-hrv.csv"
)
SWELL_CSV = (
    f"{DATA_ROOT}/swell/combined/classification/"
    "combined-swell-classification-hrv-dataset.csv"
)


def _fetch(kaggle_csv: str, out: Path, label: str):
    if out.exists():
        log.info(f"{label} already cached at {out}")
        return
    path = kagglehub.dataset_download("qiriro/stress")
    csv_src = Path(path) / kaggle_csv
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(csv_src) as src, open(out, "w") as dst:
        dst.write(src.read())
    log.ok(f"{label} {out}")


def fetch_wesad():
    _fetch(WESAD_CSV, INTERIM / "wesad" / "wesad-hrv.csv", "WESAD")


def fetch_swell():
    _fetch(SWELL_CSV, INTERIM / "swell" / "swell-hrv.csv", "SWELL")


def main():
    fetch_wesad()
    fetch_swell()


if __name__ == "__main__":
    main()
