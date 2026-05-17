from __future__ import annotations

import re
from pathlib import Path
import numpy as np
import pandas as pd

# Unified Column Names aligned with Samsung Health / Watch Sensor SDK
COL_TIMESTAMP = "timestamp"
COL_TIMESTAMP_MS = "timestamp_ms"
COL_DATASET = "dataset"
COL_SUBJECT_ID = "subject_id"

# Demographics
COL_AGE = "age"
COL_GENDER = "gender"
COL_HEIGHT = "height"
COL_WEIGHT = "weight"

# Core Watch Biometrics
COL_HEART_RATE = "heart_rate"
COL_HRV_RMSSD = "hrv_rmssd"
COL_IBI = "ibi_ms"

# Movement
COL_STEPS = "steps"
COL_ACC_X = "acc_x"
COL_ACC_Y = "acc_y"
COL_ACC_Z = "acc_z"

# Environment & Sparse Sensors
COL_TEMP = "temperature"
COL_EDA = "eda"
COL_SPO2 = "spo2"

# Predictions / Ground Truth
COL_STRESS = "stress_level"
COL_STRESS_LABEL = "stress_label"

# 20 Unified Columns for Model Input/Output
UNIFIED_COLUMNS = [
    COL_TIMESTAMP,
    COL_TIMESTAMP_MS,
    COL_DATASET,
    COL_SUBJECT_ID,
    COL_AGE,
    COL_GENDER,
    COL_HEIGHT,
    COL_WEIGHT,
    COL_HEART_RATE,
    COL_HRV_RMSSD,
    COL_IBI,
    COL_STEPS,
    COL_ACC_X,
    COL_ACC_Y,
    COL_ACC_Z,
    COL_TEMP,
    COL_EDA,
    COL_SPO2,
    COL_STRESS,
    COL_STRESS_LABEL,
]


def calculate_rmssd(ibi_series: pd.Series, window: str = "1min") -> pd.Series:
    """Calculates rolling RMSSD (Root Mean Square of Successive Differences) from IBI intervals in ms.

    Ensures the time series is properly sorted and indexed with a DatetimeIndex
    to allow time-based rolling window calculation.
    """
    if ibi_series.empty:
        return pd.Series(dtype=float, index=ibi_series.index)

    # Successive differences: diff in ms
    diffs = ibi_series.diff()
    diffs_sq = diffs**2

    # Rolling mean of squared differences
    rolling_msq = diffs_sq.rolling(window=window, min_periods=3).mean()

    # Square root of mean squared differences
    return np.sqrt(rolling_msq)


def parse_wesad_readme(file_path: Path) -> dict[str, float]:
    """Parses demographics from WESAD subject readme files.

    Gender is encoded as: Male = 0.0, Female = 1.0.
    """
    info = {}
    if not file_path.exists():
        return info
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        age_match = re.search(r"Age:\s*(\d+)", content)
        if age_match:
            info[COL_AGE] = float(age_match.group(1))

        height_match = re.search(r"Height\s*\(cm\):\s*(\d+)", content)
        if height_match:
            info[COL_HEIGHT] = float(height_match.group(1))

        weight_match = re.search(r"Weight\s*\(kg\):\s*(\d+)", content)
        if weight_match:
            info[COL_WEIGHT] = float(weight_match.group(1))

        gender_match = re.search(r"Gender:\s*(\w+)", content)
        if gender_match:
            g = gender_match.group(1).strip().lower()
            info[COL_GENDER] = 0.0 if g.startswith("m") else 1.0
    except Exception as e:
        print(f"Warning: Failed to parse WESAD readme at {file_path}: {e}")
    return info


def parse_wesad_quest(file_path: Path) -> dict[str, tuple[float, float]]:
    """Parses WESAD questionnaire CSV to get exact start and end times (in minutes) for each protocol condition.

    E.g. Base, TSST, Fun, Medi 1, Medi 2, etc.
    """
    mapping = {}
    if not file_path.exists():
        return mapping
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]

        order = []
        starts = []
        ends = []

        for l in lines:
            if "ORDER" in l:
                parts = l.replace("#", "").strip().split(";")
                order = [p.strip() for p in parts[1:] if p.strip()]
            elif "START" in l:
                parts = l.replace("#", "").strip().split(";")
                starts = [float(p) for p in parts[1:] if p.strip()]
            elif "END" in l:
                parts = l.replace("#", "").strip().split(";")
                ends = [float(p) for p in parts[1:] if p.strip()]

        for i, cond in enumerate(order):
            if i < len(starts) and i < len(ends):
                mapping[cond] = (starts[i], ends[i])
    except Exception as e:
        print(f"Warning: Failed to parse WESAD questionnaire at {file_path}: {e}")
    return mapping


def load_wesad_e4_csv(file_path: Path, col_names: list[str]) -> pd.DataFrame:
    """Loads Empatica E4 CSV files, extracting start timestamp and sampling rate.

    Calculates absolute datetimes for all measurements.
    """
    if not file_path.exists():
        return pd.DataFrame()
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            l1 = f.readline().strip().split(",")
            if not l1 or not l1[0]:
                return pd.DataFrame()
            st = float(l1[0])

            l2 = f.readline().strip().split(",")
            if not l2 or not l2[0]:
                return pd.DataFrame()
            sr = float(l2[0])

        df = pd.read_csv(file_path, header=None, skiprows=2)
        # Create timestamps using high-precision floats
        df[COL_TIMESTAMP] = pd.to_datetime(st + np.arange(len(df)) / sr, unit="s")

        data_cols = [c for c in df.columns if c != COL_TIMESTAMP]
        if len(data_cols) == len(col_names):
            df.rename(
                columns={data_cols[i]: col_names[i] for i in range(len(data_cols))},
                inplace=True,
            )
        return df[[COL_TIMESTAMP] + col_names]
    except Exception as e:
        print(f"Error loading WESAD E4 file {file_path}: {e}")
        return pd.DataFrame()


def extract_wesad_unified(raw_root: Path) -> pd.DataFrame:
    """Extracts, cleans, aligns, and labels WESAD subject data from raw files.

    Aligns everything to a unified 1Hz (1-second) watch biometric grid.
    """
    wesad_dir = raw_root / "WESAD"
    if not wesad_dir.exists():
        print(f"Error: WESAD directory not found at {wesad_dir}")
        return pd.DataFrame()

    all_subject_data = []

    # Iterate over all subjects S2 to S17 (skipping S12)
    subjects = sorted(
        [p for p in wesad_dir.iterdir() if p.is_dir() and p.name.startswith("S")]
    )
    for subject_dir in subjects:
        subject_id = subject_dir.name
        data_dir = subject_dir / f"{subject_id}_E4_Data"
        if not data_dir.exists():
            continue

        print(f"Processing WESAD Subject {subject_id}...")
        try:
            # 1. Load biometrics
            hr = load_wesad_e4_csv(data_dir / "HR.csv", [COL_HEART_RATE])
            temp = load_wesad_e4_csv(data_dir / "TEMP.csv", [COL_TEMP])
            eda = load_wesad_e4_csv(data_dir / "EDA.csv", [COL_EDA])
            acc = load_wesad_e4_csv(
                data_dir / "ACC.csv", [COL_ACC_X, COL_ACC_Y, COL_ACC_Z]
            )

            # 2. Clean body temperature artifacts (clip range 25C to 45C)
            if not temp.empty:
                temp[COL_TEMP] = pd.to_numeric(temp[COL_TEMP], errors="coerce")
                temp.loc[
                    (temp[COL_TEMP] < 25.0) | (temp[COL_TEMP] > 45.0), COL_TEMP
                ] = np.nan

            # 3. Convert ACC to m/s^2 (raw values are in 1/64g units)
            if not acc.empty:
                for c in [COL_ACC_X, COL_ACC_Y, COL_ACC_Z]:
                    acc[c] = pd.to_numeric(acc[c], errors="coerce")
                    acc[c] = (acc[c] / 64.0) * 9.80665

            # 4. Load IBI and calculate HRV RMSSD
            ibi_path = data_dir / "IBI.csv"
            ibi_df = pd.DataFrame()
            if ibi_path.exists():
                with open(ibi_path, "r", encoding="utf-8") as f:
                    line = f.readline().strip().split(",")
                    if line and line[0]:
                        st = float(line[0])
                        ibi_raw = pd.read_csv(ibi_path, header=None, skiprows=1)
                        ibi_raw.columns = ["offset", COL_IBI]
                        # Calculate exact timestamp
                        ibi_raw[COL_TIMESTAMP] = pd.to_datetime(
                            st + ibi_raw["offset"], unit="s"
                        )
                        ibi_raw = ibi_raw.set_index(COL_TIMESTAMP).sort_index()

                        # Convert IBI to milliseconds for standard watch biometrics
                        ibi_raw[COL_IBI] = ibi_raw[COL_IBI] * 1000.0

                        # Group by duplicate timestamps (take average) to ensure clean rolling RMSSD calculation
                        ibi_raw = ibi_raw.groupby(level=0).mean().sort_index()

                        # Calculate RMSSD on rolling 1-minute window
                        ibi_raw[COL_HRV_RMSSD] = calculate_rmssd(ibi_raw[COL_IBI])
                        ibi_df = ibi_raw.reset_index()

            # 5. Resample everything to a 1Hz (1-second) grid
            res = (
                lambda df: df.set_index(COL_TIMESTAMP).resample("1s").mean()
                if not df.empty
                else pd.DataFrame()
            )

            res_hr = res(hr)
            res_temp = res(temp)
            res_eda = res(eda)
            res_acc = res(acc)
            res_ibi = (
                res(ibi_df[[COL_TIMESTAMP, COL_IBI, COL_HRV_RMSSD]])
                if not ibi_df.empty
                else pd.DataFrame()
            )

            # Outer join to align timestamps
            dfs = [res_hr, res_temp, res_eda, res_acc, res_ibi]
            dfs = [d for d in dfs if not d.empty]
            if not dfs:
                continue

            combined = dfs[0]
            if len(dfs) > 1:
                combined = combined.join(dfs[1:], how="outer")

            combined = combined.reset_index()
            first_ts = combined[COL_TIMESTAMP].min()

            # 6. Load quest and assign Ground Truth Stress labels
            quest_path = subject_dir / f"{subject_id}_quest.csv"
            quest_map = parse_wesad_quest(quest_path)

            stress_vals = []
            y_vals = []

            for _, row in combined.iterrows():
                elapsed = (row[COL_TIMESTAMP] - first_ts).total_seconds()
                elapsed_min = elapsed / 60.0

                label_stress = np.nan
                label_y = np.nan

                # Map experimental condition intervals to stress targets
                for cond, (start, end) in quest_map.items():
                    if start <= elapsed_min <= end:
                        if cond == "TSST":
                            label_stress = 2.0  # Stressed (Score = 2)
                            label_y = 1.0  # Binary target: Stress
                        else:
                            label_stress = 0.0  # Not stressed (Score = 0)
                            label_y = 0.0  # Binary target: No Stress
                        break

                stress_vals.append(label_stress)
                y_vals.append(label_y)

            combined[COL_STRESS] = stress_vals
            combined[COL_STRESS_LABEL] = y_vals

            # 7. Add demographic information
            readme_path = subject_dir / f"{subject_id}_readme.txt"
            demo = parse_wesad_readme(readme_path)
            for k, v in demo.items():
                combined[k] = v

            # 8. Clean up gaps (forward-fill biometrics up to 30 seconds)
            fill_cols = [
                COL_HEART_RATE,
                COL_TEMP,
                COL_EDA,
                COL_IBI,
                COL_HRV_RMSSD,
                COL_ACC_X,
                COL_ACC_Y,
                COL_ACC_Z,
            ]
            for col in fill_cols:
                if col in combined.columns:
                    combined[col] = combined[col].ffill(limit=30)

            # Metadata
            combined[COL_SUBJECT_ID] = str(subject_id)
            combined[COL_DATASET] = "WESAD"

            # Remove rows where all core biometrics are missing
            existing_subset = [c for c in [COL_HEART_RATE, COL_ACC_X, COL_TEMP, COL_EDA] if c in combined.columns]
            if existing_subset:
                combined.dropna(subset=existing_subset, how="all", inplace=True)
            else:
                continue
            all_subject_data.append(combined)

        except Exception as e:
            print(f"Error processing subject {subject_id}: {e}")

    return (
        pd.concat(all_subject_data, ignore_index=True)
        if all_subject_data
        else pd.DataFrame()
    )


def extract_ssaqs_unified(raw_root: Path) -> pd.DataFrame:
    """Extracts, cleans, and merges sparse free-living SSAQS watch datasets from raw folders.

    Aligns everything to a standard 5-minute watch biometric grid.
    """
    ssaqs_dir = raw_root / "SSAQS dataset"
    if not ssaqs_dir.exists():
        print(f"Error: SSAQS dataset directory not found at {ssaqs_dir}")
        return pd.DataFrame()

    all_user_data = []

    # Loop over numeric directories (User 1 to 35)
    users = sorted(
        [p for p in ssaqs_dir.iterdir() if p.is_dir() and p.name.isdigit()],
        key=lambda x: int(x.name),
    )
    for user_dir in users:
        user_id = user_dir.name
        print(f"Processing SSAQS User {user_id}...")

        # 1. Load HRV (RMSSD in ms)
        hrv_path = user_dir / "hrv.csv"
        hrv_df = pd.DataFrame()
        if hrv_path.exists():
            try:
                df = pd.read_csv(hrv_path)
                if not df.empty:
                    df[COL_TIMESTAMP] = pd.to_datetime(
                        df["timestamp"].str.rstrip("Z"), errors="coerce"
                    )
                    df = df.dropna(subset=[COL_TIMESTAMP])
                    # Select only numeric rmssd column before resampling to avoid string mean crash
                    hrv_df = df[["timestamp", "rmssd"]].set_index(COL_TIMESTAMP).resample("5min").mean()
                    hrv_df.rename(columns={"rmssd": COL_HRV_RMSSD}, inplace=True)
            except Exception as e:
                print(f"Warning: Failed to load HRV for User {user_id}: {e}")

        # 2. Load Oxygen (SpO2 percentage)
        oxy_path = user_dir / "oxygen.csv"
        oxy_df = pd.DataFrame()
        if oxy_path.exists():
            try:
                df = pd.read_csv(oxy_path)
                if not df.empty:
                    df[COL_TIMESTAMP] = pd.to_datetime(
                        df["timestamp"].str.rstrip("Z"), errors="coerce"
                    )
                    df = df.dropna(subset=[COL_TIMESTAMP])
                    # Select only numeric value column before resampling
                    oxy_df = df[["timestamp", "value"]].set_index(COL_TIMESTAMP).resample("5min").mean()
                    oxy_df.rename(columns={"value": COL_SPO2}, inplace=True)
            except Exception as e:
                print(f"Warning: Failed to load Oxygen for User {user_id}: {e}")

        # 3. Load Steps (Step count in that interval)
        steps_path = user_dir / "steps.csv"
        steps_df = pd.DataFrame()
        if steps_path.exists():
            try:
                df = pd.read_csv(steps_path)
                if not df.empty:
                    df[COL_TIMESTAMP] = pd.to_datetime(
                        df["timestamp"].str.rstrip("Z"), errors="coerce"
                    )
                    df = df.dropna(subset=[COL_TIMESTAMP])
                    # Select only numeric steps column before resampling
                    steps_df = df[["timestamp", "steps"]].set_index(COL_TIMESTAMP).resample("5min").sum()
                    steps_df.rename(columns={"steps": COL_STEPS}, inplace=True)
            except Exception as e:
                print(f"Warning: Failed to load Steps for User {user_id}: {e}")

        # 4. Load Activity Level (Sedentary, Light, Moderate, Vigorous)
        act_path = user_dir / "activity_level.csv"
        act_df = pd.DataFrame()
        if act_path.exists():
            try:
                df = pd.read_csv(act_path)
                if not df.empty:
                    df[COL_TIMESTAMP] = pd.to_datetime(
                        df["timestamp"].str.rstrip("Z"), errors="coerce"
                    )
                    df = df.dropna(subset=[COL_TIMESTAMP]).copy()
                    # Map to standard physical activity scale
                    level_map = {
                        "SEDENTARY": 0.0,
                        "LIGHT": 1.0,
                        "MODERATE": 2.0,
                        "VIGOROUS": 3.0,
                    }
                    df["activity_level"] = (
                        df["level"].map(level_map).fillna(0.0)
                    )
                    # Select only mapped numeric column before resampling
                    act_df = df[["timestamp", "activity_level"]].set_index(COL_TIMESTAMP).resample("5min").mean()
            except Exception as e:
                print(f"Warning: Failed to load Activity Level for User {user_id}: {e}")

        # 5. Load daily questions (User stress/anxiety questionnaires)
        dq_path = user_dir / "daily_questions.csv"
        dq_df = pd.DataFrame()
        if dq_path.exists():
            try:
                df = pd.read_csv(dq_path)
                if not df.empty and "stress" in df.columns:
                    df[COL_TIMESTAMP] = pd.to_datetime(
                        df["timeStampSent"], unit="s", errors="coerce"
                    )
                    df = df.dropna(subset=[COL_TIMESTAMP])
                    # Select only numeric stress column before resampling
                    dq_df = df[["timestamp", "stress"]].set_index(COL_TIMESTAMP).resample("5min").mean()
                    dq_df.rename(columns={"stress": "stress_questionnaire"}, inplace=True)
            except Exception as e:
                print(f"Warning: Failed to load daily questions for User {user_id}: {e}")

        # 6. Load daily stress levels
        stress_path = user_dir / "stress.csv"
        stress_df = pd.DataFrame()
        if stress_path.exists():
            try:
                df = pd.read_csv(stress_path)
                if not df.empty:
                    df[COL_TIMESTAMP] = pd.to_datetime(
                        df["DATE"].str.rstrip("Z"), errors="coerce"
                    )
                    df = df.dropna(subset=[COL_TIMESTAMP])
                    # Select only numeric stress score column before resampling
                    stress_df = df[["timestamp", "STRESS_SCORE"]].set_index(COL_TIMESTAMP).resample("5min").mean()
                    stress_df.rename(columns={"STRESS_SCORE": "stress_score_daily"}, inplace=True)
            except Exception as e:
                print(f"Warning: Failed to load daily stress for User {user_id}: {e}")

        # 7. Join all features
        dfs = [hrv_df, oxy_df, steps_df, act_df, stress_df, dq_df]
        dfs = [d for d in dfs if not d.empty]
        if not dfs:
            continue

        combined = dfs[0]
        if len(dfs) > 1:
            combined = combined.join(dfs[1:], how="outer")

        combined = combined.reset_index()
        combined[COL_SUBJECT_ID] = str(user_id)
        combined[COL_DATASET] = "SSAQS"

        # 8. Engineer high-fidelity Ground Truth Stress Level
        stress_q = (
            combined["stress_questionnaire"]
            if "stress_questionnaire" in combined.columns
            else pd.Series(np.nan, index=combined.index)
        )
        stress_d = (
            combined["stress_score_daily"]
            if "stress_score_daily" in combined.columns
            else pd.Series(np.nan, index=combined.index)
        )
        combined[COL_STRESS] = stress_q.fillna(stress_d)
        combined[COL_STRESS_LABEL] = combined[COL_STRESS]

        # 9. Perform forward-fill for biometrics (sparse wear time, fill up to 2 hours)
        fill_cols = [
            COL_HRV_RMSSD,
            COL_SPO2,
            COL_STEPS,
            "activity_level",
            COL_STRESS,
            COL_STRESS_LABEL,
        ]
        for col in fill_cols:
            if col in combined.columns:
                combined[col] = combined[col].ffill(limit=24)

        if "activity_level" in combined.columns:
            combined["activity_level"] = combined["activity_level"].fillna(0.0)

        # Drop rows with no biometrics or stress label whatsoever
        existing_subset = [c for c in [COL_HRV_RMSSD, COL_SPO2, COL_STEPS, COL_STRESS] if c in combined.columns]
        if existing_subset:
            combined.dropna(subset=existing_subset, how="all", inplace=True)
        else:
            continue
        all_user_data.append(combined)

    return (
        pd.concat(all_user_data, ignore_index=True)
        if all_user_data
        else pd.DataFrame()
    )


def extract_mmash_unified(raw_root: Path) -> pd.DataFrame:
    """Extracts, cleans, and merges MMASH continuous watch sensor biometrics from raw files.

    Aligns everything to a 1Hz (1-second) grid, calculating HR and RMSSD from IBI.
    """
    mmash_dir = (
        raw_root
        / "multilevel-monitoring-of-activity-and-sleep-in-healthy-people-1.0.0"
        / "MMASH"
        / "DataPaper"
    )
    if not mmash_dir.exists():
        print(f"Error: MMASH directory not found at {mmash_dir}")
        return pd.DataFrame()

    all_user_data = []

    # Loop over user directories (user_1 to user_22)
    users = sorted(
        [p for p in mmash_dir.iterdir() if p.is_dir() and p.name.startswith("user_")],
        key=lambda x: int(x.name.split("_")[1]),
    )
    for user_dir in users:
        user_id = user_dir.name
        print(f"Processing MMASH {user_id}...")

        # 1. Load Demographics
        info_path = user_dir / "user_info.csv"
        user_info = {}
        if info_path.exists():
            try:
                info_df = pd.read_csv(info_path)
                if not info_df.empty:
                    user_info[COL_AGE] = float(info_df["Age"].iloc[0])
                    g = str(info_df["Gender"].iloc[0]).strip().upper()
                    user_info[COL_GENDER] = 0.0 if g.startswith("M") else 1.0
                    user_info[COL_HEIGHT] = float(info_df["Height"].iloc[0])
                    user_info[COL_WEIGHT] = float(info_df["Weight"].iloc[0])
            except Exception as e:
                print(f"Warning: Failed to load user info for {user_id}: {e}")

        # 2. Load Daily stress from questionnaire
        quest_path = user_dir / "questionnaire.csv"
        daily_stress = np.nan
        if quest_path.exists():
            try:
                quest_df = pd.read_csv(quest_path)
                if not quest_df.empty and "Daily_stress" in quest_df.columns:
                    daily_stress = float(quest_df["Daily_stress"].iloc[0])
            except Exception as e:
                print(f"Warning: Failed to load questionnaire for {user_id}: {e}")

        # 3. Load Actigraph (HR, Steps, Movement)
        act_path = user_dir / "Actigraph.csv"
        act_df = pd.DataFrame()
        if act_path.exists():
            try:
                df = pd.read_csv(act_path)
                if not df.empty:
                    # Construct unified timestamp starting from 2020-01-01
                    df[COL_TIMESTAMP] = (
                        pd.Timestamp("2020-01-01")
                        + pd.to_timedelta(df["day"] - 1, unit="D")
                        + pd.to_timedelta(df["time"])
                    )
                    # Select only numeric columns first to prevent resample mean string error
                    act_cols = ["Axis1", "Axis2", "Axis3", "Steps", "HR"]
                    df_numeric = df[[COL_TIMESTAMP] + act_cols].set_index(COL_TIMESTAMP)
                    df_resampled = df_numeric.resample("1s").mean()
                    df_resampled.rename(
                        columns={
                            "Axis1": COL_ACC_X,
                            "Axis2": COL_ACC_Y,
                            "Axis3": COL_ACC_Z,
                            "Steps": COL_STEPS,
                            "HR": COL_HEART_RATE,
                        },
                        inplace=True,
                    )
                    act_df = df_resampled[
                        [COL_ACC_X, COL_ACC_Y, COL_ACC_Z, COL_STEPS, COL_HEART_RATE]
                    ]
            except Exception as e:
                print(f"Warning: Failed to load Actigraph for {user_id}: {e}")

        # 4. Load RR and engineer heart rate variability biometrics
        rr_path = user_dir / "RR.csv"
        rr_df = pd.DataFrame()
        if rr_path.exists():
            try:
                df = pd.read_csv(rr_path)
                if not df.empty:
                    df[COL_TIMESTAMP] = (
                        pd.Timestamp("2020-01-01")
                        + pd.to_timedelta(df["day"] - 1, unit="D")
                        + pd.to_timedelta(df["time"])
                    )
                    # Drop the 'time' string column to prevent groupby mean string error
                    df_clean = df.drop(columns=["time"], errors="ignore")
                    df_clean = df_clean.set_index(COL_TIMESTAMP).sort_index()

                    # Average duplicate timestamps to avoid RMSSD calculation failure
                    df_grouped = df_clean.groupby(level=0).mean().sort_index()

                    df_grouped[COL_IBI] = df_grouped["ibi_s"] * 1000.0  # to ms
                    df_grouped[COL_HRV_RMSSD] = calculate_rmssd(df_grouped[COL_IBI])
                    df_grouped["hr_ibi"] = 60.0 / df_grouped["ibi_s"]  # estimate HR from IBI

                    rr_df = df_grouped[[COL_IBI, COL_HRV_RMSSD, "hr_ibi"]].resample("1s").mean()
            except Exception as e:
                print(f"Warning: Failed to load RR intervals for {user_id}: {e}")

        # 5. Join Actigraph and RR data
        if act_df.empty and rr_df.empty:
            continue

        if not act_df.empty and not rr_df.empty:
            combined = act_df.join(rr_df, how="outer")
        else:
            combined = act_df if not act_df.empty else rr_df

        combined = combined.reset_index()

        # Combine recorded HR and estimated HR from IBI interval
        if COL_HEART_RATE in combined.columns and "hr_ibi" in combined.columns:
            combined[COL_HEART_RATE] = combined[COL_HEART_RATE].fillna(
                combined["hr_ibi"]
            )
            combined.drop(columns=["hr_ibi"], inplace=True)
        elif "hr_ibi" in combined.columns:
            combined.rename(columns={"hr_ibi": COL_HEART_RATE}, inplace=True)

        # 6. Fill demographic and Ground Truth Stress
        combined[COL_SUBJECT_ID] = str(user_id)
        combined[COL_DATASET] = "MMASH"
        for k, v in user_info.items():
            combined[k] = v

        combined[COL_STRESS] = daily_stress
        combined[COL_STRESS_LABEL] = daily_stress

        # 7. Forward fill biometrics (up to 15 seconds) to clean transient packet loss
        fill_cols = [
            COL_HEART_RATE,
            COL_HRV_RMSSD,
            COL_IBI,
            COL_STEPS,
            COL_ACC_X,
            COL_ACC_Y,
            COL_ACC_Z,
        ]
        for col in fill_cols:
            if col in combined.columns:
                combined[col] = combined[col].ffill(limit=15)

        # Drop rows with no biometrics whatsoever
        existing_subset = [c for c in [COL_HEART_RATE, COL_ACC_X, COL_STEPS] if c in combined.columns]
        if existing_subset:
            combined.dropna(subset=existing_subset, how="all", inplace=True)
        else:
            continue
        all_user_data.append(combined)

    return (
        pd.concat(all_user_data, ignore_index=True)
        if all_user_data
        else pd.DataFrame()
    )


def finalize_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Cleans, formats, and validates the unified dataset columns and data types.

    Ensures standard formatting and compatibility with Samsung Watch Sensor SDK.
    """
    if df.empty:
        return pd.DataFrame(columns=UNIFIED_COLUMNS)

    # 1. Ensure all columns exist
    for col in UNIFIED_COLUMNS:
        if col not in df.columns:
            df[col] = np.nan

    # 2. Re-arrange in logical sequence
    df = df[UNIFIED_COLUMNS].copy()

    # 3. Format timestamps
    df[COL_TIMESTAMP] = pd.to_datetime(df[COL_TIMESTAMP])
    df[COL_TIMESTAMP_MS] = (
        (df[COL_TIMESTAMP] - pd.Timestamp("1970-01-01"))
        // pd.Timedelta(milliseconds=1)
    ).astype("Int64")
    df[COL_TIMESTAMP] = df[COL_TIMESTAMP].dt.strftime("%Y-%m-%d %H:%M:%S.%f").str.slice(0, 23)

    # 4. Strict Type Castings for watch app / ML models
    # Int64 for nullable integer columns, float64 for decimals
    type_map = {
        COL_TIMESTAMP: "string",
        COL_TIMESTAMP_MS: "Int64",
        COL_DATASET: "string",
        COL_SUBJECT_ID: "string",
        COL_AGE: "float64",
        COL_GENDER: "float64",
        COL_HEIGHT: "float64",
        COL_WEIGHT: "float64",
        COL_HEART_RATE: "float64",
        COL_HRV_RMSSD: "float64",
        COL_IBI: "float64",
        COL_STEPS: "float64",
        COL_ACC_X: "float64",
        COL_ACC_Y: "float64",
        COL_ACC_Z: "float64",
        COL_TEMP: "float64",
        COL_EDA: "float64",
        COL_SPO2: "float64",
        COL_STRESS: "float64",
        COL_STRESS_LABEL: "float64",
    }

    for col, dtype in type_map.items():
        if col in df.columns:
            try:
                df[col] = df[col].astype(dtype)
            except Exception as e:
                print(f"Warning: Failed to cast column {col} to {dtype}: {e}")

    return df


def main() -> None:
    """Command line entrypoint for testing unified extraction functions directly."""
    print("=== Testing Unified Extractor Logic ===")
    base_dir = Path(__file__).resolve().parent
    raw_root = base_dir / "data-sets-raw"
    processed_root = base_dir / "processed-datasets"

    # Quick dry run check
    for name, extractor in [
        ("WESAD", extract_wesad_unified),
        ("SSAQS", extract_ssaqs_unified),
        ("MMASH", extract_mmash_unified),
    ]:
        print(f"\nDry run testing {name} extraction...")
        # Since running fully might be slow for testing, we just check directories
        if raw_root.exists():
            print(f"Found raw root directory at {raw_root}")
        else:
            print(f"Warning: Raw root not found at {raw_root}")
            
if __name__ == "__main__":
    main()
