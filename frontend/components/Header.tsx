"use client";

import React from "react";

interface HeaderProps {
  activeTab: "predictor" | "compare" | "api";
  setActiveTab: (tab: "predictor" | "compare" | "api") => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
      <div className="h-16 w-full px-4 sm:px-8 flex items-center justify-between gap-6">
        {/* Brand Logo */}
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
        </div>

        {/* Center Navigation Links */}
        <nav className="flex items-center gap-1 font-sans text-sm">
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
        </nav>
      </div>
    </header>
  );
}

