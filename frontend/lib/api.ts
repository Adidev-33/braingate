const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ExampleMolecule {
  name: string;
  smiles: string;
  known_label: "permeable" | "non_permeable";
  description: string;
  known_toxicity?: "toxic" | "non_toxic" | null;
  known_solubility?: number | null;
  known_solubility_tier?: "High" | "Moderate" | "Low" | null;
}

export interface FeatureDict {
  mol_weight: number;
  logp: number;
  tpsa: number;
  h_donors: number;
  h_acceptors: number;
  rotatable_bonds: number;
  aromatic_rings: number;
}

export interface ShapItem {
  feature: string;
  display_name: string;
  value: number;
  shap_value: number;
  plain_text: string;
}

export interface PredictResponse {
  valid_smiles: boolean;
  prediction: "permeable" | "non_permeable";
  confidence: number;
  permeable_probability: number;
  features: FeatureDict;
  shap_explanation: ShapItem[];
  summary_sentence: string;
}

export interface ToxPredictResponse {
  valid_smiles: boolean;
  prediction: "toxic" | "non_toxic";
  confidence: number;
  toxic_probability: number;
  features: FeatureDict;
  shap_explanation: ShapItem[];
  summary_sentence: string;
}

export interface SolubilityPredictResponse {
  valid_smiles: boolean;
  log_solubility: number;
  solubility_tier: "High" | "Moderate" | "Low";
  tier_description: string;
  unit: string;
  features: FeatureDict;
  shap_explanation: ShapItem[];
  summary_sentence: string;
}

export interface ScorecardResponse {
  valid_smiles: boolean;
  smiles: string;
  features: FeatureDict;
  bbb: PredictResponse;
  toxicity: ToxPredictResponse;
  solubility: SolubilityPredictResponse;
  overall_verdict: string;
}

export interface InvalidSmilesResponse {
  valid_smiles: false;
  error: string;
}

export interface CompareResponse {
  molecule1: PredictResponse;
  molecule2: PredictResponse;
  deciding_difference: string;
}

export async function fetchHealth(): Promise<{ status: string; model_loaded: boolean; tox21_loaded?: boolean; esol_loaded?: boolean }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error("Backend service unreachable");
  return res.json();
}

export async function fetchExamples(): Promise<ExampleMolecule[]> {
  const res = await fetch(`${API_BASE_URL}/examples`);
  if (!res.ok) throw new Error("Failed to fetch example molecules");
  return res.json();
}

export async function predictSmiles(smiles: string): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ smiles })
  });

  const data = await res.json();
  if (!res.ok || data.valid_smiles === false) {
    throw new Error(data.error || "Could not parse SMILES string. Please enter a valid chemical structure.");
  }
  return data as PredictResponse;
}

export async function predictToxicity(smiles: string): Promise<ToxPredictResponse> {
  const res = await fetch(`${API_BASE_URL}/predict/toxicity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ smiles })
  });

  const data = await res.json();
  if (!res.ok || data.valid_smiles === false) {
    throw new Error(data.error || "Could not parse SMILES string for toxicity evaluation.");
  }
  return data as ToxPredictResponse;
}

export async function predictSolubility(smiles: string): Promise<SolubilityPredictResponse> {
  const res = await fetch(`${API_BASE_URL}/predict/solubility`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ smiles })
  });

  const data = await res.json();
  if (!res.ok || data.valid_smiles === false) {
    throw new Error(data.error || "Could not parse SMILES string for solubility evaluation.");
  }
  return data as SolubilityPredictResponse;
}

export async function predictScorecard(smiles: string): Promise<ScorecardResponse> {
  const res = await fetch(`${API_BASE_URL}/predict/scorecard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ smiles })
  });

  const data = await res.json();
  if (!res.ok || data.valid_smiles === false) {
    throw new Error(data.error || "Could not parse SMILES string for candidate scorecard.");
  }
  return data as ScorecardResponse;
}

export async function downloadPdfReport(
  smiles: string,
  scorecard?: ScorecardResponse | null,
  moleculeName?: string
): Promise<Blob> {
  const payload: { smiles: string; molecule_name?: string; scorecard?: ScorecardResponse } = {
    smiles,
    molecule_name: moleculeName
  };
  if (scorecard) {
    payload.scorecard = scorecard;
  }

  const res = await fetch(`${API_BASE_URL}/report/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let errorMsg = "Failed to generate PDF report from server.";
    try {
      const errJson = await res.json();
      if (errJson.error || errJson.detail) {
        errorMsg = errJson.error || errJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await res.blob();
}

export function savePdfBlob(blob: Blob, filename: string = "braingate_report.pdf") {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

export async function compareSmiles(smiles1: string, smiles2: string): Promise<CompareResponse> {
  const res = await fetch(`${API_BASE_URL}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ smiles1, smiles2 })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to run molecule comparison");
  }
  return data as CompareResponse;
}

export interface WhatIfRequest {
  smiles?: string;
  original_features?: Partial<FeatureDict>;
  modified_descriptors: Partial<FeatureDict>;
}

export interface WhatIfResponse {
  valid_input: boolean;
  original_probability: number;
  new_probability: number;
  delta_probability: number;
  delta_percentage_points: number;
  original_prediction: "permeable" | "non_permeable";
  new_prediction: "permeable" | "non_permeable";
  original_confidence: number;
  new_confidence: number;
  original_descriptors: FeatureDict;
  modified_descriptors: FeatureDict;
  disclaimer: string;
}

export interface WhatIfCurvePoint {
  feature_value: number;
  permeable_probability: number;
  prediction: "permeable" | "non_permeable";
}

export interface WhatIfCurveRequest {
  base_descriptors: FeatureDict;
  target_feature: keyof FeatureDict;
  min_val?: number;
  max_val?: number;
  num_points?: number;
}

export interface WhatIfCurveResponse {
  target_feature: string;
  curve_points: WhatIfCurvePoint[];
  disclaimer: string;
}

export async function simulateWhatIf(request: WhatIfRequest): Promise<WhatIfResponse> {
  const res = await fetch(`${API_BASE_URL}/what-if`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });

  const data = await res.json();
  if (!res.ok || data.valid_input === false) {
    throw new Error(data.error || "What-if simulation failed.");
  }
  return data as WhatIfResponse;
}

export async function fetchWhatIfCurve(request: WhatIfCurveRequest): Promise<WhatIfCurveResponse> {
  const res = await fetch(`${API_BASE_URL}/what-if/curve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to generate sensitivity curve.");
  }
  return data as WhatIfCurveResponse;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantContext {
  smiles: string;
  molecule_name?: string;
  prediction: "permeable" | "non_permeable";
  permeable_probability: number;
  confidence: number;
  features: FeatureDict;
  shap_explanation?: ShapItem[];
  summary_sentence?: string;
  what_if_data?: any;
  comparison_data?: any;
}

export interface AssistantRequest {
  question: string;
  context: AssistantContext;
  history?: ChatMessage[];
}

export interface AssistantResponse {
  answer: string;
  disclaimer: string;
  model_used?: string;
  suggested_followups?: string[];
}

export async function askAssistant(request: AssistantRequest): Promise<AssistantResponse> {
  const res = await fetch(`${API_BASE_URL}/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to consult BrainGate Scientific Assistant.");
  }
  return data as AssistantResponse;
}

export interface CandidateDescriptorDelta {
  original_value: number;
  candidate_value: number;
  absolute_delta: number;
  percentage_delta: number;
}

export interface OptimizedCandidate {
  candidate_id: number;
  name: string;
  strategy: string;
  strategy_description: string;
  prediction: "permeable" | "non_permeable";
  permeable_probability: number;
  confidence: number;
  delta_probability: number;
  delta_percentage_points: number;
  features: FeatureDict;
  descriptor_deltas: Record<string, CandidateDescriptorDelta>;
  rationale: string;
}

export interface OptimizeRequest {
  smiles?: string;
  features?: FeatureDict;
  candidate_count?: number;
  target_probability?: number;
}

export interface OptimizeResponse {
  valid_smiles: boolean;
  original_smiles?: string;
  original_prediction: "permeable" | "non_permeable";
  original_probability: number;
  original_features: FeatureDict;
  candidates: OptimizedCandidate[];
  limiting_features: string[];
  disclaimer: string;
}

export async function optimizeMolecule(request: OptimizeRequest): Promise<OptimizeResponse> {
  const res = await fetch(`${API_BASE_URL}/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Optimization calculation failed.");
  }
  return data as OptimizeResponse;
}



