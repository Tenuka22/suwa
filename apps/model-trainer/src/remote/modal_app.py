from pathlib import Path

import modal
import numpy as np

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "tensorflow>=2.21.0",
        "tf2onnx>=1.17.0",
        "scikit-learn>=1.8.0",
        "matplotlib",
        "pandas",
        "seaborn",
    )
    .add_local_python_source("src")
)

app = modal.App("train-wesad-lstm", image=image)


@app.function(cpu=1.0, memory=5120, timeout=3600, gpu="T4")
def train_remote(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    seq_len: int,
    n_features: int,
) -> dict[str, bytes]:
    import os

    os.environ["MODELS_DIR_OVERRIDE"] = "/tmp/models"

    from src.training.trainer import train_model
    from src.evaluate.metrics import evaluate_model

    print(
        f"[remote] starting training seq_len={seq_len}, n_features={n_features}",
        flush=True,
    )
    model, _history = train_model(seq_len, X_train, y_train, X_val, y_val)
    print(f"[remote] training finished seq_len={seq_len}", flush=True)
    report = evaluate_model(model, X_test, y_test, seq_len)
    print(f"\n[remote] Classification Report (seq_len={seq_len}):\n{report}", flush=True)

    model_dir = Path("/tmp/models") / f"seq_{seq_len}"
    artifacts = {}
    for f in model_dir.rglob("*"):
        if f.is_file():
            rel = str(f.relative_to(model_dir))
            artifacts[rel] = f.read_bytes()
            print(f"[remote] packaged artifact: {rel}", flush=True)
    print(f"[remote] returning {len(artifacts)} artifacts for seq_len={seq_len}", flush=True)
    return artifacts
