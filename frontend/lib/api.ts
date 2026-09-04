const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ExampleMolecule {
  name: string;
  smiles: string;
  known_label: "permeable" | "non_permeable";
  description: string;
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
  summary_sentence: str;
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

export async function fetchHealth(): Promise<{ status: string; model_loaded: boolean }> {
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
