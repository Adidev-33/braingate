import os
import sys
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import compute_descriptors
from backend.app.model import BBBModel
from backend.app.explain import SHAPExplainer
from backend.app.model_stretch import Tox21Model, ESOLModel
from backend.app.explain_stretch import Tox21Explainer, ESOLExplainer
from backend.app.what_if import run_what_if_simulation, generate_response_curve
from backend.app.ai_assistant import generate_assistant_response
from backend.app.molecular_optimizer import optimize_descriptors
from backend.app.pdf_generator import generate_pdf_report
from backend.app.schemas import (
    HealthResponse,
    ExampleMolecule,
    PredictRequest,
    PredictResponse,
    ToxPredictResponse,
    SolubilityPredictResponse,
    ScorecardResponse,
    InvalidSmilesResponse,
    CompareRequest,
    CompareResponse,
    WhatIfRequest,
    WhatIfResponse,
    WhatIfCurveRequest,
    WhatIfCurveResponse,
    AssistantRequest,
    AssistantResponse,
    OptimizeRequest,
    OptimizeResponse,
    PDFReportRequest
)

app = FastAPI(
    title="BrainGate API",
    description="Explainable Blood-Brain Barrier (BBB) Permeability & Multi-Property Candidate Screener API",
    version="2.0.0"
)

# Enable CORS for frontend cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Curated reference example molecules with known multi-property annotations
EXAMPLE_MOLECULES = [
    ExampleMolecule(
        name="Caffeine",
        smiles="CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
        known_label="permeable",
        description="Central nervous system stimulant found in coffee and tea. Readily crosses the blood-brain barrier.",
        known_toxicity="toxic",
        known_solubility=0.9633,
        known_solubility_tier="High"
    ),
    ExampleMolecule(
        name="Diazepam",
        smiles="CN1C(=O)CN=C(c2ccccc2)c2cc(Cl)ccc21",
        known_label="permeable",
        description="Benzodiazepine medication (Valium) used to treat anxiety and seizures. Highly brain-permeable.",
        known_toxicity="toxic",
        known_solubility=-0.4292,
        known_solubility_tier="High"
    ),
    ExampleMolecule(
        name="Atenolol",
        smiles="CC(C)NCC(O)COc1ccc(CC(N)=O)cc1",
        known_label="non_permeable",
        description="Hydrophilic beta-blocker used for hypertension. Minimal central nervous system penetration.",
        known_toxicity="non_toxic",
        known_solubility=None,
        known_solubility_tier=None
    ),
    ExampleMolecule(
        name="Dopamine",
        smiles="NCCc1ccc(O)c(O)c1",
        known_label="non_permeable",
        description="Endogenous neurotransmitter. Polar catecholamine structure prevents direct passive BBB penetration.",
        known_toxicity="toxic",
        known_solubility=None,
        known_solubility_tier=None
    )
]


# Initialize models and SHAP explainers singletons on startup
@app.on_event("startup")
def startup_event():
    print("FastAPI Startup: Initializing BBB, Tox21, and ESOL Models and SHAP Explainer singletons...")
    _ = BBBModel()
    _ = SHAPExplainer()
    _ = Tox21Model()
    _ = Tox21Explainer()
    _ = ESOLModel()
    _ = ESOLExplainer()
    print("FastAPI Startup: All model engines and SHAP explainers initialized successfully.")


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Liveness check endpoint to verify backend service readiness across all models."""
    try:
        bbb_loaded = BBBModel().get_raw_model() is not None
        tox_loaded = Tox21Model().get_raw_model() is not None
        esol_loaded = ESOLModel().get_raw_model() is not None
        healthy = bbb_loaded and tox_loaded and esol_loaded
        return HealthResponse(
            status="healthy" if healthy else "degraded",
            model_loaded=bbb_loaded,
            tox21_loaded=tox_loaded,
            esol_loaded=esol_loaded
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "model_loaded": False, "detail": str(e)}
        )


@app.get("/examples", response_model=List[ExampleMolecule], tags=["Examples"])
def get_example_molecules():
    """Returns a curated list of reference example molecules with known BBB permeability, toxicity, and solubility labels."""
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
    "/predict/toxicity",
    response_model=ToxPredictResponse,
    responses={422: {"model": InvalidSmilesResponse}},
    tags=["Toxicity"]
)
def predict_toxicity(request: PredictRequest):
    """
    Predicts cellular stress response and nuclear receptor toxicity liability via Tox21 model.
    Returns toxicity flag ('toxic' | 'non_toxic'), confidence, SHAP attributions, and plain-language rationale.
    """
    smiles_input = request.smiles.strip() if request.smiles else ""

    feature_dict = compute_descriptors(smiles_input)
    if feature_dict is None:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "valid_smiles": False,
                "error": f"Could not parse SMILES string '{smiles_input}'. Please enter a valid chemical structure."
            }
        )

    model = Tox21Model()
    pred_res = model.predict(feature_dict)

    explainer = Tox21Explainer()
    shap_res = explainer.explain(feature_dict)

    return ToxPredictResponse(
        valid_smiles=True,
        prediction=pred_res["prediction"],
        confidence=pred_res["confidence"],
        toxic_probability=pred_res["toxic_probability"],
        features=feature_dict,
        shap_explanation=shap_res["shap_explanation"],
        summary_sentence=shap_res["summary_sentence"]
    )


@app.post(
    "/predict/solubility",
    response_model=SolubilityPredictResponse,
    responses={422: {"model": InvalidSmilesResponse}},
    tags=["Solubility"]
)
def predict_solubility(request: PredictRequest):
    """
    Predicts aqueous log solubility (logS) via ESOL regression model.
    Returns numerical logS, qualitative solubility tier, SHAP attributions, and plain-language rationale.
    """
    smiles_input = request.smiles.strip() if request.smiles else ""

    feature_dict = compute_descriptors(smiles_input)
    if feature_dict is None:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "valid_smiles": False,
                "error": f"Could not parse SMILES string '{smiles_input}'. Please enter a valid chemical structure."
            }
        )

    model = ESOLModel()
    pred_res = model.predict(feature_dict)

    explainer = ESOLExplainer()
    shap_res = explainer.explain(feature_dict)

    return SolubilityPredictResponse(
        valid_smiles=True,
        log_solubility=pred_res["log_solubility"],
        solubility_tier=pred_res["solubility_tier"],
        tier_description=pred_res["tier_description"],
        unit=pred_res["unit"],
        features=feature_dict,
        shap_explanation=shap_res["shap_explanation"],
        summary_sentence=shap_res["summary_sentence"]
    )


@app.post(
    "/predict/scorecard",
    response_model=ScorecardResponse,
    responses={422: {"model": InvalidSmilesResponse}},
    tags=["Scorecard"]
)
def predict_scorecard(request: PredictRequest):
    """
    Multi-property drug candidate screener: computes BBB permeability, Tox21 toxicity risk,
    and ESOL aqueous solubility in a single unified call with dedicated SHAP explanations and an executive verdict.
    """
    smiles_input = request.smiles.strip() if request.smiles else ""

    # Compute RDKit descriptors once for all models
    feature_dict = compute_descriptors(smiles_input)
    if feature_dict is None:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "valid_smiles": False,
                "error": f"Could not parse SMILES string '{smiles_input}'. Please enter a valid chemical structure."
            }
        )

    # 1. BBB Permeability
    bbb_model = BBBModel()
    bbb_pred = bbb_model.predict(feature_dict)
    bbb_explainer = SHAPExplainer()
    bbb_shap = bbb_explainer.explain(feature_dict)
    bbb_res = PredictResponse(
        valid_smiles=True,
        prediction=bbb_pred["prediction"],
        confidence=bbb_pred["confidence"],
        permeable_probability=bbb_pred["permeable_probability"],
        features=feature_dict,
        shap_explanation=bbb_shap["shap_explanation"],
        summary_sentence=bbb_shap["summary_sentence"]
    )

    # 2. Tox21 Toxicity
    tox_model = Tox21Model()
    tox_pred = tox_model.predict(feature_dict)
    tox_explainer = Tox21Explainer()
    tox_shap = tox_explainer.explain(feature_dict)
    tox_res = ToxPredictResponse(
        valid_smiles=True,
        prediction=tox_pred["prediction"],
        confidence=tox_pred["confidence"],
        toxic_probability=tox_pred["toxic_probability"],
        features=feature_dict,
        shap_explanation=tox_shap["shap_explanation"],
        summary_sentence=tox_shap["summary_sentence"]
    )

    # 3. ESOL Solubility
    esol_model = ESOLModel()
    esol_pred = esol_model.predict(feature_dict)
    esol_explainer = ESOLExplainer()
    esol_shap = esol_explainer.explain(feature_dict)
    esol_res = SolubilityPredictResponse(
        valid_smiles=True,
        log_solubility=esol_pred["log_solubility"],
        solubility_tier=esol_pred["solubility_tier"],
        tier_description=esol_pred["tier_description"],
        unit=esol_pred["unit"],
        features=feature_dict,
        shap_explanation=esol_shap["shap_explanation"],
        summary_sentence=esol_shap["summary_sentence"]
    )

    # Synthesize overall candidate verdict
    verdict = generate_scorecard_verdict(bbb_pred, tox_pred, esol_pred)

    return ScorecardResponse(
        valid_smiles=True,
        smiles=smiles_input,
        features=feature_dict,
        bbb=bbb_res,
        toxicity=tox_res,
        solubility=esol_res,
        overall_verdict=verdict
    )


def generate_scorecard_verdict(bbb: dict, tox: dict, esol: dict) -> str:
    """Synthesizes a holistic executive screening summary across BBB, toxicity, and solubility."""
    is_perm = bbb["prediction"] == "permeable"
    is_safe = tox["prediction"] == "non_toxic"
    tier = esol["solubility_tier"]

    if is_perm and is_safe and tier in ["High", "Moderate"]:
        return "Optimal Candidate Profile: High blood-brain barrier permeability, low cellular toxicity risk, and favorable aqueous solubility. Prime candidate for lead progression."
    elif is_perm and not is_safe:
        return "CNS Active with Toxicity Liability: Crosses the blood-brain barrier effectively, but flagged with potential cellular/receptor toxicity risk requiring medicinal chemistry derisking."
    elif not is_perm and is_safe and tier in ["High", "Moderate"]:
        return "Peripheral Drug Profile: Favorable safety and solubility profile, but restricted from passive BBB entry; suitable for peripheral targets or requires prodrug engineering."
    elif not is_perm and not is_safe:
        return "High-Risk Profile: Restricted BBB permeability and flagged for potential toxicity liability; low prioritization for central nervous system indications."
    elif is_perm and tier == "Low":
        return "CNS Active with Solubility Risk: Permeable into the brain, but poor aqueous solubility may cause dissolution or formulation challenges."
    else:
        return f"Mixed Screening Profile: BBB {'permeable' if is_perm else 'restricted'}, {tox['prediction']} risk, {tier.lower()} aqueous solubility."


@app.post(
    "/report/pdf",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Returns raw binary PDF report file."
        },
        422: {"model": InvalidSmilesResponse}
    },
    tags=["Reporting"]
)
def export_pdf_report(request: PDFReportRequest):
    """
    Generates a publication-grade PDF summary report for a given SMILES string.
    Includes prediction verdict, confidence, computed descriptors, static SHAP bar chart,
    CNS MPO compliance table, and multi-property (Tox21 / ESOL) candidate scorecard.
    """
    smiles_input = request.smiles.strip() if request.smiles else ""

    # If full precomputed scorecard provided, use its data directly
    if request.scorecard is not None and request.scorecard.valid_smiles:
        scorecard_dict = request.scorecard.dict()
    else:
        # Otherwise compute descriptors & multi-property scorecard dynamically
        feature_dict = compute_descriptors(smiles_input)
        if feature_dict is None:
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "valid_smiles": False,
                    "error": f"Could not parse SMILES string '{smiles_input}'. Please enter a valid chemical structure."
                }
            )

        bbb_model = BBBModel()
        bbb_pred = bbb_model.predict(feature_dict)
        bbb_explainer = SHAPExplainer()
        bbb_shap = bbb_explainer.explain(feature_dict)
        bbb_res = {
            "valid_smiles": True,
            "prediction": bbb_pred["prediction"],
            "confidence": bbb_pred["confidence"],
            "permeable_probability": bbb_pred["permeable_probability"],
            "features": feature_dict,
            "shap_explanation": bbb_shap["shap_explanation"],
            "summary_sentence": bbb_shap["summary_sentence"]
        }

        tox_model = Tox21Model()
        tox_pred = tox_model.predict(feature_dict)
        tox_explainer = Tox21Explainer()
        tox_shap = tox_explainer.explain(feature_dict)
        tox_res = {
            "valid_smiles": True,
            "prediction": tox_pred["prediction"],
            "confidence": tox_pred["confidence"],
            "toxic_probability": tox_pred["toxic_probability"],
            "features": feature_dict,
            "shap_explanation": tox_shap["shap_explanation"],
            "summary_sentence": tox_shap["summary_sentence"]
        }

        esol_model = ESOLModel()
        esol_pred = esol_model.predict(feature_dict)
        esol_explainer = ESOLExplainer()
        esol_shap = esol_explainer.explain(feature_dict)
        esol_res = {
            "valid_smiles": True,
            "log_solubility": esol_pred["log_solubility"],
            "solubility_tier": esol_pred["solubility_tier"],
            "tier_description": esol_pred["tier_description"],
            "unit": esol_pred["unit"],
            "features": feature_dict,
            "shap_explanation": esol_shap["shap_explanation"],
            "summary_sentence": esol_shap["summary_sentence"]
        }

        verdict = generate_scorecard_verdict(bbb_pred, tox_pred, esol_pred)
        scorecard_dict = {
            "valid_smiles": True,
            "smiles": smiles_input,
            "features": feature_dict,
            "bbb": bbb_res,
            "toxicity": tox_res,
            "solubility": esol_res,
            "overall_verdict": verdict
        }

    try:
        pdf_bytes = generate_pdf_report(
            smiles=smiles_input,
            scorecard=scorecard_dict,
            molecule_name=request.molecule_name
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(e)}"
        )

    # Sanitize molecule filename
    clean_name = "".join(c for c in (request.molecule_name or smiles_input[:16]) if c.isalnum() or c in ("-", "_")).strip()
    if not clean_name:
        clean_name = "molecule"
    filename = f"braingate_report_{clean_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
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


@app.post(
    "/what-if",
    response_model=WhatIfResponse,
    responses={422: {"model": InvalidSmilesResponse}},
    tags=["What-If Simulator"]
)
def what_if_simulation(request: WhatIfRequest):
    """
    Evaluates modified descriptor parameters against the real trained XGBoost BBB model.
    Returns original probability, simulated probability, delta, predictions, and modified descriptors.
    """
    try:
        res = run_what_if_simulation(
            smiles=request.smiles,
            original_features=request.original_features,
            modified_descriptors=request.modified_descriptors
        )
        return WhatIfResponse(**res)
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"valid_smiles": False, "error": str(e)}
        )


@app.post(
    "/what-if/curve",
    response_model=WhatIfCurveResponse,
    responses={422: {"model": InvalidSmilesResponse}},
    tags=["What-If Simulator"]
)
def what_if_curve(request: WhatIfCurveRequest):
    """
    Generates real model response curve data for a single descriptor varied across its range
    while keeping other descriptors fixed.
    """
    try:
        curve_points = generate_response_curve(
            base_descriptors=request.base_descriptors,
            target_feature=request.target_feature,
            min_val=request.min_val,
            max_val=request.max_val,
            num_points=request.num_points or 25
        )
        return WhatIfCurveResponse(
            target_feature=request.target_feature,
            curve_points=curve_points,
            disclaimer="Computational prediction based on machine learning model; not an experimental assay result."
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"valid_smiles": False, "error": str(e)}
        )


@app.post(
    "/assistant",
    response_model=AssistantResponse,
    tags=["Scientific Assistant"]
)
def scientific_assistant(request: AssistantRequest):
    """
    BrainGate Scientific Assistant: Groq LLM-powered domain consultant answering questions
    grounded in structured RDKit descriptors, XGBoost predictions, SHAP attributions, and What-if modifications.
    """
    try:
        context_dict = request.context.dict()
        history_list = [h.dict() for h in request.history] if request.history else None
        res = generate_assistant_response(
            question=request.question,
            context=context_dict,
            history=history_list
        )
        return AssistantResponse(
            answer=res["answer"],
            disclaimer=res.get("disclaimer", "Computational prediction based on machine learning model; not an experimental or clinical result."),
            model_used=res.get("model_used"),
            suggested_followups=res.get("suggested_followups")
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Failed to generate assistant response: {str(e)}"}
        )


@app.post(
    "/optimize",
    response_model=OptimizeResponse,
    responses={422: {"model": InvalidSmilesResponse}},
    tags=["Optimization"]
)
def optimize_molecule(request: OptimizeRequest):
    """
    Molecular Modification Simulator (Level 1: Descriptor Optimization).
    Generates ranked hypothetical candidates that relieve SHAP-identified penalties
    and re-evaluates each through the trained XGBoost model.
    """
    try:
        result = optimize_descriptors(
            smiles=request.smiles,
            features=request.features,
            candidate_count=request.candidate_count,
            target_probability=request.target_probability or 0.75
        )
        return OptimizeResponse(**result)
    except ValueError as ve:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"valid_smiles": False, "error": str(ve)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Optimization failed: {str(e)}"}
        )

# Server Reload Timestamp: 2026-09-05T11:48:00




