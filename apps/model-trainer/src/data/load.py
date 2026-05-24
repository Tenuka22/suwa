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


def _condition_at_time(time_min: float, schedule: list[tuple[str, float, float]]) -> int:
    for cond, start, end in schedule:
        if start <= time_min <= end:
            return 1 if cond == DATA.stress_condition else 0
    return -1


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
    labels = np.array([_condition_at_time(t, schedule) for t in times_min])
    valid = labels >= 0

    v = values[valid]
    l = labels[valid].astype(np.intp)

    features, feature_names = extract_features(v)

    if len(features) > 0:
        features = (features - np.mean(features, axis=0)) / (
            np.std(features, axis=0) + 1e-8
        )

    return features, l, feature_names


def load_all_subjects() -> Generator[tuple[int, np.ndarray, np.ndarray, list[str]]]:
    ds_path = dataset_fetching()
    rri_dir = os.path.join(ds_path, "0. interim", "wesad", "rri")
    available = sorted(
        int(f.removeprefix("S").removesuffix(".txt")) for f in os.listdir(rri_dir)
    )
    for subj_id in available:
        yield subj_id, *load_subject(subj_id, ds_path)
