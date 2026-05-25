import json

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    fbeta_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from src.config import TRAINING


def _find_best_threshold(y_true: np.ndarray, y_prob: np.ndarray) -> tuple[float, dict[str, float]]:
    best_threshold = 0.5
    best_score = -1.0
    best_metrics = {"precision": 0.0, "recall": 0.0, "fbeta": 0.0}

    for threshold in np.linspace(0.1, 0.9, 81):
        y_pred = (y_prob >= threshold).astype(int)
        score = fbeta_score(
            y_true,
            y_pred,
            beta=TRAINING.decision_threshold_beta,
            zero_division=0,
        )
        if score > best_score:
            best_score = float(score)
            best_threshold = float(threshold)
            best_metrics = {
                "precision": float(precision_score(y_true, y_pred, zero_division=0)),
                "recall": float(recall_score(y_true, y_pred, zero_division=0)),
                "fbeta": float(score),
            }

    return best_threshold, best_metrics


def evaluate_model(model, X_test: np.ndarray, y_test: np.ndarray, seq_len: int):
    y_prob = model.predict(X_test, verbose=0).flatten()
    threshold, threshold_metrics = _find_best_threshold(y_test, y_prob)
    y_pred = (y_prob >= threshold).astype(int)

    auc = roc_auc_score(y_test, y_prob)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    metrics = {
        "seq_len": seq_len,
        "threshold": float(threshold),
        "threshold_precision": float(threshold_metrics["precision"]),
        "threshold_recall": float(threshold_metrics["recall"]),
        "threshold_fbeta": float(threshold_metrics["fbeta"]),
        "mean_stress_probability": float(np.mean(y_prob)),
        "max_stress_probability": float(np.max(y_prob)),
        "min_stress_probability": float(np.min(y_prob)),
        "auc": float(auc),
        "accuracy": float(acc),
        "f1": float(f1),
        "precision": float(precision),
        "recall": float(recall),
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn),
    }

    print(f"\nROC-AUC Score: {auc:.4f}")
    print(f"Decision Threshold: {threshold:.2f}")
    print(f"Threshold F{TRAINING.decision_threshold_beta:.1f}: {threshold_metrics['fbeta']:.4f}")
    print(f"Accuracy: {acc:.4f}, F1: {f1:.4f}")
    print(
        "Stress probability summary - "
        f"mean: {metrics['mean_stress_probability']:.4f}, "
        f"min: {metrics['min_stress_probability']:.4f}, "
        f"max: {metrics['max_stress_probability']:.4f}"
    )
    print(f"Sample stress probabilities: {np.array2string(y_prob[:10], precision=4)}")

    model_dir = TRAINING.models_dir / f"seq_{seq_len}"
    with open(model_dir / "results.json", "w") as f:
        json.dump(metrics, f, indent=4)

    report = classification_report(
        y_test,
        y_pred,
        target_names=["not-stress", "stress"],
        zero_division=0,
    )

    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["not-stress", "stress"],
        yticklabels=["not-stress", "stress"],
    )
    plt.title(f"Confusion Matrix (seq_len={seq_len})")
    plt.ylabel("Actual")
    plt.xlabel("Predicted")

    plot_path = model_dir / "confusion_matrix.png"
    plt.savefig(plot_path)
    plt.close()

    return report


def plot_correlations(features: np.ndarray, feature_names: list[str]):
    TRAINING.models_dir.mkdir(parents=True, exist_ok=True)
    df = pd.DataFrame(features, columns=feature_names)
    plt.figure(figsize=(10, 8))
    sns.heatmap(df.corr(), annot=True, cmap="coolwarm", fmt=".2f")
    plt.title("Feature Correlation Map")
    plt.savefig(TRAINING.models_dir / "feature_correlation.png")
    plt.close()


def plot_performance_summary(results: list[dict[str, float | int]]) -> None:
    if not results:
        return

    model_dir = TRAINING.models_dir
    model_dir.mkdir(parents=True, exist_ok=True)

    seq_lens = [int(item["seq_len"]) for item in results]
    x = np.arange(len(seq_lens))
    width = 0.18

    fig, ax = plt.subplots(figsize=(12, 6))
    ax.bar(x - 1.5 * width, [float(item["accuracy"]) for item in results], width, label="Accuracy")
    ax.bar(x - 0.5 * width, [float(item["precision"]) for item in results], width, label="Precision")
    ax.bar(x + 0.5 * width, [float(item["recall"]) for item in results], width, label="Recall")
    ax.bar(x + 1.5 * width, [float(item["f1"]) for item in results], width, label="F1")

    ax.set_xticks(x)
    ax.set_xticklabels([f"seq_{seq}" for seq in seq_lens])
    ax.set_ylim(0.0, 1.05)
    ax.set_ylabel("Score")
    ax.set_title("Model Performance by Sequence Length")
    ax.legend()
    ax.grid(axis="y", alpha=0.2)
    plt.tight_layout()
    plt.savefig(model_dir / "performance_summary.png")
    plt.close()

    fig, ax = plt.subplots(figsize=(12, 6))
    ax.bar(x - 1.5 * width, [int(item["tn"]) for item in results], width, label="TN")
    ax.bar(x - 0.5 * width, [int(item["fp"]) for item in results], width, label="FP")
    ax.bar(x + 0.5 * width, [int(item["fn"]) for item in results], width, label="FN")
    ax.bar(x + 1.5 * width, [int(item["tp"]) for item in results], width, label="TP")

    ax.set_xticks(x)
    ax.set_xticklabels([f"seq_{seq}" for seq in seq_lens])
    ax.set_ylabel("Window Count")
    ax.set_title("Confusion Matrix Counts by Sequence Length")
    ax.legend()
    ax.grid(axis="y", alpha=0.2)
    plt.tight_layout()
    plt.savefig(model_dir / "confusion_counts_summary.png")
    plt.close()


def plot_modal_timing(run_log: list[dict[str, float | int]]) -> None:
    if not run_log:
        return

    model_dir = TRAINING.models_dir
    model_dir.mkdir(parents=True, exist_ok=True)

    seq_lens = [int(item["seq_len"]) for item in run_log]
    durations = [float(item["duration_seconds"]) for item in run_log]
    wait_times = [float(item["wait_seconds"]) for item in run_log]

    fig, ax = plt.subplots(figsize=(12, 6))
    ax.bar([f"seq_{seq}" for seq in seq_lens], durations, label="Training duration")
    ax.plot([f"seq_{seq}" for seq in seq_lens], wait_times, marker="o", label="Queue-to-finish wait")
    ax.set_ylabel("Seconds")
    ax.set_title("Modal Run Timing by Sequence Length")
    ax.legend()
    ax.grid(axis="y", alpha=0.2)
    plt.tight_layout()
    plt.savefig(model_dir / "modal_timing_summary.png")
    plt.close()
