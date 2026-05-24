import numpy as np
import tensorflow as tf
from sklearn.utils.class_weight import compute_class_weight
from tensorflow.keras import Model

from src.config import TRAINING
from src.models.lstm import build_rri_lstm
from src.training.export import export_to_onnx
import matplotlib.pyplot as plt


def train_model(
    seq_len: int,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
) -> Model:
    n_features = X_train.shape[2]
    model = build_rri_lstm(seq_len, n_features)

    classes = np.unique(y_train)
    weights = compute_class_weight(
        class_weight="balanced", classes=classes, y=y_train
    )
    class_weight = dict(zip(classes, weights))

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=TRAINING.patience,
            restore_best_weights=True,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=TRAINING.reduce_lr_factor,
            patience=TRAINING.reduce_lr_patience,
            min_lr=TRAINING.min_lr,
        ),
    ]

    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=TRAINING.epochs,
        batch_size=TRAINING.batch_size,
        class_weight=class_weight,
        callbacks=callbacks,
        verbose=1,
    )

    model_dir = TRAINING.models_dir / f"seq_{seq_len}"
    model_dir.mkdir(parents=True, exist_ok=True)

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
    plt.savefig(model_dir / "training_curves.png")
    plt.close()

    export_to_onnx(model, seq_len, n_features, model_dir)

    model.save(str(model_dir / "model.keras"))

    return model
