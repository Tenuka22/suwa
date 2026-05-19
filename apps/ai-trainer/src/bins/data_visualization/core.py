from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

MAX_SAMPLE_ROWS = 200_000


def _load_dataset(data_file: Path) -> pd.DataFrame:
    if data_file.suffix.lower() == ".parquet":
        import pyarrow.parquet as pq

        parquet_file = pq.ParquetFile(data_file)
        batches: list[pd.DataFrame] = []
        rows_read = 0
        for batch in parquet_file.iter_batches(batch_size=50_000):
            frame = batch.to_pandas()
            batches.append(frame)
            rows_read += len(frame)
            if rows_read >= MAX_SAMPLE_ROWS:
                break
        if not batches:
            return pd.DataFrame()
        return pd.concat(batches, ignore_index=True)
    return pd.read_csv(data_file)


def _plot_numeric_overview(frame: pd.DataFrame, numeric: pd.DataFrame, output_dir: Path, stem: str) -> list[Path]:
    outputs: list[Path] = []

    plot_count = min(6, len(numeric.columns))
    if plot_count:
        figure, axes = plt.subplots(plot_count, 1, figsize=(10, 4 * plot_count))
        axes_list = [axes] if plot_count == 1 else list(axes)
        for axis, column in zip(axes_list, numeric.columns[:plot_count], strict=False):
            values = frame[column].dropna()
            if values.empty:
                continue
            sample_size = min(len(values), 5000)
            sns.histplot(values.sample(sample_size, random_state=42), kde=True, ax=axis)
            axis.set_title(column)
        figure.tight_layout()
        hist_path = output_dir / f"{stem}_histograms.png"
        figure.savefig(hist_path, dpi=160)
        plt.close(figure)
        outputs.append(hist_path)

    corr = numeric.corr(numeric_only=True)
    if not corr.empty:
        figure, axis = plt.subplots(figsize=(12, 10))
        sns.heatmap(corr, cmap="coolwarm", center=0, ax=axis)
        axis.set_title(f"{stem} correlation (sampled)")
        figure.tight_layout()
        corr_path = output_dir / f"{stem}_correlation.png"
        figure.savefig(corr_path, dpi=160)
        plt.close(figure)
        outputs.append(corr_path)

    return outputs


def _plot_categorical_overview(frame: pd.DataFrame, output_dir: Path, stem: str) -> list[Path]:
    outputs: list[Path] = []

    if "label_name" in frame.columns:
        figure, axis = plt.subplots(figsize=(12, 5))
        order = frame["label_name"].value_counts().index
        sns.countplot(data=frame, x="label_name", order=order, ax=axis)
        axis.set_title(f"{stem} label distribution (sampled)")
        axis.set_xlabel("label_name")
        axis.set_ylabel("count")
        axis.tick_params(axis="x", rotation=30)
        figure.tight_layout()
        label_path = output_dir / f"{stem}_labels.png"
        figure.savefig(label_path, dpi=160)
        plt.close(figure)
        outputs.append(label_path)

    if "stress_binary" in frame.columns:
        figure, axis = plt.subplots(figsize=(6, 5))
        sns.countplot(data=frame, x="stress_binary", ax=axis)
        axis.set_title(f"{stem} stress balance (sampled)")
        axis.set_xlabel("stress_binary")
        axis.set_ylabel("count")
        figure.tight_layout()
        stress_path = output_dir / f"{stem}_stress_balance.png"
        figure.savefig(stress_path, dpi=160)
        plt.close(figure)
        outputs.append(stress_path)

    return outputs


def visualize_dataset(data_file: Path, output_dir: Path) -> list[Path]:
    frame = _load_dataset(data_file)
    if frame.empty:
        return []

    output_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []

    numeric = frame.select_dtypes(include="number")
    if not numeric.empty:
        outputs.extend(_plot_numeric_overview(frame, numeric, output_dir, data_file.stem))

    outputs.extend(_plot_categorical_overview(frame, output_dir, data_file.stem))

    return outputs
