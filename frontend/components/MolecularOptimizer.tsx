"use client";

import React, { useState, useEffect } from "react";
import {
  PredictResponse,
  OptimizedCandidate,
  OptimizeResponse,
  optimizeMolecule
} from "@/lib/api";

interface Props {
  originalResult: PredictResponse;
  smiles: string;
  moleculeName?: string;
  onOpenAssistant?: (question?: string, extraContext?: any) => void;
  onApplyToWhatIf?: (modifiedDescriptors: any) => void;
}

const DESCRIPTOR_LABELS: Record<string, { label: string; unit: string; optimal: string }> = {
  tpsa: { label: "Topological Polar Surface Area", unit: "Å²", optimal: "< 90 Å² (sweet spot 20-50)" },
  h_donors: { label: "H-Bond Donors", unit: "", optimal: "≤ 3 (sweet spot 0-1)" },
  logp: { label: "Lipophilicity (cLogP)", unit: "", optimal: "1.0 – 4.0 (sweet spot ~2.5)" },
  mol_weight: { label: "Molecular Weight", unit: "Da", optimal: "< 450 Da (sweet spot < 350)" },
  h_acceptors: { label: "H-Bond Acceptors", unit: "", optimal: "≤ 7 (sweet spot 2-4)" },
  rotatable_bonds: { label: "Rotatable Bonds", unit: "", optimal: "≤ 8 (sweet spot 0-3)" },
  aromatic_rings: { label: "Aromatic Rings", unit: "", optimal: "1 – 4 rings" }
};

export default function MolecularOptimizer({
  originalResult,
  smiles,
  moleculeName,
  onOpenAssistant,
  onApplyToWhatIf
}: Props) {
  const [candidateCount, setCandidateCount] = useState<number>(4);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizeData, setOptimizeData] = useState<OptimizeResponse | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<OptimizedCandidate | null>(null);

  const activeName = moleculeName || "Candidate Compound";
  const origProbPct = Math.round((originalResult.permeable_probability ?? 0) * 100);
  const isOrigPerm = originalResult.prediction === "permeable";

  // Auto-generate candidates on mount or SMILES change
  useEffect(() => {
    handleGenerateCandidates();
  }, [smiles, originalResult]);

  const handleGenerateCandidates = async (count: number = candidateCount) => {
    setLoading(true);
    setError(null);
    try {
      const res = await optimizeMolecule({
        smiles: smiles,
        features: originalResult.features,
        candidate_count: count,
        target_probability: 0.75
      });
      setOptimizeData(res);
      if (res.candidates && res.candidates.length > 0) {
        setSelectedCandidate(res.candidates[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate optimized candidates.");
    } finally {
      setLoading(false);
    }
  };

  const handleExplainCandidateWithAI = (candidate: OptimizedCandidate) => {
    if (!onOpenAssistant) return;
    const q = `Why is ${candidate.name} (${candidate.strategy}) predicted to have a ${Math.round(candidate.permeable_probability * 100)}% BBB permeability compared to the original baseline (${origProbPct}%)?`;
    const extraContext = {
      comparison_data: {
        candidate_name: candidate.name,
        candidate_strategy: candidate.strategy,
        candidate_probability: candidate.permeable_probability,
        candidate_features: candidate.features,
        descriptor_deltas: candidate.descriptor_deltas,
        rationale: candidate.rationale
      }
    };
    onOpenAssistant(q, extraContext);
  };

  const handleSendToWhatIf = (candidate: OptimizedCandidate) => {
    if (onApplyToWhatIf) {
      onApplyToWhatIf(candidate.features);
    }
    // Also save to localStorage for What-if tab
    try {
      localStorage.setItem("braingate_what_if_candidate", JSON.stringify({
        original_smiles: smiles,
        candidate_name: candidate.name,
        modified_descriptors: candidate.features,
        delta_percentage_points: candidate.delta_percentage_points,
        new_probability: candidate.permeable_probability
      }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Optimizer Header Banner */}
      <div className="bg-surface-container rounded-2xl border border-slate-200 p-6 relative overflow-hidden shadow-sm">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                Level 1: Descriptor Optimization
              </span>
              <span className="text-xs font-mono text-on-surface-variant">SHAP-Guided Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">
              Molecular Modification Simulator
            </h2>
            <p className="text-xs text-on-surface-variant mt-1 max-w-2xl font-mono">
              Generates in-silico descriptor perturbations to relieve negative SHAP barriers,
              re-evaluating each candidate through the trained XGBoost model.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface-container-high p-2 rounded-xl border border-slate-200 shrink-0">
            <div className="flex items-center gap-2 px-2">
              <label htmlFor="cand-count" className="text-xs font-mono text-on-surface-variant">Count:</label>
              <select
                id="cand-count"
                value={candidateCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCandidateCount(val);
                  handleGenerateCandidates(val);
                }}
                disabled={loading}
                className="bg-surface-container-lowest border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-on-surface focus:border-primary focus:outline-none"
              >
                <option value={2}>2 Candidates</option>
                <option value={3}>3 Candidates</option>
                <option value={4}>4 Candidates</option>
                <option value={6}>6 Candidates</option>
              </select>
            </div>

            <button
              onClick={() => handleGenerateCandidates(candidateCount)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-bold font-mono transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>
                {loading ? "sync" : "auto_awesome"}
              </span>
              <span>{loading ? "Optimizing..." : "Regenerate"}</span>
            </button>
          </div>
        </div>

        {/* Baseline Molecule Context Card */}
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-surface-container-low p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block mb-0.5">Target Baseline</span>
            <span className="font-bold text-on-surface">{activeName}</span>
            <span className="text-slate-500 block truncate text-[10px] mt-0.5">{smiles}</span>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block mb-0.5">Baseline Prediction</span>
              <span className={`font-bold ${isOrigPerm ? "text-tertiary" : "text-error"}`}>
                {isOrigPerm ? "Permeable (CNS+)" : "Non-Permeable (CNS-)"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block mb-0.5">Prob</span>
              <span className="font-bold text-on-surface text-base">{origProbPct}%</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block mb-0.5">Top Limiting Factors (SHAP)</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {optimizeData?.limiting_features && optimizeData.limiting_features.length > 0 ? (
                optimizeData.limiting_features.map((feat, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-error/15 text-error border border-error/30 font-bold">
                    {feat.split(" (")[0]}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-[10px]">Analyzing features...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error/15 border border-error/40 text-error text-xs font-mono flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Candidate Cards Grid */}
      {optimizeData && optimizeData.candidates && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span>Ranked Optimized Candidates</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-surface-container-highest text-on-surface-variant">
                {optimizeData.candidates.length} Profiles Generated
              </span>
            </h3>
            <span className="text-xs text-on-surface-variant font-mono">Sorted by Predicted BBB Probability (High to Low)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {optimizeData.candidates.map((cand) => {
              const isSelected = selectedCandidate?.candidate_id === cand.candidate_id;
              const isCandPerm = cand.prediction === "permeable";
              const candProbPct = Math.round(cand.permeable_probability * 100);
              const isPositiveShift = cand.delta_percentage_points > 0;

              return (
                <div
                  key={cand.candidate_id}
                  onClick={() => setSelectedCandidate(cand)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-surface-container-high border-primary ring-2 ring-primary/40 shadow-md scale-[1.02]"
                      : "bg-surface-container border-slate-200 hover:border-slate-300 hover:bg-surface-container-high"
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-primary tracking-wider">
                        Rank #{cand.candidate_id}
                      </span>
                      <h4 className="font-bold text-sm text-on-surface leading-tight mt-0.5">
                        {cand.strategy}
                      </h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase shrink-0 ${
                      isCandPerm ? "bg-tertiary/20 text-tertiary border border-tertiary/40" : "bg-error/20 text-error border border-error/40"
                    }`}>
                      {isCandPerm ? "CNS+" : "CNS-"}
                    </span>
                  </div>

                  {/* Probability and Delta */}
                  <div className="bg-surface-container-lowest p-3 rounded-lg border border-slate-200 mb-3">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-2xl font-bold font-mono text-on-surface">
                        {candProbPct}%
                      </span>
                      <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                        isPositiveShift ? "text-tertiary" : "text-error"
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {isPositiveShift ? "arrow_upward" : "arrow_downward"}
                        </span>
                        <span>{isPositiveShift ? "+" : ""}{cand.delta_percentage_points}%</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCandPerm ? "bg-gradient-to-r from-emerald-500 to-tertiary" : "bg-gradient-to-r from-red-600 to-rose-400"
                        }`}
                        style={{ width: `${candProbPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Descriptor Shifts Summary */}
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono mb-3">
                    <div className="bg-surface-container-low p-1.5 rounded border border-slate-200 text-center">
                      <span className="text-slate-600 block">TPSA</span>
                      <span className="font-bold text-on-surface">{cand.features.tpsa}</span>
                    </div>
                    <div className="bg-surface-container-low p-1.5 rounded border border-slate-200 text-center">
                      <span className="text-slate-600 block">HBD</span>
                      <span className="font-bold text-on-surface">{cand.features.h_donors}</span>
                    </div>
                    <div className="bg-surface-container-low p-1.5 rounded border border-slate-200 text-center">
                      <span className="text-slate-600 block">LogP</span>
                      <span className="font-bold text-on-surface">{cand.features.logp}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidate(cand);
                      }}
                      className={`w-full py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all ${
                        isSelected
                          ? "bg-primary text-white shadow-sm"
                          : "bg-surface-container-highest text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      {isSelected ? "Comparing" : "Compare"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Before-vs-After Comparison View for Selected Candidate */}
      {selectedCandidate && (
        <div className="bg-surface-container rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/20 text-primary uppercase">
                  Side-by-Side Comparison
                </span>
                <span className="text-xs font-mono text-on-surface-variant">Original Baseline vs. {selectedCandidate.name}</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mt-1">
                {selectedCandidate.strategy}
              </h3>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5 max-w-2xl">
                {selectedCandidate.strategy_description}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleExplainCandidateWithAI(selectedCandidate)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-tertiary text-white text-xs font-bold font-mono transition-all hover:opacity-90 shadow-md"
              >
                <span className="material-symbols-outlined text-[16px] text-white">smart_toy</span>
                <span className="text-white">Explain with AI</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendToWhatIf(selectedCandidate)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-high border border-slate-200 hover:border-slate-300 text-on-surface text-xs font-bold font-mono transition-all hover:bg-surface-container-highest"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Fine-tune in What-If</span>
              </button>
            </div>
          </div>

          {/* Rationale Callout Card */}
          <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">lightbulb</span>
            <div className="text-xs font-mono">
              <strong className="text-primary block font-bold mb-0.5">Mechanistic Chemical Rationale:</strong>
              <span className="text-on-surface-variant leading-relaxed">{selectedCandidate.rationale}</span>
            </div>
          </div>

          {/* Detailed Descriptor Comparison Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface-container-high border-b border-slate-200 text-on-surface-variant text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Physicochemical Property</th>
                  <th className="py-3 px-4">Original Baseline</th>
                  <th className="py-3 px-4 font-bold text-primary">Candidate Profile</th>
                  <th className="py-3 px-4">Shift (Δ)</th>
                  <th className="py-3 px-4">% Change</th>
                  <th className="py-3 px-4">CNS MPO Guideline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-surface-container-low">
                {/* Probability Row */}
                <tr className="bg-surface-container-lowest/80 font-bold">
                  <td className="py-3 px-4 text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
                    <span>Predicted BBB Permeability</span>
                  </td>
                  <td className="py-3 px-4 text-on-surface">
                    {origProbPct}% ({originalResult.prediction})
                  </td>
                  <td className="py-3 px-4 text-primary text-sm">
                    {Math.round(selectedCandidate.permeable_probability * 100)}% ({selectedCandidate.prediction})
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedCandidate.delta_percentage_points > 0 ? "bg-tertiary/20 text-tertiary" : "bg-error/20 text-error"
                    }`}>
                      {selectedCandidate.delta_percentage_points > 0 ? "+" : ""}{selectedCandidate.delta_percentage_points}% pts
                    </span>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant">
                    {origProbPct > 0 ? `${Math.round(((selectedCandidate.permeable_probability - (originalResult.permeable_probability ?? 0)) / (originalResult.permeable_probability ?? 0.01)) * 100)}%` : "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-tertiary font-bold">≥ 50% Threshold</span>
                  </td>
                </tr>

                {/* Descriptor Rows */}
                {Object.keys(DESCRIPTOR_LABELS).map((key) => {
                  const info = DESCRIPTOR_LABELS[key];
                  const delta = selectedCandidate.descriptor_deltas?.[key];
                  const origVal = delta ? delta.original_value : (originalResult.features as any)?.[key] ?? 0;
                  const candVal = delta ? delta.candidate_value : (selectedCandidate.features as any)?.[key] ?? 0;
                  const absDelta = delta ? delta.absolute_delta : candVal - origVal;
                  const pctDelta = delta ? delta.percentage_delta : 0;
                  const isModified = Math.abs(absDelta) > 0.001;

                  return (
                    <tr key={key} className={isModified ? "bg-primary/5" : ""}>
                      <td className="py-3 px-4 font-medium text-on-surface">
                        <span>{info.label}</span>
                        {info.unit && <span className="text-slate-500 ml-1">({info.unit})</span>}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant font-mono">
                        {origVal}
                      </td>
                      <td className="py-3 px-4 font-bold text-on-surface font-mono">
                        <span className={isModified ? "text-primary" : ""}>{candVal}</span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {isModified ? (
                          <span className={`inline-flex items-center gap-0.5 font-bold ${absDelta > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                            <span>{absDelta > 0 ? "+" : ""}{absDelta}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-on-surface-variant">
                        {isModified ? (
                          <span>{pctDelta > 0 ? "+" : ""}{pctDelta}%</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 font-semibold">
                        {info.optimal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Safety Notice Banner */}
          <div className="mt-4 p-3 rounded-xl bg-surface-container-highest border border-slate-200 text-[11px] font-mono text-on-surface-variant flex items-center justify-between">
            <span>⚠️ {optimizeData?.disclaimer || "Hypothetical molecular modifications generated in-silico for exploration."}</span>
            <span className="text-slate-600 font-bold shrink-0">BrainGate In-Silico Lab</span>
          </div>
        </div>
      )}
    </div>
  );
}
