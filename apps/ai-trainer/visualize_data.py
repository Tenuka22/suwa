from __future__ import annotations

import sys
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


def print_summary(name: str, df: pd.DataFrame) -> None:
    """Prints a beautiful summary of the processed dataset, checking schema compliance."""
    print(f"\n{'='*25} {name.upper()} VALIDATION SUMMARY {'='*25}")
    print(f"Total Records   : {len(df):,}")
    print(f"Unique Subjects : {df['subject_id'].nunique()}")

    # Check for core columns
    expected_cols = [
        "timestamp",
        "timestamp_ms",
        "dataset",
        "subject_id",
        "heart_rate",
        "hrv_rmssd",
        "ibi_ms",
        "steps",
        "acc_x",
        "acc_y",
        "acc_z",
        "temperature",
        "eda",
        "spo2",
        "stress_level",
        "stress_label",
    ]

    print("\nColumn Verification & Integrity:")
    for col in expected_cols:
        status = "PRESENT" if col in df.columns else "MISSING"
        non_null = df[col].notna().mean() * 100 if col in df.columns else 0.0
        bar = "#" * int(non_null // 10) + "-" * (10 - int(non_null // 10))
        print(f"  {col:16} : {status:7} | Density: {non_null:5.1f}% [{bar}]")

    # Demographics Check
    demo_cols = ["age", "gender", "height", "weight"]
    available_demos = [c for c in demo_cols if c in df.columns and df[c].notna().any()]
    if available_demos:
        print("\nDemographic Distribution (Mean):")
        for col in available_demos:
            val = df[col].mean()
            if col == "gender":
                print(f"  {col:16} : Male={((1.0 - val)*100):.1f}%, Female={(val*100):.1f}%")
            else:
                unit = " cm" if col == "height" else (" kg" if col == "weight" else " years")
                print(f"  {col:16} : {val:.1f}{unit}")

    print(f"{'='*75}\n")


def plot_biometric_sync(df: pd.DataFrame, dataset_name: str, plot_dir: Path) -> Path | None:
    """Plots a synchronized window (30-minute) of watch biometrics (HR, HRV, movement) for verification."""
    # Find the first subject that has actual heart rate data
    valid_subjects = df.dropna(subset=["heart_rate"])["subject_id"].unique()
    if len(valid_subjects) == 0:
        valid_subjects = df["subject_id"].dropna().unique()
    if len(valid_subjects) == 0:
        return None

    subject_id = valid_subjects[0]
    sample = df[df["subject_id"] == subject_id].copy()
    sample["timestamp"] = pd.to_datetime(sample["timestamp"])
    sample = sample.sort_values("timestamp")

    if sample.empty:
        return None

    # Locate a 30-minute window with high data density
    start_time = sample["timestamp"].min()
    end_time = start_time + pd.Timedelta(minutes=30)
    window = sample[(sample["timestamp"] >= start_time) & (sample["timestamp"] <= end_time)]

    if window.empty:
        window = sample.head(1800)  # fallback to first 1800 rows

    fig, axes = plt.subplots(3, 1, figsize=(14, 10), sharex=True)
    fig.suptitle(
        f"{dataset_name.upper()}: Synchronized Watch Biometrics (Subject: {subject_id})",
        fontsize=16,
        fontweight="bold",
    )

    # 1. Heart Rate
    sns.lineplot(
        ax=axes[0],
        data=window,
        x="timestamp",
        y="heart_rate",
        color="crimson",
        linewidth=1.5,
    )
    axes[0].set_ylabel("HR (BPM)", fontweight="bold")
    axes[0].set_title("Heart Rate", fontweight="bold", loc="left")

    # 2. HRV (RMSSD in ms)
    if "hrv_rmssd" in window.columns and window["hrv_rmssd"].notna().any():
        sns.lineplot(
            ax=axes[1],
            data=window,
            x="timestamp",
            y="hrv_rmssd",
            color="royalblue",
            linewidth=1.5,
        )
        axes[1].set_ylabel("RMSSD (ms)", fontweight="bold")
        axes[1].set_title("Heart Rate Variability", fontweight="bold", loc="left")
    else:
        axes[1].text(
            0.5,
            0.5,
            "HRV (RMSSD) Data Missing",
            ha="center",
            va="center",
            transform=axes[1].transAxes,
        )
        axes[1].set_ylabel("RMSSD (ms)", fontweight="bold")

    # 3. Accelerometer Magnitude or Steps
    if "acc_x" in window.columns and window["acc_x"].notna().any():
        # Calculate vector magnitude: sqrt(x^2 + y^2 + z^2)
        acc_mag = np.sqrt(window["acc_x"] ** 2 + window["acc_y"] ** 2 + window["acc_z"] ** 2)
        axes[2].plot(window["timestamp"], acc_mag, color="forestgreen", alpha=0.7)
        axes[2].set_ylabel("ACC Mag (m/s²)", fontweight="bold")
        axes[2].set_title("Movement Intensity (Accelerometer)", fontweight="bold", loc="left")
    elif "steps" in window.columns and window["steps"].notna().any():
        axes[2].bar(window["timestamp"], window["steps"], color="orange", width=0.002)
        axes[2].set_ylabel("Steps", fontweight="bold")
        axes[2].set_title("Movement (Steps)", fontweight="bold", loc="left")
    else:
        axes[2].text(
            0.5,
            0.5,
            "Movement Data Missing",
            ha="center",
            va="center",
            transform=axes[2].transAxes,
        )
        axes[2].set_ylabel("Movement", fontweight="bold")

    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    plot_path = plot_dir / f"{dataset_name.lower()}_sync.png"
    plt.savefig(plot_path, dpi=160)
    plt.close()
    return plot_path


def plot_ssaqs_trends(df: pd.DataFrame, plot_dir: Path) -> Path | None:
    """Creates a specific trend plot for the sparse SSAQS dataset comparing steps and stress."""
    valid_subjects = df.dropna(subset=["steps", "stress_level"])["subject_id"].unique()
    if len(valid_subjects) == 0:
        valid_subjects = df["subject_id"].dropna().unique()
    if len(valid_subjects) == 0:
        return None

    subject_id = valid_subjects[0]
    sample = df[df["subject_id"] == subject_id].copy()
    sample["timestamp"] = pd.to_datetime(sample["timestamp"])
    sample = sample.sort_values("timestamp")

    if sample.empty:
        return None

    fig, ax1 = plt.subplots(figsize=(14, 6))
    ax2 = ax1.twinx()

    sns.lineplot(
        ax=ax1,
        data=sample,
        x="timestamp",
        y="steps",
        color="orange",
        label="Steps (5-min sum)",
        alpha=0.6,
        linewidth=1.5,
    )
    sns.scatterplot(
        ax=ax2,
        data=sample,
        x="timestamp",
        y="stress_level",
        color="red",
        label="Stress Score",
        s=100,
        zorder=5,
    )

    ax1.set_ylabel("Steps (5-min sum)", color="orange", fontweight="bold")
    ax2.set_ylabel("Stress Score (0-100)", color="red", fontweight="bold")
    plt.title(
        f"SSAQS: Free-Living Step Counts vs Daily Stress (Subject: {subject_id})",
        fontweight="bold",
        fontsize=14,
    )

    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper right")

    plt.tight_layout()
    plot_path = plot_dir / "ssaqs_trends.png"
    plt.savefig(plot_path, dpi=160)
    plt.close()
    return plot_path


def main() -> int:
    """Validation entrypoint that reads all three processed datasets and plots summaries."""
    print("*" * 80)
    print("              ZEN-DOC WATCH BIOMETRIC PIPELINE: DATA VALIDATION           ")
    print("*" * 80)

    base_dir = Path(__file__).resolve().parent
    processed_dir = base_dir / "processed-datasets"
    plot_dir = processed_dir / "plots"
    plot_dir.mkdir(exist_ok=True)

    sns.set_theme(style="whitegrid")

    datasets = {
        "WESAD": processed_dir / "wesad_unified_prediction.csv",
        "SSAQS": processed_dir / "ssaqs_unified_prediction.csv",
        "MMASH": processed_dir / "mmash_unified_prediction.csv",
    }

    plots_created = 0

    for name, path in datasets.items():
        if not path.exists():
            print(f"Skipping {name}: Processed file not found at {path}")
            continue

        print(f"\n>>> Loading and Validating {name}...")
        try:
            df = pd.read_csv(path)
            print_summary(name, df)

            if name == "SSAQS":
                p1 = plot_ssaqs_trends(df, plot_dir)
                if p1:
                    print(f"[OK] Created validation plot: {p1}")
                    plots_created += 1
            else:
                p2 = plot_biometric_sync(df, name, plot_dir)
                if p2:
                    print(f"[OK] Created validation plot: {p2}")
                    plots_created += 1

        except Exception as e:
            print(f"[X] Error validating {name}: {e}")
            import traceback
            traceback.print_exc()

    print(f"\nValidation completed! Generated {plots_created} quality checks inside {plot_dir}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
