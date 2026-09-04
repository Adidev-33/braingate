import os
import sys
import json

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import compute_descriptors
from backend.app.model_stretch import Tox21Model, ESOLModel
from backend.app.explain_stretch import Tox21Explainer, ESOLExplainer

TEST_MOLECULES = [
    {"name": "Caffeine", "smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C"},
    {"name": "Dopamine", "smiles": "NCCc1ccc(O)c(O)c1"},
    {"name": "Diazepam", "smiles": "CN1C(=O)CN=C(c2ccccc2)c2cc(Cl)ccc21"}
]


def test_stretch_pipeline():
    print("\n" + "=" * 80)
    print(" TESTING TOX21 & ESOL MODELS + SHAP EXPLAINERS ")
    print("=" * 80)

    tox_model = Tox21Model()
    esol_model = ESOLModel()
    tox_explainer = Tox21Explainer()
    esol_explainer = ESOLExplainer()

    for mol in TEST_MOLECULES:
        name = mol["name"]
        smiles = mol["smiles"]
        print(f"\nEvaluating {name} ({smiles}):")

        features = compute_descriptors(smiles)
        print("  Descriptors:", json.dumps(features, indent=2))

        # Tox21
        tox_pred = tox_model.predict(features)
        tox_exp = tox_explainer.explain(features)
        print("  [Tox21 Prediction]:", tox_pred)
        print("  [Tox21 Summary]:", tox_exp["summary_sentence"])
        print("  [Tox21 Top 2 Drivers]:", [
            f"{e['display_name']} (SHAP={e['shap_value']:+.4f})" for e in tox_exp["shap_explanation"][:2]
        ])

        # ESOL
        esol_pred = esol_model.predict(features)
        esol_exp = esol_explainer.explain(features)
        print("  [ESOL Prediction]:", esol_pred)
        print("  [ESOL Summary]:", esol_exp["summary_sentence"])
        print("  [ESOL Top 2 Drivers]:", [
            f"{e['display_name']} (SHAP={e['shap_value']:+.4f})" for e in esol_exp["shap_explanation"][:2]
        ])

    print("\n" + "=" * 80)
    print(" ALL STRETCH MODELS AND EXPLAINERS VERIFIED SUCCESSFULLY! ")
    print("=" * 80)


if __name__ == "__main__":
    test_stretch_pipeline()
