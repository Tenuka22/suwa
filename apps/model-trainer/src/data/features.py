import numpy as np
import pandas as pd


def filter_hardware_features(
    features: np.ndarray, feature_names: list[str], target_hardware: str = "MAX30102"
):
    if target_hardware == "MAX30102":
        allowed_keywords = ["RR", "RMSSD", "SDSD", "pNN", "SD1", "SD2", "HR"]
    else:
        allowed_keywords = ["RR", "RMSSD", "SDSD", "pNN", "SD1", "SD2", "HR"]

    indices = []
    filtered_names = []

    for i, name in enumerate(feature_names):
        if any(key in name.upper() for key in allowed_keywords):
            indices.append(i)
            filtered_names.append(name)

    return features[:, indices], filtered_names


def extract_features(values: np.ndarray):
    v = values.flatten().astype(np.float32, copy=False)

    f1 = v
    diffs = np.diff(v, prepend=v[0])
    f3 = np.sqrt(
        pd.Series(diffs**2).rolling(window=10, min_periods=1).mean().values
    )
    f4 = pd.Series(v).rolling(window=10, min_periods=1).std().fillna(0).values
    f5 = 1.0 / (v + 1e-8)

    all_features = np.stack([f1, diffs, f3, f4, f5], axis=1).astype(np.float32, copy=False)
    all_names = ["RRI", "RRI_Diff", "RMSSD_Local", "SDNN_Local", "HR_Proxy"]

    return all_features, all_names


def create_sequences(
    features: np.ndarray, labels: np.ndarray, seq_len: int
):
    X, y = [], []
    for i in range(0, len(features) - 2 * seq_len + 1):
        X.append(features[i : i + seq_len])
        next_mean = float(np.mean(labels[i + seq_len : i + 2 * seq_len]))
        y.append(1 if next_mean > 0.5 else 0)
    return np.asarray(X, dtype=np.float32), np.asarray(y, dtype=np.uint8)
