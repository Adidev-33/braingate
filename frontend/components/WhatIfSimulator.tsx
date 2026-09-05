"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import {
  FeatureDict,
  PredictResponse,
  WhatIfResponse,
  WhatIfCurvePoint,
  simulateWhatIf,
  fetchWhatIfCurve
} from "@/lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from "recharts";

interface Props {
  originalResult: PredictResponse;
  smiles?: string;
  onClose?: () => void;
}

interface DescriptorConfig {
  key: keyof FeatureDict;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  guideline: string;
  description: string;
}

const DESCRIPTORS_CONFIG: DescriptorConfig[] = [
  {
    key: "tpsa",
    label: "Topological Polar Surface Area",
    unit: "Å²",
    min: 0,
    max: 200,
    step: 1,
    guideline: "Optimal < 90 Å²",
    description: "Primary determinant of BBB penetration. Lower polar area promotes lipid membrane crossing."
  },
  {
    key: "logp",
    label: "Lipophilicity (cLogP)",
    unit: "",
    min: -4.0,
    max: 7.0,
    step: 0.1,
    guideline: "Optimal: 1.0 – 4.0",
    description: "Partition coefficient between octanol and water. Moderately lipophilic molecules cross best."
  },
  {
    key: "mol_weight",
    label: "Molecular Weight",
    unit: "Da",
    min: 50,
    max: 750,
    step: 1,
    guideline: "Optimal < 450 Da",
    description: "Heavier molecules face steric hindrance and diffuse slowly across tight endothelial junctions."
  },
  {
    key: "h_donors",
    label: "H-Bond Donors",
    unit: "",
    min: 0,
    max: 10,
    step: 1,
    guideline: "Optimal ≤ 3",
    description: "High donor counts require excessive desolvation energy to enter hydrophobic membranes."
  },
  {
    key: "h_acceptors",
    label: "H-Bond Acceptors",
    unit: "",
    min: 0,
    max: 14,
    step: 1,
    guideline: "Optimal ≤ 7",
    description: "Acceptors interact with water solvation shells, impeding passive diffusion."
  },
  {
    key: "rotatable_bonds",
    label: "Rotatable Bonds",
    unit: "",
    min: 0,
    max: 18,
    step: 1,
    guideline: "Optimal ≤ 8",
    description: "High conformational flexibility imposes an entropic penalty during membrane insertion."
  },
  {
    key: "aromatic_rings",
    label: "Aromatic Rings",
    unit: "",
    min: 0,
    max: 6,
    step: 1,
    guideline: "Typical: 1 – 4",
    description: "Aromatic systems provide hydrophobic pi-stacking interactions with lipid membranes."
  }
];

const KNOWN_MOLECULES: Record<string, string> = {
  "CN1C=NC2=C1C(=O)N(C(=O)N2C)C": "Caffeine (CNS+ Stimulant)",
  "CN1C(=O)CN=C(c2ccccc2)c2cc(Cl)ccc21": "Diazepam (Valium)",
  "CC(C)NCC(O)COc1ccc(CC(N)=O)cc1": "Atenolol (Beta-blocker)",
  "NCCc1ccc(O)c(O)c1": "Dopamine (Neurotransmitter)"
};

interface Props {
  originalResult: PredictResponse;
  smiles?: string;
  moleculeName?: string;
  onClose?: () => void;
}

export default function WhatIfSimulator({ originalResult, smiles, moleculeName, onClose }: Props) {
  const activeMoleculeName = moleculeName || (smiles && KNOWN_MOLECULES[smiles.trim()]) || "Target Candidate Compound";
  const [modifiedFeatures, setModifiedFeatures] = useState<FeatureDict>({
    ...originalResult.features
  });
  const [simulation, setSimulation] = useState<WhatIfResponse | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [selectedCurveFeature, setSelectedCurveFeature] = useState<keyof FeatureDict>("tpsa");
  const [curveData, setCurveData] = useState<WhatIfCurvePoint[]>([]);
  const [curveLoading, setCurveLoading] = useState<boolean>(false);
  const [appliedCandidateToast, setAppliedCandidateToast] = useState<string | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState<boolean>(false);
  const [savedCandidateData, setSavedCandidateData] = useState<any>(null);
  const [copiedSmiles, setCopiedSmiles] = useState<boolean>(false);

  // Sync features if originalResult changes
  useEffect(() => {
    setModifiedFeatures({ ...originalResult.features });
  }, [originalResult]);

  // Load any existing candidate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("braingate_what_if_candidate");
      if (stored) {
        setSavedCandidateData(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Execute What-If simulation against backend XGBoost model
  const runSimulation = useCallback(
    async (feats: FeatureDict) => {
      setSimLoading(true);
      try {
        const res = await simulateWhatIf({
          smiles: smiles,
          original_features: originalResult.features,
          modified_descriptors: feats
        });
        setSimulation(res);
      } catch (err) {
        console.error("Simulation error:", err);
      } finally {
        setSimLoading(false);
      }
    },
    [smiles, originalResult.features]
  );

  // Load sensitivity curve data
  const loadCurve = useCallback(
    async (targetFeat: keyof FeatureDict, currentFeats: FeatureDict) => {
      setCurveLoading(true);
      try {
        const conf = DESCRIPTORS_CONFIG.find((c) => c.key === targetFeat);
        const res = await fetchWhatIfCurve({
          base_descriptors: currentFeats,
          target_feature: targetFeat,
          min_val: conf?.min ?? 0,
          max_val: conf?.max ?? 200,
          num_points: 25
        });
        setCurveData(res.curve_points);
      } catch (err) {
        console.error("Curve error:", err);
      } finally {
        setCurveLoading(false);
      }
    },
    []
  );

  // Run initial simulation on mount
  useEffect(() => {
    runSimulation(modifiedFeatures);
  }, [runSimulation]);

  // Re-generate curve whenever selected curve feature or modified descriptors change
  useEffect(() => {
    loadCurve(selectedCurveFeature, modifiedFeatures);
  }, [selectedCurveFeature, modifiedFeatures, loadCurve]);

  const handleDescriptorChange = (key: keyof FeatureDict, value: number) => {
    const updated = { ...modifiedFeatures, [key]: value };
    setModifiedFeatures(updated);
    runSimulation(updated);
    loadCurve(selectedCurveFeature, updated);
  };

  const handleSelectCurveFeature = (featureKey: keyof FeatureDict) => {
    setSelectedCurveFeature(featureKey);
    loadCurve(featureKey, modifiedFeatures);
  };

  const handleResetSingle = (key: keyof FeatureDict) => {
    handleDescriptorChange(key, originalResult.features[key]);
  };

  const handleResetAll = () => {
    setModifiedFeatures({ ...originalResult.features });
    runSimulation({ ...originalResult.features });
    loadCurve(selectedCurveFeature, originalResult.features);
  };

  const handleApplyCandidate = () => {
    try {
      const candidatePayload = {
        timestamp: new Date().toISOString(),
        original_smiles: smiles,
        original_features: originalResult.features,
        modified_descriptors: modifiedFeatures,
        original_probability: originalResult.permeable_probability,
        simulated_probability: simulation?.new_probability,
        original_prediction: originalResult.prediction,
        simulated_prediction: simulation?.new_prediction,
        delta_percentage_points: simulation?.delta_percentage_points
      };
      localStorage.setItem("braingate_what_if_candidate", JSON.stringify(candidatePayload));
      setSavedCandidateData(candidatePayload);
      setAppliedCandidateToast("Candidate configuration saved for Molecular Modification Simulator!");
      setShowCandidateModal(true);
      setTimeout(() => setAppliedCandidateToast(null), 5000);
    } catch (e) {
      console.error("Failed to save candidate to localStorage", e);
    }
  };


  const origProbPct = Math.round((originalResult.permeable_probability ?? 0) * 100);
  const newProb = simulation ? simulation.new_probability : originalResult.permeable_probability;
  const newProbPct = Math.round(newProb * 100);
  const deltaPct = simulation ? simulation.delta_percentage_points : 0;
  const isSimPermeable = simulation ? simulation.new_prediction === "permeable" : originalResult.prediction === "permeable";
  const origIsPermeable = originalResult.prediction === "permeable";

  // SHAP guidance items: find features hurting permeability (negative SHAP)
  const hurtingFeatures = (originalResult.shap_explanation || []).filter((item) => item.shap_value < 0);
  const helpingFeatures = (originalResult.shap_explanation || []).filter((item) => item.shap_value > 0);

  const selectedConfig = DESCRIPTORS_CONFIG.find((c) => c.key === selectedCurveFeature);

  return (
    <div className="bg-surface-container rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-tertiary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-mono text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">tune</span>
              What-if Simulator
            </span>
            <span className="text-outline-variant">•</span>
            <span className="text-xs font-mono text-tertiary font-semibold">Real XGBoost Model In-the-Loop</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight flex items-center gap-2">
            Molecular Descriptor Sensitivity Simulator
          </h2>
          <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
            Adjust physicochemical parameters below to simulate how rational structural modifications shift the model's blood-brain barrier permeability prediction in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-all border border-slate-200 shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">restart_alt</span>
            Reset Baseline
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-all border border-slate-200"
              title="Close Simulator"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE ANALYZED MOLECULE CARD */}
      <div className="bg-surface-container-low p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 shadow-sm">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-tertiary/20 flex items-center justify-center text-primary shrink-0 border border-primary/30 shadow-inner">
            <span className="material-symbols-outlined text-[22px]">science</span>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                Active Molecule Being Simulated:
              </span>
              <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="text-primary font-mono font-bold">{activeMoleculeName}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                  origIsPermeable ? "bg-tertiary/20 text-tertiary" : "bg-error-container text-on-error-container"
                }`}>
                  {origIsPermeable ? "Baseline Permeable" : "Baseline Non-Permeable"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="font-mono text-xs text-tertiary bg-surface-container-lowest px-2.5 py-1 rounded-lg border border-slate-200 break-all select-all font-semibold">
                {smiles || "N/A"}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (smiles) {
                    navigator.clipboard.writeText(smiles);
                    setCopiedSmiles(true);
                    setTimeout(() => setCopiedSmiles(false), 2000);
                  }
                }}
                className="px-2 py-1 rounded-md text-[10px] font-mono bg-surface-container hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-slate-200 transition-all flex items-center gap-1"
                title="Copy SMILES"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {copiedSmiles ? "check" : "content_copy"}
                </span>
                <span>{copiedSmiles ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Baseline Quick Physicochemical Fingerprint */}
        <div className="flex items-center gap-2.5 font-mono text-xs border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4 shrink-0 flex-wrap">
          <div className="bg-surface-container px-2.5 py-1 rounded-lg border border-slate-200 text-center">
            <span className="text-[9px] text-on-surface-variant block uppercase">MW</span>
            <span className="font-bold text-on-surface text-xs">{originalResult.features.mol_weight} Da</span>
          </div>
          <div className="bg-surface-container px-2.5 py-1 rounded-lg border border-slate-200 text-center">
            <span className="text-[9px] text-on-surface-variant block uppercase">TPSA</span>
            <span className="font-bold text-primary text-xs">{originalResult.features.tpsa} Å²</span>
          </div>
          <div className="bg-surface-container px-2.5 py-1 rounded-lg border border-slate-200 text-center">
            <span className="text-[9px] text-on-surface-variant block uppercase">LogP</span>
            <span className="font-bold text-on-surface text-xs">{originalResult.features.logp}</span>
          </div>
        </div>
      </div>

      {/* Candidate Export Notification Toast */}
      {appliedCandidateToast && (
        <div className="bg-gradient-to-r from-tertiary/20 via-primary/20 to-tertiary/20 border border-tertiary/50 p-4 rounded-xl shadow-lg flex items-center justify-between gap-3 text-tertiary font-sans text-xs animate-in fade-in slide-in-from-top-2 relative z-20">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="font-semibold text-on-surface">{appliedCandidateToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setAppliedCandidateToast(null)}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* TOP COMPARISON CARDS: Baseline vs What-If Live Prediction */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {/* Baseline Card */}
        <div className="bg-surface-container-low p-5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              1. Original Baseline
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                origIsPermeable ? "bg-tertiary/20 text-tertiary" : "bg-error-container text-on-error-container"
              }`}
            >
              {origIsPermeable ? "Permeable" : "Non-Permeable"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-on-surface">{origProbPct}%</span>
            <span className="text-xs font-mono text-on-surface-variant">permeable probability</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-tight">
            Computed from actual molecular structure via RDKit.
          </p>
        </div>

        {/* What-If Live Simulation Card */}
        <div className="bg-gradient-to-br from-surface-container-high to-surface-container p-5 rounded-xl border border-primary/40 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-bold">
                2. Live What-If Prediction
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                isSimPermeable ? "bg-tertiary/20 text-tertiary" : "bg-error-container text-on-error-container"
              }`}
            >
              {isSimPermeable ? "Permeable (CNS+)" : "Non-Permeable (CNS-)"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black font-mono ${isSimPermeable ? "text-tertiary" : "text-error"}`}>
              {newProbPct}%
            </span>
            <span className="text-xs font-mono text-on-surface-variant">simulated probability</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-xs font-bold ${
                deltaPct > 0
                  ? "bg-tertiary/20 text-tertiary"
                  : deltaPct < 0
                  ? "bg-error/20 text-error"
                  : "bg-surface-container-highest text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {deltaPct > 0 ? "trending_up" : deltaPct < 0 ? "trending_down" : "drag_handle"}
              </span>
              <span>{deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`} shift</span>
            </span>
            <span className="text-[11px] font-mono text-on-surface-variant">vs original molecule</span>
          </div>
        </div>

        {/* Candidate Actions Card */}
        <div className="bg-surface-container-low p-5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-tertiary font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">science</span>
              3. Candidate Pipeline
            </span>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Forward current simulated descriptor configuration to downstream molecular design modules.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              id="btn-apply-candidate"
              onClick={handleApplyCandidate}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-tertiary text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px] text-white">send</span>
              <span className="text-white">Apply as Candidate</span>
            </button>

            {savedCandidateData && (
              <button
                type="button"
                id="btn-view-saved-candidate"
                onClick={() => setShowCandidateModal(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-mono text-[11px] font-semibold bg-surface-container-high hover:bg-surface-container-highest text-tertiary border border-tertiary/30 transition-all"
              >
                <span className="material-symbols-outlined text-[15px]">visibility</span>
                <span>Inspect Stored Candidate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SHAP EXPLAINER GUIDANCE CALLOUT */}
      {hurtingFeatures.length > 0 && (
        <div className="bg-surface-container-low p-4 rounded-xl border border-amber-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">lightbulb</span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-800">
                  SHAP Optimization Guidance
                </h4>
                <span className="text-[10px] font-mono text-on-surface-variant">
                  High-leverage modification targets
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                The baseline prediction is most restricted by:{" "}
                {hurtingFeatures.slice(0, 2).map((item, idx) => (
                  <span key={item.feature} className="text-on-surface font-semibold">
                    {idx > 0 && ", "}
                    {item.display_name.split(" (")[0]} (SHAP {item.shap_value > 0 ? `+${item.shap_value.toFixed(2)}` : item.shap_value.toFixed(2)})
                  </span>
                ))}
                . Adjusting these descriptors yields the fastest path to BBB permeability.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {hurtingFeatures.slice(0, 2).map((item) => {
              const isSelected = selectedCurveFeature === item.feature;
              return (
                <button
                  key={item.feature}
                  type="button"
                  id={`btn-plot-${item.feature}`}
                  onClick={() => handleSelectCurveFeature(item.feature as keyof FeatureDict)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 shadow-sm ${
                    isSelected
                      ? "bg-amber-600 text-white font-bold ring-2 ring-amber-400"
                      : "bg-surface-container-high hover:bg-surface-container-highest text-amber-800 border border-amber-500/40"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {isSelected ? "check_circle" : "show_chart"}
                  </span>
                  <span>Plot {item.display_name.split(" (")[0]}</span>
                  {isSelected && <span className="text-[10px] uppercase font-bold">(Active)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE: Descriptors Sliders (Left) & Response Curve Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* LEFT COLUMN: 7 Descriptor Sliders (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">sliders</span>
              Descriptor Tuning Controls (7 Descriptors)
            </h3>
            <span className="text-xs font-mono text-on-surface-variant">Interactive Sliders</span>
          </div>

          <div className="space-y-3.5">
            {DESCRIPTORS_CONFIG.map((config) => {
              const currentVal = modifiedFeatures[config.key];
              const originalVal = originalResult.features[config.key];
              const isModified = Math.abs(currentVal - originalVal) > 0.001;

              return (
                <div
                  key={config.key}
                  className={`p-4 rounded-xl border transition-all ${
                    isModified
                      ? "bg-surface-container-high border-primary/50 shadow-md"
                      : "bg-surface-container-low border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-on-surface">{config.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-container-highest text-tertiary">
                        {config.guideline}
                      </span>
                      {isModified && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/20 text-primary font-bold">
                          Modified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={config.min}
                          max={config.max}
                          step={config.step}
                          value={currentVal}
                          onChange={(e) => handleDescriptorChange(config.key, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-0.5 text-right font-mono text-xs font-bold rounded bg-surface-container-lowest border border-slate-200 text-on-surface focus:outline-none focus:border-primary"
                        />
                        <span className="font-mono text-xs text-on-surface-variant w-6">{config.unit}</span>
                      </div>

                      {isModified && (
                        <button
                          type="button"
                          onClick={() => handleResetSingle(config.key)}
                          title="Reset to baseline"
                          className="p-1 rounded bg-surface-container hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-all text-xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">undo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={currentVal}
                      onChange={(e) => handleDescriptorChange(config.key, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-surface-container-lowest rounded-lg appearance-none cursor-pointer accent-primary"
                    />

                    <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                      <span>
                        Min: {config.min} {config.unit}
                      </span>
                      <span className="text-outline">
                        Baseline: {originalVal} {config.unit}
                      </span>
                      <span>
                        Max: {config.max} {config.unit}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Sensitivity Response Curve Chart (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-tertiary">analytics</span>
              Response Curve
            </h3>
            <span className="text-xs font-mono text-on-surface-variant">Live Sensitivity</span>
          </div>

          <div className="bg-surface-container-low p-5 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm">
            {/* Target Feature Selector Dropdown */}
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="curve-descriptor-select" className="text-xs font-mono text-on-surface-variant">
                Vary Descriptor:
              </label>
              <select
                id="curve-descriptor-select"
                value={selectedCurveFeature}
                onChange={(e) => handleSelectCurveFeature(e.target.value as keyof FeatureDict)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-slate-200 text-xs font-mono font-semibold text-primary focus:outline-none focus:border-primary"
              >
                {DESCRIPTORS_CONFIG.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label} ({c.unit || "unitless"})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Simulated response curve varying <strong className="text-on-surface">{selectedConfig?.label}</strong> while holding all other 6 descriptors at current tuned values.
            </p>

            {/* Recharts Response Curve */}
            <div className="h-64 w-full relative">
              {curveLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low/80 backdrop-blur-sm z-10">
                  <span className="material-symbols-outlined text-primary text-[28px] animate-spin">
                    sync
                  </span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curveData} margin={{ top: 10, right: 15, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                    <XAxis
                      dataKey="feature_value"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      label={{
                        value: `${selectedConfig?.label} (${selectedConfig?.unit || ""})`,
                        position: "insideBottom",
                        offset: -12,
                        fill: "#64748b",
                        fontSize: 10
                      }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      domain={[0, 1]}
                      tickFormatter={(val) => `${Math.round(val * 100)}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as WhatIfCurvePoint;
                          return (
                            <div className="bg-surface-container-highest p-2.5 rounded-lg border border-slate-200 shadow-lg font-mono text-[11px] space-y-1">
                              <div className="text-on-surface font-bold">
                                {selectedConfig?.label}: {data.feature_value} {selectedConfig?.unit}
                              </div>
                              <div className="text-tertiary">
                                BBB Probability: {Math.round(data.permeable_probability * 100)}%
                              </div>
                              <div className={data.prediction === "permeable" ? "text-tertiary" : "text-error"}>
                                Class: {data.prediction}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* 50% Threshold reference line */}
                    <ReferenceLine
                      y={0.5}
                      stroke="#d97706"
                      strokeDasharray="4 4"
                      label={{
                        value: "50% Boundary",
                        position: "insideTopRight",
                        fill: "#d97706",
                        fontSize: 9
                      }}
                    />
                    {/* Current operating point marker */}
                    <ReferenceLine
                      x={modifiedFeatures[selectedCurveFeature]}
                      stroke="#059669"
                      strokeDasharray="2 2"
                      label={{
                        value: "Current",
                        position: "insideTopLeft",
                        fill: "#059669",
                        fontSize: 9
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="permeable_probability"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={{ r: 2, fill: "#0284c7" }}
                      activeDot={{ r: 5, fill: "#059669", stroke: "#0f172a" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Operating Point Details */}
            <div className="bg-surface-container p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-on-surface-variant">Current Operating Point:</span>
                <span className="font-bold text-on-surface">
                  {modifiedFeatures[selectedCurveFeature]} {selectedConfig?.unit}
                </span>
              </div>
              <div className="flex items-center gap-1 font-bold">
                <span className="text-on-surface-variant">Permeability:</span>
                <span className={isSimPermeable ? "text-tertiary" : "text-error"}>
                  {newProbPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Computational Disclaimer Banner */}
          <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-slate-200 flex items-start gap-2.5 text-on-surface-variant text-[11px] leading-relaxed">
            <span className="material-symbols-outlined text-[16px] text-tertiary shrink-0 mt-0.5">
              verified_user
            </span>
            <div>
              <strong className="text-on-surface">Computational Prediction Notice:</strong> All probabilities and response curves are generated live by the trained XGBoost model and represent in-silico estimates, not experimental laboratory assay results.
            </div>
          </div>
        </div>
      </div>

      {/* CANDIDATE INSPECTOR MODAL */}
      {showCandidateModal && savedCandidateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-high rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-tertiary/20 text-tertiary uppercase">
                    Stored in Browser localStorage
                  </span>
                  <span className="text-[11px] font-mono text-on-surface-variant">
                    key: "braingate_what_if_candidate"
                  </span>
                </div>
                <h3 className="text-xl font-bold text-on-surface">
                  Candidate Configuration Package
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCandidateModal(false)}
                className="p-1 rounded-lg bg-surface-container hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Molecule & Prediction Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div className="bg-surface-container-low p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">
                  SMILES String
                </span>
                <p className="font-bold text-primary break-all">
                  {savedCandidateData.original_smiles || smiles}
                </p>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">
                  Probability Shift (Baseline → Simulated)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-on-surface">
                    {Math.round((savedCandidateData.original_probability || 0) * 100)}%
                  </span>
                  <span className="text-on-surface-variant">→</span>
                  <span className="text-base font-extrabold text-tertiary">
                    {Math.round((savedCandidateData.simulated_probability || 0) * 100)}%
                  </span>
                  <span className="text-xs font-bold text-tertiary">
                    ({savedCandidateData.delta_percentage_points > 0 ? `+${savedCandidateData.delta_percentage_points}%` : `${savedCandidateData.delta_percentage_points}%`})
                  </span>
                </div>
              </div>
            </div>

            {/* Parameter Delta Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
                Descriptor Variations (Baseline vs Applied Overrides)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-surface-container-low">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-surface-container text-on-surface-variant uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Descriptor</th>
                      <th className="px-3 py-2 text-right">Original</th>
                      <th className="px-3 py-2 text-right">What-If Override</th>
                      <th className="px-3 py-2 text-right">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-on-surface">
                    {DESCRIPTORS_CONFIG.map((c) => {
                      const orig = savedCandidateData.original_features?.[c.key] ?? originalResult.features[c.key];
                      const mod = savedCandidateData.modified_descriptors?.[c.key] ?? modifiedFeatures[c.key];
                      const diff = Number((mod - orig).toFixed(2));
                      const isChanged = Math.abs(diff) > 0.001;
                      return (
                        <tr key={c.key} className={isChanged ? "bg-primary/5" : ""}>
                          <td className="px-3 py-2 font-semibold">
                            {c.label} ({c.unit || "count"})
                          </td>
                          <td className="px-3 py-2 text-right text-on-surface-variant">
                            {orig}
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${isChanged ? "text-primary" : "text-on-surface"}`}>
                            {mod}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isChanged ? (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${diff > 0 ? "text-tertiary bg-tertiary/10" : "text-error bg-error/10"}`}>
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Downstream Integration Details */}
            <div className="bg-surface-container p-3.5 rounded-xl border border-slate-200 text-xs text-on-surface-variant space-y-1">
              <span className="font-bold font-mono text-tertiary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">info</span>
                Downstream Module Consumption:
              </span>
              <p className="leading-relaxed text-[11px]">
                This payload is persisted in browser storage and can be consumed by the Molecular Modification Simulator or exported for external QSAR / in-silico medicinal chemistry pipelines.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(savedCandidateData, null, 2));
                  setAppliedCandidateToast("Copied candidate JSON to clipboard!");
                  setTimeout(() => setAppliedCandidateToast(null), 3000);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs font-semibold bg-surface-container hover:bg-surface-container-highest text-on-surface border border-slate-200 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>Copy JSON</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCandidateModal(false)}
                className="px-5 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-primary text-white hover:opacity-90 transition-all shadow-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

