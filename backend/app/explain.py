import os
import sys
import pandas as pd
import numpy as np
import shap

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import FEATURE_NAMES, FEATURE_DISPLAY_NAMES
from backend.app.model import BBBModel


class SHAPExplainer:
    """Singleton SHAP TreeExplainer manager."""

    _instance = None
    _explainer = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SHAPExplainer, cls).__new__(cls)
            cls._instance._init_explainer()
        return cls._instance

    def _init_explainer(self):
        model_wrapper = BBBModel()
        raw_model = model_wrapper.get_raw_model()
        print("Initializing SHAP TreeExplainer...")
        self._explainer = shap.TreeExplainer(raw_model)

    def explain(self, feature_dict: dict) -> dict:
        """
        Computes SHAP feature importance for a single molecule feature dictionary.
        Returns detailed list of feature contributions and plain-language summaries.
        """
        df_input = pd.DataFrame([feature_dict])[FEATURE_NAMES]
        shap_values = self._explainer.shap_values(df_input)[0]

        explanations = []
        for feat_name, shap_val in zip(FEATURE_NAMES, shap_values):
            val = feature_dict[feat_name]
            shap_rounded = round(float(shap_val), 4)
            plain_text = translate_shap_to_text(feat_name, val, shap_rounded)

            explanations.append({
                "feature": feat_name,
                "display_name": FEATURE_DISPLAY_NAMES[feat_name],
                "value": val,
                "shap_value": shap_rounded,
                "plain_text": plain_text
            })

        # Sort explanations by absolute SHAP impact descending
        explanations.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

        # Generate overall summary sentence
        summary_sentence = generate_summary_sentence(feature_dict, explanations)

        return {
            "shap_explanation": explanations,
            "summary_sentence": summary_sentence
        }


def translate_shap_to_text(feat: str, val: float, shap_val: float) -> str:
    """Maps feature value, SHAP contribution sign, and magnitude into chemist-readable English."""
    is_pos = shap_val >= 0

    if feat == "tpsa":
        if is_pos:
            if val <= 90:
                return f"Low topological polar surface area (TPSA = {val} <= 90) strongly favors crossing the blood-brain barrier."
            else:
                return f"Polar surface area (TPSA = {val}) modestly supports membrane interaction."
        else:
            if val > 90:
                return f"High polarity (TPSA = {val} > 90) creates a major energy barrier to lipid membrane penetration."
            else:
                return f"Polar surface area (TPSA = {val}) slightly restricts crossing probability."

    elif feat == "logp":
        if is_pos:
            if 1.0 <= val <= 4.0:
                return f"Optimal lipophilicity (LogP = {val} in 1.0-4.0 range) provides ideal fat-solubility for membrane diffusion."
            elif val > 4.0:
                return f"High lipophilicity (LogP = {val}) promotes lipid membrane partitioning."
            else:
                return f"Hydrophilic properties (LogP = {val}) provide adequate aqueous solubility balance."
        else:
            if val < 1.0:
                return f"Poor lipophilicity (LogP = {val} < 1.0) limits membrane partitioning into brain tissue."
            elif val > 4.0:
                return f"Excessive lipophilicity (LogP = {val} > 4.0) increases risk of non-specific tissue binding."
            else:
                return f"Lipophilicity balance (LogP = {val}) slightly decreases crossing probability."

    elif feat == "mol_weight":
        if is_pos:
            if val <= 450:
                return f"Compact molecular size (MW = {val} Da <= 450 Da) facilitates rapid passive diffusion."
            else:
                return f"Molecular size (MW = {val} Da) remains acceptable for membrane passage."
        else:
            if val > 450:
                return f"Large molecular weight (MW = {val} Da > 450 Da) hinders passive movement across tight junctions."
            else:
                return f"Molecular weight (MW = {val} Da) modestly restricts diffusion rate."

    elif feat == "h_donors":
        if is_pos:
            return f"Low H-bond donor count ({val}) prevents excessive energy penalty when entering lipid bilayers."
        else:
            return f"Multiple H-bond donors ({val}) require high energy to break water solvation shells before crossing."

    elif feat == "h_acceptors":
        if is_pos:
            return f"Favorable H-bond acceptor count ({val}) allows smooth transition across the hydrophobic core."
        else:
            return f"Excessive H-bond acceptors ({val}) increase polar solvation, restricting membrane permeability."

    elif feat == "rotatable_bonds":
        if is_pos:
            return f"Low molecular flexibility ({val} rotatable bonds) minimizes entropy loss during membrane entry."
        else:
            return f"High conformational flexibility ({val} rotatable bonds) increases the entropic penalty of membrane insertion."

    elif feat == "aromatic_rings":
        if is_pos:
            return f"Aromatic ring system ({val} rings) enhances hydrophobic pi-stacking interactions with lipid membranes."
        else:
            return f"Aromatic ring count ({val} rings) slightly reduces favorable descriptor balance."

    return f"Feature {feat} = {val} contributed {shap_val:+.4f} to prediction."


def generate_summary_sentence(feature_dict: dict, sorted_explanations: list) -> str:
    """Generates a concise 1-sentence overall plain-English explanation."""
    top1 = sorted_explanations[0]
    top2 = sorted_explanations[1] if len(sorted_explanations) > 1 else None

    # Compute overall prediction orientation from top SHAP values
    top_pos = [e for e in sorted_explanations if e["shap_value"] > 0]
    top_neg = [e for e in sorted_explanations if e["shap_value"] < 0]

    if len(top_pos) >= len(top_neg):
        outcome = "Predicted to cross the BBB"
        reason1 = top1["display_name"].split(" (")[0]
        reason2 = top2["display_name"].split(" (")[0] if top2 else None
        if top2:
            return f"{outcome}, primarily driven by favorable {reason1.lower()} and {reason2.lower()}."
        return f"{outcome}, primarily driven by favorable {reason1.lower()}."
    else:
        outcome = "Predicted NOT to cross the BBB"
        reason1 = top1["display_name"].split(" (")[0]
        reason2 = top2["display_name"].split(" (")[0] if top2 else None
        if top2:
            return f"{outcome}, primarily hindered by {reason1.lower()} and {reason2.lower()}."
        return f"{outcome}, primarily hindered by {reason1.lower()}."


if __name__ == "__main__":
    from backend.app.features import compute_descriptors
    from backend.app.model import BBBModel

    caffeine_smiles = "CN1C=NC2=C1C(=O)N(C(=O)N2C)C"
    print(f"\n--- Testing SHAP Explainer on Caffeine ({caffeine_smiles}) ---")
    feat = compute_descriptors(caffeine_smiles)
    model = BBBModel()
    pred = model.predict(feat)
    explainer = SHAPExplainer()
    explanation = explainer.explain(feat)

    print("Prediction:", pred)
    print("Summary Sentence:", explanation["summary_sentence"])
    print("Top Feature Explanations:")
    for item in explanation["shap_explanation"]:
        print(f"  - {item['display_name']} ({item['value']}): SHAP {item['shap_value']:+.4f} | {item['plain_text']}")
