"use client";

import React, { useEffect, useState } from "react";
import { fetchHealth } from "@/lib/api";

interface HeaderProps {
  activeTab: "predictor" | "compare" | "api";
  setActiveTab: (tab: "predictor" | "compare" | "api") => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((data) => setHealthy(data.status === "healthy" && data.model_loaded))
      .catch(() => setHealthy(false));
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
      <div className="h-16 w-full px-4 sm:px-8 flex items-center justify-between gap-6">
        {/* Brand Logo & Live Badge */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("predictor")}>
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-[22px]">science</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-tight text-on-surface leading-none">
                BrainGate
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                BBB Predictor
              </span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 bg-surface-container px-3 py-1 rounded-full">
            <span
              className={`w-2 h-2 rounded-full ${
                healthy ? "bg-tertiary shadow-[0_0_8px_rgba(78,222,163,0.6)]" : "bg-error"
              }`}
            />
            <span className="font-mono text-[11px] text-on-surface-variant">
              {healthy === null
                ? "Connecting..."
                : healthy
                ? "XGBoost + SHAP Engine v1.0 • Live Inference (Port 8000)"
                : "Backend Offline"}
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 font-sans text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("predictor")}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === "predictor"
                ? "bg-surface-container-high text-primary font-bold"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            Single Predictor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("compare")}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === "compare"
                ? "bg-surface-container-high text-primary font-bold"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            Compare Analogs
          </button>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all flex items-center gap-1"
          >
            FastAPI Docs <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </nav>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors text-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">api</span>
            <span>REST API</span>
          </a>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-secondary-container text-white flex items-center justify-center font-bold text-xs shadow-inner">
              NC
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-medium leading-tight text-on-surface">Dr. A. Vance</span>
              <span className="text-[10px] font-mono text-on-surface-variant">Neurochem Lab</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
