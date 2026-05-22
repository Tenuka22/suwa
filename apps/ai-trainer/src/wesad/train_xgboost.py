import pandas as pd
import warnings
from pathlib import Path

import xgboost as xgb

from preprocess import log
from preprocess import (
    subject_split, scale_data, evaluate_model,
    compute_class_weights, make_sample_weights,
    RANDOM_STATE, save_artifacts,
)
from wesad.load_data import filter_hrv_features, get_X_y_groups
from preprocess.fetch_raw_data import fetch_wesad

warnings.filterwarnings("ignore")

DATASET = "wesad"
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent / "artifacts"
INTERIM = ARTIFACTS_DIR.parent.parent.parent / "dataset" / "0. interim" / DATASET

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


def main():
    csv_path = INTERIM / "wesad-hrv.csv"
    if not csv_path.exists():
        log.info("Local cache not found, fetching from Kaggle...")
        fetch_wesad()

    df = pd.read_csv(csv_path)
    df = df.sort_values(["subject id"]).reset_index(drop=True)
    df = df.rename(columns={"subject id": "subject_id"})

    X, y, groups, le, feature_names = get_X_y_groups(df)
    (X_train, X_val, X_test, y_train, y_val, y_test,
     train_subjects, val_subjects, test_subjects) = subject_split(X, y, groups, RANDOM_STATE)

    X_train_s, X_val_s, X_test_s, _ = scale_data(X_train, X_val, X_test)

    nc = len(le.classes_)
    class_weight_dict = compute_class_weights(y_train)
    sample_weight_tr = make_sample_weights(y_train, class_weight_dict)

    dtrain = xgb.DMatrix(X_train_s, label=y_train, weight=sample_weight_tr)
    dval = xgb.DMatrix(X_val_s, label=y_val)

    params = {
        "objective": "multi:softprob",
        "num_class": nc,
        "eval_metric": "mlogloss",
        "seed": RANDOM_STATE,
        **HYPERPARAMS,
    }

    log.info(f"Training XGBoost ({NUM_BOOST_ROUND} rounds, early stopping 50)...")
    model = xgb.train(
        params, dtrain,
        num_boost_round=NUM_BOOST_ROUND,
        evals=[(dtrain, "train"), (dval, "val")],
        early_stopping_rounds=50, verbose_eval=0,
    )
    log.ok("Training complete")

    save_artifacts(
        dataset=DATASET,
        model=model,
        feature_names=feature_names,
        classes=list(le.classes_),
    )
    evaluate_model("XGBoost", model, X_test_s, y_test, le)


if __name__ == "__main__":
    main()
