from __future__ import annotations

import logging
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from tensorflow.keras import Model

from src.config import MODEL, TRAINING

logger = logging.getLogger(__name__)


def _validate_inputs(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    seq_len: int,
) -> None:
    if X_train.ndim != 3:
        raise ValueError(
            f"X_train must be 3-D (samples, timesteps, features), got {X_train.shape}"
        )
    if X_train.shape[1] != seq_len:
        raise ValueError(f"X_train timesteps ({X_train.shape[1]}) != seq_len ({seq_len})")
    if X_train.shape[0] != y_train.shape[0]:
        raise ValueError(
            f"X_train / y_train sample count mismatch: {X_train.shape[0]} vs {y_train.shape[0]}"
        )
    if X_val.shape[2] != X_train.shape[2]:
        raise ValueError(
            f"Feature count mismatch: train={X_train.shape[2]}, val={X_val.shape[2]}"
        )


def _compute_positive_rate(y: np.ndarray) -> float:
    if len(y) == 0:
        raise ValueError("Cannot compute a positive rate for an empty label vector.")
    return float(np.mean(y))


def _build_loss(y_train: np.ndarray) -> tf.keras.losses.Loss:
    positive_rate = float(np.clip(_compute_positive_rate(y_train), 0.05, 0.5))
    alpha = float(np.clip((1.0 - positive_rate) * TRAINING.positive_class_weight, 0.5, 0.9))
    logger.info("Using focal loss with alpha=%.3f, gamma=2.0", alpha)
    return tf.keras.losses.BinaryFocalCrossentropy(
        gamma=2.0,
        alpha=alpha,
        from_logits=False,
        apply_class_balancing=False,
    )


def _build_callbacks() -> list[tf.keras.callbacks.Callback]:
    return [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=TRAINING.patience,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=TRAINING.reduce_lr_factor,
            patience=TRAINING.reduce_lr_patience,
            min_lr=TRAINING.min_lr,
            verbose=1,
        ),
    ]


def _find_best_threshold(
    y_true: np.ndarray,
    y_prob: np.ndarray,
) -> tuple[float, dict[str, float]]:
    from sklearn.metrics import fbeta_score, precision_score, recall_score

    best_threshold = 0.5
    best_score = -1.0
    best_metrics: dict[str, float] = {}

    for threshold in np.linspace(0.1, 0.9, 81):
        y_pred = (y_prob >= threshold).astype(np.uint8)
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


def _save_training_curves(
    history: tf.keras.callbacks.History,
    model_dir: Path,
) -> None:
    try:
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

        ax1.plot(history.history["loss"], label="train")
        ax1.plot(history.history["val_loss"], label="val")
        ax1.set_title("Loss")
        ax1.set_xlabel("Epoch")
        ax1.legend()

        ax2.plot(history.history["accuracy"], label="train")
        ax2.plot(history.history["val_accuracy"], label="val")
        ax2.set_title("Accuracy")
        ax2.set_xlabel("Epoch")
        ax2.legend()

        plt.tight_layout()
        out = model_dir / "training_curves.png"
        plt.savefig(out, dpi=150)
        logger.info("Saved training curves -> %s", out)
    except Exception:
        logger.exception("Failed to save training curves - continuing.")
    finally:
        plt.close("all")


def _save_model(model: Model, model_dir: Path) -> None:
    out = model_dir / "model.keras"
    model.save(str(out))
    logger.info("Saved Keras model -> %s", out)


def train_model(
    seq_len: int,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
) -> tuple[Model, tf.keras.callbacks.History]:
    from src.models.lstm import build_rri_lstm

    _validate_inputs(X_train, y_train, X_val, y_val, seq_len)

    n_features = X_train.shape[2]
    model_dir = TRAINING.model_dir(seq_len)

    logger.info(
        "Training seq_len=%d | samples=%d | features=%d | dir=%s",
        seq_len,
        len(X_train),
        n_features,
        model_dir,
    )

    model = build_rri_lstm(seq_len, n_features)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=MODEL.learning_rate),
        loss=_build_loss(y_train),
        metrics=[
            "accuracy",
            tf.keras.metrics.AUC(name="auc"),
            tf.keras.metrics.AUC(curve="PR", name="pr_auc"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.Precision(name="precision"),
        ],
    )

    idx = np.random.permutation(len(X_train))
    X_train, y_train = X_train[idx], y_train[idx]

    train_ds = tf.data.Dataset.from_tensor_slices((X_train, y_train))
    train_ds = train_ds.batch(TRAINING.batch_size).prefetch(tf.data.AUTOTUNE)
    val_ds = tf.data.Dataset.from_tensor_slices((X_val, y_val))
    val_ds = val_ds.batch(TRAINING.batch_size).prefetch(tf.data.AUTOTUNE)

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=TRAINING.epochs,
        callbacks=_build_callbacks(),
        verbose=1,
    )

    _save_training_curves(history, model_dir)
    if TRAINING.export_onnx:
        from src.training.export import export_to_onnx

        export_to_onnx(model, seq_len, n_features, model_dir)
    _save_model(model, model_dir)

    stopped_at = len(history.history["loss"])
    logger.info("Finished seq_len=%d after %d epochs.", seq_len, stopped_at)

    return model, history
