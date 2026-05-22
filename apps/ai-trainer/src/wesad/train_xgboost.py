import argparse
import warnings
from pathlib import Path
warnings.filterwarnings("ignore")

import xgboost as xgb

from preprocess import log
from preprocess import (
    subject_split, scale_data, prepare_sequences,
    aggregate_sequences, evaluate_model,
    compute_class_weights, make_sample_weights,
    RANDOM_STATE, save_artifacts,
)
from wesad.load_data import load_wesad, get_X_y_groups

DATASET = "wesad"
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent / "artifacts"

HYPERPARAMS = {
    "max_depth": 6,
    "learning_rate": 0.1,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "min_child_weight": 5,
    "gamma": 0.5,
    "reg_lambda": 2.0,
    "reg_alpha": 0.5,
}
NUM_BOOST_ROUND = 2000

parser = argparse.ArgumentParser()
parser.add_argument("--seq-len", type=int, nargs="*", default=None)
parser.add_argument("--step", type=int, default=0)
args = parser.parse_args()

SEQ_LENS = args.seq_len if args.seq_len is not None else [30, 60, 90]


def main():
    wesad = load_wesad()
    X, y, groups, le, feature_names = get_X_y_groups(wesad)
    (X_train, X_val, X_test, y_train, y_val, y_test,
     train_subjects, val_subjects, test_subjects) = subject_split(X, y, groups, RANDOM_STATE)

    X_train_s, X_val_s, X_test_s, scaler = scale_data(X_train, X_val, X_test)

    for seq_len in SEQ_LENS:
        step = args.step if args.step > 0 else max(1, seq_len // 3)
        subdir = f"seq_len_{seq_len}"

        (X_tr, y_tr), (X_va, y_va), (X_te, y_te) = prepare_sequences(
            X_train_s, X_val_s, X_test_s, y_train, y_val, y_test,
            train_subjects, val_subjects, test_subjects, seq_len, step,
        )

        X_tr_a = aggregate_sequences(X_tr)
        X_va_a = aggregate_sequences(X_va)
        X_te_a = aggregate_sequences(X_te)

        nc = len(le.classes_)
        class_weight_dict = compute_class_weights(y_tr)
        sample_weight_tr = make_sample_weights(y_tr, class_weight_dict)

        dtrain = xgb.DMatrix(X_tr_a, label=y_tr, weight=sample_weight_tr)
        dval = xgb.DMatrix(X_va_a, label=y_va)

        params = {
            "objective": "multi:softprob",
            "num_class": nc,
            "eval_metric": "mlogloss",
            "seed": RANDOM_STATE,
            **HYPERPARAMS,
        }

        log.info(f"Training XGBoost seq_len={seq_len} ({NUM_BOOST_ROUND} rounds, early stopping 50)...")
        model = xgb.train(
            params, dtrain,
            num_boost_round=NUM_BOOST_ROUND,
            evals=[(dtrain, "train"), (dval, "val")],
            early_stopping_rounds=50, verbose_eval=0,
        )
        log.ok(f"Training complete (seq_len={seq_len})")

        save_artifacts(
            dataset=DATASET,
            model=model,
            base_feature_names=feature_names,
            classes=list(le.classes_),
            scaler=scaler,
            seq_len=seq_len,
            step=step,
            subdir=subdir,
        )
        evaluate_model("XGBoost", model, X_te_a, y_te, le)


if __name__ == "__main__":
    main()
