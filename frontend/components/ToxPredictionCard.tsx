"use client";

import React from "react";
import { ToxPredictResponse } from "@/lib/api";

interface Props {
  result: ToxPredictResponse;
}

export default function ToxPredictionCard({ result }: Props) {
  const isToxic = result.prediction === "toxic";
  const confidencePct = Math.round(result.confidence * 100);
  const strokeDashoffset = 264 - (264 * confidencePct) / 100;

  return (
    <div className="relative overflow-hidden bg-surface-container rounded-xl p-6 shadow-xl flex flex-col gap-6 border border-slate-800/80">
      {/* Background Glow */}
      <div
        className={`absolute -left-10 -bottom-10 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          !isToxic ? "bg-tertiary/10" : "bg-amber-500/10"
        }`}
      />

      {/* Header Strip */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs uppercase tracking-wider mb-2 font-semibold shadow-sm ${
              !isToxic
                ? "bg-tertiary/20 text-tertiary shadow-[0_0_16px_rgba(78,222,163,0.3)]"
                : "bg-amber-500/20 text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.3)]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {!isToxic ? "shield" : "warning"}
            </span>
            <span>{!isToxic ? "Low Toxicity Risk" : "Toxicity Liability Flag"}</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">
            {!isToxic ? "Non-Toxic Profile" : "Potential Cellular Toxicity"}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            {!isToxic
              ? "Clean profile across nuclear receptor and stress-response pathways (Tox21 12-assay screen)."
              : "Predicted hit on cellular stress or nuclear-receptor activation pathways (e.g., AhR, p53, MMP)."}
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
                  !isToxic
                    ? "text-tertiary drop-shadow-[0_0_8px_rgba(78,222,163,0.7)]"
                    : "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]"
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
              <span
                className={`font-mono text-[9px] uppercase -mt-0.5 font-bold ${
                  !isToxic ? "text-tertiary" : "text-amber-400"
                }`}
              >
                CONF.
              </span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant mt-1">Tox21 XGBoost</span>
        </div>
      </div>

      {/* Physicochemical Metric Grid */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-surface-container-low p-3 rounded-lg shadow-sm border border-slate-800/40">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">
            Toxic Probability
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`font-mono text-base font-bold ${
                !isToxic ? "text-tertiary" : "text-amber-400"
              }`}
            >
              {(result.toxic_probability * 100).toFixed(1)}%
            </span>
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant/80 mt-1">
            Across 12 Tox21 assays
          </p>
        </div>

        <div className="bg-surface-container-low p-3 rounded-lg shadow-sm border border-slate-800/40">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">
            Safety Margin
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-base font-bold text-on-surface">
              {!isToxic ? "Optimal" : "Elevated Risk"}
            </span>
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant/80 mt-1">
            {!isToxic ? "Low off-target liability" : "Requires derisking"}
          </p>
        </div>
      </div>

      {/* Rationale Sentence Callout */}
      <div className="relative z-10 bg-surface-container-lowest/80 p-4 rounded-lg border border-slate-800/60 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">
            clinical_notes
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-primary font-bold">
            Toxicology Executive Rationale
          </span>
        </div>
        <p className="text-xs text-on-surface leading-relaxed italic">
          &ldquo;{result.summary_sentence}&rdquo;
        </p>
      </div>
    </div>
  );
}
