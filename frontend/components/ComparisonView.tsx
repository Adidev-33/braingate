"use client";

import React, { useState } from "react";
import { compareSmiles, CompareResponse } from "@/lib/api";
import PredictionCard from "./PredictionCard";
import ShapBarChart from "./ShapBarChart";

export default function ComparisonView() {
  const [smiles1, setSmiles1] = useState<string>("CN1C=NC2=C1C(=O)N(C(=O)N2C)C"); // Caffeine
  const [smiles2, setSmiles2] = useState<string>("NCCc1ccc(O)c(O)c1"); // Dopamine
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smiles1.trim() || !smiles2.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await compareSmiles(smiles1.trim(), smiles2.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to compare molecules.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Comparison Form Input Card */}
      <div className="bg-surface-container rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">compare_arrows</span>
          <h2 className="text-base font-bold text-on-surface">Molecule Side-by-Side Comparison</h2>
        </div>
        <p className="text-xs text-on-surface-variant">
          Enter two SMILES structures to compare permeability predictions and identify deciding chemical differences.
        </p>

        <form onSubmit={handleCompare} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-outline uppercase font-semibold">
              Molecule 1 SMILES
            </label>
            <input
              type="text"
              value={smiles1}
              onChange={(e) => setSmiles1(e.target.value)}
              placeholder="e.g. Caffeine SMILES"
              disabled={loading}
              className="w-full px-3 py-2 bg-surface-container-lowest border border-slate-200 rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-outline uppercase font-semibold">
              Molecule 2 SMILES
            </label>
            <input
              type="text"
              value={smiles2}
              onChange={(e) => setSmiles2(e.target.value)}
              placeholder="e.g. Dopamine SMILES"
              disabled={loading}
              className="w-full px-3 py-2 bg-surface-container-lowest border border-slate-200 rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={loading || !smiles1.trim() || !smiles2.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-tertiary text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin text-white">sync</span>
                  <span className="text-white">Comparing Molecule Structures...</span>
                </>
              ) : (
                <>
                  <span className="text-white">Run Side-by-Side Comparison</span>
                  <span className="material-symbols-outlined text-[18px] text-white">compare_arrows</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs font-mono">
          {error}
        </div>
      )}

      {/* Deciding Difference Callout Banner */}
      {result && (
        <div className="p-5 rounded-xl bg-surface-container-high border border-primary/30 shadow-sm flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[24px] shrink-0 mt-0.5">
            tune
          </span>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-wider text-primary font-bold">
              Primary Deciding Structural Factor
            </span>
            <p className="text-sm font-semibold text-on-surface leading-relaxed">
              {result.deciding_difference}
            </p>
          </div>
        </div>
      )}

      {/* Side-by-Side Result Cards */}
      {result && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              Molecule 1 Result
            </div>
            <PredictionCard result={result.molecule1} />
            <ShapBarChart shapData={result.molecule1.shap_explanation} />
          </div>

          <div className="space-y-6">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-secondary">
              Molecule 2 Result
            </div>
            <PredictionCard result={result.molecule2} />
            <ShapBarChart shapData={result.molecule2.shap_explanation} />
          </div>
        </div>
      )}
    </div>
  );
}
