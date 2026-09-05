import os
import sys
import json
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.main import app

client = TestClient(app)


def print_section(title: str):
    print("\n" + "=" * 80)
    print(f" {title} ")
    print("=" * 80)


def test_what_if_endpoints():
    print_section("1. TESTING POST /what-if (DOPAMINE: NON-PERMEABLE BASELINE -> LOWER TPSA & HBD)")
    # Dopamine baseline: TPSA ~ 66.48, HBD = 3, MW = 153.18, Non-permeable (prob ~ 0.141)
    dopamine_smiles = "NCCc1ccc(O)c(O)c1"
    payload = {
        "smiles": dopamine_smiles,
        "modified_descriptors": {
            "tpsa": 30.0,
            "h_donors": 0
        }
    }
    print("Request Body:")
    print(json.dumps(payload, indent=2))
    
    response = client.post("/what-if", json=payload)
    print(f"\nHTTP Status: {response.status_code}")
    print("Response JSON Payload:")
    data = response.json()
    print(json.dumps(data, indent=2))
    
    assert response.status_code == 200
    assert data["valid_input"] is True
    assert data["original_prediction"] == "non_permeable"
    assert data["original_probability"] < 0.5
    # Lowering donors and polarity should significantly increase BBB probability
    assert data["new_probability"] > data["original_probability"]
    assert data["delta_percentage_points"] > 0
    assert "disclaimer" in data
    assert data["modified_descriptors"]["tpsa"] == 30.0
    assert data["modified_descriptors"]["h_donors"] == 0

    print_section("2. TESTING POST /what-if USING PRE-COMPUTED ORIGINAL FEATURES")
    features_payload = {
        "original_features": {
            "mol_weight": 194.19,
            "logp": -1.03,
            "tpsa": 61.82,
            "h_donors": 0,
            "h_acceptors": 3,
            "rotatable_bonds": 0,
            "aromatic_rings": 2
        },
        "modified_descriptors": {
            "mol_weight": 650.0,
            "tpsa": 160.0
        }
    }
    response2 = client.post("/what-if", json=features_payload)
    print(f"HTTP Status: {response2.status_code}")
    data2 = response2.json()
    print(json.dumps(data2, indent=2))
    assert response2.status_code == 200
    # Increasing MW and TPSA significantly should drop permeability
    assert data2["new_probability"] < data2["original_probability"]
    assert data2["delta_probability"] < 0

    print_section("3. TESTING POST /what-if/curve (TPSA RESPONSE CURVE)")
    curve_payload = {
        "base_descriptors": {
            "mol_weight": 194.19,
            "logp": 1.5,
            "tpsa": 50.0,
            "h_donors": 0,
            "h_acceptors": 2,
            "rotatable_bonds": 1,
            "aromatic_rings": 1
        },
        "target_feature": "tpsa",
        "min_val": 0.0,
        "max_val": 180.0,
        "num_points": 10
    }
    curve_res = client.post("/what-if/curve", json=curve_payload)
    print(f"HTTP Status: {curve_res.status_code}")
    curve_data = curve_res.json()
    print("Response Curve Summary (10 points):")
    for pt in curve_data["curve_points"]:
        print(f"  TPSA = {pt['feature_value']:>6.1f} Å² | Prob = {pt['permeable_probability']:>6.4f} | Pred = {pt['prediction']}")
    
    assert curve_res.status_code == 200
    assert len(curve_data["curve_points"]) == 10
    # Higher TPSA should generally decrease probability
    assert curve_data["curve_points"][0]["permeable_probability"] >= curve_data["curve_points"][-1]["permeable_probability"]

    print_section("4. TESTING POST /what-if (INVALID INPUT ERROR HANDLING)")
    invalid_payload = {
        "smiles": "INVALID_STRUCTURE_XYZ",
        "modified_descriptors": {"tpsa": 50.0}
    }
    invalid_res = client.post("/what-if", json=invalid_payload)
    print(f"HTTP Status: {invalid_res.status_code} (Expected 422)")
    assert invalid_res.status_code == 422

    print_section("ALL WHAT-IF SIMULATOR ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!")


if __name__ == "__main__":
    test_what_if_endpoints()
