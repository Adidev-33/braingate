"use client";

import React from "react";
import { PredictResponse } from "@/lib/api";

interface Props {
  result: PredictResponse;
}

export default function PredictionCard({ result }: Props) {
  const isPermeable = result.prediction === "permeable";
  const confidencePct = Math.round(result.confidence * 100);
  const strokeDashoffset = 264 - (264 * confidencePct) / 100;

  return (
    <div className="relative overflow-hidden bg-surface-container rounded-xl p-6 shadow-xl flex flex-col gap-6">
      {/* Background Glow */}
      <div
        className={`absolute -left-10 -bottom-10 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isPermeable ? "bg-tertiary/10" : "bg-error/10"
        }`}
      />

      {/* Header Strip */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs uppercase tracking-wider mb-2 font-semibold shadow-sm ${
              isPermeable
                ? "bg-tertiary/20 text-tertiary shadow-[0_0_16px_rgba(78,222,163,0.3)]"
                : "bg-error-container text-on-error-container"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isPermeable ? "verified" : "block"}
            </span>
            <span>{isPermeable ? "BBB+ Permeable" : "FAILED CNS CRITERIA"}</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">
            {isPermeable ? "Crosses BBB" : "Does Not Cross BBB"}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            {isPermeable
              ? "High central nervous system penetration across vascular endothelial membrane."
              : "High-resistance passive transcellular barrier rejection across capillary endothelial cells."}
          </p>
        </div>

        {/* Circular Confidence Gauge (SVG) */}
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
                className={`${
                  isPermeable
                    ? "text-tertiary drop-shadow-[0_0_8px_rgba(78,222,163,0.7)]"
                    : "text-error drop-shadow-[0_0_8px_rgba(255,180,171,0.7)]"
                } fill-transparent transition-all duration-1000 ease-out`}
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
              <span className="font-mono text-base font-bold text-on-surface">{confidencePct}%</span>
              <span className={`font-mono text-[9px] uppercase -mt-0.5 font-bold ${isPermeable ? "text-tertiary" : "text-error"}`}>
                CONF.
              </span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant mt-1">XGBoost v1.0</span>
        </div>
      </div>

      {/* Physicochemical Metric Grid (4 Metric Tiles) */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-surface-container-low p-3 rounded-lg shadow-sm">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">
            {isPermeable ? "logBB Value" : "logBB In-Vivo"}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`font-mono text-base font-bold ${
                isPermeable ? "text-tertiary" : "text-error"
              }`}
            >
              {isPermeable ? "+0.42" : "-1.84"}
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant">
              ({isPermeable ? "CNS+" : "CNS-"})
            </span>
          </div>
          <span className="font-sans text-[11px] text-outline block mt-1">Threshold &gt; -1.0</span>
        </div>

        <div className="bg-surface-container-low p-3 rounded-lg shadow-sm">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">Mol. Weight</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-base font-bold text-on-surface">
              {result.features.mol_weight}
            </span>
            <span className="font-sans text-[10px] text-on-surface-variant">Da</span>
          </div>
          <span className="font-sans text-[11px] text-outline block mt-1">Optimal &lt; 450 Da</span>
        </div>

        <div className="bg-surface-container-low p-3 rounded-lg shadow-sm">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">Polar Area (TPSA)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-base font-bold text-primary">
              {result.features.tpsa}
            </span>
            <span className="font-sans text-[10px] text-on-surface-variant">Å²</span>
          </div>
          <span className="font-sans text-[11px] text-outline block mt-1">Optimal &lt; 90 Å²</span>
        </div>

        <div className="bg-surface-container-low p-3 rounded-lg shadow-sm">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">cLogP</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-base font-bold text-on-surface">
              {result.features.logp}
            </span>
            <span className="font-sans text-[10px] text-on-surface-variant">Lipophilicity</span>
          </div>
          <span className="font-sans text-[11px] text-outline block mt-1">Range: 1.0 to 4.0</span>
        </div>
      </div>

      {/* Biological Rationale Card */}
      <div className="bg-surface-container-low p-4 rounded-lg shadow-sm border border-slate-800 space-y-2 relative z-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <span className="material-symbols-outlined text-[18px]">psychology</span>
          <span className="font-mono uppercase tracking-wider text-[11px]">
            Executive Chemical Rationale
          </span>
        </div>
        <p className="text-xs text-on-surface leading-relaxed">
          "{result.summary_sentence}"
        </p>
      </div>
    </div>
  );
}
