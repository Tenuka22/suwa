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


def load_wesad() -> pd.DataFrame:
    path = kagglehub.dataset_download("qiriro/stress")
    wesad = pd.read_csv(
        os.path.join(
            path,
            "./dataset/2. final/datasets/hrv/wesad/combined/classification/"
            "wesad-chest-combined-classification-hrv.csv",
        )
    )
    wesad = wesad.sort_values(["subject id"]).reset_index(drop=True)
    wesad = wesad.rename(columns={"subject id": "subject_id"})
    return wesad


def filter_sensor_included_features(df: pd.DataFrame) -> pd.DataFrame:
    keep = [c for c in df.columns if is_max30102_feature(c)]
    missing = set(keep) - set(df.columns)
    if missing:
        print(f"WARNING: {len(missing)} keep-columns not in dataset (typo?)")
    return df[keep]


def get_X_y_groups(df: pd.DataFrame):
    features = filter_sensor_included_features(df)
    X = features.values.astype(np.float64)
    le = LabelEncoder()
    y = le.fit_transform(df["condition"].values)
    groups = df["subject_id"].values
    feature_names = features.columns.tolist()
    print(f"  Features used: {len(feature_names)}")
    print(f"  Classes: {list(le.classes_)}  distribution: {np.bincount(y)}")
    return X, y, groups, le, feature_names
