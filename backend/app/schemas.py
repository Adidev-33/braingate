from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    model_loaded: bool = Field(..., example=True)
    tox21_loaded: bool = Field(True, example=True)
    esol_loaded: bool = Field(True, example=True)


class ExampleMolecule(BaseModel):
    name: str = Field(..., example="Caffeine")
    smiles: str = Field(..., example="CN1C=NC2=C1C(=O)N(C(=O)N2C)C")
    known_label: str = Field(..., example="permeable")
    description: str = Field(..., example="Central nervous system stimulant")
    known_toxicity: Optional[str] = Field(None, example="toxic", description="Known Tox21 assay status if available")
    known_solubility: Optional[float] = Field(None, example=0.9633, description="Known experimental log solubility (log mol/L) if available")
    known_solubility_tier: Optional[str] = Field(None, example="High", description="Solubility classification tier")


class PredictRequest(BaseModel):
    smiles: str = Field(..., example="CN1C=NC2=C1C(=O)N(C(=O)N2C)C", description="SMILES string representation of candidate molecule")


class ShapItem(BaseModel):
    feature: str = Field(..., example="tpsa")
    display_name: str = Field(..., example="Topological Polar Surface Area (TPSA Å²)")
    value: float = Field(..., example=61.82)
    shap_value: float = Field(..., example=0.21)
    plain_text: str = Field(..., example="Moderate polar surface area supports crossing the barrier.")


class PredictResponse(BaseModel):
    valid_smiles: bool = Field(True, example=True)
    prediction: str = Field(..., example="permeable", description="'permeable' or 'non_permeable'")
    confidence: float = Field(..., example=0.8076, description="Model confidence score (0.0 to 1.0)")
    permeable_probability: float = Field(..., example=0.8076, description="Probability of permeable class")
    features: Dict[str, float] = Field(..., description="Dict of computed 7 RDKit descriptors")
    shap_explanation: List[ShapItem] = Field(..., description="Ordered feature SHAP importance list with plain-text sentences")
    summary_sentence: str = Field(..., example="Predicted to cross the BBB, primarily driven by favorable h-bond donors and molecular weight.")


class ToxPredictResponse(BaseModel):
    valid_smiles: bool = Field(True, example=True)
    prediction: str = Field(..., example="non_toxic", description="'toxic' or 'non_toxic'")
    confidence: float = Field(..., example=0.68, description="Model confidence score (0.0 to 1.0)")
    toxic_probability: float = Field(..., example=0.32, description="Probability of toxic hit")
    features: Dict[str, float] = Field(..., description="Dict of computed 7 RDKit descriptors")
    shap_explanation: List[ShapItem] = Field(..., description="Ordered feature SHAP importance list with plain-text sentences")
    summary_sentence: str = Field(..., example="Predicted low overall toxicity risk, supported by favorable lipophilicity.")


class SolubilityPredictResponse(BaseModel):
    valid_smiles: bool = Field(True, example=True)
    log_solubility: float = Field(..., example=0.8989, description="Predicted log solubility in log(mol/L)")
    solubility_tier: str = Field(..., example="High", description="Classification: 'High', 'Moderate', or 'Low'")
    tier_description: str = Field(..., example="Highly soluble in aqueous media (> 10 mM)")
    unit: str = Field("log(mol/L)", example="log(mol/L)")
    features: Dict[str, float] = Field(..., description="Dict of computed 7 RDKit descriptors")
    shap_explanation: List[ShapItem] = Field(..., description="Ordered feature SHAP importance list with plain-text sentences")
    summary_sentence: str = Field(..., example="Aqueous solubility favored, primarily driven by lipophilicity and h-bond donors.")


class ScorecardResponse(BaseModel):
    valid_smiles: bool = Field(True, example=True)
    smiles: str = Field(..., example="CN1C=NC2=C1C(=O)N(C(=O)N2C)C")
    features: Dict[str, float] = Field(..., description="Dict of computed 7 RDKit descriptors")
    bbb: PredictResponse = Field(..., description="Full BBB permeability prediction and SHAP block")
    toxicity: ToxPredictResponse = Field(..., description="Full Tox21 toxicity prediction and SHAP block")
    solubility: SolubilityPredictResponse = Field(..., description="Full ESOL solubility prediction and SHAP block")
    overall_verdict: str = Field(..., example="Candidate profile: Favorable BBB penetration, low toxicity risk, and high aqueous solubility.")


class InvalidSmilesResponse(BaseModel):
    valid_smiles: bool = Field(False, example=False)
    error: str = Field(..., example="Could not parse SMILES string. Please check chemical structure syntax.")


class CompareRequest(BaseModel):
    smiles1: str = Field(..., example="CN1C=NC2=C1C(=O)N(C(=O)N2C)C", description="First SMILES string")
    smiles2: str = Field(..., example="NCCc1ccc(O)c(O)c1", description="Second SMILES string")


class CompareResponse(BaseModel):
    molecule1: Dict[str, Any] = Field(..., description="Full prediction object for molecule 1")
    molecule2: Dict[str, Any] = Field(..., description="Full prediction object for molecule 2")
    deciding_difference: str = Field(..., example="Molecule 1 crosses the BBB, whereas Molecule 2 is restricted due to higher polarity.")


class WhatIfRequest(BaseModel):
    smiles: Optional[str] = Field(None, example="NCCc1ccc(O)c(O)c1", description="Original SMILES string")
    original_features: Optional[Dict[str, float]] = Field(None, description="Pre-computed original descriptor dictionary if available")
    modified_descriptors: Dict[str, float] = Field(..., description="Dictionary of modified/overridden descriptor values", example={"tpsa": 45.0, "h_donors": 1})


class WhatIfResponse(BaseModel):
    valid_input: bool = Field(True, example=True)
    original_probability: float = Field(..., example=0.141, description="Original BBB permeability probability (0.0 to 1.0)")
    new_probability: float = Field(..., example=0.785, description="Simulated BBB permeability probability (0.0 to 1.0)")
    delta_probability: float = Field(..., example=0.644, description="Raw change in probability (new - original)")
    delta_percentage_points: float = Field(..., example=64.4, description="Percentage points delta (e.g. +64.4% or -12.3%)")
    original_prediction: str = Field(..., example="non_permeable", description="'permeable' or 'non_permeable'")
    new_prediction: str = Field(..., example="permeable", description="'permeable' or 'non_permeable'")
    original_confidence: float = Field(..., example=0.859, description="Original prediction confidence")
    new_confidence: float = Field(..., example=0.785, description="Simulated prediction confidence")
    original_descriptors: Dict[str, float] = Field(..., description="Full baseline descriptor vector")
    modified_descriptors: Dict[str, float] = Field(..., description="Full modified descriptor vector fed to the model")
    disclaimer: str = Field("Computational prediction based on machine learning model; not an experimental assay result.", example="Computational prediction based on machine learning model; not an experimental assay result.")


class WhatIfCurvePoint(BaseModel):
    feature_value: float = Field(..., example=60.0)
    permeable_probability: float = Field(..., example=0.82)
    prediction: str = Field(..., example="permeable")


class WhatIfCurveRequest(BaseModel):
    base_descriptors: Dict[str, float] = Field(..., description="Baseline/current descriptor vector")
    target_feature: str = Field(..., example="tpsa", description="Descriptor to vary along the x-axis")
    min_val: Optional[float] = Field(None, example=0.0, description="Minimum descriptor range value")
    max_val: Optional[float] = Field(None, example=200.0, description="Maximum descriptor range value")
    num_points: Optional[int] = Field(25, example=25, description="Number of simulation steps")


class WhatIfCurveResponse(BaseModel):
    target_feature: str = Field(..., example="tpsa")
    curve_points: List[WhatIfCurvePoint] = Field(..., description="List of simulated response points along the descriptor curve")
    disclaimer: str = Field("Computational prediction based on machine learning model; not an experimental assay result.", example="Computational prediction based on machine learning model; not an experimental assay result.")


class ChatMessage(BaseModel):
    role: str = Field(..., example="user", description="'user' | 'assistant'")
    content: str = Field(..., example="Why is permeability predicted to be low?")


class AssistantContext(BaseModel):
    smiles: str = Field(..., example="NCCc1ccc(O)c(O)c1", description="Current molecule SMILES string")
    molecule_name: Optional[str] = Field(None, example="Dopamine", description="Molecule name if known")
    prediction: str = Field(..., example="non_permeable", description="'permeable' | 'non_permeable'")
    permeable_probability: float = Field(..., example=0.141, description="Model permeable probability (0.0 to 1.0)")
    confidence: float = Field(..., example=0.859, description="Model confidence score")
    features: Dict[str, float] = Field(..., description="Computed 7 RDKit descriptors")
    shap_explanation: Optional[List[ShapItem]] = Field(None, description="SHAP feature attributions")
    summary_sentence: Optional[str] = Field(None, description="Executive plain-text chemical summary")
    what_if_data: Optional[Dict[str, Any]] = Field(None, description="Optional What-If simulation parameters and deltas")
    comparison_data: Optional[Dict[str, Any]] = Field(None, description="Optional analog comparison data")


class AssistantRequest(BaseModel):
    question: str = Field(..., example="Why did this molecule fail BBB criteria?", description="User query or preset action prompt")
    context: AssistantContext = Field(..., description="Structured prediction and SHAP context")
    history: Optional[List[ChatMessage]] = Field(None, description="Optional previous conversation history for multi-turn chat")


class AssistantResponse(BaseModel):
    answer: str = Field(..., description="Grounded scientific explanation from BrainGate Assistant")
    disclaimer: str = Field("Computational prediction based on machine learning model; not an experimental or clinical result.", example="Computational prediction based on machine learning model; not an experimental or clinical result.")
    model_used: Optional[str] = Field(None, example="groq/openai/gpt-oss-120b", description="Identifier of the model engine that produced the response")
    suggested_followups: Optional[List[str]] = Field(None, description="Suggested follow-up scientific questions")


