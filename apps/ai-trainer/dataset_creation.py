from __future__ import annotations

import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Import unified extractor functions and constants
from unified_extractor import (
    extract_wesad_unified,
    extract_ssaqs_unified,
    extract_mmash_unified,
    finalize_dataset,
    UNIFIED_COLUMNS,
)


def print_dataset_stats(name: str, df: pd.DataFrame) -> None:
    """Prints beautiful, comprehensive tabular statistics of a unified dataset.

    Shows shapes, unique subjects, and biometric data density.
    """
    print(f"\n{'='*25} {name.upper()} DATASET STATISTICS {'='*25}")
    if df.empty:
        print("Dataset is EMPTY!")
        return

    print(f"Total Rows      : {len(df):,}")
    print(f"Unique Subjects : {df['subject_id'].nunique()}")

    # Compute percentage of non-null values for each biometric column
    print("\nBiometric Data Density (% non-empty):")
    missing = df.isna().mean() * 100
    density = 100.0 - missing

    # Select columns that are relevant watch sensors
    biometric_cols = [
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

    for col in biometric_cols:
        if col in density.index:
            val = density[col]
            bar = "#" * int(val // 5) + "-" * (20 - int(val // 5))
            print(f"  {col:15} : {val:5.1f}%  [{bar}]")

    # Show demographics
    demo_cols = ["age", "gender", "height", "weight"]
    available_demos = [c for c in demo_cols if c in df.columns and df[c].notna().any()]
    if available_demos:
        print("\nDemographics (Mean of non-empty):")
        for col in available_demos:
            val = df[col].mean()
            if col == "gender":
                # Convert male/female ratio to readable percentage
                print(f"  {col:15} : Male={((1.0 - val) * 100.0):.1f}%, Female={(val * 100.0):.1f}%")
            else:
                unit = " cm" if col == "height" else (" kg" if col == "weight" else " years")
                print(f"  {col:15} : {val:.1f}{unit}")

    print(f"{'='*75}\n")


def main() -> int:
    """Main orchestrator for the raw-to-processed AI Trainer pipeline."""
    print("*" * 80)
    print("           ZEN-DOC WATCH BIOMETRIC PIPELINE: DATASET CREATION             ")
    print("*" * 80)

    base_dir = Path(__file__).resolve().parent
    raw_root = base_dir / "data-sets-raw"
    processed_root = base_dir / "processed-datasets"

    # Create processed datasets and plots folders
    processed_root.mkdir(exist_ok=True)
    (processed_root / "plots").mkdir(exist_ok=True)

    if not raw_root.exists():
        print(f"Error: Raw datasets root not found at {raw_root}!")
        return 1

    datasets_to_process = [
        ("wesad", extract_wesad_unified, "wesad_unified_prediction.csv"),
        ("ssaqs", extract_ssaqs_unified, "ssaqs_unified_prediction.csv"),
        ("mmash", extract_mmash_unified, "mmash_unified_prediction.csv"),
    ]

    summary = {}

    for name, extractor_fn, out_filename in datasets_to_process:
        print(f"\n>>> Extracting & Processing {name.upper()} Dataset...")
        try:
            # 1. Extract raw data
            df = extractor_fn(raw_root)

            # 2. Standardize schema and datatypes
            df_clean = finalize_dataset(df)

            # 3. Save to unified CSV file
            if not df_clean.empty:
                out_path = processed_root / out_filename
                df_clean.to_csv(out_path, index=False)
                print(f"[OK] Saved {name.upper()} to {out_path}")
                print_dataset_stats(name, df_clean)
                summary[name] = {
                    "status": "Success",
                    "rows": len(df_clean),
                    "subjects": df_clean["subject_id"].nunique(),
                    "columns": len(df_clean.columns),
                }
            else:
                print(f"[X] Failed: Extracted {name.upper()} data was empty!")
                summary[name] = {"status": "Empty", "rows": 0, "subjects": 0, "columns": 0}

        except Exception as e:
            print(f"[X] Error processing {name.upper()}: {e}")
            import traceback
            traceback.print_exc()
            summary[name] = {"status": f"Error: {str(e)}", "rows": 0, "subjects": 0, "columns": 0}

    print("\n" + "=" * 30 + " PIPELINE SUMMARY " + "=" * 30)
    for name, stats in summary.items():
        print(f"  {name.upper():8} : Status={stats['status']:10} Rows={stats['rows']:,} Subjects={stats['subjects']} Columns={stats['columns']}")
    print("=" * 78 + "\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
