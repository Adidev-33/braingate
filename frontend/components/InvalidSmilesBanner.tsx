"use client";

import React from "react";

interface Props {
  error: string;
  onClear: () => void;
}

export default function InvalidSmilesBanner({ error, onClear }: Props) {
  return (
    <div className="bg-surface-container rounded-xl p-6 shadow-xl flex flex-col gap-4 border border-error/30">
      {/* Top Warning Strip */}
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-error-container text-error font-mono text-xs font-semibold tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
          INFERENCE BLOCKED • SYNTAX MALFORMED
        </span>
        <span className="font-mono text-xs text-on-surface-variant">
          RDKit MolValidator v2026.03
        </span>
      </div>

      {/* Main Error Box */}
      <div className="rounded-lg p-4 bg-surface-container-low border-l-4 border-error flex items-start gap-4">
        <div className="p-2 rounded bg-error-container text-error shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[24px]">report_problem</span>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-base font-semibold text-on-surface">SMILES Syntax Parse Error</h4>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container-highest text-error font-semibold">
              RDKit: SMILES_PARSE_FAILED
            </span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
            {error}
          </p>
        </div>
      </div>

      {/* Quick Fix Button */}
      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-primary font-medium text-xs transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">backspace</span>
          <span>Clear & Enter Valid SMILES</span>
        </button>
      </div>
    </div>
  );
}
