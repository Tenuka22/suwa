import os
import sys
import numpy as np
from sklearn.model_selection import train_test_split

from src.config import TRAINING
from src.data.features import create_sequences_by_subject
from src.data.load import load_all_subjects_hrv as load_all_subjects
from src.evaluate.metrics import evaluate_model
from src.training.trainer import train_model


os.environ.setdefault("PYTHONIOENCODING", "utf-8")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def run() -> None:
    """
    Main entry point for the model trainer.
    Executes Data Loading, Feature Engineering, Sequence Creation, and Training.
    """
    print("--- Starting ZenDoc Model Trainer ---")
    
    print("Loading processed HRV data for all subjects...")
    subjects = list(load_all_subjects())
    print(f"Successfully loaded {len(subjects)} subjects.")

    if len(subjects) == 0:
        print("Error: No subjects found. Check dataset path.")
        return

    feature_names = subjects[0][3]
    n_features = len(feature_names)
    print(f"Features for MAX30102 ({n_features}): {feature_names}")

    # 2. Process each sequence length defined in config
    for seq_len in TRAINING.sequence_lengths:
        print(f"\n{'='*60}")
        print(f"Processing Sequence Length: {seq_len}")
        print(f"{'='*60}")

        print(f"Creating temporal sequences (Window: {seq_len})...")
        X_all, y_all = create_sequences_by_subject(subjects, seq_len)
        print(f"Total sequences created: {len(X_all)}")

        print("Performing stratified data split (Train/Val/Test)...")
        X_train, X_temp, y_train, y_temp = train_test_split(
            X_all, y_all, test_size=0.2, stratify=y_all, random_state=42
        )
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42
        )

        print(f"Training parameters - Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
        print(f"Stress ratios - Train: {y_train.mean():.3f}, Test: {y_test.mean():.3f}")
        
        model, _history = train_model(seq_len, X_train, y_train, X_val, y_val)

        print(f"\nEvaluating model for seq_len={seq_len}...")
        report = evaluate_model(model, X_test, y_test, seq_len)
        print(f"Classification Report:\n{report}")

    print(f"\nAll models and artifacts saved to: {TRAINING.models_dir}")
    print("Architecture: [MAX30102 HRV Features] -> LSTM Sequence -> Future Stress Prediction")


if __name__ == "__main__":
    run()
