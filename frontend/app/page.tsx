"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import SmilesInput from "@/components/SmilesInput";
import PredictionCard from "@/components/PredictionCard";
import ToxPredictionCard from "@/components/ToxPredictionCard";
import SolubilityPredictionCard from "@/components/SolubilityPredictionCard";
import ScorecardView from "@/components/ScorecardView";
import ShapBarChart from "@/components/ShapBarChart";
import FeaturesTable from "@/components/FeaturesTable";
import InvalidSmilesBanner from "@/components/InvalidSmilesBanner";
import ComparisonView from "@/components/ComparisonView";
import {
  predictScorecard,
  ScorecardResponse,
  PredictResponse,
  ToxPredictResponse,
  SolubilityPredictResponse
} from "@/lib/api";

type PropertyTab = "bbb" | "toxicity" | "solubility" | "scorecard";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"predictor" | "compare" | "api">("predictor");
  const [propertyTab, setPropertyTab] = useState<PropertyTab>("bbb");
  const [smiles, setSmiles] = useState<string>("CN1C=NC2=C1C(=O)N(C(=O)N2C)C"); // Caffeine default
  const [scorecard, setScorecard] = useState<ScorecardResponse | null>(null);
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
      // Calls unified scorecard endpoint which computes BBB, Tox21, and ESOL in one pass
      const data = await predictScorecard(smilesInput);
      setScorecard(data);
    } catch (err: any) {
      setError(err.message || "Could not parse SMILES string. Please enter a valid chemical structure.");
      setScorecard(null);
    } finally {
      setLoading(false);
    }
  };

  const bbbResult: PredictResponse | null = scorecard?.bbb || null;
  const toxResult: ToxPredictResponse | null = scorecard?.toxicity || null;
  const solResult: SolubilityPredictResponse | null = scorecard?.solubility || null;

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="w-full pt-20 pb-16 min-h-screen">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 flex flex-col gap-6">
          {/* Main Workspace / Tab Switcher */}
          {activeTab === "compare" ? (
            <ComparisonView />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Property Navigation Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container p-1.5 rounded-xl border border-slate-800/80 shadow-md">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    id="tab-bbb"
                    onClick={() => setPropertyTab("bbb")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
                      propertyTab === "bbb"
                        ? "bg-surface-container-highest text-primary shadow-sm border border-slate-700"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                    <span>BBB Permeability</span>
                  </button>

                  <button
                    id="tab-toxicity"
                    onClick={() => setPropertyTab("toxicity")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
                      propertyTab === "toxicity"
                        ? "bg-surface-container-highest text-amber-400 shadow-sm border border-slate-700"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">shield</span>
                    <span>Cellular Toxicity</span>
                  </button>

                  <button
                    id="tab-solubility"
                    onClick={() => setPropertyTab("solubility")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
                      propertyTab === "solubility"
                        ? "bg-surface-container-highest text-cyan-400 shadow-sm border border-slate-700"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">water_drop</span>
                    <span>Aqueous Solubility</span>
                  </button>

                  <button
                    id="tab-scorecard"
                    onClick={() => setPropertyTab("scorecard")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
                      propertyTab === "scorecard"
                        ? "bg-gradient-to-r from-primary/20 to-tertiary/20 text-tertiary shadow-sm border border-tertiary/40"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">fact_check</span>
                    <span>Full Scorecard</span>
                  </button>
                </div>

                <div className="hidden md:flex items-center gap-2 px-3 py-1 font-mono text-[11px] text-on-surface-variant">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  <span>Interactive Multi-Property Screener</span>
                </div>
              </div>

              {/* When in Full Scorecard Mode: Top Input Bar + Full Width Scorecard */}
              {propertyTab === "scorecard" ? (
                <div className="flex flex-col gap-6">
                  <SmilesInput
                    smiles={smiles}
                    setSmiles={setSmiles}
                    onSubmit={handlePredict}
                    loading={loading}
                    liveFeatures={scorecard?.features}
                  />

                  {loading && (
                    <div className="bg-surface-container rounded-xl p-12 text-center space-y-4 shadow-xl">
                      <span className="material-symbols-outlined text-[36px] text-primary animate-spin">
                        sync
                      </span>
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-on-surface">Evaluating Candidate Scorecard</h3>
                        <p className="font-mono text-xs text-on-surface-variant">
                          Evaluating BBB permeability, Tox21 toxicity risk, and ESOL solubility...
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

                  {!loading && !error && scorecard && (
                    <ScorecardView scorecard={scorecard} />
                  )}
                </div>
              ) : (
                /* Standard Asymmetric 2-Column Layout for Single Property Tabs */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* LEFT COLUMN: Input Workspace (7 Cols ~ 60%) */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
                          {propertyTab === "bbb"
                            ? "Computational Neuropharmacology"
                            : propertyTab === "toxicity"
                            ? "Pre-Clinical In Vitro Safety"
                            : "Thermodynamic Aqueous Solvation"}
                        </span>
                        <span className="text-outline-variant">•</span>
                        <span className="font-mono text-xs text-tertiary">
                          {propertyTab === "bbb"
                            ? "Direct Transcellular Diffusion"
                            : propertyTab === "toxicity"
                            ? "Nuclear Receptor & Stress Screen"
                            : "Delaney Aqueous Solubility"}
                        </span>
                      </div>
                      <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
                        {propertyTab === "bbb"
                          ? "Predict Blood-Brain Barrier Permeability"
                          : propertyTab === "toxicity"
                          ? "Screen Cellular Stress & Toxicity Risk"
                          : "Predict Aqueous Log Solubility"}
                      </h1>
                      <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                        {propertyTab === "bbb"
                          ? "Explainable blood-brain barrier permeability prediction with atom-level feature attribution and real-time SMILES verification."
                          : propertyTab === "toxicity"
                          ? "Tox21 nuclear receptor and stress-response pathway toxicity liability filter trained on 7,823 validated compounds."
                          : "Thermodynamic ESOL Delaney aqueous solubility regressor predicting logS (mol/L) and formulation liability tiers."}
                      </p>
                    </div>

                    <SmilesInput
                      smiles={smiles}
                      setSmiles={setSmiles}
                      onSubmit={handlePredict}
                      loading={loading}
                      liveFeatures={scorecard?.features}
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

                    {!loading && !error && scorecard && (
                      <>
                        {propertyTab === "bbb" && bbbResult && (
                          <>
                            <PredictionCard result={bbbResult} />
                            <ShapBarChart shapData={bbbResult.shap_explanation} />
                            <FeaturesTable features={bbbResult.features} />
                          </>
                        )}

                        {propertyTab === "toxicity" && toxResult && (
                          <>
                            <ToxPredictionCard result={toxResult} />
                            <ShapBarChart shapData={toxResult.shap_explanation} />
                            <FeaturesTable features={toxResult.features} />
                          </>
                        )}

                        {propertyTab === "solubility" && solResult && (
                          <>
                            <SolubilityPredictionCard result={solResult} />
                            <ShapBarChart shapData={solResult.shap_explanation} />
                            <FeaturesTable features={solResult.features} />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
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
              <span>XGBoost (BBBP • Tox21 • ESOL) + SHAP</span>
            </span>
          </div>
          <div>BrainGate Multi-Property Candidate Screener • v2.0</div>
        </div>
      </footer>
    </div>
  );
}
