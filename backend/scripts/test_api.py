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


def test_all_endpoints():
    print_section("1. TESTING GET /health")
    response = client.get("/health")
    print(f"HTTP Status: {response.status_code}")
    print("Response JSON Payload:")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    print_section("2. TESTING GET /examples")
    response = client.get("/examples")
    print(f"HTTP Status: {response.status_code}")
    print("Response JSON Payload (Curated Reference Molecules):")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 200
    assert len(response.json()) >= 4

    print_section("3. TESTING POST /predict (VALID MOLECULE: CAFFEINE)")
    payload = {"smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C"}
    print("Request Body:")
    print(json.dumps(payload, indent=2))
    response = client.post("/predict", json=payload)
    print(f"\nHTTP Status: {response.status_code}")
    print("Response JSON Payload:")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 200
    assert response.json()["valid_smiles"] is True
    assert response.json()["prediction"] == "permeable"

    print_section("4. TESTING POST /predict (INVALID SMILES: 'INVALID_SMILES_STRING_123')")
    payload = {"smiles": "INVALID_SMILES_STRING_123"}
    print("Request Body:")
    print(json.dumps(payload, indent=2))
    response = client.post("/predict", json=payload)
    print(f"\nHTTP Status: {response.status_code} (Expected HTTP 422 Unprocessable Entity)")
    print("Response JSON Payload:")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 422
    assert response.json()["valid_smiles"] is False

    print_section("5. TESTING POST /compare (CAFFEINE vs DOPAMINE)")
    payload = {
        "smiles1": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C", # Caffeine (Permeable)
        "smiles2": "NCCc1ccc(O)c(O)c1"               # Dopamine (Non-Permeable)
    }
    print("Request Body:")
    print(json.dumps(payload, indent=2))
    response = client.post("/compare", json=payload)
    print(f"\nHTTP Status: {response.status_code}")
    print("Response JSON Payload:")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 200
    assert "deciding_difference" in response.json()

    print_section("ALL FASTAPI ENDPOINTS VERIFIED SUCCESSFULLY!")


if __name__ == "__main__":
    test_all_endpoints()
