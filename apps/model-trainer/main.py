import os
import sys
import tempfile
from collections.abc import Iterable
from pathlib import Path

import numpy as np

from src.config import TRAINING
from src.data.features import create_sequences
from src.data.load import load_all_subjects
from src.evaluate.metrics import plot_correlations

_CACHE_VERSION = "v1"
_SEQUENCE_CACHE_DIR = Path(tempfile.gettempdir()) / "zen_doc_model_trainer_cache" / "sequences"
_SEQUENCE_CACHE_DIR.mkdir(parents=True, exist_ok=True)

os.environ.setdefault("PYTHONIOENCODING", "utf-8")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def run(data: dict | None = None) -> None:
    print("Data received:", data)
    print("Loading raw RRI sensor data for all subjects...")
    subjects = list(load_all_subjects())

    print(f"Loaded {len(subjects)} subjects")

    if len(subjects) > 0:
        feature_names = subjects[0][3]
        print(f"Hardware-compatible features (MAX30102): {feature_names}")
        plot_correlations(subjects[0][1], feature_names)

    train_subjects = [s for s in subjects if s[0] <= 13]
    val_subjects = [s for s in subjects if s[0] in (14, 15)]
    test_subjects = [s for s in subjects if s[0] >= 16]

    for seq_len in TRAINING.sequence_lengths:
        _train_local_sequence(
            seq_len,
            subjects,
            train_subjects,
            val_subjects,
            test_subjects,
        )

    print(f"\nAll models saved to: {TRAINING.models_dir}")
    print(
        "\nArchitecture: [RRI sensor readings] -> sequence -> LSTM -> stress prediction"
    )


def _prepare_data(
    subj_list: Iterable[tuple[int, np.ndarray, np.ndarray, list[str]]],
    seq_len: int,
) -> tuple[np.ndarray, np.ndarray]:
    subj_items = list(subj_list)
    subj_ids = "-".join(str(subj_id) for subj_id, _, _, _ in subj_items)
    cache_path = _SEQUENCE_CACHE_DIR / f"{_CACHE_VERSION}_seq{seq_len}_{subj_ids}.npz"
    if cache_path.exists():
        cached = np.load(cache_path, allow_pickle=False)
        return cached["X"], cached["y"]

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
    np.savez_compressed(cache_path, X=X, y=y)
    return X, y


def _train_local_sequence(
    seq_len: int,
    subjects: list[tuple[int, np.ndarray, np.ndarray, list[str]]],
    train_subjects: list[tuple[int, np.ndarray, np.ndarray, list[str]]],
    val_subjects: list[tuple[int, np.ndarray, np.ndarray, list[str]]],
    test_subjects: list[tuple[int, np.ndarray, np.ndarray, list[str]]],
) -> None:
    print(f"\n{'=' * 60}")
    print(f"Sensor sequence -> LSTM (seq_len={seq_len})")
    print(
        f"Input: ({seq_len}, {len(subjects[0][3])}) RRI features -> LSTM -> stress probability"
    )
    print(f"{'=' * 60}")

    X_train_seq, y_train_seq = _prepare_data(train_subjects, seq_len)
    X_val_seq, y_val_seq = _prepare_data(val_subjects, seq_len)
    X_test_seq, y_test_seq = _prepare_data(test_subjects, seq_len)

    print(
        f"Train sequences: {X_train_seq.shape}, Val: {X_val_seq.shape}, Test: {X_test_seq.shape}"
    )
    print(
        f"Stress ratio - Train: {y_train_seq.mean():.3f}, Val: {y_val_seq.mean():.3f}, Test: {y_test_seq.mean():.3f}"
    )

    _train_local(
        seq_len,
        X_train_seq,
        y_train_seq,
        X_val_seq,
        y_val_seq,
        X_test_seq,
        y_test_seq,
    )


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
