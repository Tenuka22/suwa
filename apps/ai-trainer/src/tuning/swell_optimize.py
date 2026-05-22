import json
import warnings
from pathlib import Path
warnings.filterwarnings("ignore")

import numpy as np
import xgboost as xgb
import optuna
from sklearn.metrics import accuracy_score

from ..preprocess import (
    subject_split, scale_data, prepare_sequences,
    aggregate_sequences, compute_class_weights, make_sample_weights,
    RANDOM_STATE,
)
from ..swell.load_data import load_swell, get_X_y_groups

DATASET = "swell"
SEQ_LENS = [30, 60, 90]
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent / "artifacts"

print("=" * 60)
print(f"{DATASET.upper()} - XGBoost Optimization for all SEQ_LENS")
print("=" * 60)

swell = load_swell()
X, y, groups, le, feature_names = get_X_y_groups(swell)
(X_train, X_val, X_test, y_train, y_val, y_test,
 train_subjects, val_subjects, test_subjects) = subject_split(X, y, groups, RANDOM_STATE)

X_train_s, X_val_s, X_test_s, scaler = scale_data(X_train, X_val, X_test)

nc = len(le.classes_)
class_weight_dict = compute_class_weights(y_train)

print(f"\nTrain samples: {len(y_train)}  Val: {len(y_val)}  Test: {len(y_test)}")
print(f"Classes: {nc}  Weights: {class_weight_dict}")

for SEQ_LEN in SEQ_LENS:
    STEP = max(1, SEQ_LEN // 3)
    SUBDIR = f"seq_len_{SEQ_LEN}"

    print(f"\n{'=' * 60}")
    print(f"Optimizing SEQ_LEN={SEQ_LEN}, STEP={STEP}")
    print(f"{'=' * 60}")

    (X_tr, y_tr), (X_va, y_va), (X_te, y_te) = prepare_sequences(
        X_train_s, X_val_s, X_test_s, y_train, y_val, y_test,
        train_subjects, val_subjects, test_subjects, SEQ_LEN, STEP,
    )

    X_tr_a = aggregate_sequences(X_tr)
    X_va_a = aggregate_sequences(X_va)

    def objective(trial):
        params = {
            "objective": "multi:softprob",
            "num_class": nc,
            "eval_metric": "mlogloss",
            "seed": RANDOM_STATE,
            "max_depth": trial.suggest_int("max_depth", 3, 15),
            "learning_rate": trial.suggest_float("learning_rate", 0.005, 0.3, log=True),
            "subsample": trial.suggest_float("subsample", 0.4, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.4, 1.0),
            "min_child_weight": trial.suggest_int("min_child_weight", 1, 20),
            "gamma": trial.suggest_float("gamma", 0, 10.0),
            "reg_lambda": trial.suggest_float("reg_lambda", 0, 10.0),
            "reg_alpha": trial.suggest_float("reg_alpha", 0, 10.0),
        }
        num_boost_round = trial.suggest_int("num_boost_round", 100, 3000)
        sample_weight_tr = make_sample_weights(y_tr, class_weight_dict)
        dtrain = xgb.DMatrix(X_tr_a, label=y_tr, weight=sample_weight_tr)
        dval = xgb.DMatrix(X_va_a, label=y_va)
        model = xgb.train(
            params, dtrain,
            num_boost_round=num_boost_round,
            evals=[(dtrain, "train"), (dval, "val")],
            early_stopping_rounds=50, verbose_eval=0,
        )
        preds = model.predict(dval).argmax(axis=1)
        return accuracy_score(y_va, preds)

    sampler = optuna.samplers.TPESampler(seed=RANDOM_STATE)
    study = optuna.create_study(direction="maximize", sampler=sampler, study_name=f"xgb_{DATASET}_sl{SEQ_LEN}")
    study.optimize(objective, n_trials=10, show_progress_bar=True)

    print(f"\n  Best val acc for SEQ_LEN={SEQ_LEN}: {study.best_value:.4f}")
    best = study.best_trial.params

    best_params_dir = ARTIFACTS_DIR / DATASET / "xgboost" / SUBDIR
    best_params_dir.mkdir(parents=True, exist_ok=True)
    with open(best_params_dir / "best_params.json", "w") as f:
        json.dump(best, f, indent=2)

    print(f"  Params saved to {best_params_dir / 'best_params.json'}")
    for key, value in best.items():
        print(f"    {key}: {value}")

print(f"\n{'=' * 60}")
print("All SEQ_LENS complete. Summary:")
for SEQ_LEN in SEQ_LENS:
    print(f"  SEQ_LEN={SEQ_LEN}: artifacts/{DATASET}/xgboost/seq_len_{SEQ_LEN}/best_params.json")
print(f"{'=' * 60}")
