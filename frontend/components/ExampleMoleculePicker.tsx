"use client";

import React, { useEffect, useState } from "react";
import { fetchExamples, ExampleMolecule } from "@/lib/api";

interface Props {
  onSelect: (smiles: string) => void;
  selectedSmiles?: string;
  disabled?: boolean;
}

export default function ExampleMoleculePicker({ onSelect, selectedSmiles, disabled }: Props) {
  const [examples, setExamples] = useState<ExampleMolecule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchExamples()
      .then((data) => {
        setExamples(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load reference examples:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant py-2">
        <span className="material-symbols-outlined text-[16px] animate-spin text-primary">sync</span>
        <span>Loading reference benchmark controls...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">science</span>
          <span className="font-mono text-xs uppercase tracking-wider text-on-surface font-semibold">
            VALIDATED REFERENCE BENCHMARK CONTROLS
          </span>
        </div>
        <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
          {examples.length} Controls Loaded
        </span>
      </div>

      {/* Benchmark Cards Mosaic (2x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {examples.map((mol) => {
          const isSelected = selectedSmiles === mol.smiles;
          const isPerm = mol.known_label === "permeable";

          return (
            <div
              key={mol.name}
              onClick={() => !disabled && onSelect(mol.smiles)}
              className={`group relative bg-surface-container/80 hover:bg-surface-container-high transition-all p-4 rounded-xl cursor-pointer shadow-md flex flex-col justify-between gap-3 border ${
                isSelected
                  ? "border-primary bg-surface-container-high ring-1 ring-primary/40"
                  : "border-slate-800 hover:border-slate-700"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                    {mol.name}
                  </span>
                  <span className="text-[11px] text-outline line-clamp-1">{mol.description}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase shrink-0 ${
                    isPerm
                      ? "bg-tertiary/15 text-tertiary shadow-[0_0_12px_rgba(78,222,163,0.2)]"
                      : "bg-error/15 text-error"
                  }`}
                >
                  {isPerm ? "BBB+" : "BBB-"}
                </span>
              </div>

              {/* Multi-property summary tags */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {mol.known_toxicity && (
                  <span
                    className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded ${
                      mol.known_toxicity === "non_toxic"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {mol.known_toxicity === "non_toxic" ? "Clean Tox" : "Tox Flag"}
                  </span>
                )}
                {mol.known_solubility_tier && (
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">
                    Sol: {mol.known_solubility_tier}
                  </span>
                )}
              </div>

              <div className="bg-surface-container-lowest p-2 rounded font-mono text-[11px] text-on-surface-variant truncate">
                {mol.smiles}
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-mono text-[11px] text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">input</span> Quick Load
                </span>
                <span className="font-mono text-[10px] text-outline">In vitro Control</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
