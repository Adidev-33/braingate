import os
import sys
from typing import List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import compute_descriptors
from backend.app.model import BBBModel
from backend.app.explain import SHAPExplainer
from backend.app.schemas import (
    HealthResponse,
    ExampleMolecule,
    PredictRequest,
    PredictResponse,
    InvalidSmilesResponse,
    CompareRequest,
    CompareResponse
)

app = FastAPI(
    title="BrainGate API",
    description="Explainable Blood-Brain Barrier (BBB) Permeability Predictor API",
    version="1.0.0"
)

# Enable CORS for frontend cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Curated reference example molecules for demonstration
EXAMPLE_MOLECULES = [
    ExampleMolecule(
        name="Caffeine",
        smiles="CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
        known_label="permeable",
        description="Central nervous system stimulant found in coffee and tea. Readily crosses the blood-brain barrier."
    ),
    ExampleMolecule(
        name="Diazepam",
        smiles="CN1C(=O)CN=C(c2ccccc2)c2cc(Cl)ccc21",
        known_label="permeable",
        description="Benzodiazepine medication (Valium) used to treat anxiety and seizures. Highly brain-permeable."
    ),
    ExampleMolecule(
        name="Atenolol",
        smiles="CC(C)NCC(O)COc1ccc(CC(N)=O)cc1",
        known_label="non_permeable",
        description="Hydrophilic beta-blocker used for hypertension. Minimal central nervous system penetration."
    ),
    ExampleMolecule(
        name="Dopamine",
        smiles="NCCc1ccc(O)c(O)c1",
        known_label="non_permeable",
        description="Endogenous neurotransmitter. Polar catecholamine structure prevents direct passive BBB penetration."
    )
]

# Initialize model and SHAP explainer singletons on startup
@app.on_event("startup")
def startup_event():
    print("FastAPI Startup: Initializing BBB Model and SHAP Explainer singletons...")
    _ = BBBModel()
    _ = SHAPExplainer()
    print("FastAPI Startup: Engine initialization complete.")


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Liveness check endpoint to verify backend service readiness."""
    try:
        model = BBBModel()
        loaded = model.get_raw_model() is not None
        return HealthResponse(status="healthy", model_loaded=loaded)
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "model_loaded": False, "detail": str(e)}
        )


@app.get("/examples", response_model=List[ExampleMolecule], tags=["Examples"])
def get_example_molecules():
    """Returns a curated list of reference example molecules with known BBB permeability labels."""
    return EXAMPLE_MOLECULES


@app.post(
    "/predict",
    response_model=PredictResponse,
    responses={422: {"model": InvalidSmilesResponse}},
    tags=["Prediction"]
)
def predict_bbbp(request: PredictRequest):
    """
    Predicts BBB permeability for a given SMILES string.
    Returns prediction label, confidence score, 7 computed descriptors, SHAP breakdown, and plain-language explanation.
    """
    smiles_input = request.smiles.strip() if request.smiles else ""

    # Compute RDKit descriptors
    feature_dict = compute_descriptors(smiles_input)
    if feature_dict is None:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "valid_smiles": False,
                "error": f"Could not parse SMILES string '{smiles_input}'. Please enter a valid chemical structure."
            }
        )

    # Run XGBoost inference
    model = BBBModel()
    pred_res = model.predict(feature_dict)

    # Run SHAP explainability analysis
    explainer = SHAPExplainer()
    shap_res = explainer.explain(feature_dict)

    return PredictResponse(
        valid_smiles=True,
        prediction=pred_res["prediction"],
        confidence=pred_res["confidence"],
        permeable_probability=pred_res["permeable_probability"],
        features=feature_dict,
        shap_explanation=shap_res["shap_explanation"],
        summary_sentence=shap_res["summary_sentence"]
    )


@app.post(
    "/compare",
    response_model=CompareResponse,
    responses={422: {"model": InvalidSmilesResponse}},
    tags=["Comparison"]
)
def compare_molecules(request: CompareRequest):
    """
    Compares two candidate molecules side-by-side.
    Returns full prediction and SHAP analysis objects for both, along with a called-out deciding feature difference.
    """
    # Molecule 1
    f1 = compute_descriptors(request.smiles1)
    if f1 is None:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"valid_smiles": False, "error": f"Could not parse molecule 1 SMILES '{request.smiles1}'."}
        )

    # Molecule 2
    f2 = compute_descriptors(request.smiles2)
    if f2 is None:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"valid_smiles": False, "error": f"Could not parse molecule 2 SMILES '{request.smiles2}'."}
        )

    model = BBBModel()
    explainer = SHAPExplainer()

    p1 = model.predict(f1)
    e1 = explainer.explain(f1)
    res1 = {
        "valid_smiles": True,
        "prediction": p1["prediction"],
        "confidence": p1["confidence"],
        "permeable_probability": p1["permeable_probability"],
        "features": f1,
        "shap_explanation": e1["shap_explanation"],
        "summary_sentence": e1["summary_sentence"]
    }

    p2 = model.predict(f2)
    e2 = explainer.explain(f2)
    res2 = {
        "valid_smiles": True,
        "prediction": p2["prediction"],
        "confidence": p2["confidence"],
        "permeable_probability": p2["permeable_probability"],
        "features": f2,
        "shap_explanation": e2["shap_explanation"],
        "summary_sentence": e2["summary_sentence"]
    }

    # Determine deciding difference
    deciding_diff = generate_deciding_difference(f1, f2, res1, res2)

    return CompareResponse(
        molecule1=res1,
        molecule2=res2,
        deciding_difference=deciding_diff
    )


def generate_deciding_difference(f1: dict, f2: dict, res1: dict, res2: dict) -> str:
    """Computes the primary structural difference explaining divergence in prediction."""
    p1 = res1["prediction"]
    p2 = res2["prediction"]

    tpsa_diff = round(abs(f1["tpsa"] - f2["tpsa"]), 2)
    mw_diff = round(abs(f1["mol_weight"] - f2["mol_weight"]), 2)
    logp_diff = round(abs(f1["logp"] - f2["logp"]), 2)

    if p1 != p2:
        if f1["tpsa"] > 90 or f2["tpsa"] > 90:
            more_polar = "Molecule 2" if f2["tpsa"] > f1["tpsa"] else "Molecule 1"
            return f"Deciding difference: {more_polar} has significantly higher polar surface area (TPSA difference of {tpsa_diff} Å²), exceeding the 90 Å² CNS barrier threshold."
        elif mw_diff > 100:
            heavier = "Molecule 2" if f2["mol_weight"] > f1["mol_weight"] else "Molecule 1"
            return f"Deciding difference: {heavier} has substantially higher molecular weight (MW difference of {mw_diff} Da), impairing passive membrane diffusion."
        else:
            return f"Deciding difference: Divergence driven by lipophilicity (LogP diff = {logp_diff}) and hydrogen bonding capacity."
    else:
        return f"Both molecules share the same prediction ({p1}). Structural variance: TPSA diff = {tpsa_diff} Å², MW diff = {mw_diff} Da."
