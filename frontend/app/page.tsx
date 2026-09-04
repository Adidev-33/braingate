"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import SmilesInput from "@/components/SmilesInput";
import PredictionCard from "@/components/PredictionCard";
import ShapBarChart from "@/components/ShapBarChart";
import FeaturesTable from "@/components/FeaturesTable";
import InvalidSmilesBanner from "@/components/InvalidSmilesBanner";
import ComparisonView from "@/components/ComparisonView";
import { predictSmiles, PredictResponse } from "@/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"predictor" | "compare" | "api">("predictor");
  const [smiles, setSmiles] = useState<string>("CN1C=NC2=C1C(=O)N(C(=O)N2C)C"); // Caffeine default
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Run prediction for initial default Caffeine on mount
  useEffect(() => {
    handlePredict("CN1C=NC2=C1C(=O)N(C(=O)N2C)C");
  }, []);

  const handlePredict = async (smilesInput: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictSmiles(smilesInput);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Could not parse SMILES string. Please enter a valid chemical structure.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="w-full pt-20 pb-16 min-h-screen">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 flex flex-col gap-6">
          {/* Top Status Bar & Context Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low/70 backdrop-blur-md px-6 py-3 rounded-xl shadow-sm border border-slate-800/60">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-surface-container-highest/80 px-3 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
                <span className="font-mono text-xs uppercase tracking-wider text-primary font-bold">
                  xAI BBB-PERMEABILITY V1.0
                </span>
              </div>
              <span className="text-outline-variant font-mono text-xs">•</span>
              <span className="font-mono text-xs text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-tertiary">check_circle</span>
                XGBoost Model Checkpoint: <strong class="text-on-surface">xgb_bbbp_model.pkl</strong>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">memory</span>
                <span className="font-mono text-xs text-on-surface-variant">FastAPI Uvicorn Active</span>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded">
                <span className="font-mono text-[10px] uppercase text-outline">Compute node</span>
                <span className="font-mono text-xs text-primary font-bold">localhost:8000</span>
              </div>
            </div>
          </div>

          {/* Main Asymmetric Workspace / Tab Switcher */}
          {activeTab === "compare" ? (
            <ComparisonView />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Input Workspace (7 Cols ~ 60%) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Header & Thesis */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-widest text-primary-fixed-dim font-bold">
                      Computational Neuropharmacology
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-mono text-xs text-tertiary">Direct Transcellular Diffusion</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
                    Predict Blood-Brain Barrier Permeability
                  </h1>
                  <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                    Explainable blood-brain barrier permeability prediction with atom-level feature attribution and real-time SMILES verification.
                  </p>
                </div>

                <SmilesInput
                  smiles={smiles}
                  setSmiles={setSmiles}
                  onSubmit={handlePredict}
                  loading={loading}
                  liveFeatures={result?.features}
                />
              </div>

              {/* RIGHT COLUMN: Results & SHAP Explanation (5 Cols ~ 40%) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {loading && (
                  <div className="bg-surface-container rounded-xl p-12 text-center space-y-4 shadow-xl">
                    <span className="material-symbols-outlined text-[36px] text-primary animate-spin">
                      sync
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-on-surface">Evaluating Molecular Structure</h3>
                      <p className="font-mono text-xs text-on-surface-variant">
                        Computing 7 RDKit descriptors & SHAP TreeExplainer values...
                      </p>
                    </div>
                  </div>
                )}

                {!loading && error && (
                  <InvalidSmilesBanner
                    error={error}
                    onClear={() => {
                      setError(null);
                      setSmiles("");
                    }}
                  />
                )}

                {!loading && !error && result && (
                  <>
                    <PredictionCard result={result} />
                    <ShapBarChart shapData={result.shap_explanation} />
                    <FeaturesTable features={result.features} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full bg-surface-container-low py-4 border-t border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <span>RDKit 2026.03</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">hub</span>
              <span>XGBoost + SHAP</span>
            </span>
          </div>
          <div>BrainGate AI Pipeline • Production v1.0</div>
        </div>
      </footer>
    </div>
  );
}
