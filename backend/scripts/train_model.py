import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
import xgboost as xgb
from backend.app.features import FEATURE_NAMES

FEATURES_CSV_PATH = os.path.join(PROJECT_ROOT, "backend", "data", "processed", "features_df.csv")
MODEL_SAVE_PATH = os.path.join(PROJECT_ROOT, "backend", "models", "xgb_bbbp_model.pkl")
METRICS_SAVE_PATH = os.path.join(PROJECT_ROOT, "backend", "models", "metrics.json")
TEST_FEATURES_PATH = os.path.join(PROJECT_ROOT, "backend", "data", "processed", "test_features.csv")


def train_xgboost():
    """Train XGBoost model on extracted RDKit features."""
    if not os.path.exists(FEATURES_CSV_PATH):
        raise FileNotFoundError(f"Features file missing at {FEATURES_CSV_PATH}. Run features.py first.")

    print(f"Loading feature dataset from {FEATURES_CSV_PATH}...")
    df = pd.read_csv(FEATURES_CSV_PATH)

    X = df[FEATURE_NAMES]
    y = df["p_np"]

    # Stratified split: 80% train, 10% validation, 10% test
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.10, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.1111, random_state=42, stratify=y_train_val
    )  # 0.1111 * 0.90 approx 10% of total

    print(f"Dataset Split Summary:")
    print(f"  - Train size: {len(X_train)} samples")
    print(f"  - Validation size: {len(X_val)} samples")
    print(f"  - Test size: {len(X_test)} samples")

    # Handle class imbalance via scale_pos_weight
    neg_count = np.sum(y_train == 0)
    pos_count = np.sum(y_train == 1)
    scale_pos_weight = neg_count / pos_count
    print(f"Class Imbalance Handling: scale_pos_weight = {scale_pos_weight:.4f} (neg={neg_count}, pos={pos_count})")

    # Initialize XGBClassifier
    clf = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        random_state=42,
        early_stopping_rounds=30
    )

    print("Training XGBoost Classifier...")
    clf.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    # Evaluate on held-out test set
    y_pred_proba = clf.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)

    roc_auc = roc_auc_score(y_test, y_pred_proba)
    bal_acc = balanced_accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("\n--- Test Set Evaluation Results ---")
    print(f"  - ROC-AUC Score: {roc_auc:.4f} (Benchmark Target: >0.85)")
    print(f"  - Balanced Accuracy: {bal_acc:.4f}")
    print(f"  - Precision: {prec:.4f}")
    print(f"  - Recall: {rec:.4f}")
    print(f"  - F1 Score: {f1:.4f}")
    print(f"  - Confusion Matrix: {cm}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=["Non-Permeable", "Permeable"]))

    # Save model artifact
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    joblib.dump(clf, MODEL_SAVE_PATH)
    print(f"Saved trained XGBoost model to {MODEL_SAVE_PATH}")

    # Save test set data & metrics for explainability validation
    metrics = {
        "roc_auc": round(float(roc_auc), 4),
        "balanced_accuracy": round(float(bal_acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "confusion_matrix": cm,
        "test_samples": len(y_test)
    }

    with open(METRICS_SAVE_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metrics to {METRICS_SAVE_PATH}")

    # Save test set features CSV for SHAP global analysis
    X_test_copy = X_test.copy()
    X_test_copy["p_np_true"] = y_test.values
    X_test_copy["p_np_pred_prob"] = y_pred_proba
    X_test_copy.to_csv(TEST_FEATURES_PATH, index=False)
    print(f"Saved test features to {TEST_FEATURES_PATH}")

    return clf, metrics


if __name__ == "__main__":
    train_xgboost()
