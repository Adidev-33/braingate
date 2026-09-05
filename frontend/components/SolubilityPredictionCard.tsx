"use client";

import React from "react";
import { SolubilityPredictResponse } from "@/lib/api";

interface Props {
  result: SolubilityPredictResponse;
}

export default function SolubilityPredictionCard({ result }: Props) {
  const isHigh = result.solubility_tier === "High";
  const isModerate = result.solubility_tier === "Moderate";
  const logS = result.log_solubility;

  // Map logS (-5 to +2) into a visual gauge percentage (0 to 100)
  const normalizedPct = Math.min(100, Math.max(5, Math.round(((logS + 5) / 7) * 100)));
  const strokeDashoffset = 264 - (264 * normalizedPct) / 100;

  const colorClass = isHigh
    ? "text-cyan-700"
    : isModerate
    ? "text-amber-700"
    : "text-rose-700";

  const badgeClass = isHigh
    ? "bg-cyan-500/15 text-cyan-700 shadow-sm"
    : isModerate
    ? "bg-amber-500/15 text-amber-700 shadow-sm"
    : "bg-rose-500/15 text-rose-700 shadow-sm";

  return (
    <div className="relative overflow-hidden bg-surface-container rounded-xl p-6 shadow-sm flex flex-col gap-6 border border-slate-200">
      {/* Background Glow */}
      <div
        className={`absolute -left-10 -bottom-10 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isHigh ? "bg-cyan-500/10" : isModerate ? "bg-amber-500/10" : "bg-rose-500/10"
        }`}
      />

      {/* Header Strip */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs uppercase tracking-wider mb-2 font-semibold shadow-sm ${badgeClass}`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isHigh ? "water_drop" : isModerate ? "opacity" : "water_loss"}
            </span>
            <span>{result.solubility_tier} Solubility Tier</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">
            {logS >= 0 ? `+${logS.toFixed(2)}` : logS.toFixed(2)} log(mol/L)
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            {result.tier_description}
          </p>
        </div>

        {/* Circular Solubility Gauge */}
        <div className="relative flex flex-col items-center justify-center shrink-0">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-surface-container-highest fill-transparent"
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
              />
              <circle
                className={`${colorClass} fill-transparent transition-all duration-1000 ease-out`}
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="264"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-sm font-bold text-on-surface">
                {logS >= 0 ? `+${logS.toFixed(1)}` : logS.toFixed(1)}
              </span>
              <span className={`font-mono text-[9px] uppercase -mt-0.5 font-bold ${colorClass}`}>
                logS
              </span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant mt-1">ESOL Regressor</span>
        </div>
      </div>

      {/* Physicochemical Metric Grid */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-surface-container-low p-3 rounded-lg shadow-sm border border-slate-200">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">
            Aqueous LogS
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`font-mono text-base font-bold ${colorClass}`}>
              {logS.toFixed(3)}
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant">mol/L</span>
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant/80 mt-1">
            Measured log solubility
          </p>
        </div>

        <div className="bg-surface-container-low p-3 rounded-lg shadow-sm border border-slate-200">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">
            Formulation Risk
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-base font-bold text-on-surface">
              {isHigh ? "Minimal" : isModerate ? "Standard" : "Precipitation Risk"}
            </span>
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant/80 mt-1">
            {isHigh ? "Ready for IV / oral dosing" : isModerate ? "Cosolvents may help" : "Lipid vehicle required"}
          </p>
        </div>
      </div>

      {/* Rationale Sentence Callout */}
      <div className="relative z-10 bg-surface-container-lowest p-4 rounded-lg border border-slate-200 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-cyan-700">
            science
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-cyan-700 font-bold">
            Thermodynamic Solvation Rationale
          </span>
        </div>
        <p className="text-xs text-on-surface leading-relaxed italic">
          &ldquo;{result.summary_sentence}&rdquo;
        </p>
      </div>
    </div>
  );
}
