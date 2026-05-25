import argparse
import json
import os
import time
from collections.abc import Iterable
from pathlib import Path
import sys
import tempfile

import numpy as np
import modal

from src.config import TRAINING
from src.data.features import create_sequences
from src.data.load import load_all_subjects
from src.evaluate.metrics import (
    plot_correlations,
    plot_modal_timing,
    plot_performance_summary,
)

_CACHE_VERSION = "v1"
_SEQUENCE_CACHE_DIR = Path(tempfile.gettempdir()) / "zen_doc_model_trainer_cache" / "sequences"
_SEQUENCE_CACHE_DIR.mkdir(parents=True, exist_ok=True)

os.environ.setdefault("PYTHONIOENCODING", "utf-8")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Train WESAD LSTM stress model")
    parser.add_argument(
        "--online",
        action="store_true",
        default=False,
        help="Run model training on Modal cloud infrastructure",
    )
    args = parser.parse_args()

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

    if args.online:
        _train_online_all(
            subjects,
            train_subjects,
            val_subjects,
            test_subjects,
        )
    else:
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


def _train_online_all(
    subjects: list[tuple[int, np.ndarray, np.ndarray, list[str]]],
    train_subjects: list[tuple[int, np.ndarray, np.ndarray, list[str]]],
    val_subjects: list[tuple[int, np.ndarray, np.ndarray, list[str]]],
    test_subjects: list[tuple[int, np.ndarray, np.ndarray, list[str]]],
) -> None:
    from src.remote.modal_app import app, train_remote

    print("Sending all sequence lengths to Modal for parallel training...")

    jobs: dict[int, object] = {}
    run_log: list[dict[str, float | int]] = []
    launch_times: dict[int, float] = {}
    with modal.enable_output():
        with app.run():
            for seq_len in TRAINING.sequence_lengths:
                print(f"Queueing remote training job for seq_len={seq_len}...")
                launch_times[seq_len] = time.perf_counter()
                X_train_seq, y_train_seq = _prepare_data(train_subjects, seq_len)
                X_val_seq, y_val_seq = _prepare_data(val_subjects, seq_len)
                X_test_seq, y_test_seq = _prepare_data(test_subjects, seq_len)
                jobs[seq_len] = train_remote.spawn(
                    X_train_seq,
                    y_train_seq,
                    X_val_seq,
                    y_val_seq,
                    X_test_seq,
                    y_test_seq,
                    seq_len,
                    X_train_seq.shape[2],
                )
                del X_train_seq, y_train_seq, X_val_seq, y_val_seq, X_test_seq, y_test_seq

            for seq_len in TRAINING.sequence_lengths:
                print(f"Waiting for remote artifacts for seq_len={seq_len}...")
                wait_start = time.perf_counter()
                artifacts = jobs[seq_len].get()
                _save_remote_artifacts(seq_len, artifacts)
                metrics = _print_remote_metrics(seq_len)
                finished_at = time.perf_counter()
                run_log.append(
                    {
                        "seq_len": seq_len,
                        "duration_seconds": finished_at - wait_start,
                        "wait_seconds": finished_at - launch_times[seq_len],
                        **(metrics or {}),
                    }
                )

    plot_modal_timing(run_log)
    plot_performance_summary([item for item in run_log if "accuracy" in item])


def _save_remote_artifacts(seq_len: int, artifacts: dict[str, bytes]) -> None:
    model_dir = TRAINING.models_dir / f"seq_{seq_len}"
    model_dir.mkdir(parents=True, exist_ok=True)

    for rel_path, data in sorted(artifacts.items()):
        dst = model_dir / rel_path
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(data)
        print(f"  Downloaded: {rel_path} ({len(data)} bytes)")

    print(f"  Saved artifacts to: {model_dir}")


def _print_remote_metrics(seq_len: int) -> dict[str, float | int] | None:
    report_path = TRAINING.models_dir / f"seq_{seq_len}" / "results.json"
    if report_path.exists():
        with open(report_path) as f:
            metrics = json.load(f)
        print(
            f"  Accuracy: {metrics['accuracy']:.4f}, "
            f"F1: {metrics['f1']:.4f}, "
            f"AUC: {metrics['auc']:.4f}"
        )
        return metrics

    return None


if __name__ == "__main__":
    main()
