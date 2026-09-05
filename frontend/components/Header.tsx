"use client";

import React, { useState, useEffect } from "react";

interface HeaderProps {
  activeTab: "predictor" | "compare" | "api";
  setActiveTab: (tab: "predictor" | "compare" | "api") => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Check saved theme preference or system preference on mount
    const savedTheme = localStorage.getItem("braingate_theme");
    if (savedTheme === "dark" || (!savedTheme && document.documentElement.classList.contains("dark"))) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("braingate_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("braingate_theme", "light");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.45)] border-b border-slate-200">
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

        {/* Center Navigation Links & Theme Toggle */}
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1 font-sans text-sm">
            <button
              type="button"
              onClick={() => setActiveTab("predictor")}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === "predictor"
                  ? "bg-surface-container-high text-primary font-bold shadow-sm"
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
                  ? "bg-surface-container-high text-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              Compare Analogs
            </button>
          </nav>

          {/* Theme Switcher Toggle Button */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all border border-slate-200 shadow-sm group active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] text-primary group-hover:rotate-45 transition-transform">
              {isDark ? "light_mode" : "dark_mode"}
            </span>
            <span className="font-mono text-xs font-semibold hidden sm:inline">
              {isDark ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

