import json

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
)

from src.config import TRAINING


def evaluate_model(model, X_test: np.ndarray, y_test: np.ndarray, seq_len: int):
    y_prob = model.predict(X_test, verbose=0).flatten()

    threshold = 0.5
    y_pred = (y_prob > threshold).astype(int)

    auc = roc_auc_score(y_test, y_prob)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    metrics = {
        "seq_len": seq_len,
        "threshold": threshold,
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
    print(f"Decision Threshold: {threshold}")
    print(f"Accuracy: {acc:.4f}, F1: {f1:.4f}")

    model_dir = TRAINING.models_dir / f"seq_{seq_len}"
    with open(model_dir / "results.json", "w") as f:
        json.dump(metrics, f, indent=4)

    report = classification_report(
        y_test, y_pred, target_names=["not-stress", "stress"]
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
