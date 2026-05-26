import os
import sys
from collections.abc import Iterable


import numpy as np

from src.config import TRAINING
from src.data.features import create_sequences, filter_hardware_features
from src.data.load import load_all_subjects_hrv as load_all_subjects
from src.evaluate.metrics import plot_correlations


os.environ.setdefault("PYTHONIOENCODING", "utf-8")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def run(data: dict | None = None) -> None:
    print("Data received:", data)
    print("Loading raw chest HRV data for all subjects...")
    subjects = list(load_all_subjects())

    print(f"Loaded {len(subjects)} subjects")

    filtered_subjects = []
    for subj_id, features, labels, feature_names in subjects:
        features_f, names_f = filter_hardware_features(features, feature_names)
        filtered_subjects.append((subj_id, features_f, labels, names_f))
    subjects = filtered_subjects

    if len(subjects) > 0:
        feature_names = subjects[0][3]
        n_features = len(feature_names)
        print(f"MAX30102 features ({n_features}): {feature_names}")
        plot_correlations(subjects[0][1], feature_names)
    else:
        n_features = 0

    train_subjects = [s for s in subjects if s[0] <= 13]
    val_subjects = [s for s in subjects if s[0] in (14, 15)]
    test_subjects = [s for s in subjects if s[0] >= 16]

    for seq_len in TRAINING.sequence_lengths:
        X_train, y_train = _prepare_data(train_subjects, seq_len)
        X_val, y_val = _prepare_data(val_subjects, seq_len)
        X_test, y_test = _prepare_data(test_subjects, seq_len)
        _train_local_wrapper(seq_len, n_features, X_train, y_train, X_val, y_val, X_test, y_test)

    print(f"\nAll models saved to: {TRAINING.models_dir}")
    print(
        "\nArchitecture: [RRI sensor readings] -> sequence -> LSTM -> stress prediction"
    )


def _prepare_data(
    subj_list: Iterable[tuple[int, np.ndarray, np.ndarray, list[str]]],
    seq_len: int,
) -> tuple[np.ndarray, np.ndarray]:
    subj_items = list(subj_list)
    all_X, all_y = [], []
    for _, v, l, _ in subj_items:
        X_sub, y_sub = create_sequences(v, l, seq_len)
        if len(X_sub) > 0:
            all_X.append(X_sub)
            all_y.append(y_sub)

    if not all_X or not all_y:
        raise ValueError(f"No training sequences could be created for seq_len={seq_len}")

    X = np.concatenate(all_X).astype(np.float32, copy=False)
    y = np.concatenate(all_y).astype(np.uint8, copy=False)
    return X, y


def _train_local_wrapper(
    seq_len: int,
    n_features: int,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> None:
    print(f"\n{'=' * 60}")
    print(f"Sensor sequence -> LSTM (seq_len={seq_len})")
    print(f"Input: ({seq_len}, {n_features}) HRV features -> LSTM -> stress probability")
    print(f"{'=' * 60}")
    print(f"Train sequences: {X_train.shape}, Val: {X_val.shape}, Test: {X_test.shape}")
    print(f"Stress ratio - Train: {y_train.mean():.3f}, Val: {y_val.mean():.3f}, Test: {y_test.mean():.3f}")

    _train_local(seq_len, X_train, y_train, X_val, y_val, X_test, y_test)


def _train_local(
    seq_len: int,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
):
    from src.evaluate.metrics import evaluate_model
    from src.training.trainer import train_model

    model, _history = train_model(seq_len, X_train, y_train, X_val, y_val)
    report = evaluate_model(model, X_test, y_test, seq_len)
    print(f"\nClassification Report (seq_len={seq_len}):\n{report}")


if __name__ == "__main__":
    run()
