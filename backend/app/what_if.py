import os
import sys
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import FEATURE_NAMES, compute_descriptors
from backend.app.model import BBBModel

# Sensible default descriptor bounds and stepping for simulation & response curves
DESCRIPTOR_RANGES = {
    "mol_weight": {"min": 50.0, "max": 800.0, "step": 10.0, "unit": "Da"},
    "logp": {"min": -5.0, "max": 8.0, "step": 0.25, "unit": ""},
    "tpsa": {"min": 0.0, "max": 250.0, "step": 5.0, "unit": "Å²"},
    "h_donors": {"min": 0, "max": 12, "step": 1, "unit": ""},
    "h_acceptors": {"min": 0, "max": 15, "step": 1, "unit": ""},
    "rotatable_bonds": {"min": 0, "max": 20, "step": 1, "unit": ""},
    "aromatic_rings": {"min": 0, "max": 8, "step": 1, "unit": ""}
}


def run_what_if_simulation(
    smiles: Optional[str] = None,
    original_features: Optional[Dict[str, float]] = None,
    modified_descriptors: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Executes a What-If simulation by applying descriptor modifications on top of a baseline molecule.
    Uses the real trained XGBoost model without retraining.
    """
    if modified_descriptors is None:
        modified_descriptors = {}

    # 1. Obtain baseline features
    base_features: Optional[Dict[str, float]] = None
    if original_features is not None and all(k in original_features for k in FEATURE_NAMES):
        base_features = {k: float(original_features[k]) for k in FEATURE_NAMES}
    elif smiles:
        base_features = compute_descriptors(smiles.strip())

    if base_features is None:
        raise ValueError("Invalid input: Provide a valid SMILES string or a complete original descriptor dictionary.")

    # 2. Compute original prediction with real trained model
    model = BBBModel()
    orig_pred = model.predict(base_features)

    # 3. Construct modified feature vector (applying user overrides on top of base features)
    merged_features = base_features.copy()
    for feat_name, val in modified_descriptors.items():
        if feat_name in FEATURE_NAMES and val is not None:
            # Cast integer-typed features appropriately
            if feat_name in ["h_donors", "h_acceptors", "rotatable_bonds", "aromatic_rings"]:
                merged_features[feat_name] = int(round(float(val)))
            else:
                merged_features[feat_name] = round(float(val), 2)

    # 4. Run real model prediction on modified feature vector
    new_pred = model.predict(merged_features)

    # 5. Compute deltas
    orig_prob = orig_pred["permeable_probability"]
    new_prob = new_pred["permeable_probability"]
    delta_prob = round(new_prob - orig_prob, 4)
    delta_percentage_points = round(delta_prob * 100.0, 2)

    return {
        "valid_input": True,
        "original_probability": orig_prob,
        "new_probability": new_prob,
        "delta_probability": delta_prob,
        "delta_percentage_points": delta_percentage_points,
        "original_prediction": orig_pred["prediction"],
        "new_prediction": new_pred["prediction"],
        "original_confidence": orig_pred["confidence"],
        "new_confidence": new_pred["confidence"],
        "original_descriptors": base_features,
        "modified_descriptors": merged_features,
        "disclaimer": "Computational prediction based on machine learning model; not an experimental assay result."
    }


def generate_response_curve(
    base_descriptors: Dict[str, float],
    target_feature: str,
    min_val: Optional[float] = None,
    max_val: Optional[float] = None,
    num_points: int = 25
) -> List[Dict[str, Any]]:
    """
    Generates response curve data (BBB probability vs feature value) across a specified range
    while holding all other descriptors fixed at base_descriptors values.
    """
    if target_feature not in FEATURE_NAMES:
        raise ValueError(f"Unknown target feature: {target_feature}. Must be one of {FEATURE_NAMES}")

    default_range = DESCRIPTOR_RANGES.get(target_feature, {"min": 0.0, "max": 100.0})
    f_min = float(min_val if min_val is not None else default_range["min"])
    f_max = float(max_val if max_val is not None else default_range["max"])

    if f_min >= f_max:
        f_max = f_min + 10.0

    is_int_feat = target_feature in ["h_donors", "h_acceptors", "rotatable_bonds", "aromatic_rings"]
    
    if is_int_feat:
        val_range = list(range(int(f_min), int(f_max) + 1))
    else:
        val_range = [round(float(v), 2) for v in np.linspace(f_min, f_max, num_points)]

    model = BBBModel()
    curve_points = []

    for val in val_range:
        current_features = base_descriptors.copy()
        current_features[target_feature] = int(val) if is_int_feat else val
        pred = model.predict(current_features)
        curve_points.append({
            "feature_value": val,
            "permeable_probability": pred["permeable_probability"],
            "prediction": pred["prediction"]
        })

    return curve_points
