from collections.abc import Callable
from typing import Any

import numpy as np

from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

import log


def subject_split(X, y, groups, random_state=42):
    gss1 = GroupShuffleSplit(n_splits=1, test_size=0.3, random_state=random_state)
    train_idx, temp_idx = next(gss1.split(X, y, groups=groups))

    temp_groups = groups[temp_idx]
    gss2 = GroupShuffleSplit(n_splits=1, test_size=0.5, random_state=random_state)
    val_rel, test_rel = next(gss2.split(X[temp_idx], y[temp_idx], groups=temp_groups))

    val_idx = temp_idx[val_rel]
    test_idx = temp_idx[test_rel]

    X_train, X_val, X_test = X[train_idx], X[val_idx], X[test_idx]
    y_train, y_val, y_test = y[train_idx], y[val_idx], y[test_idx]

    train_subjects = groups[train_idx]
    val_subjects = groups[val_idx]
    test_subjects = groups[test_idx]

    return (X_train, X_val, X_test,
            y_train, y_val, y_test,
            train_subjects, val_subjects, test_subjects)


def scale_data(X_train, X_val, X_test):
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train).astype(np.float32)
    X_val_s = scaler.transform(X_val).astype(np.float32)
    X_test_s = scaler.transform(X_test).astype(np.float32)
    return X_train_s, X_val_s, X_test_s, scaler


def create_sequences(data, labels, subjects, seq_len=30, step=10):
    X_s, y_s = [], []
    for s in np.unique(subjects):
        mask = subjects == s
        X_sub = data[mask]
        y_sub = labels[mask]
        for i in range(0, len(X_sub) - seq_len + 1, step):
            X_s.append(X_sub[i : i + seq_len])
            y_s.append(y_sub[i + seq_len - 1])
    return np.array(X_s, dtype=np.float32), np.array(y_s)


def prepare_sequences(X_train_s, X_val_s, X_test_s,
                      y_train, y_val, y_test,
                      train_subjects, val_subjects, test_subjects,
                      seq_len=30, step=10):
    X_tr, y_tr = create_sequences(X_train_s, y_train, train_subjects, seq_len, step)
    X_va, y_va = create_sequences(X_val_s, y_val, val_subjects, seq_len, step)
    X_te, y_te = create_sequences(X_test_s, y_test, test_subjects, seq_len, step)
    return (X_tr, y_tr), (X_va, y_va), (X_te, y_te)


def compute_class_weights(y_train):
    classes = np.unique(y_train)
    w = compute_class_weight(class_weight="balanced", classes=classes, y=y_train)
    return dict(enumerate(w))


def make_sample_weights(y, class_weight_dict):
    return np.array([class_weight_dict[i] for i in y], dtype=np.float64)


def evaluate_model(name, model, X_test, y_test, le):
    import xgboost as xgb
    if isinstance(model, xgb.Booster):
        preds = model.predict(xgb.DMatrix(X_test))
    else:
        preds = model.predict(X_test, batch_size=256)
    if preds.ndim == 2:
        preds = preds.argmax(axis=1)

    cm = confusion_matrix(y_test, preds)
    total = cm.sum()
    correct = cm.trace()
    overall_acc = correct / total

    log.header("EVALUATION")
    log.info(f"Overall accuracy: {overall_acc:.4f}  ({correct}/{total})")

    log.info("Per-class metrics:")
    log.detail(f"{'Class':>18s}  {'Acc':>6s}  {'Prec':>6s}  {'Recall':>7s}  {'F1':>6s}  {'FP':>4s}  {'FN':>4s}  {'Support':>7s}")
    for i, cls in enumerate(le.classes_):
        tp = cm[i, i]
        fp = cm[:, i].sum() - tp
        fn = cm[i, :].sum() - tp
        n = cm[i, :].sum()
        acc_i = tp / n if n > 0 else 0.0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
        log.detail(f"{cls:>18s}  {acc_i:>6.3f}  {prec:>6.3f}  {rec:>7.3f}  {f1:>6.3f}  {fp:>4d}  {fn:>4d}  {n:>7d}")


    return preds


def flatten_sequences(X_seq):
    n, seq_len, n_feats = X_seq.shape
    X_flat = X_seq.reshape(n, seq_len * n_feats)
    return X_flat


def aggregate_sequences(X_seq):
    n, seq_len, n_feats = X_seq.shape
    agg = np.zeros((n, n_feats * 5), dtype=np.float32)
    for i in range(n):
        agg[i, 0*n_feats:1*n_feats] = X_seq[i].mean(axis=0)
        agg[i, 1*n_feats:2*n_feats] = X_seq[i].std(axis=0)
        agg[i, 2*n_feats:3*n_feats] = X_seq[i].min(axis=0)
        agg[i, 3*n_feats:4*n_feats] = X_seq[i].max(axis=0)
        agg[i, 4*n_feats:5*n_feats] = X_seq[i][-1] - X_seq[i][0]
    return agg


def loso_subject_split(X, y, groups, test_subject):
    train_mask = groups != test_subject
    test_mask = groups == test_subject
    X_train, X_test = X[train_mask], X[test_mask]
    y_train, y_test = y[train_mask], y[test_mask]
    groups_train = groups[train_mask]

    val_ratio = 0.2
    subjects_train = np.unique(groups_train)
    n_val_subj = max(1, int(len(subjects_train) * val_ratio))
    rng = np.random.default_rng(42)
    rng.shuffle(subjects_train)
    val_subjects = set(subjects_train[:n_val_subj])

    val_mask = np.isin(groups_train, list(val_subjects))
    train_mask_inner = ~val_mask
    X_val, y_val = X_train[val_mask], y_train[val_mask]
    X_tr, y_tr = X_train[train_mask_inner], y_train[train_mask_inner]

    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_tr).astype(np.float32)
    X_val_s = scaler.transform(X_val).astype(np.float32)
    X_te_s = scaler.transform(X_test).astype(np.float32)

    return X_tr_s, X_val_s, X_te_s, y_tr, y_val, y_test, scaler


def loso_evaluate(
    X: np.ndarray,
    y: np.ndarray,
    groups: np.ndarray,
    le: LabelEncoder,
    build_model: Callable[..., Any],
    seq_len: int = 30,
    step: int = 10,
    use_raw_sequences: bool = False,
) -> dict[str, Any]:
    subjects = np.unique(groups)
    all_accs = []
    all_cms = None
    n_classes = len(le.classes_)

    log.header(f"LOSO Evaluation ({len(subjects)} folds)")

    for i, test_subj in enumerate(subjects):
        X_tr_s, X_val_s, X_te_s, y_tr, y_val, y_te, scaler = loso_subject_split(
            X, y, groups, test_subj
        )

        (X_tr_seq, y_tr_seq), (X_va_seq, y_va_seq), (X_te_seq, y_te_seq) = prepare_sequences(
            X_tr_s, X_val_s, X_te_s, y_tr, y_val, y_te,
            np.full(len(y_tr), 0), np.full(len(y_val), 1), np.full(len(y_te), 2),
            seq_len, step,
        )

        X_tr_a = aggregate_sequences(X_tr_seq)
        X_va_a = aggregate_sequences(X_va_seq)
        X_te_a = aggregate_sequences(X_te_seq)

        model = build_model(
            X_tr_seq if use_raw_sequences else X_tr_a,
            y_tr_seq,
            X_va_seq if use_raw_sequences else X_va_a,
            y_va_seq,
        )

        eval_data = X_te_seq if use_raw_sequences else X_te_a

        if hasattr(model, "predict"):
            if "xgboost" in type(model).__module__:
                import xgboost as xgb
                preds = model.predict(xgb.DMatrix(eval_data)).argmax(axis=1)
            else:
                preds = model.predict(eval_data, verbose=0)
                if preds.ndim == 2:
                    preds = preds.argmax(axis=1)
        else:
            preds = model(eval_data)

        acc = accuracy_score(y_te_seq, preds)
        all_accs.append(acc)

        cm_fold = confusion_matrix(y_te_seq, preds, labels=range(n_classes))
        if all_cms is None:
            all_cms = cm_fold
        else:
            all_cms += cm_fold

        log.info(f"Fold {i+1}/{len(subjects)}  subject={test_subj}  acc={acc:.4f}")

    all_accs = np.array(all_accs)
    mean_acc = all_accs.mean()
    std_acc = all_accs.std()

    log.header("LOSO Results")
    log.info(f"Mean LOSO accuracy: {mean_acc:.4f}  (±{std_acc:.4f})")
    log.detail(f"Per-subject accuracies: {np.round(all_accs, 4).tolist()}")

    if all_cms is not None:
        correct = all_cms.trace()
        total = all_cms.sum()
        log.info(f"Total accuracy: {correct/total:.4f}  ({correct}/{total})")
        log.detail(f"{'Class':>18s}  {'Acc':>6s}  {'Prec':>6s}  {'Recall':>7s}  {'F1':>6s}  {'FP':>4s}  {'FN':>4s}  {'Support':>7s}")
        for ci, cls in enumerate(le.classes_):
            tp = all_cms[ci, ci]
            fp = all_cms[:, ci].sum() - tp
            fn = all_cms[ci, :].sum() - tp
            n = all_cms[ci, :].sum()
            acc_i = tp / n if n > 0 else 0.0
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
            log.detail(f"{cls:>18s}  {acc_i:>6.3f}  {prec:>6.3f}  {rec:>7.3f}  {f1:>6.3f}  {fp:>4d}  {fn:>4d}  {n:>7d}")

    return {"per_subject": all_accs, "mean": mean_acc, "std": std_acc, "confusion": all_cms}


SEQ_LEN = 30
STEP = 10
RANDOM_STATE = 42
EPOCHS = 30
BATCH_SIZE = 256
PATIENCE = 5
LR = 5e-4
