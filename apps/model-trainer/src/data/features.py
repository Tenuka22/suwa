import numpy as np
import pandas as pd


def filter_hardware_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Filters the dataset to include only features that a MAX30102 sensor can reasonably extract.
    
    MAX30102 Characteristics:
    - Integrated Pulse Oximetry and Heart-Rate Monitor.
    - Extracts Red and IR (Infrared) PPG signals.
    - Derived data: Heart Rate (HR), SpO2 (Oxygen Saturation), and RR Intervals (RRI).
    - Features below are derived from these raw signals (HRV analysis).
    - Sampling: User specified ~4Hz processed features.
    """
    
    # We select features that can be derived from the heart-rate/RRI signals 
    # provided by the MAX30102 PPG sensor.
    target_features = [
        "MEAN_RR",       # Average time between heartbeats
        "MEDIAN_RR",     # Median time between heartbeats
        "SDRR",          # Standard deviation of RR intervals (Overall HRV)
        "RMSSD",         # Root mean square of successive differences (Parasympathetic activity)
        "SDSD",          # Standard deviation of successive differences
        "SDRR_RMSSD",    # Ratio of SDRR to RMSSD
        "HR",            # Heart Rate (BPM)
        "pNN25",         # Percentage of RR intervals differing by >25ms
        "pNN50",         # Percentage of RR intervals differing by >50ms
        "SD1",           # Poincaré plot short-term variability
        "SD2",           # Poincaré plot long-term variability
    ]
    
    # Identify which columns are present in the current dataframe
    available_features = [col for col in target_features if col in df.columns]
    
    # Return the filtered dataframe with readable names (keeping original case/naming as requested)
    return df[available_features]


def create_sequences_by_subject(
    subjects_data: list, 
    seq_len: int
) -> tuple[np.ndarray, np.ndarray]:
    """
    Groups data by user and creates sequences.
    
    Feature Window: Current sequence (seq_len items).
    Target Label: Majority vote of the next 10% of items immediately following the sequence.
    (e.g., if seq_len=120, label is derived from the next 12 items).
    """
    all_X = []
    all_y = []
    
    # Target size is 10% of seq_len
    target_size = int(seq_len * 0.1)
    if target_size == 0:
        target_size = 1
        
    for subj_id, features, labels, _ in subjects_data:
        n_samples = len(features)
        
        # We need seq_len + target_size items available to create a sequence
        for i in range(0, n_samples - seq_len - target_size + 1, seq_len):
            # Current window (Features)
            x_window = features[i : i + seq_len]
            
            # Target labels (Next 10% of items)
            future_segment_labels = labels[i + seq_len : i + seq_len + target_size]
            
            # Majority vote for the future state
            counts = np.bincount(future_segment_labels.astype(np.intp), minlength=3)
            y_label = np.argmax(counts)
            
            all_X.append(x_window)
            all_y.append(y_label)
            
    return np.array(all_X, dtype=np.float32), np.array(all_y, dtype=np.uint8)

