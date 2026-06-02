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
    f1_score,
    precision_score,
    recall_score,
)
from src.config import TRAINING


def _summarize_predictions(y_true: np.ndarray, y_prob: np.ndarray) -> dict[str, float]:
    y_pred = np.argmax(y_prob, axis=1)
    score = f1_score(y_true, y_pred, average="macro", zero_division=0)
    best_metrics = {
        "precision": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
        "fbeta": float(score),
    }
    return best_metrics


def evaluate_model(model, X_test: np.ndarray, y_test: np.ndarray, seq_len: int):
    eval_result = model.evaluate(X_test, y_test, verbose=0, return_dict=True)
    y_prob = model.predict(X_test, verbose=0)
    
    # Custom prediction logic: balance Stress (Class 2) detection
    y_pred = np.zeros(len(y_prob), dtype=np.intp)
    stress_threshold = 0.5
    for i, prob in enumerate(y_prob):
        if prob[2] >= stress_threshold:
            y_pred[i] = 2 # Stress
        else:
            y_pred[i] = np.argmax(prob[:2]) # Max of Baseline or Amusement
    
    threshold_metrics = _summarize_predictions(y_test, y_prob)

    acc = float(eval_result.get("accuracy", accuracy_score(y_test, y_pred)))
    test_loss = float(eval_result.get("loss", 0.0))
    f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    precision = precision_score(y_test, y_pred, average="macro", zero_division=0)
    recall = recall_score(y_test, y_pred, average="macro", zero_division=0)

    cm = confusion_matrix(y_test, y_pred, labels=[0, 1, 2])
    class_names = ["baseline", "amusement", "stress"]
    actual_counts = np.bincount(y_test.astype(np.intp), minlength=3)
    predicted_counts = np.bincount(y_pred.astype(np.intp), minlength=3)

    metrics = {
        "seq_len": seq_len,
        "threshold_precision": float(threshold_metrics["precision"]),
        "threshold_recall": float(threshold_metrics["recall"]),
        "threshold_fbeta": float(threshold_metrics["fbeta"]),
        "accuracy": float(acc),
        "test_loss": float(test_loss),
        "f1": float(f1),
        "precision": float(precision),
        "recall": float(recall),
        "mean_baseline_probability": float(np.mean(y_prob[:, 0])),
        "mean_amusement_probability": float(np.mean(y_prob[:, 1])),
        "mean_stress_probability": float(np.mean(y_prob[:, 2])),
    }

    print(f"\nTest loss: {test_loss:.4f}")
    print(f"Test accuracy: {acc:.4f}")
    print(f"Macro F1: {f1:.4f}")
    print(
        "Mean class probabilities - "
        f"baseline: {metrics['mean_baseline_probability']:.4f}, "
        f"amusement: {metrics['mean_amusement_probability']:.4f}, "
        f"stress: {metrics['mean_stress_probability']:.4f}"
    )
    print(
        "Class counts - "
        f"actual baseline={actual_counts[0]}, amusement={actual_counts[1]}, stress={actual_counts[2]} | "
        f"pred baseline={predicted_counts[0]}, amusement={predicted_counts[1]}, stress={predicted_counts[2]}"
    )
    print(f"Sample probabilities: {np.array2string(y_prob[:10], precision=4)}")

    model_dir = TRAINING.models_dir / f"seq_{seq_len}"
    with open(model_dir / "results.json", "w") as f:
        json.dump(metrics, f, indent=4)

    report = classification_report(
        y_test,
        y_pred,
        labels=[0, 1, 2],
        target_names=class_names,
        zero_division=0,
    )

    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
    )
    plt.title(f"Confusion Matrix (seq_len={seq_len})")
    plt.ylabel("Actual")
    plt.xlabel("Predicted")

    plot_path = model_dir / "confusion_matrix.png"
    plt.savefig(plot_path)
    plt.close()

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar(["test_accuracy", "test_loss"], [acc, test_loss], color=["#2b8a3e", "#c92a2a"])
    ax.set_ylim(0.0, max(1.0, test_loss * 1.15, acc * 1.15))
    ax.set_title(f"Test Metrics (seq_len={seq_len})")
    ax.grid(axis="y", alpha=0.2)
    plt.tight_layout()
    plt.savefig(model_dir / "test_metrics_summary.png")
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
    ax.bar(
        x - 1.0 * width,
        [float(item["mean_baseline_probability"]) for item in results],
        width,
        label="Baseline",
    )
    ax.bar(
        x,
        [float(item["mean_amusement_probability"]) for item in results],
        width,
        label="Amusement",
    )
    ax.bar(
        x + 1.0 * width,
        [float(item["mean_stress_probability"]) for item in results],
        width,
        label="Stress",
    )

    ax.set_xticks(x)
    ax.set_xticklabels([f"seq_{seq}" for seq in seq_lens])
    ax.set_ylabel("Mean Probability")
    ax.set_title("Mean Class Probabilities by Sequence Length")
    ax.legend()
    ax.grid(axis="y", alpha=0.2)
    plt.tight_layout()
    plt.savefig(model_dir / "class_probability_summary.png")
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
