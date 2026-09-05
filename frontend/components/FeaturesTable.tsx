"use client";

import React from "react";
import { Sliders, CheckCircle2, AlertCircle } from "lucide-react";
import { FeatureDict } from "@/lib/api";

interface Props {
  features: FeatureDict;
}

export default function FeaturesTable({ features }: Props) {
  const rows = [
    {
      key: "tpsa",
      name: "Topological Polar Surface Area (TPSA)",
      val: `${features.tpsa} Å²`,
      threshold: "< 90 Å²",
      pass: features.tpsa <= 90,
      rule: "Single strongest predictor of BBB penetration."
    },
    {
      key: "mol_weight",
      name: "Molecular Weight (MW)",
      val: `${features.mol_weight} Da`,
      threshold: "< 450 Da",
      pass: features.mol_weight <= 450,
      rule: "Heavier molecules struggle to cross lipid bilayers."
    },
    {
      key: "logp",
      name: "Lipophilicity (LogP)",
      val: `${features.logp}`,
      threshold: "1.0 – 4.0",
      pass: features.logp >= 1.0 && features.logp <= 4.0,
      rule: "Optimal fat/water solubility balance needed."
    },
    {
      key: "h_donors",
      name: "H-Bond Donors",
      val: `${features.h_donors}`,
      threshold: "≤ 3",
      pass: features.h_donors <= 3,
      rule: "Fewer donors reduces desolvation energy penalty."
    },
    {
      key: "h_acceptors",
      name: "H-Bond Acceptors",
      val: `${features.h_acceptors}`,
      threshold: "≤ 7",
      pass: features.h_acceptors <= 7,
      rule: "Limits hydration shell thickness."
    },
    {
      key: "rotatable_bonds",
      name: "Rotatable Bonds",
      val: `${features.rotatable_bonds}`,
      threshold: "≤ 8",
      pass: features.rotatable_bonds <= 8,
      rule: "Less flexibility lowers entropic cost of crossing."
    },
    {
      key: "aromatic_rings",
      name: "Aromatic Rings",
      val: `${features.aromatic_rings}`,
      threshold: "1 – 4",
      pass: features.aromatic_rings >= 1 && features.aromatic_rings <= 4,
      rule: "Enhances lipid membrane π-system interactions."
    }
  ];

  return (
    <div className="bg-surface-container rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-on-surface tracking-tight">
            Computed RDKit Descriptors vs CNS MPO Rules
          </h3>
          <p className="text-xs text-on-surface-variant font-mono">
            Comparing calculated features against pharmacologist lead optimization guidelines
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-surface-container-high border-b border-slate-200 text-on-surface-variant text-[10px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3.5">Descriptor</th>
              <th className="py-2.5 px-3.5">Value</th>
              <th className="py-2.5 px-3.5">CNS MPO Guideline</th>
              <th className="py-2.5 px-3.5">Status</th>
              <th className="py-2.5 px-3.5">Pharmacological Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-surface-container-low font-medium">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-surface-container-high/50 transition-colors">
                <td className="py-3 px-3.5 text-on-surface font-semibold font-sans">{row.name}</td>
                <td className="py-3 px-3.5 font-mono text-primary font-bold">{row.val}</td>
                <td className="py-3 px-3.5 font-mono text-slate-600 font-semibold">{row.threshold}</td>
                <td className="py-3 px-3.5">
                  {row.pass ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-tertiary/15 text-tertiary border border-tertiary/30 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Favorable
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-error/15 text-error border border-error/30 font-bold">
                      <AlertCircle className="w-3 h-3" /> Suboptimal
                    </span>
                  )}
                </td>
                <td className="py-3 px-3.5 text-on-surface-variant text-[11px] font-sans leading-snug">
                  {row.rule}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
