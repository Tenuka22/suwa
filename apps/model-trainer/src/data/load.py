import os
from collections.abc import Generator

import numpy as np
import pandas as pd

from src.config import DATA
from src.data.download import dataset_fetching
from src.data.features import filter_hardware_features


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

    labels = np.full(len(times_min), -1, dtype=np.intp)
    for condition, start, end in schedule:
        normalized_condition = condition.strip().lower()
        if normalized_condition == DATA.stress_condition.lower():
            mask = (times_min >= start) & (times_min <= end)
            labels[mask] = 2
        elif normalized_condition == DATA.amusement_condition.lower():
            mask = (times_min >= start) & (times_min <= end)
            labels[mask] = 1
        elif normalized_condition == DATA.baseline_condition.lower():
            mask = (times_min >= start) & (times_min <= end)
            labels[mask] = 0
    return labels


def load_subject_hrv(subj_id: int, ds_path: str):
    """
    Loads processed HRV chest data for a subject and filters for hardware capabilities.
    """
    hrv_path = os.path.join(
        ds_path, "1. processed", "hrv", "wesad", "raw", "chest", f"S{subj_id}.xlsx"
    )
    quest_path = os.path.join(
        ds_path, "0. interim", "wesad", "Labels", f"S{subj_id}_quest.csv"
    )

    df = pd.read_excel(hrv_path)
    
    times_min = df["Time"].values
    
    df_filtered = filter_hardware_features(df)
    features = df_filtered.values.astype(np.float32)
    feature_names = df_filtered.columns.tolist()

    schedule = _parse_quest(quest_path)
    labels = _label_full_timeline(times_min, schedule)
    
    valid = labels >= 0
    features = features[valid]
    labels = labels[valid]

    return features, labels, feature_names


def load_all_subjects_hrv() -> Generator[tuple[int, np.ndarray, np.ndarray, list[str]]]:
    """
    Yields data for all available subjects.
    """
    ds_path = dataset_fetching()
    hrv_dir = os.path.join(ds_path, "1. processed", "hrv", "wesad", "raw", "chest")
    available = sorted(
        int(f.removeprefix("S").removesuffix(".xlsx")) for f in os.listdir(hrv_dir)
    )
    for subj_id in available:
        yield subj_id, *load_subject_hrv(subj_id, ds_path)
