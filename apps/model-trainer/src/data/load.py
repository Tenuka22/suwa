import os
from collections.abc import Generator

import numpy as np
import pandas as pd

from src.config import DATA
from src.data.download import dataset_fetching
from src.data.features import extract_features


def _parse_quest(filepath: str):
    df = pd.read_csv(filepath, header=None)
    order_str = str(df.iloc[1, 0]).removeprefix("# ORDER;")
    start_str = str(df.iloc[2, 0]).removeprefix("# START;")
    end_str = str(df.iloc[3, 0]).removeprefix("# END;")
    conditions = order_str.split(";")
    starts = [float(v) for v in start_str.split(";") if v]
    ends = [float(v) for v in end_str.split(";") if v]
    return list(zip(conditions[: len(starts)], starts, ends))


def _label_full_timeline(
    times_min: np.ndarray, schedule: list[tuple[str, float, float]]
) -> np.ndarray:
    if not schedule:
        return np.zeros(times_min.shape, dtype=np.intp)

    labels = np.zeros(len(times_min), dtype=np.intp)
    for condition, start, end in schedule:
        if condition == DATA.stress_condition:
            mask = (times_min >= start) & (times_min <= end)
            labels[mask] = 1
    return labels


def _label_times(
    times_min: np.ndarray, schedule: list[tuple[str, float, float]]
) -> np.ndarray:
    if not schedule:
        return np.full(times_min.shape, -1, dtype=np.intp)

    schedule = sorted(schedule, key=lambda x: x[1])
    starts = np.asarray([start for _, start, _ in schedule], dtype=np.float64)
    ends = np.asarray([end for _, _, end in schedule], dtype=np.float64)
    stress_flags = np.asarray(
        [cond == DATA.stress_condition for cond, _, _ in schedule], dtype=np.intp
    )

    interval_idx = np.searchsorted(starts, times_min, side="right") - 1
    valid = (interval_idx >= 0) & (times_min <= ends[np.clip(interval_idx, 0, None)])

    labels = np.full(times_min.shape, -1, dtype=np.intp)
    labels[valid] = stress_flags[interval_idx[valid]]
    return labels


def load_subject(subj_id: int, ds_path: str):
    rri_path = os.path.join(ds_path, "0. interim", "wesad", "rri", f"S{subj_id}.txt")
    quest_path = os.path.join(
        ds_path, "0. interim", "wesad", "Labels", f"S{subj_id}_quest.csv"
    )

    rri = np.loadtxt(rri_path)
    schedule = _parse_quest(quest_path)
    times_s = rri[:, 0]
    times_min = times_s / 60.0
    values = rri[:, 1]
    labels = _label_times(times_min, schedule)
    valid = labels >= 0

    v = values[valid]
    l = labels[valid].astype(np.intp)

    features, feature_names = extract_features(v)

    if len(features) > 0:
        features = (features - np.mean(features, axis=0)) / (
            np.std(features, axis=0) + 1e-8
        )

    return features, l, feature_names


def load_subject_hrv(subj_id: int, ds_path: str):
    hrv_path = os.path.join(
        ds_path, "1. processed", "hrv", "wesad", "raw", "chest", f"S{subj_id}.xlsx"
    )
    quest_path = os.path.join(
        ds_path, "0. interim", "wesad", "Labels", f"S{subj_id}_quest.csv"
    )

    df = pd.read_excel(hrv_path)
    times_min = df["Time"].values
    features = df.drop(columns=["Time"]).values.astype(np.float32)
    feature_names = [c for c in df.columns if c != "Time"]

    schedule = _parse_quest(quest_path)
    labels = _label_full_timeline(times_min, schedule)
    if len(features) > 0:
        features = (features - np.mean(features, axis=0)) / (
            np.std(features, axis=0) + 1e-8
        )

    return features, labels, feature_names


def load_all_subjects_hrv() -> Generator[tuple[int, np.ndarray, np.ndarray, list[str]]]:
    ds_path = dataset_fetching()
    hrv_dir = os.path.join(ds_path, "1. processed", "hrv", "wesad", "raw", "chest")
    available = sorted(
        int(f.removeprefix("S").removesuffix(".xlsx")) for f in os.listdir(hrv_dir)
    )
    for subj_id in available:
        yield subj_id, *load_subject_hrv(subj_id, ds_path)


def load_all_subjects() -> Generator[tuple[int, np.ndarray, np.ndarray, list[str]]]:
    ds_path = dataset_fetching()
    rri_dir = os.path.join(ds_path, "0. interim", "wesad", "rri")
    available = sorted(
        int(f.removeprefix("S").removesuffix(".txt")) for f in os.listdir(rri_dir)
    )
    for subj_id in available:
        yield subj_id, *load_subject(subj_id, ds_path)
