import os
import sys
import json

# Fix Windows console encoding for LLM unicode outputs
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


def test_assistant_endpoints():
    # 1. First get real prediction & SHAP for Dopamine
    dopamine_smiles = "NCCc1ccc(O)c(O)c1"
    pred_res = client.post("/predict", json={"smiles": dopamine_smiles}).json()

    print_section("1. TESTING POST /assistant ('Why low?' on Dopamine)")
    dopamine_context = {
        "smiles": dopamine_smiles,
        "molecule_name": "Dopamine",
        "prediction": pred_res["prediction"],
        "permeable_probability": pred_res["permeable_probability"],
        "confidence": pred_res["confidence"],
        "features": pred_res["features"],
        "shap_explanation": pred_res["shap_explanation"],
        "summary_sentence": pred_res["summary_sentence"]
    }

    req_payload = {
        "question": "Why low?",
        "context": dopamine_context
    }
    response = client.post("/assistant", json=req_payload)
    print(f"HTTP Status: {response.status_code}")
    data = response.json()
    print(f"Model Used: {data.get('model_used')}")
    print("Response Answer Preview:")
    print(data["answer"][:400] + "...\n")
    print(f"Disclaimer: {data['disclaimer']}")
    assert response.status_code == 200
    assert "disclaimer" in data
    assert data["model_used"] and data["model_used"].startswith("groq/")
    assert len(data["answer"]) > 50

    print_section("2. TESTING POST /assistant ('Explain SHAP')")
    req_shap = {
        "question": "Explain SHAP",
        "context": dopamine_context
    }
    res_shap = client.post("/assistant", json=req_shap)
    print(f"HTTP Status: {res_shap.status_code}")
    data_shap = res_shap.json()
    print(f"Model Used: {data_shap.get('model_used')}")
    print("Response Answer Preview:")
    print(data_shap["answer"][:400] + "...\n")
    assert res_shap.status_code == 200
    assert "SHAP" in data_shap["answer"] or "shap" in data_shap["answer"].lower()

    print_section("3. TESTING POST /assistant ('How to improve?')")
    req_improve = {
        "question": "How to improve?",
        "context": dopamine_context
    }
    res_improve = client.post("/assistant", json=req_improve)
    print(f"HTTP Status: {res_improve.status_code}")
    data_improve = res_improve.json()
    print(f"Model Used: {data_improve.get('model_used')}")
    print("Response Answer Preview:")
    print(data_improve["answer"][:400] + "...\n")
    assert res_improve.status_code == 200
    assert len(data_improve["answer"]) > 50

    print_section("4. TESTING POST /assistant WITH WHAT-IF DATA ('Explain modification')")
    what_if_context = dict(dopamine_context)
    what_if_context["what_if_data"] = {
        "original_probability": 0.141,
        "new_probability": 0.7753,
        "delta_percentage_points": 63.43,
        "original_prediction": "non_permeable",
        "new_prediction": "permeable",
        "modified_descriptors": {
            "tpsa": 30.0,
            "h_donors": 0
        },
        "original_descriptors": pred_res["features"]
    }

    req_what_if = {
        "question": "Explain modification",
        "context": what_if_context
    }
    res_what_if = client.post("/assistant", json=req_what_if)
    print(f"HTTP Status: {res_what_if.status_code}")
    data_what_if = res_what_if.json()
    print(f"Model Used: {data_what_if.get('model_used')}")
    print("Response Answer Preview:")
    print(data_what_if["answer"][:450] + "...\n")
    assert res_what_if.status_code == 200
    assert len(data_what_if["answer"]) > 50

    print_section("ALL ASSISTANT TESTS PASSED WITH GROQ MODEL!")


if __name__ == "__main__":
    test_assistant_endpoints()
