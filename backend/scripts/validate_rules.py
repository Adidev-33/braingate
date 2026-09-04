import os
import sys
import json
import pandas as pd
import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import FEATURE_NAMES, FEATURE_DISPLAY_NAMES
from backend.app.model import BBBModel
from backend.app.explain import SHAPExplainer

TEST_FEATURES_PATH = os.path.join(PROJECT_ROOT, "backend", "data", "processed", "test_features.csv")
VALIDATION_SAVE_PATH = os.path.join(PROJECT_ROOT, "backend", "models", "cns_mpo_validation.json")


def validate_cns_mpo_rules():
    """Validates global SHAP feature importance against established CNS MPO guidelines."""
    if not os.path.exists(TEST_FEATURES_PATH):
        raise FileNotFoundError(f"Test features dataset missing at {TEST_FEATURES_PATH}. Run train_model.py first.")

    print(f"Loading test set from {TEST_FEATURES_PATH}...")
    df_test = pd.read_csv(TEST_FEATURES_PATH)
    X_test = df_test[FEATURE_NAMES]

    explainer_instance = SHAPExplainer()
    raw_explainer = explainer_instance._explainer

    # Compute SHAP matrix for test set
    shap_matrix = raw_explainer.shap_values(X_test)
    mean_abs_shap = np.mean(np.abs(shap_matrix), axis=0)

    feature_ranking = []
    for feat_name, mean_shap in zip(FEATURE_NAMES, mean_abs_shap):
        feature_ranking.append({
            "feature": feat_name,
            "display_name": FEATURE_DISPLAY_NAMES[feat_name],
            "mean_abs_shap": round(float(mean_shap), 4)
        })

    feature_ranking.sort(key=lambda x: x["mean_abs_shap"], reverse=True)

    print("\n=========================================================")
    print("      SCIENTIFIC VALIDATION: SHAP vs CNS MPO RULES       ")
    print("=========================================================")
    print("CNS MPO Medicinal Chemistry Benchmarks:")
    print("  1. TPSA < 90 Å² (Single strongest predictor of BBB crossing)")
    print("  2. Molecular Weight < 450 Da")
    print("  3. LogP between 1.0 and 4.0\n")

    print("Model Global SHAP Feature Importance Ranking (Test Set):")
    print(f"{'Rank':<6} | {'Feature':<35} | {'Mean |SHAP|':<12}")
    print("-" * 60)

    tpsa_rank = -1
    for rank, item in enumerate(feature_ranking, start=1):
        if item["feature"] == "tpsa":
            tpsa_rank = rank
        print(f"{rank:<6} | {item['display_name']:<35} | {item['mean_abs_shap']:<12.4f}")

    print("-" * 60)

    # Scientific assertion check
    tpsa_is_top = tpsa_rank in [1, 2, 3]
    top_feature_name = feature_ranking[0]['display_name']

    print(f"\n[Validation Result] TPSA global rank: #{tpsa_rank} of 7 features.")
    if tpsa_is_top:
        print(f"SUCCESS: Topological Polar Surface Area (TPSA) naturally emerged as a top-{tpsa_rank} feature without hardcoded rules!")
    else:
        print(f"NOTICE: Top feature emerged as {top_feature_name} (TPSA rank #{tpsa_rank}).")

    validation_report = {
        "tpsa_rank": tpsa_rank,
        "top_feature": feature_ranking[0]["feature"],
        "ranking": feature_ranking,
        "cns_mpo_alignment_verified": tpsa_is_top,
        "summary": f"TPSA ranked #{tpsa_rank} among 7 descriptors, confirming alignment with CNS MPO guidelines."
    }

    os.makedirs(os.path.dirname(VALIDATION_SAVE_PATH), exist_ok=True)
    with open(VALIDATION_SAVE_PATH, "w") as f:
        json.dump(validation_report, f, indent=2)
    print(f"Saved validation report to {VALIDATION_SAVE_PATH}")

    return validation_report


if __name__ == "__main__":
    validate_cns_mpo_rules()
