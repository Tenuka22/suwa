import argparse
import json
import warnings
from pathlib import Path
warnings.filterwarnings("ignore")

import xgboost as xgb

from ..preprocess import (
    subject_split, scale_data, prepare_sequences,
    aggregate_sequences, evaluate_model,
    compute_class_weights, make_sample_weights,
    RANDOM_STATE,
)
from ..export_artifacts import save_artifacts
from .load_data import load_wesad, get_X_y_groups

DATASET = "wesad"
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent / "artifacts"

parser = argparse.ArgumentParser()
parser.add_argument("--seq-len", type=int, default=30)
parser.add_argument("--step", type=int, default=0)
args = parser.parse_args()

SEQ_LEN = args.seq_len
STEP = args.step if args.step > 0 else max(1, SEQ_LEN // 3)
SUBDIR = f"seq_len_{SEQ_LEN}"
PARAMS_PATH = ARTIFACTS_DIR / DATASET / "xgboost" / SUBDIR / "best_params.json"


def load_params():
    if PARAMS_PATH.exists():
        with open(PARAMS_PATH) as f:
            p = json.load(f)
        print(f"  Loaded best params from {PARAMS_PATH}")
        return {
            "max_depth": p.get("max_depth", 6),
            "learning_rate": p.get("learning_rate", 0.1),
            "subsample": p.get("subsample", 0.8),
            "colsample_bytree": p.get("colsample_bytree", 0.8),
            "min_child_weight": p.get("min_child_weight", 3),
            "gamma": p.get("gamma", 0.1),
            "reg_lambda": p.get("reg_lambda", 2.0),
            "reg_alpha": p.get("reg_alpha", 0.2),
        }, p.get("num_boost_round", 500)
    else:
        print("  WARNING: best_params.json not found, using defaults")
        return {
            "max_depth": 6,
            "learning_rate": 0.1,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "min_child_weight": 3,
            "gamma": 0.1,
            "reg_lambda": 2.0,
            "reg_alpha": 0.2,
        }, 500


def main():
    wesad = load_wesad()
    X, y, groups, le, feature_names = get_X_y_groups(wesad)
    (X_train, X_val, X_test, y_train, y_val, y_test,
     train_subjects, val_subjects, test_subjects) = subject_split(X, y, groups, RANDOM_STATE)

    X_train_s, X_val_s, X_test_s, scaler = scale_data(X_train, X_val, X_test)
    tree_params, num_boost_round = load_params()

    (X_tr, y_tr), (X_va, y_va), (X_te, y_te) = prepare_sequences(
        X_train_s, X_val_s, X_test_s, y_train, y_val, y_test,
        train_subjects, val_subjects, test_subjects, SEQ_LEN, STEP,
    )

    X_tr_a = aggregate_sequences(X_tr)
    X_va_a = aggregate_sequences(X_va)
    X_te_a = aggregate_sequences(X_te)

    nc = len(le.classes_)
    class_weight_dict = compute_class_weights(y_train)
    sample_weight_tr = make_sample_weights(y_tr, class_weight_dict)

    dtrain = xgb.DMatrix(X_tr_a, label=y_tr, weight=sample_weight_tr)
    dval = xgb.DMatrix(X_va_a, label=y_va)

    params = {
        "objective": "multi:softprob",
        "num_class": nc,
        "eval_metric": "mlogloss",
        "seed": RANDOM_STATE,
        **tree_params,
    }

    model = xgb.train(
        params, dtrain,
        num_boost_round=num_boost_round,
        evals=[(dtrain, "train"), (dval, "val")],
        early_stopping_rounds=50, verbose_eval=0,
    )

    save_artifacts(
        dataset=DATASET,
        model=model,
        base_feature_names=feature_names,
        classes=list(le.classes_),
        scaler=scaler,
        seq_len=SEQ_LEN,
        step=STEP,
        subdir=SUBDIR,
    )
    evaluate_model("XGBoost", model, X_te_a, y_te, le)


if __name__ == "__main__":
    main()
