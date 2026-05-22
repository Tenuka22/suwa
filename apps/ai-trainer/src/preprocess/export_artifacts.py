import json
import os
import tempfile
from pathlib import Path

import xgboost as xgb

from . import log

ARTIFACTS_ROOT = Path(__file__).resolve().parent.parent.parent / "artifacts"


def _artifacts_dir(dataset: str) -> Path:
    d = ARTIFACTS_ROOT / dataset / "xgboost_pre_engineered_hrv"
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_artifacts(
    dataset: str,
    model: xgb.Booster,
    feature_names: list[str],
    classes: list[str],
    extra_desc: str = "",
    subdir: str = "",
):
    out = _artifacts_dir(dataset) / subdir
    out.mkdir(parents=True, exist_ok=True)

    model.save_model(str(out / "model.json"))
    log.ok(f"XGBoost JSON -> {out / 'model.json'}")

    _save_onnx(model, str(out / "model.onnx"), feature_names)
    log.ok(f"ONNX         -> {out / 'model.onnx'}")

    with open(out / "classes.json", "w") as f:
        json.dump(classes, f)
    log.ok(f"Classes      -> {out / 'classes.json'}")

    _write_desc(out, dataset, feature_names, classes, extra_desc)
    log.detail(f"Description  -> {out / 'desc.md'}")


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
        log.warn(f"ONNX export skipped ({e})")


def _write_desc(
    out: Path,
    dataset: str,
    feature_names: list[str],
    classes: list[str],
    extra: str = "",
):
    n_feats = len(feature_names)

    lines = [
        f"# {dataset.upper()} — Stress Detection Model (XGBoost)",
        "",
        "## Overview",
        "This model classifies stress states from Heart Rate Variability (HRV) features",
        "derived from a **MAX30102 Oximeter / Heart Rate Beat Pulse Sensor (1.8–3.3 V)**.",
        "The sensor provides raw PPG (photoplethysmography) data from which RR-intervals",
        "(time between heartbeats) are extracted. All features are time-domain HRV metrics",
        "computed solely from these RR-intervals.",
        "",
        "## Model",
        f"- **Type**: XGBoost (Gradient Boosted Trees)",
        f"- **Task**: Multi-class classification ({len(classes)} classes)",
        f"- **Classes**: {classes}",
        "- **Loss**: multi:softprob (class probabilities)",
        "",
        "## Input",
        f"- {n_feats} raw HRV features per sample (no windowing, no aggregation).",
        "5. Features are standardized (zero mean, unit variance) per split.",
        "",
        "## Output",
        f"- **Classes**: {classes}",
        "- The model outputs a probability distribution over the classes.",
        "",
        "## Training",
        f"- **Dataset**: {dataset.upper()} (from Kaggle Stress dataset — qiriro/stress)",
        "- **Split**: Subject-wise 70/15/15 (GroupShuffleSplit) — no subject overlap between sets.",
    ]

    if extra:
        lines.extend(["", extra])

    lines.append("")
    (out / "desc.md").write_text("\n".join(lines), encoding="utf-8")
