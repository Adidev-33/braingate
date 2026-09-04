import os
import sys
import pandas as pd
import numpy as np
import shap

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import FEATURE_NAMES, FEATURE_DISPLAY_NAMES
from backend.app.model_stretch import Tox21Model, ESOLModel


class Tox21Explainer:
    """Singleton SHAP TreeExplainer manager for Tox21 toxicity classifier."""

    _instance = None
    _explainer = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Tox21Explainer, cls).__new__(cls)
            cls._instance._init_explainer()
        return cls._instance

    def _init_explainer(self):
        model_wrapper = Tox21Model()
        raw_model = model_wrapper.get_raw_model()
        print("Initializing Tox21 SHAP TreeExplainer...")
        self._explainer = shap.TreeExplainer(raw_model)

    def explain(self, feature_dict: dict) -> dict:
        """
        Computes SHAP feature importance for a single molecule under the Tox21 model.
        Returns detailed feature contributions and plain-language toxicity rationale.
        """
        df_input = pd.DataFrame([feature_dict])[FEATURE_NAMES]
        # For binary classification, shap_values is array of shape (N, features)
        shap_vals = self._explainer.shap_values(df_input)
        if isinstance(shap_vals, list):
            shap_values = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
        else:
            shap_values = shap_vals[0]

        explanations = []
        for feat_name, shap_val in zip(FEATURE_NAMES, shap_values):
            val = feature_dict[feat_name]
            shap_rounded = round(float(shap_val), 4)
            plain_text = translate_tox_shap_to_text(feat_name, val, shap_rounded)

            explanations.append({
                "feature": feat_name,
                "display_name": FEATURE_DISPLAY_NAMES[feat_name],
                "value": val,
                "shap_value": shap_rounded,
                "plain_text": plain_text
            })

        explanations.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        summary_sentence = generate_tox_summary_sentence(feature_dict, explanations)

        return {
            "shap_explanation": explanations,
            "summary_sentence": summary_sentence
        }


class ESOLExplainer:
    """Singleton SHAP TreeExplainer manager for ESOL solubility regressor."""

    _instance = None
    _explainer = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ESOLExplainer, cls).__new__(cls)
            cls._instance._init_explainer()
        return cls._instance

    def _init_explainer(self):
        model_wrapper = ESOLModel()
        raw_model = model_wrapper.get_raw_model()
        print("Initializing ESOL SHAP TreeExplainer...")
        self._explainer = shap.TreeExplainer(raw_model)

    def explain(self, feature_dict: dict) -> dict:
        """
        Computes SHAP feature importance for a single molecule under the ESOL solubility model.
        Returns detailed feature contributions and plain-language solubility rationale.
        """
        df_input = pd.DataFrame([feature_dict])[FEATURE_NAMES]
        shap_vals = self._explainer.shap_values(df_input)
        shap_values = shap_vals[0] if isinstance(shap_vals, np.ndarray) else shap_vals

        explanations = []
        for feat_name, shap_val in zip(FEATURE_NAMES, shap_values):
            val = feature_dict[feat_name]
            shap_rounded = round(float(shap_val), 4)
            plain_text = translate_esol_shap_to_text(feat_name, val, shap_rounded)

            explanations.append({
                "feature": feat_name,
                "display_name": FEATURE_DISPLAY_NAMES[feat_name],
                "value": val,
                "shap_value": shap_rounded,
                "plain_text": plain_text
            })

        explanations.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        summary_sentence = generate_esol_summary_sentence(feature_dict, explanations)

        return {
            "shap_explanation": explanations,
            "summary_sentence": summary_sentence
        }


def translate_tox_shap_to_text(feat: str, val: float, shap_val: float) -> str:
    """Maps feature value and SHAP contribution into chemist-readable toxicology rationale."""
    is_pos = shap_val >= 0  # positive SHAP pushes towards toxic risk

    if feat == "logp":
        if is_pos:
            return f"Elevated lipophilicity (LogP = {val}) drives non-specific membrane accumulation and off-target receptor interaction."
        else:
            return f"Hydrophilic character (LogP = {val}) mitigates intracellular lipophilic accumulation, reducing toxicity risk."

    elif feat == "aromatic_rings":
        if is_pos:
            return f"Aromatic ring count ({val}) increases planar hydrophobic surface area, predisposing to xenobiotic receptor activation."
        else:
            return f"Low aromaticity ({val} rings) avoids planar hydrophobic binding motifs common in reactive toxicophores."

    elif feat == "mol_weight":
        if is_pos:
            return f"Molecular weight ({val} Da) contributes to steric bulk and potential multi-target interference."
        else:
            return f"Compact molecular weight ({val} Da) reduces the likelihood of complex multi-target cytotoxicity."

    elif feat == "tpsa":
        if is_pos:
            return f"Low polar surface area (TPSA = {val} Å²) increases passive cellular uptake and nuclear receptor exposure."
        else:
            return f"Sufficient polar surface area (TPSA = {val} Å²) favors metabolic clearance over intracellular entrapment."

    elif feat == "h_donors":
        if is_pos:
            return f"H-bond donor pattern ({val}) modestly elevates cellular stress reactivity."
        else:
            return f"Favorable H-bond donor count ({val}) maintains clean hydrogen-bonding balance."

    elif feat == "h_acceptors":
        if is_pos:
            return f"High H-bond acceptor density ({val}) increases localized electrostatic interaction with cellular proteins."
        else:
            return f"Controlled H-bond acceptor count ({val}) prevents excessive electrostatic reactivity."

    elif feat == "rotatable_bonds":
        if is_pos:
            return f"Molecular flexibility ({val} rotatable bonds) permits conformational adaptation into off-target pockets."
        else:
            return f"Rigid scaffold ({val} rotatable bonds) restricts conformational binding to off-target receptors."

    return f"Feature {feat} = {val} contributed {shap_val:+.4f} to toxicity score."


def generate_tox_summary_sentence(feature_dict: dict, sorted_explanations: list) -> str:
    """Generates a concise 1-sentence overall plain-English explanation for toxicity."""
    top1 = sorted_explanations[0]
    top2 = sorted_explanations[1] if len(sorted_explanations) > 1 else None

    # Positive sum indicates net toxicity risk
    net_shap = sum(e["shap_value"] for e in sorted_explanations)
    reason1 = top1["display_name"].split(" (")[0]
    reason2 = top2["display_name"].split(" (")[0] if top2 else None

    if net_shap >= 0:
        outcome = "Flagged with potential toxicity liability"
        if top2:
            return f"{outcome}, primarily driven by elevated {reason1.lower()} and {reason2.lower()}."
        return f"{outcome}, primarily driven by elevated {reason1.lower()}."
    else:
        outcome = "Predicted low overall toxicity risk"
        if top2:
            return f"{outcome}, supported by favorable {reason1.lower()} and {reason2.lower()}."
        return f"{outcome}, supported by favorable {reason1.lower()}."


def translate_esol_shap_to_text(feat: str, val: float, shap_val: float) -> str:
    """Maps feature value and SHAP contribution into chemist-readable aqueous solubility rationale."""
    is_pos = shap_val >= 0  # positive SHAP increases aqueous solubility (logS)

    if feat == "logp":
        if is_pos:
            return f"Hydrophilic profile (LogP = {val}) strongly promotes thermodynamic partitioning into aqueous solvent."
        else:
            return f"High lipophilicity (LogP = {val}) exerts strong hydrophobic resistance against water solvation."

    elif feat == "mol_weight":
        if is_pos:
            return f"Low molecular size ({val} Da) incurs minimal cavitation energy penalty when creating cavities in water."
        else:
            return f"Large molecular weight ({val} Da) requires high free energy to disrupt water hydrogen-bond networks."

    elif feat == "tpsa":
        if is_pos:
            return f"Polar surface area (TPSA = {val} Å²) provides strong electrostatic dipole interactions with polar water."
        else:
            return f"Low polarity (TPSA = {val} Å²) offers limited dipole stabilization in aqueous environment."

    elif feat == "aromatic_rings":
        if is_pos:
            return f"Absence of excessive aromatic rings ({val}) avoids hydrophobic pi-stacking crystal lattice stabilization."
        else:
            return f"Aromatic ring system ({val} rings) drives strong crystal lattice stabilization, severely penalizing dissolution."

    elif feat == "h_donors":
        if is_pos:
            return f"H-bond donors ({val}) engage directly in donor-acceptor hydrogen bonding with surrounding water."
        else:
            return f"Sparse H-bond donors ({val}) provide minimal direct hydrogen bonding to water molecules."

    elif feat == "h_acceptors":
        if is_pos:
            return f"H-bond acceptors ({val}) act as anchor points for solvent water molecules."
        else:
            return f"Low acceptor count ({val}) offers limited hydration anchor sites."

    elif feat == "rotatable_bonds":
        if is_pos:
            return f"Conformational flexibility ({val} rotatable bonds) disrupts rigid crystal lattice packing, assisting solubility."
        else:
            return f"Scaffold rigidity ({val} rotatable bonds) facilitates tight crystalline packing, reducing solubility."

    return f"Feature {feat} = {val} contributed {shap_val:+.4f} to solubility."


def generate_esol_summary_sentence(feature_dict: dict, sorted_explanations: list) -> str:
    """Generates a concise 1-sentence overall plain-English explanation for solubility."""
    top1 = sorted_explanations[0]
    top2 = sorted_explanations[1] if len(sorted_explanations) > 1 else None

    net_shap = sum(e["shap_value"] for e in sorted_explanations)
    reason1 = top1["display_name"].split(" (")[0]
    reason2 = top2["display_name"].split(" (")[0] if top2 else None

    if net_shap >= 0:
        outcome = "Aqueous solubility favored"
        if top2:
            return f"{outcome}, primarily driven by {reason1.lower()} and {reason2.lower()}."
        return f"{outcome}, primarily driven by {reason1.lower()}."
    else:
        outcome = "Aqueous solubility constrained"
        if top2:
            return f"{outcome}, primarily hindered by {reason1.lower()} and {reason2.lower()}."
        return f"{outcome}, primarily hindered by {reason1.lower()}."
