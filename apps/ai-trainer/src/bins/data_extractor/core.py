from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path
import pickle
import sys

import kagglehub
import numpy as np
import pandas as pd

WESAD_DATASET_SLUG = "orvile/wesad-wearable-stress-affect-detection-dataset"
MESA_DATASET_SLUG = "jennyyao77/mesa-100-all"

LABEL_NAMES = {
    0: "rest",
    1: "baseline",
    2: "stress",
    3: "amusement",
    4: "meditation",
    6: "reading_short",
    7: "reading_final",
}

WINDOW_SIZE = 700
WINDOW_STEP = 350



def load_wesad_payload(path: Path) -> dict[str, object] | None:
    try:
        with path.open("rb") as handle:
            payload = pickle.load(handle, encoding="latin1")
    except Exception:
        return None
    return payload if isinstance(payload, dict) else None


def wesad_metadata(subject_dir: Path, subject_id: str) -> dict[str, object]:
    data: dict[str, object] = {
        "subject_id": subject_id,
        "age_years": np.nan,
        "height_cm": np.nan,
        "weight_kg": np.nan,
        "bmi": np.nan,
        "gender_code": np.nan,
        "gender_label": "unknown",
    }
    readme = subject_dir / f"{subject_id}_readme.txt"
    if not readme.exists():
        return data

    for line in readme.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if line.startswith("Age:"):
            data["age_years"] = float(line.split(":", 1)[1])
        elif line.startswith("Height (cm):"):
            data["height_cm"] = float(line.split(":", 1)[1])
        elif line.startswith("Weight (kg):"):
            data["weight_kg"] = float(line.split(":", 1)[1])
        elif line.startswith("Gender:"):
            gender = line.split(":", 1)[1].strip().lower()
            data["gender_code"] = 1.0 if gender == "male" else 0.0 if gender == "female" else np.nan
            data["gender_label"] = gender

    if np.isfinite(data["height_cm"]) and np.isfinite(data["weight_kg"]):
        height_m = float(data["height_cm"]) / 100.0
        data["bmi"] = float(data["weight_kg"]) / (height_m * height_m)
    return data


def _repeat_last_1d(values: np.ndarray, count: int) -> np.ndarray:
    if count <= 0:
        return np.empty(0, dtype=float)
    if values.size == 0:
        return np.full(count, np.nan, dtype=float)
    indices = np.minimum(np.arange(count), values.size - 1)
    return values[indices]


def _repeat_last_acc(values: np.ndarray, count: int) -> np.ndarray:
    if count <= 0:
        return np.empty((0, 3), dtype=float)
    if values.ndim != 2 or values.shape[0] == 0:
        return np.full((count, 3), np.nan, dtype=float)
    indices = np.minimum(np.arange(count), values.shape[0] - 1)
    repeated = values[indices]
    if repeated.shape[1] >= 3:
        return repeated[:, :3]
    padded = np.full((count, 3), np.nan, dtype=float)
    padded[:, : repeated.shape[1]] = repeated
    return padded


def _safe_label_name(label_id: int) -> str:
    return LABEL_NAMES.get(label_id, f"label_{label_id}")


def _window_indices(length: int, window_size: int, step: int) -> Iterator[tuple[int, int]]:
    if length < window_size:
        return
    for start in range(0, length - window_size + 1, step):
        yield start, start + window_size


def _window_mode(values: np.ndarray) -> int:
    valid = values[np.isfinite(values)].astype(np.int32, copy=False)
    if valid.size == 0:
        return -1
    counts = np.bincount(valid[valid >= 0])
    if counts.size == 0:
        return -1
    return int(counts.argmax())


def _summarize_windows(frame: "pd.DataFrame", signal_columns: list[str], label_column: str) -> dict[str, object]:
    summary: dict[str, object] = {}
    for column in signal_columns:
        series = frame[column]
        summary[f"{column}_mean"] = float(series.mean())
        summary[f"{column}_std"] = float(series.std())
        summary[f"{column}_min"] = float(series.min())
        summary[f"{column}_max"] = float(series.max())

    labels = frame[label_column].dropna().astype(int)
    label_id = int(labels.mode().iloc[0]) if not labels.empty else -1
    summary["label_id"] = label_id
    summary["label_name"] = _safe_label_name(label_id)
    summary["row_count"] = int(len(frame))
    summary["window_count"] = 1
    return summary


def wesad_file_windows(pkl_path: Path) -> tuple[dict[str, object], dict[str, object]] | None:
    payload = load_wesad_payload(pkl_path)
    if payload is None:
        return None

    signal = payload.get("signal", {})
    if not isinstance(signal, dict):
        return None

    labels = np.asarray(payload.get("label", []), dtype=float).reshape(-1)
    count = int(labels.size)
    if count == 0:
        return None

    subject_id = str(payload.get("subject") or pkl_path.parent.name or pkl_path.stem)
    meta = wesad_metadata(pkl_path.parent, subject_id)
    wrist = signal.get("wrist", {}) if isinstance(signal.get("wrist", {}), dict) else {}
    chest = signal.get("chest", {}) if isinstance(signal.get("chest", {}), dict) else {}

    ecg = np.asarray(chest.get("ECG", []), dtype=float).reshape(-1)
    resp = np.asarray(chest.get("Resp", []), dtype=float).reshape(-1)
    eda = np.asarray(wrist.get("EDA", []), dtype=float).reshape(-1)
    temp = np.asarray(wrist.get("TEMP", wrist.get("Temp", [])), dtype=float).reshape(-1)
    acc = np.asarray(wrist.get("ACC", []), dtype=float)

    label_ids = np.full(count, -1, dtype=np.int32)
    valid_mask = np.isfinite(labels)
    if valid_mask.any():
        label_ids[valid_mask] = labels[valid_mask].astype(np.int32)

    acc_values = _repeat_last_acc(acc, count)

    sample_frame = pd.DataFrame(
        {
            "subject_id": [subject_id] * count,
            "sample_index": np.arange(count, dtype=np.int32),
            "timestamp_sec": np.arange(count, dtype=np.float64) / WINDOW_SIZE,
            "ecg": _repeat_last_1d(ecg, count),
            "resp": _repeat_last_1d(resp, count),
            "eda": _repeat_last_1d(eda, count),
            "temp": _repeat_last_1d(temp, count),
            "acc_x": acc_values[:, 0],
            "acc_y": acc_values[:, 1],
            "acc_z": acc_values[:, 2],
            "label_id": label_ids,
        }
    )
    for key, value in meta.items():
        sample_frame[key] = value

    window_rows: list[dict[str, object]] = []
    for start, end in _window_indices(len(sample_frame), WINDOW_SIZE, WINDOW_STEP):
        window = sample_frame.iloc[start:end]
        window_rows.append(
            {
                "subject_id": subject_id,
                "window_start": int(start),
                "window_end": int(end),
                "timestamp_start_sec": float(window["timestamp_sec"].iloc[0]),
                "timestamp_end_sec": float(window["timestamp_sec"].iloc[-1]),
                "ecg_mean": float(window["ecg"].mean()),
                "ecg_std": float(window["ecg"].std()),
                "resp_mean": float(window["resp"].mean()),
                "resp_std": float(window["resp"].std()),
                "eda_mean": float(window["eda"].mean()),
                "eda_std": float(window["eda"].std()),
                "temp_mean": float(window["temp"].mean()),
                "temp_std": float(window["temp"].std()),
                "acc_x_mean": float(window["acc_x"].mean()),
                "acc_y_mean": float(window["acc_y"].mean()),
                "acc_z_mean": float(window["acc_z"].mean()),
                "label_id": _window_mode(window["label_id"].to_numpy()),
            }
        )

    if not window_rows:
        return None

    window_frame = pd.DataFrame(window_rows)
    window_frame["label_name"] = window_frame["label_id"].map(_safe_label_name)
    window_frame["stress_binary"] = (window_frame["label_id"] == 2).astype(np.int8)
    for key, value in meta.items():
        window_frame[key] = value

    summary = _summarize_windows(window_frame, ["ecg_mean", "resp_mean", "eda_mean", "temp_mean"], "label_id")
    summary["subject_id"] = subject_id
    summary.update(meta)
    return window_frame.to_dict(orient="list"), summary


def load_mesa_frames(raw_root: Path) -> Iterator[object]:
    import pandas as pd

    parquet_paths = sorted(raw_root.rglob("*.parquet"))
    total = len(parquet_paths)
    for index, parquet_path in enumerate(parquet_paths, start=1):
        if index == 1 or index % 5 == 0 or index == total:
            sys.stderr.write(f"\rReading MESA files: {index}/{total}")
            sys.stderr.flush()
        try:
            frame = pd.read_parquet(parquet_path)
        except Exception:
            continue
        if frame.empty:
            continue
        frame = frame.copy()
        frame.insert(0, "subject_id", f"mesa_{parquet_path.stem.replace('mesa-sleep-', '')}")
        frame.insert(1, "sample_index", range(len(frame)))
        yield frame
    if total:
        sys.stderr.write("\rReading MESA files: done\n")
        sys.stderr.flush()


def extract_wesad(wesad_raw_root: Path, processed_root: Path) -> dict[str, Path]:
    processed_root.mkdir(parents=True, exist_ok=True)
    outputs: dict[str, Path] = {}
    wesad_windows_file = processed_root / "wesad_windows_dataset.parquet"
    wesad_subjects_file = processed_root / "wesad_subject_summary.parquet"

    import pyarrow as pa
    import pyarrow.parquet as pq

    windows_writer: pq.ParquetWriter | None = None
    subjects: list[dict[str, object]] = []
    pkl_paths = sorted(wesad_raw_root.rglob("*.pkl"))
    total = len(pkl_paths)

    for index, pkl_path in enumerate(pkl_paths, start=1):
        if total:
            percent = int(index * 100 / total)
            sys.stderr.write(f"\rExtracting WESAD: {percent}% ({index}/{total})")
            sys.stderr.flush()
        windows_columns = wesad_file_windows(pkl_path)
        if windows_columns is None:
            continue
        columns, subject_summary = windows_columns
        subjects.append(subject_summary)
        table = pa.Table.from_pydict(columns)
        if windows_writer is None:
            windows_writer = pq.ParquetWriter(wesad_windows_file, table.schema)
        windows_writer.write_table(table)

    if windows_writer is not None:
        windows_writer.close()
        outputs["wesad_windows"] = wesad_windows_file
        sys.stderr.write("\rExtracting WESAD: 100% done\n")
        sys.stderr.flush()
        print(f"Saved WESAD windows dataset to {wesad_windows_file}")

    if subjects:
        subject_frame = pd.DataFrame(subjects)
        subject_frame.to_parquet(wesad_subjects_file, index=False)
        outputs["wesad_subjects"] = wesad_subjects_file
        print(f"Saved WESAD subject summary to {wesad_subjects_file}")

    return outputs


def extract_mesa(mesa_raw_root: Path, processed_root: Path) -> dict[str, Path]:
    processed_root.mkdir(parents=True, exist_ok=True)
    outputs: dict[str, Path] = {}
    mesa_windows_file = processed_root / "mesa_windows_dataset.parquet"
    mesa_subjects_file = processed_root / "mesa_subject_summary.parquet"

    import pyarrow as pa
    import pyarrow.parquet as pq

    windows_writer: pq.ParquetWriter | None = None
    subjects: list[dict[str, object]] = []
    parquet_paths = sorted(mesa_raw_root.rglob("*.parquet"))
    total = len(parquet_paths)

    for index, frame in enumerate(load_mesa_frames(mesa_raw_root), start=1):
        percent = int(index * 100 / total) if total else 100
        sys.stderr.write(f"\rExtracting MESA: {percent}% ({index}/{total})")
        sys.stderr.flush()
        subject_id = str(frame["subject_id"].iloc[0])
        signal_columns = [column for column in ["ECG", "PPG", "ABD", "THX"] if column in frame.columns]
        label_column = "Stage" if "Stage" in frame.columns else None
        if not signal_columns or label_column is None:
            continue

        window_rows: list[dict[str, object]] = []
        for start, end in _window_indices(len(frame), WINDOW_SIZE, WINDOW_STEP):
            window = frame.iloc[start:end]
            row: dict[str, object] = {
                "subject_id": subject_id,
                "window_start": int(start),
                "window_end": int(end),
                "timestamp_start": int(start),
                "timestamp_end": int(end),
                "label_id": _window_mode(window[label_column].to_numpy()),
            }
            for column in signal_columns:
                row[f"{column.lower()}_mean"] = float(window[column].mean())
                row[f"{column.lower()}_std"] = float(window[column].std())
            window_rows.append(row)

        if not window_rows:
            continue

        window_frame = pd.DataFrame(window_rows)
        window_frame["label_name"] = window_frame["label_id"].map(lambda value: f"stage_{value}" if value >= 0 else "unknown")
        table = pa.Table.from_pandas(window_frame, preserve_index=False)
        if windows_writer is None:
            windows_writer = pq.ParquetWriter(mesa_windows_file, table.schema)
        windows_writer.write_table(table)
        subjects.append(_summarize_windows(window_frame, [f"{column.lower()}_mean" for column in signal_columns], "label_id") | {"subject_id": subject_id})

    if windows_writer is not None:
        windows_writer.close()
        outputs["mesa_windows"] = mesa_windows_file
        sys.stderr.write("\rExtracting MESA: 100% done\n")
        sys.stderr.flush()
        print(f"Saved MESA windows dataset to {mesa_windows_file}")

    if subjects:
        subject_frame = pd.DataFrame(subjects)
        subject_frame.to_parquet(mesa_subjects_file, index=False)
        outputs["mesa_subjects"] = mesa_subjects_file
        print(f"Saved MESA subject summary to {mesa_subjects_file}")

    return outputs


def main() -> int:
    base_dir = Path(__file__).resolve().parents[3]
    processed_root = base_dir / "processed-datasets"

    print("Downloading WESAD dataset...")
    wesad_source_path = Path(kagglehub.dataset_download(WESAD_DATASET_SLUG))

    print("Downloading MESA dataset...")
    mesa_source_path = Path(kagglehub.dataset_download(MESA_DATASET_SLUG))

    print("Extracting WESAD dataset...")
    extract_wesad(wesad_source_path, processed_root)

    print("Extracting MESA dataset...")
    extract_mesa(mesa_source_path, processed_root)
    return 0
