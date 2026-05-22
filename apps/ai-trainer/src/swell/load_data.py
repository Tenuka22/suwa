import os

import kagglehub
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

MAX30102_BASES = sorted(
    [
        "MEAN_RR",
        "MEDIAN_RR",
        "SDRR",
        "RMSSD",
        "SDSD",
        "SDRR_RMSSD",
        "HR",
        "pNN25",
        "pNN50",
        "SD1",
        "SD2",
        "KURT",
        "SKEW",
        "MEAN_REL_RR",
        "MEDIAN_REL_RR",
        "SDRR_REL_RR",
        "RMSSD_REL_RR",
        "SDSD_REL_RR",
        "SDRR_RMSSD_REL_RR",
        "KURT_REL_RR",
        "SKEW_REL_RR",
    ],
    key=len,
    reverse=True,
)

CROSS_DOMAIN_REMOVE = {
    "MEAN_RR_MEAN_MEAN_REL_RR",
    "SD2_LF",
    "HR_LF",
    "HR_HF",
    "HF_VLF",
}

NON_FEATURE_COLS = {
    "condition",
    "subject_id",
    "Condition Label",
    "NasaTLX class",
    "NasaTLX Label",
    "datasetId",
}


def is_max30102_feature(col: str) -> bool:
    for base in MAX30102_BASES:
        if col == base or col.startswith(base + "_"):
            return col not in CROSS_DOMAIN_REMOVE
    return False


def load_swell() -> pd.DataFrame:
    path = kagglehub.dataset_download("qiriro/stress")
    swell = pd.read_csv(
        os.path.join(
            path,
            "./dataset/2. final/datasets/hrv/swell/combined/classification/"
            "combined-swell-classification-hrv-dataset.csv",
        )
    )
    swell = swell.sort_values(["subject_id"]).reset_index(drop=True)
    return swell


def filter_sensor_included_features(swell: pd.DataFrame) -> pd.DataFrame:
    keep = [c for c in swell.columns if is_max30102_feature(c)]
    missing = set(keep) - set(swell.columns)
    if missing:
        print(f"WARNING: {len(missing)} keep-columns not in dataset (typo?)")
    return swell[keep]


def get_X_y_groups(swell: pd.DataFrame):
    features = filter_sensor_included_features(swell)
    X = features.values.astype(np.float64)
    le = LabelEncoder()
    y = le.fit_transform(swell["condition"].values)
    groups = swell["subject_id"].values
    feature_names = features.columns.tolist()
    print(f"  Features used: {len(feature_names)}")
    print(f"  Classes: {list(le.classes_)}  distribution: {np.bincount(y)}")
    return X, y, groups, le, feature_names
