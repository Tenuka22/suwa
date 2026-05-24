from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class DataConfig:
    stress_condition: str = "TSST"


@dataclass(frozen=True)
class ModelConfig:
    lstm_units: int = 32
    dropout_rate: float = 0.3
    learning_rate: float = 0.001
    l2_reg: float = 1e-3
    lstm_dropout: float = 0.35
    lstm_recurrent_dropout: float = 0.2


@dataclass(frozen=True)
class TrainingConfig:
    sequence_lengths: tuple[int, ...] = (30, 60, 90)
    epochs: int = 10
    batch_size: int = 64
    patience: int = 4
    reduce_lr_patience: int = 2
    reduce_lr_factor: float = 0.5
    min_lr: float = 1e-6
    models_dir: Path = Path(os.environ.get("MODELS_DIR_OVERRIDE", "models/wesad_lstm"))


DATA = DataConfig()
MODEL = ModelConfig()
TRAINING = TrainingConfig()
