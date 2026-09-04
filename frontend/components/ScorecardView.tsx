"use client";

import React from "react";
import { ScorecardResponse } from "@/lib/api";
import ShapBarChart from "@/components/ShapBarChart";
import FeaturesTable from "@/components/FeaturesTable";

interface Props {
  scorecard: ScorecardResponse;
}

export default function ScorecardView({ scorecard }: Props) {
  const { bbb, toxicity, solubility, overall_verdict, features } = scorecard;
  const isPermeable = bbb.prediction === "permeable";
  const isSafe = toxicity.prediction === "non_toxic";
  const isHighSolubility = solubility.solubility_tier === "High";

  // Scorecard tier: Prime (3/3), Viable (2/3), Restricted (1/3 or 0/3)
  const passCount = (isPermeable ? 1 : 0) + (isSafe ? 1 : 0) + (isHighSolubility || solubility.solubility_tier === "Moderate" ? 1 : 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Executive Multi-Property Screener Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface-container-high/90 via-surface-container/90 to-surface-container-high/90 rounded-2xl p-6 shadow-2xl border border-slate-700/80">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                passCount === 3
                  ? "bg-tertiary/20 text-tertiary border border-tertiary/40"
                  : passCount === 2
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
              }`}
            >
              <span className="material-symbols-outlined text-[32px]">
                {passCount === 3 ? "verified_user" : passCount === 2 ? "flaky" : "gpp_bad"}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
                  MULTI-PROPERTY DRUG CANDIDATE SCORECARD
                </span>
                <span className="text-outline-variant">•</span>
                <span
                  className={`font-mono text-xs uppercase font-bold px-2 py-0.5 rounded-full ${
                    passCount === 3
                      ? "bg-tertiary/20 text-tertiary"
                      : passCount === 2
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {passCount === 3 ? "Lead Optimization Prime" : passCount === 2 ? "Viable with Caveats" : "High Liability"}
                </span>
              </div>
              <h2 className="text-2xl font-black text-on-surface tracking-tight mt-1">
                Candidate Evaluation: {passCount}/3 Criteria Met
              </h2>
              <p className="text-sm text-on-surface/90 mt-1 max-w-3xl leading-relaxed italic">
                &ldquo;{overall_verdict}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-surface-container-lowest/80 px-4 py-2 rounded-xl border border-slate-800">
            <div className="text-right font-mono">
              <div className="text-[10px] text-on-surface-variant uppercase">Screener engines</div>
              <div className="text-xs font-bold text-primary">BBBP • Tox21 • ESOL</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Side-by-Side Property Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. BBB Permeability */}
        <div className="bg-surface-container rounded-xl p-5 shadow-xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-[10px] uppercase text-outline tracking-wider font-semibold">
                Property 1 • Pharmacokinetics
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isPermeable ? "bg-tertiary/20 text-tertiary" : "bg-error/20 text-error"
                }`}
              >
                {isPermeable ? "Pass" : "Fail"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">BBB Permeability</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-xl font-black ${isPermeable ? "text-tertiary" : "text-error"}`}>
                {isPermeable ? "Permeable" : "Non-Permeable"}
              </span>
              <span className="font-mono text-xs text-on-surface-variant">
                ({Math.round(bbb.confidence * 100)}% conf)
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              {bbb.summary_sentence}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-on-surface-variant">Target: CNS Active</span>
            <span className="text-primary font-semibold">ROC-AUC: 0.889</span>
          </div>
        </div>

        {/* 2. Tox21 Toxicity Risk */}
        <div className="bg-surface-container rounded-xl p-5 shadow-xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-[10px] uppercase text-outline tracking-wider font-semibold">
                Property 2 • Toxicology
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isSafe ? "bg-tertiary/20 text-tertiary" : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {isSafe ? "Clean" : "Flag"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Cellular Toxicity</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-xl font-black ${isSafe ? "text-tertiary" : "text-amber-400"}`}>
                {isSafe ? "Low Risk" : "Toxicity Liability"}
              </span>
              <span className="font-mono text-xs text-on-surface-variant">
                ({(toxicity.toxic_probability * 100).toFixed(0)}% prob)
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              {toxicity.summary_sentence}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-on-surface-variant">Assays: 12 NR & SR</span>
            <span className="text-primary font-semibold">ROC-AUC: 0.741</span>
          </div>
        </div>

        {/* 3. ESOL Solubility */}
        <div className="bg-surface-container rounded-xl p-5 shadow-xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-[10px] uppercase text-outline tracking-wider font-semibold">
                Property 3 • Biophysics
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isHighSolubility
                    ? "bg-cyan-500/20 text-cyan-400"
                    : solubility.solubility_tier === "Moderate"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {solubility.solubility_tier}
              </span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Aqueous Solubility</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-cyan-400">
                {solubility.log_solubility.toFixed(2)} log(mol/L)
              </span>
              <span className="font-mono text-xs text-on-surface-variant">
                ({solubility.solubility_tier})
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              {solubility.summary_sentence}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-on-surface-variant">Model: Delaney/ESOL</span>
            <span className="text-primary font-semibold">R² = 0.851</span>
          </div>
        </div>
      </div>

      {/* RDKit Molecular Descriptors Shared Across All 3 Models */}
      <FeaturesTable features={features} />

      {/* SHAP Breakdown for All 3 Models in Stacked Accordion/Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h4 className="font-mono text-xs uppercase font-bold text-primary mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            BBB SHAP Drivers
          </h4>
          <ShapBarChart shapData={bbb.shap_explanation} />
        </div>
        <div>
          <h4 className="font-mono text-xs uppercase font-bold text-amber-400 mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">shield</span>
            Toxicity SHAP Drivers
          </h4>
          <ShapBarChart shapData={toxicity.shap_explanation} />
        </div>
        <div>
          <h4 className="font-mono text-xs uppercase font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">water_drop</span>
            Solubility SHAP Drivers
          </h4>
          <ShapBarChart shapData={solubility.shap_explanation} />
        </div>
      </div>
    </div>
  );
}
