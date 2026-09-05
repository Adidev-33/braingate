"""
BrainGate Molecular Optimization Engine (Level 1: Descriptor Optimization)
--------------------------------------------------------------------------
Generates hypothetical modified descriptor configurations for molecules with poor
or borderline BBB permeability using SHAP feature attribution guidance and CNS MPO
(Central Nervous System Multiparameter Optimization) principles.

Every candidate is evaluated through the real trained XGBoost model (BBBModel)
with zero fabricated scores.
"""

import sys
import os
import copy
from typing import Dict, List, Any, Optional, Tuple

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import compute_descriptors, FEATURE_DISPLAY_NAMES, FEATURE_NAMES

FEATURE_ORDER = FEATURE_NAMES
from backend.app.model import BBBModel
from backend.app.explain import SHAPExplainer


# CNS MPO Guideline Reference Thresholds
CNS_MPO_TARGETS = {
    "tpsa": (20.0, 90.0, 45.0),           # (min, max_desirable, sweet_spot)
    "logp": (1.0, 4.0, 2.5),              # (min, max_desirable, sweet_spot)
    "mol_weight": (150.0, 450.0, 320.0),  # (min, max_desirable, sweet_spot)
    "h_donors": (0.0, 3.0, 0.0),          # (min, max_desirable, sweet_spot)
    "h_acceptors": (1.0, 7.0, 3.0),       # (min, max_desirable, sweet_spot)
    "rotatable_bonds": (0.0, 8.0, 2.0),   # (min, max_desirable, sweet_spot)
    "aromatic_rings": (1.0, 4.0, 2.0)     # (min, max_desirable, sweet_spot)
}


def sanitize_descriptor_vector(feats: Dict[str, float]) -> Dict[str, float]:
    """Ensures descriptor values are physically plausible and properly rounded."""
    clean: Dict[str, float] = {}
    clean["mol_weight"] = max(50.0, min(800.0, round(float(feats.get("mol_weight", 200.0)), 2)))
    clean["logp"] = max(-4.0, min(7.0, round(float(feats.get("logp", 2.0)), 2)))
    clean["tpsa"] = max(0.0, min(250.0, round(float(feats.get("tpsa", 60.0)), 2)))
    clean["h_donors"] = max(0, min(12, int(round(float(feats.get("h_donors", 1))))))
    clean["h_acceptors"] = max(0, min(15, int(round(float(feats.get("h_acceptors", 3))))))
    clean["rotatable_bonds"] = max(0, min(20, int(round(float(feats.get("rotatable_bonds", 2))))))
    clean["aromatic_rings"] = max(0, min(6, int(round(float(feats.get("aromatic_rings", 1))))))
    return clean


def calculate_descriptor_deltas(
    orig_feats: Dict[str, float],
    cand_feats: Dict[str, float]
) -> Dict[str, Dict[str, float]]:
    """Calculates absolute and percentage shifts for each descriptor."""
    deltas = {}
    for k in FEATURE_ORDER:
        orig_v = float(orig_feats.get(k, 0.0))
        cand_v = float(cand_feats.get(k, 0.0))
        abs_d = round(cand_v - orig_v, 2)
        pct_d = round(((cand_v - orig_v) / orig_v) * 100, 1) if abs(orig_v) > 1e-4 else (0.0 if abs_d == 0 else 100.0)
        deltas[k] = {
            "original_value": orig_v,
            "candidate_value": cand_v,
            "absolute_delta": abs_d,
            "percentage_delta": pct_d
        }
    return deltas


def generate_candidate_strategies(
    base_feats: Dict[str, float],
    shap_items: List[Dict[str, Any]]
) -> List[Tuple[str, str, Dict[str, float], str]]:
    """
    Generates a diversified portfolio of hypothetical descriptor modifications
    targeted at relieving model-identified barriers to permeability.

    Returns: List of (strategy_name, strategy_description, candidate_features, rationale)
    """
    strategies = []
    
    # Identify limiting features (negative SHAP or severe guideline deviations)
    neg_features = [s.get("feature") for s in shap_items if s.get("shap_value", 0.0) < -0.05]
    
    tpsa = float(base_feats.get("tpsa", 60.0))
    hbd = float(base_feats.get("h_donors", 2.0))
    hba = float(base_feats.get("h_acceptors", 4.0))
    mw = float(base_feats.get("mol_weight", 250.0))
    logp = float(base_feats.get("logp", 1.5))
    rot = float(base_feats.get("rotatable_bonds", 3.0))
    arom = float(base_feats.get("aromatic_rings", 1.0))

    # --- Strategy 1: Targeted H-Bond / Polar Capping ---
    s1 = copy.deepcopy(base_feats)
    s1["h_donors"] = max(0, int(hbd - 2)) if hbd >= 2 else max(0, int(hbd - 1))
    s1["tpsa"] = max(20.0, round(tpsa - (hbd - s1["h_donors"]) * 20.2, 2))  # ~20 Å² per polar -OH/-NH group
    s1["mol_weight"] = round(mw + (hbd - s1["h_donors"]) * 14.03, 2)       # Methylation (+14 Da per -CH3)
    s1["logp"] = round(logp + (hbd - s1["h_donors"]) * 0.5, 2)             # Slight lipophilicity gain
    strategies.append((
        "Targeted Polar Capping",
        "Alleviates polar solvation penalties by methylating/masking active hydrogen bond donors.",
        sanitize_descriptor_vector(s1),
        f"Reduces H-Bond Donors from {hbd} to {s1['h_donors']} and lowers TPSA by {round(tpsa - s1['tpsa'], 1)} Å², lowering aqueous desolvation free energy."
    ))

    # --- Strategy 2: CNS MPO Polarity Derisking ---
    s2 = copy.deepcopy(base_feats)
    s2["tpsa"] = min(tpsa, 40.0 if tpsa > 40.0 else tpsa * 0.7)
    s2["h_donors"] = 0
    s2["h_acceptors"] = min(hba, 3.0)
    s2["logp"] = min(4.0, max(1.8, logp + 0.8))
    strategies.append((
        "CNS MPO Polarity Derisking",
        "Optimizes polar surface area and hydrogen bonding capacity directly into optimal CNS ranges.",
        sanitize_descriptor_vector(s2),
        f"Aggressively brings TPSA into the ideal CNS window ({s2['tpsa']} Å² < 90 Å²) and eliminates HBD penalty, maximizing passive transcellular permeability."
    ))

    # --- Strategy 3: Lipophilicity & Rigidity Balance ---
    s3 = copy.deepcopy(base_feats)
    s3["logp"] = 2.8  # Ideal central sweet spot for passive membrane partitioning
    s3["rotatable_bonds"] = max(0, int(rot - 2)) if rot >= 3 else max(0, int(rot - 1))
    s3["h_donors"] = min(hbd, 1)
    s3["tpsa"] = min(tpsa, 55.0)
    strategies.append((
        "Lipophilicity & Flexibility Tuning",
        "Aligns cLogP with membrane partition equilibrium and rigidifies conformation to reduce entropy loss.",
        sanitize_descriptor_vector(s3),
        f"Optimizes cLogP to {s3['logp']} and lowers rotatable bonds to {s3['rotatable_bonds']}, minimizing the conformational entropy penalty during lipid bilayer entry."
    ))

    # --- Strategy 4: Comprehensive Multi-Parameter Lead ---
    s4 = copy.deepcopy(base_feats)
    s4["mol_weight"] = min(mw, 320.0) if mw > 350.0 else mw
    s4["logp"] = 2.5
    s4["tpsa"] = 35.0
    s4["h_donors"] = 0
    s4["h_acceptors"] = min(hba, 3)
    s4["rotatable_bonds"] = min(rot, 2)
    s4["aromatic_rings"] = max(1, min(arom, 2))
    strategies.append((
        "Multi-Parameter Lead Candidate",
        "Holistic co-optimization across all 7 physicochemical parameters to achieve maximum predicted BBB permeability.",
        sanitize_descriptor_vector(s4),
        "Synchronously satisfies all Lipinski and CNS MPO guidelines (MW < 350, LogP ~2.5, TPSA < 50 Å², HBD = 0)."
    ))

    # --- Strategy 5: Scaffold Rigidification & Aromatic Enhancement ---
    s5 = copy.deepcopy(base_feats)
    s5["aromatic_rings"] = max(1, min(3, int(arom + 1))) if arom < 3 else arom
    s5["rotatable_bonds"] = max(0, int(rot - 2))
    s5["h_donors"] = min(hbd, 1)
    s5["tpsa"] = min(tpsa, 60.0)
    s5["logp"] = min(3.8, max(1.5, logp + 0.6))
    strategies.append((
        "Scaffold Rigidification",
        "Introduces aromatic ring bioisosterism and cyclization to restrict rotatable bonds.",
        sanitize_descriptor_vector(s5),
        f"Enhances hydrophobic pi-stacking interactions and reduces flexible degrees of freedom to {s5['rotatable_bonds']} rotatable bonds."
    ))

    # --- Strategy 6: Low Molecular Weight Fragment Analog ---
    s6 = copy.deepcopy(base_feats)
    s6["mol_weight"] = max(120.0, round(mw * 0.75, 2))
    s6["tpsa"] = max(15.0, round(tpsa * 0.6, 2))
    s6["h_donors"] = min(hbd, 1)
    s6["h_acceptors"] = max(1, int(hba - 1))
    s6["rotatable_bonds"] = max(0, int(rot - 1))
    strategies.append((
        "Compact Fragment Analog",
        "Reduces steric volume and molecular weight to facilitate rapid passive pore and tight-junction diffusion.",
        sanitize_descriptor_vector(s6),
        f"Trims molecular weight to {s6['mol_weight']} Da (Δ {round(s6['mol_weight'] - mw, 1)} Da) and lowers polar surface area."
    ))

    return strategies


def optimize_descriptors(
    smiles: Optional[str] = None,
    features: Optional[Dict[str, float]] = None,
    candidate_count: int = 4,
    target_probability: float = 0.75
) -> Dict[str, Any]:
    """
    Main entry point for Molecular Optimization (Level 1: Descriptor Optimization).
    
    1. Computes baseline features and SHAP attribution for limiting factors.
    2. Generates diversified candidate descriptor strategies.
    3. Runs real inference for each candidate through the trained XGBoost model.
    4. Computes absolute and percentage deltas per descriptor.
    5. Ranks candidates descending by predicted BBB probability.
    """
    # 1. Resolve baseline features
    base_features: Optional[Dict[str, float]] = None
    if smiles and smiles.strip():
        base_features = compute_descriptors(smiles.strip())
        if base_features is None:
            raise ValueError(f"Could not parse SMILES string '{smiles}'. Please enter a valid chemical structure.")
    elif features:
        base_features = sanitize_descriptor_vector(features)
    else:
        raise ValueError("Either 'smiles' or 'features' must be provided for molecular optimization.")

    # 2. Run baseline prediction and SHAP explanation
    model = BBBModel()
    explainer = SHAPExplainer()

    orig_pred_result = model.predict(base_features)
    orig_shap_result = explainer.explain(base_features)

    orig_prob = orig_pred_result["permeable_probability"]
    orig_pred = orig_pred_result["prediction"]
    shap_items = orig_shap_result.get("shap_explanation", [])

    # Extract limiting features
    limiting_features = [
        item.get("display_name", item.get("feature", ""))
        for item in shap_items
        if item.get("shap_value", 0.0) < 0.0
    ][:3]

    # 3. Generate candidate portfolios
    raw_strategies = generate_candidate_strategies(base_features, shap_items)

    # 4. Evaluate each candidate through real XGBoost model
    evaluated_candidates = []
    for strat_name, strat_desc, cand_feats, rationale in raw_strategies:
        pred_res = model.predict(cand_feats)
        cand_prob = pred_res["permeable_probability"]
        cand_pred = pred_res["prediction"]
        cand_conf = pred_res["confidence"]

        delta_prob = round(cand_prob - orig_prob, 4)
        delta_pp = round(delta_prob * 100, 2)
        descriptor_deltas = calculate_descriptor_deltas(base_features, cand_feats)

        evaluated_candidates.append({
            "strategy": strat_name,
            "strategy_description": strat_desc,
            "prediction": cand_pred,
            "permeable_probability": cand_prob,
            "confidence": cand_conf,
            "delta_probability": delta_prob,
            "delta_percentage_points": delta_pp,
            "features": cand_feats,
            "descriptor_deltas": descriptor_deltas,
            "rationale": rationale
        })

    # 5. Sort candidates descending by permeable_probability (best first)
    evaluated_candidates.sort(key=lambda c: c["permeable_probability"], reverse=True)

    # 6. Format and rank the requested count
    count = max(1, min(len(evaluated_candidates), candidate_count))
    final_candidates = []
    for idx, cand in enumerate(evaluated_candidates[:count], start=1):
        cand["candidate_id"] = idx
        cand["name"] = f"Candidate {idx}: {cand['strategy']}"
        final_candidates.append(cand)

    return {
        "valid_smiles": True,
        "original_smiles": smiles,
        "original_prediction": orig_pred,
        "original_probability": orig_prob,
        "original_features": base_features,
        "candidates": final_candidates,
        "limiting_features": limiting_features,
        "disclaimer": "Hypothetical molecular modifications generated in-silico for exploration. Computational predictions do not guarantee biological activity or BBB penetration in-vivo."
    }
