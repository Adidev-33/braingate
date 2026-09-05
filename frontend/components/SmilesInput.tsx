"use client";

import React, { useState, useEffect, useRef } from "react";
import ExampleMoleculePicker from "./ExampleMoleculePicker";
import { FeatureDict } from "@/lib/api";

interface Props {
  smiles: string;
  setSmiles: (s: string) => void;
  onSubmit: (smiles: string) => void;
  loading: boolean;
  liveFeatures?: FeatureDict | null;
}

interface PubChemResult {
  commonName: string | null;
  iupacName: string | null;
}

// Calls PubChem PUG REST to resolve a SMILES string to a drug name.
// Returns common name (Title) and IUPAC name if available.
async function lookupDrugName(smiles: string): Promise<PubChemResult> {
  const encoded = encodeURIComponent(smiles.trim());
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encoded}/property/IUPACName,Title/JSON`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) return { commonName: null, iupacName: null };
  const data = await res.json();
  const props = data?.PropertyTable?.Properties?.[0];
  return {
    commonName: props?.Title ?? null,
    iupacName: props?.IUPACName ?? null,
  };
}

export default function SmilesInput({
  smiles,
  setSmiles,
  onSubmit,
  loading,
  liveFeatures,
}: Props) {
  const [drugName, setDrugName] = useState<string | null>(null);
  const [iupacName, setIupacName] = useState<string | null>(null);
  const [nameLoading, setNameLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced PubChem lookup: fires 800ms after user stops typing
  useEffect(() => {
    setDrugName(null);
    setIupacName(null);

    if (!smiles || smiles.trim().length < 4) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setNameLoading(true);
      try {
        const result = await lookupDrugName(smiles);
        setDrugName(result.commonName);
        setIupacName(result.iupacName);
      } catch {
        setDrugName(null);
        setIupacName(null);
      } finally {
        setNameLoading(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [smiles]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setSmiles(text.trim());
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (smiles.trim() && !loading) {
      onSubmit(smiles.trim());
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* SMILES Terminal Input Card */}
      <div className="relative bg-surface-container/90 backdrop-blur-xl rounded-xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">grain</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs uppercase tracking-wider text-on-surface font-semibold">
                INPUT SMILES STRING
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant">
                Simplified Molecular Input Line Entry System
              </span>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePaste}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all text-xs"
              title="Paste clipboard payload"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">content_paste</span>
              <span>Paste</span>
            </button>
            <button
              type="button"
              onClick={() => setSmiles("")}
              disabled={loading || !smiles}
              className="flex items-center gap-1 px-3 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all text-xs disabled:opacity-40"
              title="Clear input field"
            >
              <span className="material-symbols-outlined text-[16px] text-error">backspace</span>
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Code Input Terminal Box */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative bg-surface-container-lowest rounded-lg p-4 shadow-sm flex flex-col gap-2 border border-slate-200">
            <div className="flex items-center justify-between pb-1 text-on-surface-variant font-mono text-[11px] tracking-wider">
              <span className="text-outline">CANONICAL LINE NOTATION</span>
              <span className="font-mono text-[11px] text-tertiary font-semibold">
                {smiles.length} chars
              </span>
            </div>
            <textarea
              id="smiles-input"
              rows={3}
              value={smiles}
              onChange={(e) => setSmiles(e.target.value)}
              placeholder="e.g. CN1C=NC2=C1C(=O)N(C(=O)N2C)C"
              disabled={loading}
              className="w-full bg-transparent resize-none font-mono text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed tracking-wide selection:bg-primary/20"
            />
          </div>

          {/* ── Drug Name Identification Banner ── */}
          {(nameLoading || drugName || iupacName) && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/8 border border-primary/20 text-sm transition-all">
              <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0">
                {nameLoading ? "progress_activity" : "science"}
              </span>
              {nameLoading ? (
                <span className="text-on-surface-variant font-mono text-xs animate-pulse">
                  Identifying molecule via PubChem…
                </span>
              ) : (
                <div className="flex flex-col gap-0.5 min-w-0">
                  {drugName && (
                    <span className="font-semibold text-on-surface text-sm">
                      {drugName}
                    </span>
                  )}
                  {iupacName && (
                    <span className="font-mono text-[11px] text-on-surface-variant truncate" title={iupacName}>
                      IUPAC: {iupacName}
                    </span>
                  )}
                  {!drugName && !iupacName && (
                    <span className="text-outline text-xs font-mono">
                      No match found in PubChem — novel or uncommon structure
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Molecular Parameter Badges Preview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <div className="flex flex-col bg-surface-container-low border border-slate-200/80 p-2.5 rounded-lg">
              <span className="font-mono text-[10px] text-outline uppercase tracking-wider">
                Mol Weight
              </span>
              <span className="font-mono text-sm text-on-surface font-semibold mt-0.5">
                {liveFeatures?.mol_weight ?? "—"}{" "}
                <span className="text-[10px] text-outline-variant font-normal">Da</span>
              </span>
            </div>
            <div className="flex flex-col bg-surface-container-low border border-slate-200/80 p-2.5 rounded-lg">
              <span className="font-mono text-[10px] text-outline uppercase tracking-wider">
                cLogP (oct/wat)
              </span>
              <span className="font-mono text-sm text-on-surface font-semibold mt-0.5">
                {liveFeatures?.logp ?? "—"}
              </span>
            </div>
            <div className="flex flex-col bg-surface-container-low border border-slate-200/80 p-2.5 rounded-lg">
              <span className="font-mono text-[10px] text-outline uppercase tracking-wider">
                TPSA
              </span>
              <span className="font-mono text-sm text-on-surface font-semibold mt-0.5">
                {liveFeatures?.tpsa ?? "—"}{" "}
                <span className="text-[10px] text-outline-variant font-normal">Å²</span>
              </span>
            </div>
            <div className="flex flex-col bg-surface-container-low border border-slate-200/80 p-2.5 rounded-lg">
              <span className="font-mono text-[10px] text-outline uppercase tracking-wider">
                H-Bond Donors
              </span>
              <span className="font-mono text-sm text-on-surface font-semibold mt-0.5">
                {liveFeatures?.h_donors ?? "—"}
              </span>
            </div>
            <div className="flex flex-col bg-surface-container-low border border-slate-200/80 p-2.5 rounded-lg">
              <span className="font-mono text-[10px] text-outline uppercase tracking-wider">
                H-Bond Acc
              </span>
              <span className="font-mono text-sm text-on-surface font-semibold mt-0.5">
                {liveFeatures?.h_acceptors ?? "—"}
              </span>
            </div>
          </div>

          {/* Primary Action Execution Button */}
          <button
            type="submit"
            disabled={loading || !smiles.trim()}
            className="w-full relative flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-tertiary text-white shadow-md hover:opacity-95 font-bold text-base transition-all transform active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin text-white">sync</span>
                <span className="text-white">Calculating RDKit Descriptors &amp; SHAP Inference...</span>
              </>
            ) : (
              <>
                <span className="text-white">Predict BBB Permeability</span>
                <span className="material-symbols-outlined text-[20px] text-white">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Benchmark Reference Controls Picker */}
      <ExampleMoleculePicker
        onSelect={(s) => {
          setSmiles(s);
          onSubmit(s);
        }}
        selectedSmiles={smiles}
        disabled={loading}
      />
    </div>
  );
}
