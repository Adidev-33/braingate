import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def print_section(title: str):
    print("\n" + "=" * 80)
    print(f" {title} ")
    print("=" * 80)


def test_optimizer():
    # ---------------------------------------------------------
    # 1. Test Optimization on Dopamine (Low Permeability Baseline: ~14.1%)
    # ---------------------------------------------------------
    print_section("1. TESTING POST /optimize (DOPAMINE - Low Permeability Baseline)")
    dopamine_smiles = "NCCc1ccc(O)c(O)c1"
    req_dopamine = {
        "smiles": dopamine_smiles,
        "candidate_count": 4,
        "target_probability": 0.75
    }

    res = client.post("/optimize", json=req_dopamine)
    print(f"HTTP Status: {res.status_code}")
    assert res.status_code == 200
    data = res.json()

    print(f"Original SMILES: {data['original_smiles']}")
    print(f"Original Prediction: {data['original_prediction']} ({round(data['original_probability']*100, 1)}%)")
    print(f"Limiting Features Identified: {data['limiting_features']}")
    print(f"Candidate Count Returned: {len(data['candidates'])}")
    print(f"Disclaimer: {data['disclaimer']}")

    assert data["valid_smiles"] is True
    assert data["original_prediction"] == "non_permeable"
    assert len(data["candidates"]) == 4

    # Verify ranking (descending by permeable_probability)
    probs = [c["permeable_probability"] for c in data["candidates"]]
    print(f"Candidate Probabilities: {[round(p*100, 1) for p in probs]}")
    assert probs == sorted(probs, reverse=True), "Candidates must be sorted descending by probability"

    # Top candidate should be significantly improved
    top_cand = data["candidates"][0]
    print(f"\nTop Candidate: {top_cand['name']}")
    print(f"Strategy: {top_cand['strategy']}")
    print(f"Prediction: {top_cand['prediction']} ({round(top_cand['permeable_probability']*100, 1)}%)")
    print(f"Delta Shift: +{top_cand['delta_percentage_points']}% percentage points")
    print(f"Rationale: {top_cand['rationale']}")
    
    assert top_cand["permeable_probability"] > 0.70, "Top candidate should achieve > 70% probability"
    assert top_cand["prediction"] == "permeable"
    assert "tpsa" in top_cand["descriptor_deltas"]
    assert "h_donors" in top_cand["descriptor_deltas"]

    # Verify delta calculations
    tpsa_delta = top_cand["descriptor_deltas"]["tpsa"]
    print(f"TPSA Delta: {tpsa_delta['original_value']} -> {tpsa_delta['candidate_value']} (Delta: {tpsa_delta['absolute_delta']})")
    assert tpsa_delta["candidate_value"] == round(tpsa_delta["original_value"] + tpsa_delta["absolute_delta"], 2)

    # ---------------------------------------------------------
    # 2. Test Optimization on Caffeine (High Permeability Baseline: ~80.8%)
    # ---------------------------------------------------------
    print_section("2. TESTING POST /optimize (CAFFEINE - High Baseline)")
    caffeine_smiles = "CN1C=NC2=C1C(=O)N(C(=O)N2C)C"
    req_caff = {
        "smiles": caffeine_smiles,
        "candidate_count": 3
    }
    res_caff = client.post("/optimize", json=req_caff)
    print(f"HTTP Status: {res_caff.status_code}")
    assert res_caff.status_code == 200
    data_caff = res_caff.json()
    assert len(data_caff["candidates"]) == 3
    print(f"Top Caffeine Modification: {data_caff['candidates'][0]['name']} ({round(data_caff['candidates'][0]['permeable_probability']*100, 1)}%)")

    # ---------------------------------------------------------
    # 3. Test Optimization via Pre-computed Features (No SMILES)
    # ---------------------------------------------------------
    print_section("3. TESTING POST /optimize (DIRECT FEATURE VECTOR INPUT)")
    req_feats = {
        "features": {
            "mol_weight": 380.0,
            "logp": 0.5,
            "tpsa": 110.0,
            "h_donors": 4,
            "h_acceptors": 6,
            "rotatable_bonds": 5,
            "aromatic_rings": 1
        },
        "candidate_count": 2
    }
    res_feats = client.post("/optimize", json=req_feats)
    print(f"HTTP Status: {res_feats.status_code}")
    assert res_feats.status_code == 200
    data_feats = res_feats.json()
    assert len(data_feats["candidates"]) == 2
    print(f"Original Prob: {round(data_feats['original_probability']*100, 1)}% -> Top Candidate: {round(data_feats['candidates'][0]['permeable_probability']*100, 1)}%")

    # ---------------------------------------------------------
    # 4. Test Error Handling (Invalid SMILES)
    # ---------------------------------------------------------
    print_section("4. TESTING POST /optimize (INVALID SMILES)")
    req_invalid = {
        "smiles": "INVALID_STRUCTURE_XYZ",
        "candidate_count": 3
    }
    res_invalid = client.post("/optimize", json=req_invalid)
    print(f"HTTP Status: {res_invalid.status_code}")
    assert res_invalid.status_code == 422
    assert "error" in res_invalid.json()

    print_section("ALL MOLECULAR OPTIMIZER TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_optimizer()
