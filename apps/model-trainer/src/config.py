from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DataConfig:
    baseline_condition: str = "Base"
    amusement_condition: str = "Fun"
    stress_condition: str = "TSST"


@dataclass(frozen=True)
class ModelConfig:
    lstm_units: int = 64
    dropout_rate: float = 0.3
    learning_rate: float = 1e-3
    l2_reg: float = 5e-4
    lstm_dropout: float = 0.2
    lstm_recurrent_dropout: float = 0.0


@dataclass(frozen=True)
class TrainingConfig:
    sequence_lengths: tuple[int, ...] = tuple(
        int(item)
        for item in os.environ.get("SEQUENCE_LENGTHS_OVERRIDE", "120,240,360").split(",")
        if item.strip()
    )
    epochs: int = int(os.environ.get("EPOCHS_OVERRIDE", "30"))
    batch_size: int = 32
    export_onnx: bool = True

    patience: int = 15
    reduce_lr_patience: int = 5
    reduce_lr_factor: float = 0.5
    min_lr: float = 1e-6
    positive_class_weight: float = 4.0
    decision_threshold_beta: float = 2.0

    models_dir: Path = Path(os.environ.get("MODELS_DIR_OVERRIDE", "models"))

    def model_dir(self, seq_len: int) -> Path:
        d = self.models_dir / f"seq_{seq_len}"
        d.mkdir(parents=True, exist_ok=True)
        return d


DATA = DataConfig()
MODEL = ModelConfig()
TRAINING = TrainingConfig()
