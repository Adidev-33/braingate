import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    mean_squared_error,
    mean_absolute_error,
    r2_score
)

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import FEATURE_NAMES

PROCESSED_DIR = os.path.join(PROJECT_ROOT, "backend", "data", "processed")
MODELS_DIR = os.path.join(PROJECT_ROOT, "backend", "models")
TOX21_CSV_PATH = os.path.join(PROCESSED_DIR, "tox21_processed.csv")
ESOL_CSV_PATH = os.path.join(PROCESSED_DIR, "esol_processed.csv")

TOX21_MODEL_PATH = os.path.join(MODELS_DIR, "xgb_tox21_model.pkl")
ESOL_MODEL_PATH = os.path.join(MODELS_DIR, "xgb_esol_model.pkl")
STRETCH_METRICS_PATH = os.path.join(MODELS_DIR, "stretch_metrics.json")


def train_tox21():
    """Train XGBoost binary classifier for Tox21 toxicity risk."""
    print("\n" + "=" * 70)
    print(" 1. TRAINING TOX21 TOXICITY CLASSIFIER ")
    print("=" * 70)

    if not os.path.exists(TOX21_CSV_PATH):
        raise FileNotFoundError(f"Tox21 data missing at {TOX21_CSV_PATH}. Run data_prep_stretch.py first.")

    df = pd.read_csv(TOX21_CSV_PATH)
    X = df[FEATURE_NAMES]
    y = df["toxic"]

    # Stratified 80/10/10 split
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.10, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.1111, random_state=42, stratify=y_train_val
    )

    neg_count = np.sum(y_train == 0)
    pos_count = np.sum(y_train == 1)
    scale_pos_weight = float(neg_count / pos_count)
    print(f"Dataset split: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")
    print(f"Class imbalance: neg={neg_count}, pos={pos_count}, scale_pos_weight={scale_pos_weight:.4f}")

    clf = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        random_state=42,
        early_stopping_rounds=30
    )

    clf.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    y_pred_proba = clf.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)

    roc_auc = float(roc_auc_score(y_test, y_pred_proba))
    bal_acc = float(balanced_accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    cm = confusion_matrix(y_test, y_pred).tolist()

    print(f"\n--- Tox21 Test Set Metrics ---")
    print(f"  - ROC-AUC: {roc_auc:.4f}")
    print(f"  - Balanced Accuracy: {bal_acc:.4f}")
    print(f"  - Precision: {prec:.4f}")
    print(f"  - Recall: {rec:.4f}")
    print(f"  - F1 Score: {f1:.4f}")
    print(f"  - Confusion Matrix: {cm}")

    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(clf, TOX21_MODEL_PATH)
    print(f"Saved Tox21 model to {TOX21_MODEL_PATH}")

    return {
        "roc_auc": round(roc_auc, 4),
        "balanced_accuracy": round(bal_acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm,
        "test_samples": len(y_test)
    }


def train_esol():
    """Train XGBoost regressor for ESOL log solubility."""
    print("\n" + "=" * 70)
    print(" 2. TRAINING ESOL SOLUBILITY REGRESSOR ")
    print("=" * 70)

    if not os.path.exists(ESOL_CSV_PATH):
        raise FileNotFoundError(f"ESOL data missing at {ESOL_CSV_PATH}. Run data_prep_stretch.py first.")

    df = pd.read_csv(ESOL_CSV_PATH)
    X = df[FEATURE_NAMES]
    y = df["log_solubility"]

    # 80/10/10 split
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.10, random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.1111, random_state=42
    )

    print(f"Dataset split: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")

    reg = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        eval_metric="rmse",
        random_state=42,
        early_stopping_rounds=30
    )

    reg.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    y_pred = reg.predict(X_test)

    mse = mean_squared_error(y_test, y_pred)
    rmse = float(np.sqrt(mse))
    mae = float(mean_absolute_error(y_test, y_pred))
    r2 = float(r2_score(y_test, y_pred))

    print(f"\n--- ESOL Test Set Metrics ---")
    print(f"  - RMSE: {rmse:.4f} (log mol/L)")
    print(f"  - MAE: {mae:.4f} (log mol/L)")
    print(f"  - R² Score: {r2:.4f}")

    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(reg, ESOL_MODEL_PATH)
    print(f"Saved ESOL model to {ESOL_MODEL_PATH}")

    return {
        "rmse": round(rmse, 4),
        "mae": round(mae, 4),
        "r2_score": round(r2, 4),
        "test_samples": len(y_test)
    }


if __name__ == "__main__":
    tox21_metrics = train_tox21()
    esol_metrics = train_esol()

    stretch_metrics = {
        "tox21": tox21_metrics,
        "esol": esol_metrics
    }

    with open(STRETCH_METRICS_PATH, "w") as f:
        json.dump(stretch_metrics, f, indent=2)
    print(f"\nAll stretch metrics saved to {STRETCH_METRICS_PATH}")
