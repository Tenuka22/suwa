from __future__ import annotations

import logging
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from sklearn.utils.class_weight import compute_class_weight
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
        raise ValueError(
            f"X_train timesteps ({X_train.shape[1]}) != seq_len ({seq_len})"
        )
    if X_train.shape[0] != y_train.shape[0]:
        raise ValueError(
            f"X_train / y_train sample count mismatch: {X_train.shape[0]} vs {y_train.shape[0]}"
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
    except Exception:
        logger.exception("Failed to save training curves.")
    finally:
        plt.close("all")


def _save_model(model: Model, model_dir: Path) -> None:
    out = model_dir / "model.keras"
    model.save(str(out))


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
        "Training seq_len=%d | samples=%d | features=%d",
        seq_len,
        len(X_train),
        n_features,
    )

    # 1. Build Model
    model = build_rri_lstm(seq_len, n_features)
    
    # 2. Adapt Normalization Layer (Keras layer handles standardization)
    standardization_layer = model.get_layer("standardization")
    print("Adapting Keras Normalization layer to training data...")
    standardization_layer.adapt(X_train)
    
    # 3. Compile
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=MODEL.learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=[
            "accuracy",
            tf.keras.metrics.SparseCategoricalAccuracy(name="sparse_accuracy"),
        ],
    )

    # 4. Prepare Datasets
    train_ds = tf.data.Dataset.from_tensor_slices((X_train, y_train))
    train_ds = train_ds.shuffle(len(X_train)).batch(TRAINING.batch_size).prefetch(tf.data.AUTOTUNE)
    
    val_ds = tf.data.Dataset.from_tensor_slices((X_val, y_val))
    val_ds = val_ds.batch(TRAINING.batch_size).prefetch(tf.data.AUTOTUNE)

    # 5. Fit
    classes = np.unique(y_train)
    class_weights = compute_class_weight(
        "balanced", classes=classes, y=y_train
    )
    class_weight_dict = dict(enumerate(class_weights))
    
    # Increase weight for the Stress class (index 2)
    if 2 in class_weight_dict:
        class_weight_dict[2] *= TRAINING.positive_class_weight
        
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=TRAINING.epochs,
        callbacks=_build_callbacks(),
        class_weight=class_weight_dict,
        verbose=1,
    )

    # 6. Save Artifacts
    _save_training_curves(history, model_dir)
    if TRAINING.export_onnx:
        from src.training.export import export_to_onnx
        export_to_onnx(model, seq_len, n_features, model_dir)
    _save_model(model, model_dir)

    return model, history
