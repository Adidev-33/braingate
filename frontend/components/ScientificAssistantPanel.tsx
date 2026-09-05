"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PredictResponse,
  ChatMessage,
  AssistantContext,
  askAssistant
} from "@/lib/api";

interface Props {
  originalResult: PredictResponse;
  smiles: string;
  moleculeName?: string;
  whatIfData?: any;
  comparisonData?: any;
  initialQuestion?: string;
  onClose?: () => void;
}

const KNOWN_MOLECULES: Record<string, string> = {
  "CN1C=NC2=C1C(=O)N(C(=O)N2C)C": "Caffeine",
  "CN1C(=O)CN=C(c2ccccc2)c2cc(Cl)ccc21": "Diazepam",
  "CC(C)NCC(O)COc1ccc(CC(N)=O)cc1": "Atenolol",
  "NCCc1ccc(O)c(O)c1": "Dopamine"
};

export default function ScientificAssistantPanel({
  originalResult,
  smiles,
  moleculeName,
  whatIfData,
  comparisonData,
  initialQuestion,
  onClose
}: Props) {
  const activeName = moleculeName || (smiles && KNOWN_MOLECULES[smiles.trim()]) || "Candidate Molecule";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeWhatIf, setActiveWhatIf] = useState<any>(whatIfData || null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef<boolean>(false);
  const lastDispatchedQuestionRef = useRef<string | null>(null);

  // Check localStorage for any What-If candidate data if not passed directly
  useEffect(() => {
    if (!whatIfData) {
      try {
        const stored = localStorage.getItem("braingate_what_if_candidate");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.original_smiles === smiles) {
            setActiveWhatIf(parsed);
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setActiveWhatIf(whatIfData);
    }
  }, [smiles, whatIfData]);

  // Initial welcome message (runs when molecule changes)
  useEffect(() => {
    const isPerm = originalResult.prediction === "permeable";
    const probPct = Math.round((originalResult.permeable_probability ?? 0) * 100);
    const welcomeText = `Hello! I am your **BrainGate Scientific Assistant**.\n\nI have loaded the prediction data for **${activeName}** (` + "`" + smiles + "`" + `):\n- **Model Prediction:** ${isPerm ? "Permeable (CNS+)" : "Non-Permeable (CNS-)"} (${probPct}% probability)\n- **Dominant Attribution:** ${originalResult.shap_explanation?.[0]?.display_name || "Calculated SHAP values"}\n\nAsk me anything about why this prediction was made, how specific descriptors impact permeability, or click one of the quick actions below!`;

    setMessages([
      {
        role: "assistant",
        content: welcomeText
      }
    ]);
  }, [smiles, activeName, originalResult.prediction, originalResult.permeable_probability]);

  // Handle auto-dispatch of initialQuestion exactly once per question
  useEffect(() => {
    if (
      initialQuestion &&
      initialQuestion.trim() &&
      lastDispatchedQuestionRef.current !== initialQuestion
    ) {
      lastDispatchedQuestionRef.current = initialQuestion;
      handleSendQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const [modelUsed, setModelUsed] = useState<string | null>(null);

  const handleSendQuestion = async (presetQuestion?: string) => {
    const q = (presetQuestion || inputQuestion).trim();
    if (!q || inFlightRef.current) return;

    inFlightRef.current = true;
    setError(null);
    setInputQuestion("");

    // Append user message
    const userMsg: ChatMessage = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const context: AssistantContext = {
        smiles: smiles,
        molecule_name: activeName,
        prediction: originalResult.prediction as "permeable" | "non_permeable",
        permeable_probability: originalResult.permeable_probability ?? 0.5,
        confidence: originalResult.confidence ?? 0.5,
        features: originalResult.features,
        shap_explanation: originalResult.shap_explanation,
        summary_sentence: originalResult.summary_sentence,
        what_if_data: activeWhatIf,
        comparison_data: comparisonData
      };

      const res = await askAssistant({
        question: q,
        context: context,
        history: messages.slice(-6)
      });

      if (res.model_used) {
        setModelUsed(res.model_used);
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: res.answer
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || "Failed to generate scientific response.");
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `⚠️ **Error:** ${err.message || "Could not retrieve explanation from assistant. Please try again."}`
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  const isPermeable = originalResult.prediction === "permeable";
  const probPct = Math.round((originalResult.permeable_probability ?? 0) * 100);

  return (
    <div className="bg-surface-container rounded-2xl border border-slate-200 shadow-xl flex flex-col h-[680px] max-h-[85vh] w-full overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-tertiary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="px-5 py-4 bg-surface-container-high border-b border-slate-200 flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-tertiary/20 flex items-center justify-center text-primary border border-primary/30 shadow-inner">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-on-surface tracking-tight">
                BrainGate Scientific Assistant
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-primary/20 text-primary uppercase flex items-center gap-1 border border-primary/30">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {modelUsed ? (modelUsed.includes("groq") ? "⚡ Groq LLM" : modelUsed) : "⚡ Groq Llama"}
              </span>
            </div>
            <p className="text-[11px] font-mono text-on-surface-variant flex items-center gap-1.5">
              <span>Target: <strong className="text-on-surface">{activeName}</strong></span>
              <span>•</span>
              <span className={isPermeable ? "text-tertiary font-bold" : "text-error font-bold"}>
                {isPermeable ? "Permeable" : "Non-Permeable"} ({probPct}%)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMessages([
                {
                  role: "assistant",
                  content: `Conversation reset. Ask any question about **${activeName}**!`
                }
              ]);
            }}
            title="Reset Conversation"
            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-all text-xs border border-slate-200"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close Assistant Panel"
              className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-all text-xs border border-slate-200"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions Preset Ribbon */}
      <div className="px-4 py-2.5 bg-surface-container-low border-b border-slate-200 flex items-center gap-2 overflow-x-auto relative z-10 no-scrollbar">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant shrink-0 flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px] text-tertiary">bolt</span>
          Quick:
        </span>

        {/* Dynamic "Why low?" or "Why high?" */}
        <button
          type="button"
          onClick={() => handleSendQuestion(isPermeable ? "Why high?" : "Why low?")}
          disabled={loading}
          className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-surface-container-high hover:bg-surface-container-highest text-primary border border-primary/30 hover:border-primary transition-all shrink-0 active:scale-95 disabled:opacity-50"
        >
          {isPermeable ? "Why high?" : "Why low?"}
        </button>

        {/* Explain SHAP */}
        <button
          type="button"
          onClick={() => handleSendQuestion("Explain SHAP")}
          disabled={loading}
          className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-surface-container-high hover:bg-surface-container-highest text-cyan-700 border border-cyan-500/30 hover:border-cyan-600 transition-all shrink-0 active:scale-95 disabled:opacity-50"
        >
          Explain SHAP
        </button>

        {/* How to improve? */}
        <button
          type="button"
          onClick={() => handleSendQuestion("How to improve?")}
          disabled={loading}
          className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-surface-container-high hover:bg-surface-container-highest text-amber-700 border border-amber-500/30 hover:border-amber-600 transition-all shrink-0 active:scale-95 disabled:opacity-50"
        >
          How to improve?
        </button>

        {/* Explain modification (when What-if data present) */}
        {activeWhatIf && (
          <button
            type="button"
            onClick={() => handleSendQuestion("Explain modification")}
            disabled={loading}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-surface-container-high hover:bg-surface-container-highest text-tertiary border border-tertiary/40 hover:border-tertiary transition-all shrink-0 active:scale-95 disabled:opacity-50 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[13px]">tune</span>
            Explain modification
          </button>
        )}

        {/* Compare analogs */}
        {comparisonData && (
          <button
            type="button"
            onClick={() => handleSendQuestion("Compare analogs")}
            disabled={loading}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-surface-container-high hover:bg-surface-container-highest text-purple-700 border border-purple-500/30 transition-all shrink-0 active:scale-95 disabled:opacity-50"
          >
            Compare analogs
          </button>
        )}
      </div>

      {/* Main Chat Thread */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 relative z-10 text-xs leading-relaxed">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0 border border-slate-200 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                </div>
              )}

              <div
                className={`max-w-[92%] sm:max-w-[88%] rounded-2xl p-4 shadow-sm ${
                  isUser
                    ? "bg-primary text-white font-medium rounded-tr-none"
                    : "bg-surface-container-low border border-slate-200 text-on-surface rounded-tl-none"
                }`}
              >
                {isUser ? (
                  <p className="font-mono text-xs text-white leading-relaxed">{msg.content}</p>
                ) : (
                  <MarkdownMessage content={msg.content} />
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0 border border-primary/40 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3 justify-start animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0 border border-slate-200">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
            </div>
            <div className="bg-surface-container-low border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-on-surface-variant font-mono text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] ml-1">Analyzing prediction & SHAP features...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar & Scientific Disclaimer */}
      <div className="p-4 bg-surface-container-high border-t border-slate-200 flex flex-col gap-2 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuestion();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder={`Ask about ${activeName}'s BBB prediction, SHAP values, or optimization...`}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-slate-300 text-xs font-mono text-on-surface focus:outline-none focus:border-primary placeholder:text-slate-400 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || !inputQuestion.trim()}
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-white">send</span>
            <span className="hidden sm:inline text-white">Ask</span>
          </button>
        </form>

        {/* Computational Disclaimer */}
        <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant px-1 pt-1 border-t border-slate-200">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-tertiary">info</span>
            <span>Computational estimate • Not an experimental assay result</span>
          </span>
          <span className="text-outline">BrainGate v2.0 AI</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Resilient Markdown Message Renderer
 * Supports tables, headers, blockquotes, lists, code blocks, bold, italics, and inline code.
 */
function MarkdownMessage({ content }: { content: string }) {
  // 1. Normalize malformed collapsed table rows where || is used instead of newlines
  const normalized = content
    .replace(/\|\s*\|/g, "|\n|")
    .replace(/\r\n/g, "\n");

  const lines = normalized.split("\n");
  const blocks: Array<
    | { type: "heading"; level: number; text: string }
    | { type: "blockquote"; text: string }
    | { type: "code"; lang?: string; code: string }
    | { type: "table"; headers: string[]; rows: string[][] }
    | { type: "list"; items: string[]; ordered: boolean }
    | { type: "paragraph"; text: string }
  > = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consume closing ```
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      continue;
    }

    // Headings
    if (trimmed.startsWith("#")) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        blocks.push({
          type: "heading",
          level: match[1].length,
          text: match[2]
        });
        i++;
        continue;
      }
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join("\n") });
      continue;
    }

    // Table detection: line starts and ends with |
    if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const rawHeaders = tableLines[0].split("|").slice(1, -1).map((h) => h.trim());
        let startRowIdx = 1;
        // Check if second line is separator |---|---|
        if (tableLines.length > 1 && /^\|(\s*:?-+:?\s*\|)+$/.test(tableLines[1])) {
          startRowIdx = 2;
        }
        const dataRows: string[][] = [];
        for (let r = startRowIdx; r < tableLines.length; r++) {
          const rowCells = tableLines[r].split("|").slice(1, -1).map((c) => c.trim());
          if (rowCells.some((c) => c.length > 0)) {
            dataRows.push(rowCells);
          }
        }
        blocks.push({ type: "table", headers: rawHeaders, rows: dataRows });
        continue;
      }
    }

    // Unordered or Ordered List
    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const isOrdered = /^\d+\.\s+/.test(trimmed);
      const listItems: string[] = [];
      while (
        i < lines.length &&
        ((!isOrdered && /^[-*]\s+/.test(lines[i].trim())) ||
          (isOrdered && /^\d+\.\s+/.test(lines[i].trim())))
      ) {
        const itemText = lines[i].trim().replace(/^[-*]\s+|\d+\.\s+/, "");
        listItems.push(itemText);
        i++;
      }
      blocks.push({ type: "list", items: listItems, ordered: isOrdered });
      continue;
    }

    // Regular Paragraph (consume contiguous lines until blank line or special block)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }

  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-on-surface">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          if (block.level === 1 || block.level === 2) {
            return (
              <h3 key={idx} className="font-bold font-mono text-sm text-primary pt-2 pb-0.5 tracking-tight">
                {renderFormattedInline(block.text)}
              </h3>
            );
          }
          if (block.level === 3) {
            return (
              <h4 key={idx} className="font-bold font-mono text-xs text-primary pt-1.5 pb-0.5 uppercase tracking-wider">
                {renderFormattedInline(block.text)}
              </h4>
            );
          }
          return (
            <h5 key={idx} className="font-bold font-mono text-xs text-tertiary pt-1">
              {renderFormattedInline(block.text)}
            </h5>
          );
        }

        if (block.type === "blockquote") {
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-primary pl-3 py-1 bg-surface-container text-on-surface-variant italic font-mono text-[11px] rounded-r my-1.5"
            >
              {renderFormattedInline(block.text)}
            </blockquote>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={idx}
              className="bg-surface-container-lowest p-3 rounded-xl border border-slate-200 overflow-x-auto text-[11px] font-mono text-primary my-2 shadow-inner"
            >
              <code>{block.code}</code>
            </pre>
          );
        }

        if (block.type === "table") {
          return (
            <div
              key={idx}
              className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-surface-container-lowest max-w-full"
            >
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-surface-container-high border-b border-slate-200 font-mono text-[11px] text-on-surface">
                  <tr>
                    {block.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="py-2.5 px-3.5 font-bold border-r border-slate-200 last:border-r-0 text-on-surface"
                      >
                        {renderFormattedInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {block.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-surface-container-high/40 transition-colors even:bg-surface-container-low/30"
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-2.5 px-3.5 text-on-surface border-r border-slate-200/50 last:border-r-0 text-[11.5px] leading-relaxed"
                        >
                          {renderFormattedInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "list") {
          if (block.ordered) {
            return (
              <ol key={idx} className="space-y-1.5 pl-1 my-1">
                {block.items.map((item, lIdx) => (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className="font-mono text-primary font-bold text-[11px] shrink-0 mt-0.5">
                      {lIdx + 1}.
                    </span>
                    <span>{renderFormattedInline(item)}</span>
                  </li>
                ))}
              </ol>
            );
          }
          return (
            <ul key={idx} className="space-y-1.5 pl-1 my-1">
              {block.items.map((item, lIdx) => (
                <li key={lIdx} className="flex items-start gap-2">
                  <span className="text-primary font-bold text-[14px] leading-none mt-0.5">•</span>
                  <span>{renderFormattedInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        // Paragraph: check if paragraph is a single bold line acting as a title
        if (
          block.text.startsWith("**") &&
          block.text.endsWith("**") &&
          !block.text.slice(2, -2).includes("**")
        ) {
          return (
            <h4 key={idx} className="font-bold text-sm text-on-surface pt-1 tracking-tight">
              {renderFormattedInline(block.text)}
            </h4>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {renderFormattedInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

// Helper to format inline bold, italics, code pills, and scientific notation
function renderFormattedInline(text: string) {
  if (!text) return null;

  // Tokenize by inline markers: code, bold, italic, strike
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|~[^~]+~)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary font-mono text-[11px] border border-slate-200 font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="text-on-surface font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="text-on-surface-variant italic font-medium">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
      return (
        <em key={index} className="text-on-surface-variant italic font-medium">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("~") && part.endsWith("~") && part.length >= 2) {
      return (
        <span key={index} className="line-through text-outline">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}
