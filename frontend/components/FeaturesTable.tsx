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
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Computed RDKit Descriptors vs CNS MPO Rules</h3>
          <p className="text-xs text-slate-400">Comparing calculated features against pharmacologist guidelines</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <th className="py-2.5 px-3">Descriptor</th>
              <th className="py-2.5 px-3">Value</th>
              <th className="py-2.5 px-3">CNS MPO Guideline</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Pharmacological Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-3 text-slate-200 font-semibold">{row.name}</td>
                <td className="py-3 px-3 font-mono text-indigo-300">{row.val}</td>
                <td className="py-3 px-3 font-mono text-slate-400">{row.threshold}</td>
                <td className="py-3 px-3">
                  {row.pass ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Favorable
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <AlertCircle className="w-3 h-3" /> Suboptimal
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-slate-400 hidden md:table-cell text-[11px]">
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
