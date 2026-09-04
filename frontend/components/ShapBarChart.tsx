"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { ShapItem } from "@/lib/api";

interface Props {
  shapData: ShapItem[];
}

export default function ShapBarChart({ shapData }: Props) {
  // Sort features by absolute SHAP value descending
  const sorted = [...shapData].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value));

  const chartData = sorted.map((item) => ({
    name: item.display_name.split(" (")[0],
    full_name: item.display_name,
    shap_value: item.shap_value,
    value: item.value,
    plain_text: item.plain_text,
    is_positive: item.shap_value >= 0,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-surface-container-high border border-slate-700 rounded-xl shadow-xl max-w-xs space-y-1.5 z-50 text-xs font-sans">
          <div className="flex items-center justify-between font-semibold text-on-surface">
            <span>{data.full_name}</span>
            <span className="font-mono text-primary">val: {data.value}</span>
          </div>
          <div className="font-mono text-[11px] flex items-center gap-1">
            <span className="text-on-surface-variant">SHAP Impact:</span>
            <span className={data.is_positive ? "text-tertiary font-bold" : "text-error font-bold"}>
              {data.shap_value > 0 ? `+${data.shap_value}` : data.shap_value}
            </span>
          </div>
          <p className="text-[11px] text-on-surface border-t border-slate-800 pt-1.5 leading-snug">
            {data.plain_text}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface-container rounded-xl p-6 shadow-xl flex flex-col gap-6">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded font-semibold">
              SHAP Local Explainer
            </span>
            <span className="font-mono text-xs text-on-surface-variant">
              TreeExplainer Live Calculation
            </span>
          </div>
          <h3 className="text-xl font-bold text-on-surface mt-1 tracking-tight">
            Descriptor Contributions
          </h3>
        </div>

        {/* Bipolar Legend */}
        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-error" />
            <span className="text-on-surface-variant">Hindering (-logBB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-primary" />
            <span className="text-primary font-semibold">Facilitating (+logBB)</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant">
        Calculated via TreeExplainer on 7 RDKit molecular descriptors. Positive values push the model toward BBB permeability.
      </p>

      {/* Dynamic Recharts Visualization */}
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#869397"
              fontSize={11}
              tickFormatter={(val) => val.toFixed(2)}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#dfe2ef"
              fontSize={11}
              width={140}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="#3d494c" strokeDasharray="3 3" />
            <Bar dataKey="shap_value" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.is_positive ? "#4cd7f6" : "#ffb4ab"}
                  fillOpacity={0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Waterfall Feature Breakdown List */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <span className="font-mono text-xs font-semibold text-on-surface uppercase tracking-wider">
          Atom-Level & Descriptor Attributions
        </span>
        <div className="space-y-2">
          {sorted.map((item) => {
            const isPos = item.shap_value >= 0;
            return (
              <div
                key={item.feature}
                className="group bg-surface-container-low p-3 rounded-lg shadow-sm transition-all hover:bg-surface-container-high flex flex-col gap-1.5 border border-slate-800/60"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      {isPos ? "check_circle" : "info"}
                    </span>
                    <span className="font-semibold text-on-surface">
                      {item.display_name} = {item.value}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold ${
                      isPos ? "text-primary" : "text-error"
                    }`}
                  >
                    {item.shap_value > 0 ? `+${item.shap_value}` : item.shap_value} SHAP
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant flex items-center gap-1">
                  {item.plain_text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
