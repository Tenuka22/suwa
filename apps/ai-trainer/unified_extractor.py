from __future__ import annotations

import os
from pathlib import Path
import pandas as pd
import numpy as np
import re

# Unified Column Names (Intuitive Sequence)
# 1. Metadata
COL_TIMESTAMP = 'timestamp'
COL_DATASET = 'dataset'
COL_SUBJECT_ID = 'subject_id'
# 2. Demographics
COL_AGE = 'age'
COL_GENDER = 'gender'
COL_HEIGHT = 'height'
COL_WEIGHT = 'weight'
# 3. Core Biometrics (Samsung Style)
COL_HEART_RATE = 'heart_rate'
COL_HRV_RMSSD = 'hrv_rmssd'
COL_IBI = 'ibi_ms'
# 4. Movement
COL_STEPS = 'steps'
COL_ACC_X = 'acc_x'
COL_ACC_Y = 'acc_y'
COL_ACC_Z = 'acc_z'
# 5. Environment & Sparse Sensors
COL_TEMP = 'temperature'
COL_EDA = 'eda'
COL_SPO2 = 'spo2'
COL_STRESS = 'stress_level'

# Define the logical sequence for all columns
UNIFIED_COLUMNS = [
    COL_TIMESTAMP, COL_DATASET, COL_SUBJECT_ID,
    COL_AGE, COL_GENDER, COL_HEIGHT, COL_WEIGHT,
    COL_HEART_RATE, COL_HRV_RMSSD, COL_IBI,
    COL_STEPS, COL_ACC_X, COL_ACC_Y, COL_ACC_Z,
    COL_TEMP, COL_EDA, COL_SPO2, COL_STRESS
]

def parse_wesad_readme(file_path: Path) -> dict:
    info = {}
    if not file_path.exists(): return info
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            age_match = re.search(r'Age:\s*(\d+)', content)
            if age_match: info[COL_AGE] = int(age_match.group(1))
            height_match = re.search(r'Height\s*\(cm\):\s*(\d+)', content)
            if height_match: info[COL_HEIGHT] = int(height_match.group(1))
            weight_match = re.search(r'Weight\s*\(kg\):\s*(\d+)', content)
            if weight_match: info[COL_WEIGHT] = int(weight_match.group(1))
            gender_match = re.search(r'Gender:\s*(\w+)', content)
            if gender_match:
                g = gender_match.group(1).lower()
                info[COL_GENDER] = 0 if g.startswith('m') else 1 # M=0, F=1
    except Exception: pass
    return info

def calculate_rmssd(ibi_series: pd.Series, window='1min') -> pd.Series:
    if ibi_series.empty: return pd.Series(dtype=float)
    diffs = ibi_series.diff()
    diffs_sq = diffs**2
    rolling_msq = diffs_sq.rolling(window=window, min_periods=5).mean()
    return np.sqrt(rolling_msq) * 1000.0

def load_wesad_e4_csv(file_path: Path, col_names: list[str]) -> pd.DataFrame:
    if not file_path.exists(): return pd.DataFrame()
    with open(file_path, 'r') as f:
        l1 = f.readline().strip().split(',')
        if not l1 or not l1[0]: return pd.DataFrame()
        st = float(l1[0])
        l2 = f.readline().strip().split(',')
        if not l2 or not l2[0]: return pd.DataFrame()
        sr = float(l2[0])
    df = pd.read_csv(file_path, header=None, skiprows=2)
    df[COL_TIMESTAMP] = pd.to_datetime(st + np.arange(len(df)) / sr, unit='s')
    data_cols = [c for c in df.columns if c != COL_TIMESTAMP]
    if len(data_cols) == len(col_names):
        df.rename(columns={data_cols[i]: col_names[i] for i in range(len(data_cols))}, inplace=True)
    return df[[COL_TIMESTAMP] + col_names]

def extract_wesad_unified(raw_root: Path) -> pd.DataFrame:
    wesad_dir = raw_root / "WESAD"
    if not wesad_dir.exists(): return pd.DataFrame()
    all_subject_data = []
    for subject_dir in sorted([p for p in wesad_dir.iterdir() if p.is_dir() and p.name.startswith("S")]):
        data_dir = subject_dir / f"{subject_dir.name}_E4_Data"
        if not data_dir.exists(): continue
        print(f"Processing WESAD {subject_dir.name}...")
        try:
            hr = load_wesad_e4_csv(data_dir / "HR.csv", [COL_HEART_RATE])
            temp = load_wesad_e4_csv(data_dir / "TEMP.csv", [COL_TEMP])
            eda = load_wesad_e4_csv(data_dir / "EDA.csv", [COL_EDA])
            acc = load_wesad_e4_csv(data_dir / "ACC.csv", [COL_ACC_X, COL_ACC_Y, COL_ACC_Z])
            
            # WESAD ACC to m/s^2
            if not acc.empty:
                for c in [COL_ACC_X, COL_ACC_Y, COL_ACC_Z]: acc[c] = (acc[c] / 64.0) * 9.81
            
            ibi_path = data_dir / "IBI.csv"
            ibi_df = pd.DataFrame()
            if ibi_path.exists():
                with open(ibi_path, 'r') as f:
                    line = f.readline().strip().split(',')
                    if line and line[0]:
                        st = float(line[0])
                        ibi_raw = pd.read_csv(ibi_path, header=None, skiprows=1)
                        ibi_raw.columns = ['offset', COL_IBI]
                        ibi_raw[COL_TIMESTAMP] = pd.to_datetime(st + ibi_raw['offset'], unit='s')
                        ibi_raw = ibi_raw.set_index(COL_TIMESTAMP).sort_index()
                        ibi_raw[COL_HRV_RMSSD] = calculate_rmssd(ibi_raw[COL_IBI])
                        ibi_raw[COL_IBI] = ibi_raw[COL_IBI] * 1000.0 # to ms
                        ibi_df = ibi_raw.reset_index()

            res = lambda df: df.set_index(COL_TIMESTAMP).resample('1s').mean() if not df.empty else pd.DataFrame()
            combined = res(hr).join([res(temp), res(eda), res(acc), res(ibi_df)], how='outer').reset_index()
            combined[COL_SUBJECT_ID] = subject_dir.name
            combined[COL_DATASET] = "WESAD"
            
            # Fill Gaps (Maximize Density)
            # HR, Temp, EDA are filled aggressively to match 1Hz grid
            for col in [COL_HEART_RATE, COL_TEMP, COL_EDA, COL_HRV_RMSSD, COL_IBI]:
                if col in combined.columns:
                    combined[col] = combined[col].ffill(limit=30) # Fill up to 30s gap
            
            info = parse_wesad_readme(subject_dir / f"{subject_dir.name}_readme.txt")
            for k, v in info.items(): combined[k] = v
            
            combined.dropna(subset=[COL_HEART_RATE, COL_ACC_X, COL_TEMP, COL_EDA], how='all', inplace=True)
            all_subject_data.append(combined)
        except Exception as e: print(f"Error WESAD {subject_dir.name}: {e}")
    return pd.concat(all_subject_data, ignore_index=True) if all_subject_data else pd.DataFrame()

def extract_ssaqs_unified(processed_root: Path) -> pd.DataFrame:
    ssaqs_dir = processed_root / "ssaqs"
    if not ssaqs_dir.exists(): return pd.DataFrame()
    try:
        hrv = pd.read_csv(ssaqs_dir / "hrv.csv")
        oxy = pd.read_csv(ssaqs_dir / "oxygen.csv")
        stps = pd.read_csv(ssaqs_dir / "steps.csv")
        strs = pd.read_csv(ssaqs_dir / "stress.csv")
        col_map = {'rmssd': COL_HRV_RMSSD, 'value': COL_SPO2, 'STRESS_SCORE': COL_STRESS, 'DATE': COL_TIMESTAMP, 'user_id': COL_SUBJECT_ID}
        for df in [hrv, oxy, stps, strs]:
            df.rename(columns=col_map, inplace=True, errors='ignore')
            df[COL_TIMESTAMP] = pd.to_datetime(df[COL_TIMESTAMP]).dt.tz_localize(None)
        all_user_data = []
        for uid in hrv[COL_SUBJECT_ID].unique():
            f = lambda d: d[d[COL_SUBJECT_ID] == uid].set_index(COL_TIMESTAMP).select_dtypes(include=[np.number]).resample('5min')
            u = f(hrv).mean().join([f(oxy).mean()[[COL_SPO2]], f(stps).sum()[[COL_STEPS]], f(strs).mean()[[COL_STRESS]]], how='outer')
            u = u.ffill(limit=24).reset_index() # ffill 2 hours for sparse SSAQS
            u[COL_SUBJECT_ID] = str(uid)
            u[COL_DATASET] = "SSAQS"
            u.dropna(subset=[COL_HRV_RMSSD, COL_SPO2, COL_STEPS, COL_STRESS], how='all', inplace=True)
            all_user_data.append(u)
        return pd.concat(all_user_data, ignore_index=True) if all_user_data else pd.DataFrame()
    except Exception as e: print(f"Error SSAQS: {e}"); return pd.DataFrame()

def extract_mmash_unified(processed_root: Path) -> pd.DataFrame:
    mmash_dir = processed_root / "mmash"
    if not mmash_dir.exists(): return pd.DataFrame()
    try:
        rr = pd.read_csv(mmash_dir / "rr.csv")
        act = pd.read_csv(mmash_dir / "actigraph.csv")
        info_df = pd.read_csv(mmash_dir / "user_info.csv")
        make_ts = lambda d: pd.Timestamp('2020-01-01') + pd.to_timedelta(d['day']-1, unit='D') + pd.to_timedelta(d['time'])
        rr[COL_TIMESTAMP] = make_ts(rr); act[COL_TIMESTAMP] = make_ts(act)
        rr.rename(columns={'user_id': COL_SUBJECT_ID, 'ibi_s': COL_IBI}, inplace=True)
        act.rename(columns={'user_id': COL_SUBJECT_ID, 'Axis1': COL_ACC_X, 'Axis2': COL_ACC_Y, 'Axis3': COL_ACC_Z, 'Steps': COL_STEPS, 'HR': COL_HEART_RATE}, inplace=True)
        all_user_data = []
        for uid in rr[COL_SUBJECT_ID].unique():
            u_rr = rr[rr[COL_SUBJECT_ID] == uid].sort_values(COL_TIMESTAMP).groupby(COL_TIMESTAMP).mean(numeric_only=True).reset_index()
            u_act = act[act[COL_SUBJECT_ID] == uid].sort_values(COL_TIMESTAMP).groupby(COL_TIMESTAMP).mean(numeric_only=True).reset_index()
            
            idx = u_rr.set_index(COL_TIMESTAMP)
            idx[COL_HRV_RMSSD] = calculate_rmssd(idx[COL_IBI])
            idx['hr_ibi'] = 60.0 / idx[COL_IBI]
            idx[COL_IBI] = idx[COL_IBI] * 1000.0
            
            res_rr = idx[[COL_IBI, COL_HRV_RMSSD, 'hr_ibi']].resample('1s').mean()
            res_act = u_act.set_index(COL_TIMESTAMP)[[COL_ACC_X, COL_ACC_Y, COL_ACC_Z, COL_STEPS, COL_HEART_RATE]].resample('1s').mean()
            
            u = res_rr.join(res_act, how='outer').reset_index()
            u[COL_HEART_RATE] = u[COL_HEART_RATE].fillna(u['hr_ibi'])
            u.drop(columns=['hr_ibi'], inplace=True)
            
            # Fill gaps for density
            for c in [COL_HEART_RATE, COL_HRV_RMSSD, COL_IBI, COL_STEPS]:
                if c in u.columns: u[c] = u[c].ffill(limit=15)
            
            u[COL_SUBJECT_ID] = str(uid); u[COL_DATASET] = "MMASH"
            m = info_df[info_df['user_id'] == uid]
            if not m.empty:
                u[COL_AGE] = m['Age'].values[0]
                u[COL_GENDER] = 0 if m['Gender'].values[0] == 'M' else 1
                u[COL_HEIGHT] = m['Height'].values[0]
                u[COL_WEIGHT] = m['Weight'].values[0]
            u.dropna(subset=[COL_HEART_RATE, COL_ACC_X, COL_STEPS], how='all', inplace=True)
            all_user_data.append(u)
        return pd.concat(all_user_data, ignore_index=True) if all_user_data else pd.DataFrame()
    except Exception as e: print(f"Error MMASH: {e}"); return pd.DataFrame()

def finalize_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Standardizes column sequence and cleans 100% empty columns."""
    if df.empty: return df
    for col in UNIFIED_COLUMNS:
        if col not in df.columns: df[col] = np.nan
    df = df[UNIFIED_COLUMNS]
    # Remove columns that are COMPLETELY empty (NaN) for this dataset
    # This identifies what sensors were actually available.
    return df.dropna(axis=1, how='all')

def main():
    base_dir = Path(".").resolve()
    raw_root = base_dir / "data-sets-raw"
    processed_root = base_dir / "processed-datasets"
    if not raw_root.exists():
        raw_root = base_dir / "apps" / "ai-trainer" / "data-sets-raw"
        processed_root = base_dir / "apps" / "ai-trainer" / "processed-datasets"

    for extractor, name in [(extract_wesad_unified, "wesad"), (extract_ssaqs_unified, "ssaqs"), (extract_mmash_unified, "mmash")]:
        print(f"\nExtracting {name}...")
        df = extractor(raw_root if name == "wesad" else processed_root)
        df = finalize_dataset(df)
        if not df.empty:
            out_path = processed_root / f"{name}_unified_prediction.csv"
            df.to_csv(out_path, index=False)
            print(f"Saved {name}: {len(df)} rows, {len(df.columns)} columns.")
            print(f"Available: {list(df.columns)}")
        else:
            print(f"No data for {name}")

if __name__ == "__main__":
    main()
