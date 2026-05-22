import os
import tempfile
from pathlib import Path

import joblib
import xgboost as xgb


ARTIFACTS_ROOT = Path(__file__).resolve().parent.parent / "artifacts"


def _artifacts_dir(dataset: str) -> Path:
    d = ARTIFACTS_ROOT / dataset / "xgboost"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _aggregated_feature_names(base_names: list[str]) -> list[str]:
    stats = ["mean", "std", "min", "max", "delta"]
    return [f"{f}_{s}" for s in stats for f in base_names]


def save_artifacts(
    dataset: str,
    model: xgb.Booster,
    base_feature_names: list[str],
    classes: list[str],
    scaler=None,
    seq_len=30,
    step=10,
    extra_desc: str = "",
    subdir: str = "",
):
    out = _artifacts_dir(dataset) / subdir
    n_feats = len(base_feature_names)
    agg_names = _aggregated_feature_names(base_feature_names)

    model.save_model(str(out / "model.json"))
    print(f"  [artifacts] XGBoost JSON -> {out / 'model.json'}")

    joblib.dump(model, str(out / "model.joblib"))
    print(f"  [artifacts] Joblib       -> {out / 'model.joblib'}")

    _save_onnx(model, str(out / "model.onnx"), agg_names)
    print(f"  [artifacts] ONNX         -> {out / 'model.onnx'}")

    _write_desc(out, dataset, base_feature_names, classes, scaler, seq_len, step, extra_desc)
    print(f"  [artifacts] Description  -> {out / 'desc.md'}")


def _save_onnx(booster: xgb.Booster, path: str, feature_names: list[str]):
    try:
        from xgboost import XGBClassifier

        import onnxmltools
        from onnxmltools.convert.common.data_types import FloatTensorType

        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
            booster.save_model(tmp.name)
            tmp_path = tmp.name

        skmodel = XGBClassifier()
        skmodel.load_model(tmp_path)

        initial_types = [("float_input", FloatTensorType([None, len(feature_names)]))]
        onnx_model = onnxmltools.convert_xgboost(skmodel, initial_types=initial_types)
        with open(path, "wb") as f:
            f.write(onnx_model.SerializeToString())

        os.unlink(tmp_path)
    except Exception as e:
        print(f"  [artifacts] WARNING: ONNX export skipped ({e})")


FEATURE_DESCRIPTIONS = {
    "MEAN_RR": "Mean of RR intervals",
    "MEDIAN_RR": "Median of RR intervals",
    "SDRR": "Standard deviation of RR intervals",
    "RMSSD": "Root mean square of successive RR differences",
    "SDSD": "Standard deviation of successive RR differences",
    "SDRR_RMSSD": "Ratio of SDRR to RMSSD",
    "HR": "Heart rate derived from RR intervals",
    "pNN25": "Percentage of successive RR differences exceeding 25 ms",
    "pNN50": "Percentage of successive RR differences exceeding 50 ms",
    "SD1": "Poincaré plot standard deviation perpendicular to line of identity",
    "SD2": "Poincaré plot standard deviation along line of identity",
    "KURT": "Kurtosis of RR intervals",
    "SKEW": "Skewness of RR intervals",
    "MEAN_REL_RR": "Mean of relative RR intervals",
    "MEDIAN_REL_RR": "Median of relative RR intervals",
    "SDRR_REL_RR": "SDRR of relative RR intervals",
    "RMSSD_REL_RR": "RMSSD of relative RR intervals",
    "SDSD_REL_RR": "SDSD of relative RR intervals",
    "SDRR_RMSSD_REL_RR": "Ratio of SDRR_REL_RR to RMSSD_REL_RR",
    "KURT_REL_RR": "Kurtosis of relative RR intervals",
    "SKEW_REL_RR": "Skewness of relative RR intervals",
}

TRANSFORMED_FEATURES = {
    "MEAN_RR_LOG": "Log transform of MEAN_RR",
    "MEAN_RR_SQRT": "Square root of MEAN_RR",
    "MEDIAN_REL_RR_LOG": "Log transform of MEDIAN_REL_RR",
    "RMSSD_REL_RR_LOG": "Log transform of RMSSD_REL_RR",
    "SDSD_REL_RR_LOG": "Log transform of SDSD_REL_RR",
    "RMSSD_LOG": "Log transform of RMSSD",
    "SDRR_RMSSD_LOG": "Log transform of SDRR_RMSSD",
    "pNN25_LOG": "Log transform of pNN25",
    "pNN50_LOG": "Log transform of pNN50",
    "SD1_LOG": "Log transform of SD1",
    "KURT_YEO_JONSON": "Yeo-Johnson power transform of KURT",
    "SKEW_YEO_JONSON": "Yeo-Johnson power transform of SKEW",
    "MEAN_REL_RR_YEO_JONSON": "Yeo-Johnson power transform of MEAN_REL_RR",
    "SKEW_REL_RR_YEO_JONSON": "Yeo-Johnson power transform of SKEW_REL_RR",
    "SD1_BOXCOX": "Box-Cox transform of SD1",
    "KURT_SQUARE": "Square of KURT",
    "HR_SQRT": "Square root of HR",
}


def _write_desc(
    out: Path,
    dataset: str,
    base_features: list[str],
    classes: list[str],
    scaler=None,
    seq_len=30,
    step=10,
    extra: str = "",
):
    core = [f for f in base_features if f in FEATURE_DESCRIPTIONS]
    transformed = [f for f in base_features if f in TRANSFORMED_FEATURES]
    n_feats = len(base_features)

    lines = [
        f"# {dataset.upper()} — Stress Detection Model (XGBoost)",
        "",
        "## Overview",
        "This model classifies stress states from Heart Rate Variability (HRV) features",
        "derived from a **MAX30102 Oximeter / Heart Rate Beat Pulse Sensor (1.8–3.3 V)**.",
        "The sensor provides raw PPG (photoplethysmography) data from which RR-intervals",
        "(time between heartbeats) are extracted. All features are time-domain HRV metrics",
        "computed solely from these RR-intervals — no frequency-domain or other sensor data",
        "is used.",
        "",
        "## Model",
        f"- **Type**: XGBoost (Gradient Boosted Trees)",
        f"- **Task**: Multi-class classification ({len(classes)} classes)",
        f"- **Classes**: {classes}",
        "- **Loss**: multi:softprob (class probabilities)",
        "",
        "## Input Pipeline",
        "1. Raw HRV features are computed over sliding windows of consecutive beats.",
        f"2. Sequences of {seq_len} consecutive windows (stride {step}) are formed per subject.",
        f"3. Each sequence is aggregated into 5 statistics per feature: **mean**, **std**, **min**, **max**, **delta** (last - first).",
        f"4. Result: {n_feats} base features × 5 statistics = **{n_feats * 5} features**.",
        "5. Features are standardized (zero mean, unit variance) per split.",
        "",
        "## Base Features",
        "",
        "### Core Time-Domain HRV Metrics",
    ]

    for feat in core:
        desc = FEATURE_DESCRIPTIONS.get(feat, "")
        lines.append(f"- **{feat}**: {desc}")

    if transformed:
        lines.extend(["", "### Transformed Features (to improve normality)"])
        for feat in transformed:
            desc = TRANSFORMED_FEATURES.get(feat, "")
            lines.append(f"- **{feat}**: {desc}")

    lines.extend([
        "",
        "## Output",
        f"- **Classes**: {classes}",
        "- The model outputs a probability distribution over the classes.",
        "",
        "## Training",
        f"- **Dataset**: {dataset.upper()} (from Kaggle Stress dataset — qiriro/stress)",
        "- **Split**: Subject-wise 70/15/15 (GroupShuffleSplit) — no subject overlap between sets.",
        "- **Hyperparameters**: Tuned via Optuna (TPE sampler, 100 trials).",
        "- **Early stopping**: 50 rounds on validation mlogloss.",
    ])

    if scaler is not None:
        lines.extend([
            "",
            "## Scaler",
            f"- Mean: {scaler.mean_.tolist()}",
            f"- Scale: {scaler.scale_.tolist()}",
        ])

    if extra:
        lines.extend(["", extra])

    lines.append("")
    (out / "desc.md").write_text("\n".join(lines), encoding="utf-8")
