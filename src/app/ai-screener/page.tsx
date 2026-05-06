"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Upload, X, FileText, Sparkles, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, History, Zap,
  ArrowLeft, ExternalLink, Building2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface CriteriaScore {
  category: string;
  score: number;
  max_score: number;
  status: "strong" | "gap" | "misaligned";
  reasoning: string;
}

interface ScreeningResultData {
  overall_score: number;
  overall_verdict: string;
  fit_level: "strong" | "potential" | "weak" | "poor";
  criteria_scores: CriteriaScore[];
  strengths: string[];
  concerns: string[];
  suggested_next_steps: string[];
  resultId?: string;
}

interface HistoryItem {
  id: string;
  companyName: string;
  sector: string | null;
  stage: string | null;
  overallScore: number;
  fitLevel: string;
  createdAt: string;
  deal: { id: string; companyName: string } | null;
}

interface Deal {
  id: string;
  companyName: string;
  stage: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Reading the deck…",
  "Analysing founding team…",
  "Checking against your criteria…",
  "Calculating scores…",
  "Generating verdict…",
];

const FIT_CONFIG = {
  strong:    { color: "#2d9c6e", label: "Strong fit",                   ring: "#2d9c6e" },
  potential: { color: "#e8a020", label: "Potential fit, dig deeper",    ring: "#e8a020" },
  weak:      { color: "#e87820", label: "Weak fit",                     ring: "#e87820" },
  poor:      { color: "#e54d2e", label: "Poor fit",                     ring: "#e54d2e" },
};

const STATUS_CONFIG = {
  strong:    { icon: CheckCircle2,   color: "#2d9c6e", label: "Strong"         },
  gap:       { icon: AlertTriangle,  color: "#e8a020", label: "Gap identified"  },
  misaligned:{ icon: XCircle,        color: "#e54d2e", label: "Misaligned"      },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function scoreColor(score: number) {
  if (score >= 80) return "#2d9c6e";
  if (score >= 60) return "#e8a020";
  if (score >= 40) return "#e87820";
  return "#e54d2e";
}

// ── Animated circular score ───────────────────────────────────────────────────

function ScoreCircle({ score, fitLevel }: { score: number; fitLevel: keyof typeof FIT_CONFIG }) {
  const [displayed, setDisplayed] = useState(0);
  const color = FIT_CONFIG[fitLevel]?.color ?? "#3b7ef6";
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const pct = displayed / 100;

  useEffect(() => {
    let current = 0;
    const step = score / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, score);
      setDisplayed(Math.round(current));
      if (current >= score) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--s-border-strong)" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="70" cy="70" r={radius} fill="none"
            stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: "stroke-dashoffset 0.03s linear" }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ gap: 0 }}
        >
          <span
            className="tabular-nums font-bold"
            style={{ fontSize: 36, color: "var(--s-text)", lineHeight: 1 }}
          >
            {displayed}
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--s-text-muted)" }}>
            / 100
          </span>
        </div>
      </div>
      <div
        className="text-xs font-semibold px-3 py-1.5 rounded-full"
        style={{ background: `${color}18`, color }}
      >
        {FIT_CONFIG[fitLevel]?.label}
      </div>
    </div>
  );
}

// ── Criteria bar row ──────────────────────────────────────────────────────────

function CriteriaRow({
  item, index, expanded, onToggle,
}: {
  item: CriteriaScore;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pct = item.score / item.max_score;
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.gap;
  const StatusIcon = cfg.icon;
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(pct * 100), 100 + index * 80);
    return () => clearTimeout(t);
  }, [pct, index]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--s-border-strong)", background: "var(--s-surface)" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background: expanded ? "var(--s-raised)" : "transparent" }}
      >
        {/* Category */}
        <span className="text-sm font-medium w-36 flex-shrink-0" style={{ color: "var(--s-text)" }}>
          {item.category}
        </span>

        {/* Bar */}
        <div className="flex-1 h-2 rounded-full" style={{ background: "var(--s-border-strong)" }}>
          <div
            className="h-2 rounded-full"
            style={{
              width: `${barWidth}%`,
              background: cfg.color,
              transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>

        {/* Score */}
        <span
          className="text-xs tabular-nums font-bold w-10 text-right flex-shrink-0"
          style={{ color: cfg.color }}
        >
          {item.score}/{item.max_score}
        </span>

        {/* Status */}
        <div className="flex items-center gap-1.5 w-32 flex-shrink-0">
          <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />
          <span className="text-xs font-medium" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>

        {/* Expand chevron */}
        {expanded
          ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--s-text-muted)" }} />
          : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--s-text-muted)" }} />
        }
      </button>

      {expanded && (
        <div
          className="px-4 pb-3 pt-1 text-xs leading-relaxed"
          style={{ color: "var(--s-text-muted)", borderTop: "1px solid var(--s-border-strong)" }}
        >
          {item.reasoning}
        </div>
      )}
    </div>
  );
}

// ── Results view ──────────────────────────────────────────────────────────────

function ResultsView({
  result,
  companyName,
  onReset,
  deals,
}: {
  result: ScreeningResultData;
  companyName: string;
  onReset: () => void;
  deals: Deal[];
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [savingDeal, setSavingDeal] = useState(false);
  const [savedDealId, setSavedDealId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string>("");

  async function handleSaveToDeal() {
    if (!result.resultId || !selectedDealId) return;
    setSavingDeal(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/screener/results", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId: result.resultId, dealId: selectedDealId }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedDealId(selectedDealId);
    } catch {
      setSaveError("Failed to save. Try again.");
    } finally {
      setSavingDeal(false);
    }
  }

  const fit = result.fit_level as keyof typeof FIT_CONFIG;
  const fitCfg = FIT_CONFIG[fit] ?? FIT_CONFIG.poor;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: "var(--s-text-muted)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--s-text)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--s-text-muted)")}
      >
        <ArrowLeft className="w-4 h-4" />
        Screen another deal
      </button>

      {/* Hero card */}
      <div
        className="rounded-2xl p-8 flex flex-col items-center text-center gap-5"
        style={{
          background: "var(--s-surface)",
          border: `1px solid ${fitCfg.color}30`,
          boxShadow: `0 0 40px ${fitCfg.color}10`,
        }}
      >
        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--s-text-muted)" }}>
          AI Screening Report
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--s-text)" }}>{companyName}</h2>

        <ScoreCircle score={result.overall_score} fitLevel={fit} />

        <p className="text-sm max-w-lg leading-relaxed" style={{ color: "var(--s-text-muted)" }}>
          {result.overall_verdict}
        </p>
      </div>

      {/* Criteria breakdown */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--s-border-strong)" }}
      >
        <div
          className="px-5 py-3.5 flex items-center gap-2"
          style={{ borderBottom: "1px solid var(--s-border-strong)", background: "var(--s-surface)" }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--s-text-muted)" }}>
            Criteria Breakdown
          </span>
        </div>
        <div className="p-4 space-y-2" style={{ background: "var(--s-bg)" }}>
          {result.criteria_scores.map((item, idx) => (
            <CriteriaRow
              key={item.category}
              item={item}
              index={idx}
              expanded={expandedIdx === idx}
              onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            />
          ))}
        </div>
      </div>

      {/* Strengths + Concerns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Strengths */}
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: "var(--s-surface)", border: "1px solid var(--s-border-strong)" }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: "#2d9c6e" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#2d9c6e" }}>
              Key Strengths
            </span>
          </div>
          <ul className="space-y-2">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "var(--s-text-muted)" }}>
                <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#2d9c6e" }} />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Concerns */}
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: "var(--s-surface)", border: "1px solid var(--s-border-strong)" }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: "#e8a020" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#e8a020" }}>
              Key Concerns
            </span>
          </div>
          <ul className="space-y-2">
            {result.concerns.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "var(--s-text-muted)" }}>
                <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#e8a020" }} />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Next steps */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ background: "var(--s-surface)", border: "1px solid var(--s-border-strong)" }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: "var(--s-accent)" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--s-accent)" }}>
            Suggested Next Steps
          </span>
        </div>
        <ol className="space-y-2">
          {result.suggested_next_steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-xs leading-relaxed" style={{ color: "var(--s-text-muted)" }}>
              <span
                className="text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(59,126,246,0.12)", color: "var(--s-accent)" }}
              >
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      {/* Save to deal */}
      {!savedDealId && result.resultId && (
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: "var(--s-surface)", border: "1px solid var(--s-border-strong)" }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--s-text-muted)" }}>
            Save to Deal
          </span>
          <div className="flex items-center gap-3">
            <select
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
              className="flex-1 text-sm rounded-lg px-3 py-2"
              style={{
                background: "var(--s-input-bg)",
                border: "1px solid var(--s-input-border)",
                color: selectedDealId ? "var(--s-text)" : "var(--s-text-muted)",
                outline: "none",
              }}
            >
              <option value="">Select a deal to link this report…</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>{d.companyName}</option>
              ))}
            </select>
            <button
              onClick={handleSaveToDeal}
              disabled={savingDeal || !selectedDealId}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all flex-shrink-0"
              style={{
                background: "var(--s-accent)",
                opacity: savingDeal || !selectedDealId ? 0.5 : 1,
              }}
            >
              {savingDeal ? "Saving…" : "Save Report"}
            </button>
          </div>
          {saveError && <p className="text-xs" style={{ color: "#e54d2e" }}>{saveError}</p>}
        </div>
      )}

      {savedDealId && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "rgba(45,156,110,0.08)", border: "1px solid rgba(45,156,110,0.2)" }}
        >
          <CheckCircle2 className="w-4 h-4" style={{ color: "#2d9c6e" }} />
          <span className="text-sm font-medium" style={{ color: "#2d9c6e" }}>
            Report saved to deal. The deal card now shows a Screened badge.
          </span>
          <Link
            href={`/deals/${savedDealId}`}
            className="ml-auto flex items-center gap-1 text-xs font-semibold"
            style={{ color: "var(--s-accent)" }}
          >
            View Deal <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── History view ──────────────────────────────────────────────────────────────

function HistoryView({
  items,
  onViewReport,
}: {
  items: HistoryItem[];
  onViewReport: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <History className="w-10 h-10 mb-3" style={{ color: "var(--s-text-dim)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--s-text-muted)" }}>
          No screenings yet
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--s-text-dim)" }}>
          Screen your first deal to see results here
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--s-border-strong)" }}
    >
      {/* Table header */}
      <div
        className="grid text-[10px] font-bold uppercase tracking-wider px-5 py-3"
        style={{
          gridTemplateColumns: "1fr 120px 90px 100px 140px 90px",
          background: "var(--s-surface)",
          borderBottom: "1px solid var(--s-border-strong)",
          color: "var(--s-text-muted)",
        }}
      >
        <span>Company</span>
        <span>Date</span>
        <span>Score</span>
        <span>Fit</span>
        <span>Linked Deal</span>
        <span />
      </div>

      {items.map((item, idx) => {
        const fit = item.fitLevel as keyof typeof FIT_CONFIG;
        const fitCfg = FIT_CONFIG[fit] ?? FIT_CONFIG.poor;
        return (
          <div
            key={item.id}
            className="grid items-center px-5 py-3.5 text-sm"
            style={{
              gridTemplateColumns: "1fr 120px 90px 100px 140px 90px",
              borderTop: idx > 0 ? "1px solid var(--s-border-strong)" : undefined,
              background: "var(--s-bg)",
            }}
          >
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--s-text)" }}>
                {item.companyName}
              </p>
              {(item.sector || item.stage) && (
                <p className="text-[11px]" style={{ color: "var(--s-text-muted)" }}>
                  {[item.sector, item.stage].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <span className="text-xs" style={{ color: "var(--s-text-muted)" }}>
              {fmtDate(item.createdAt)}
            </span>
            <span
              className="text-sm tabular-nums font-bold"
              style={{ color: scoreColor(item.overallScore) }}
            >
              {item.overallScore}
            </span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full inline-flex"
              style={{ background: `${fitCfg.color}18`, color: fitCfg.color }}
            >
              {fitCfg.label.split(",")[0]}
            </span>
            <span className="text-xs" style={{ color: "var(--s-text-muted)" }}>
              {item.deal ? (
                <Link
                  href={`/deals/${item.deal.id}`}
                  className="flex items-center gap-1 hover:underline"
                  style={{ color: "var(--s-accent)" }}
                >
                  <Building2 className="w-3 h-3" />
                  {item.deal.companyName}
                </Link>
              ) : (
                <span style={{ color: "var(--s-text-dim)" }}>—</span>
              )}
            </span>
            <button
              onClick={() => onViewReport(item.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: "var(--s-raised)",
                color: "var(--s-text-muted)",
                border: "1px solid var(--s-border-strong)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--s-text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--s-text-muted)";
              }}
            >
              View Report
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIScreenerPage() {
  const [activeTab, setActiveTab] = useState<"screen" | "history">("screen");

  // Upload state
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [dealId, setDealId] = useState("");

  // Screening state
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [result, setResult] = useState<ScreeningResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Shared data
  const [deals, setDeals] = useState<Deal[]>([]);

  // Load deals for dropdown
  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then(setDeals)
      .catch(() => {});
  }, []);

  // Load history when tab switches
  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    fetch("/api/screener/results")
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "history") loadHistory();
  }, [activeTab, loadHistory]);

  // Rotate loading messages
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // ── Drag & drop ────────────────────────────────────────────────────────────

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...arr.filter((f) => !existing.has(f.name))];
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  // ── Screen ────────────────────────────────────────────────────────────────

  async function handleScreen() {
    if (!companyName.trim() && files.length === 0) {
      setError("Please provide at least a company name or upload collateral.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    setLoadingMsgIdx(0);

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      fd.append("companyName", companyName.trim() || "Unknown Company");
      fd.append("sector", sector);
      fd.append("stage", stage);
      fd.append("additionalContext", additionalContext);
      if (dealId) fd.append("dealId", dealId);

      const res = await fetch("/api/screener/screen", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Screening failed");

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleViewReport(id: string) {
    try {
      const res = await fetch(`/api/screener/results/${id}`);
      const data = await res.json();
      const parsed = JSON.parse(data.fullResult) as ScreeningResultData;
      parsed.resultId = data.id;
      setResult(parsed);
      setCompanyName(data.companyName);
      setActiveTab("screen");
    } catch {
      // ignore
    }
  }

  function handleReset() {
    setResult(null);
    setFiles([]);
    setCompanyName("");
    setSector("");
    setStage("");
    setAdditionalContext("");
    setDealId("");
    setError(null);
  }

  const inputStyle = {
    background: "var(--s-input-bg)",
    border: "1px solid var(--s-input-border)",
    color: "var(--s-text)",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "13px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s",
  };

  const focusStyle = { borderColor: "var(--s-accent)" };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--s-bg)" }}>
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          background: "var(--s-surface)",
          borderBottom: "1px solid var(--s-border-strong)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(59,126,246,0.12)" }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "var(--s-accent)" }} />
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: "var(--s-text)" }}>
              AI Deal Screener
            </h1>
            <p className="text-xs" style={{ color: "var(--s-text-muted)" }}>
              Upload collateral and get an instant AI score against your fund criteria
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: "var(--s-raised)" }}
        >
          {(["screen", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab ? "var(--s-surface)" : "transparent",
                color: activeTab === tab ? "var(--s-text)" : "var(--s-text-muted)",
                boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.15)" : undefined,
              }}
            >
              {tab === "screen" ? <Sparkles className="w-3.5 h-3.5" /> : <History className="w-3.5 h-3.5" />}
              {tab === "screen" ? "Screen a Deal" : "History"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-3xl mx-auto">

          {/* ── HISTORY TAB ── */}
          {activeTab === "history" && (
            historyLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <HistoryView items={history} onViewReport={handleViewReport} />
            )
          )}

          {/* ── SCREEN TAB ── */}
          {activeTab === "screen" && (
            <>
              {/* Results */}
              {result && (
                <ResultsView
                  result={result}
                  companyName={companyName || "Unknown Company"}
                  onReset={handleReset}
                  deals={deals}
                />
              )}

              {/* Loading */}
              {isProcessing && (
                <div
                  className="flex flex-col items-center justify-center py-24 rounded-2xl gap-6"
                  style={{ border: "1px solid var(--s-border-strong)", background: "var(--s-surface)" }}
                >
                  {/* Spinner */}
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full animate-spin" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="var(--s-border-strong)" strokeWidth="4" />
                      <circle
                        cx="32" cy="32" r="28" fill="none"
                        stroke="var(--s-accent)" strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="44 132"
                        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                      />
                    </svg>
                    <Sparkles
                      className="w-6 h-6 absolute inset-0 m-auto"
                      style={{ color: "var(--s-accent)" }}
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--s-text)" }}>
                      {LOADING_MESSAGES[loadingMsgIdx]}
                    </p>
                    <p className="text-xs" style={{ color: "var(--s-text-dim)" }}>
                      This usually takes 15–30 seconds
                    </p>
                  </div>
                </div>
              )}

              {/* Form (hidden when loading or result shown) */}
              {!isProcessing && !result && (
                <div className="space-y-5">

                  {/* Error */}
                  {error && (
                    <div
                      className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: "rgba(229,77,46,0.08)",
                        border: "1px solid rgba(229,77,46,0.2)",
                        color: "#e54d2e",
                      }}
                    >
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Step 1 — Upload */}
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: "1px solid var(--s-border-strong)" }}
                  >
                    <div
                      className="px-5 py-3 flex items-center gap-2"
                      style={{ borderBottom: "1px solid var(--s-border-strong)", background: "var(--s-surface)" }}
                    >
                      <span
                        className="text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ background: "rgba(59,126,246,0.12)", color: "var(--s-accent)" }}
                      >1</span>
                      <span className="text-xs font-semibold" style={{ color: "var(--s-text)" }}>
                        Upload Collateral
                      </span>
                      <span className="text-xs ml-1" style={{ color: "var(--s-text-muted)" }}>
                        — pitch deck, one-pager, financials
                      </span>
                    </div>

                    <div className="p-5 space-y-3" style={{ background: "var(--s-bg)" }}>
                      {/* Drop zone */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 cursor-pointer transition-all gap-3"
                        style={{
                          borderColor: dragging ? "var(--s-accent)" : "var(--s-border-strong)",
                          background: dragging ? "rgba(59,126,246,0.04)" : "transparent",
                        }}
                      >
                        <Upload
                          className="w-8 h-8"
                          style={{ color: dragging ? "var(--s-accent)" : "var(--s-text-dim)" }}
                        />
                        <div className="text-center">
                          <p className="text-sm font-semibold" style={{ color: "var(--s-text-muted)" }}>
                            Drag & drop PDFs here
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--s-text-dim)" }}>
                            or click to browse — multiple files supported
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          multiple
                          className="hidden"
                          onChange={(e) => e.target.files && addFiles(e.target.files)}
                        />
                      </div>

                      {/* File list */}
                      {files.length > 0 && (
                        <div className="space-y-2">
                          {files.map((f) => (
                            <div
                              key={f.name}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                              style={{
                                background: "var(--s-surface)",
                                border: "1px solid var(--s-border-strong)",
                              }}
                            >
                              <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--s-accent)" }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate" style={{ color: "var(--s-text)" }}>
                                  {f.name}
                                </p>
                                <p className="text-[10px]" style={{ color: "var(--s-text-dim)" }}>
                                  {fmtBytes(f.size)}
                                </p>
                              </div>
                              <button
                                onClick={() => removeFile(f.name)}
                                className="p-1 rounded-md transition-colors"
                                style={{ color: "var(--s-text-dim)" }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.color = "#e54d2e";
                                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(229,77,46,0.08)";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.color = "var(--s-text-dim)";
                                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                }}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2 — Context */}
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: "1px solid var(--s-border-strong)" }}
                  >
                    <div
                      className="px-5 py-3 flex items-center gap-2"
                      style={{ borderBottom: "1px solid var(--s-border-strong)", background: "var(--s-surface)" }}
                    >
                      <span
                        className="text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ background: "rgba(59,126,246,0.12)", color: "var(--s-accent)" }}
                      >2</span>
                      <span className="text-xs font-semibold" style={{ color: "var(--s-text)" }}>
                        Company Context
                      </span>
                      <span className="text-xs ml-1" style={{ color: "var(--s-text-muted)" }}>
                        — optional quick fields
                      </span>
                    </div>

                    <div className="p-5 space-y-4" style={{ background: "var(--s-bg)" }}>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium" style={{ color: "var(--s-text-muted)" }}>
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Zomato, Mamaearth…"
                            style={inputStyle}
                            onFocus={(e) => Object.assign((e.target as HTMLInputElement).style, focusStyle)}
                            onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--s-input-border)")}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium" style={{ color: "var(--s-text-muted)" }}>
                            Sector
                          </label>
                          <input
                            type="text"
                            value={sector}
                            onChange={(e) => setSector(e.target.value)}
                            placeholder="e.g. F&B, Consumer Tech…"
                            style={inputStyle}
                            onFocus={(e) => Object.assign((e.target as HTMLInputElement).style, focusStyle)}
                            onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--s-input-border)")}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium" style={{ color: "var(--s-text-muted)" }}>
                            Stage
                          </label>
                          <select
                            value={stage}
                            onChange={(e) => setStage(e.target.value)}
                            style={inputStyle}
                            onFocus={(e) => Object.assign((e.target as HTMLSelectElement).style, focusStyle)}
                            onBlur={(e) => ((e.target as HTMLSelectElement).style.borderColor = "var(--s-input-border)")}
                          >
                            <option value="">Select stage…</option>
                            <option>Pre-seed</option>
                            <option>Seed</option>
                            <option>Series A</option>
                            <option>Series B+</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium" style={{ color: "var(--s-text-muted)" }}>
                            Link to Deal (optional)
                          </label>
                          <select
                            value={dealId}
                            onChange={(e) => setDealId(e.target.value)}
                            style={inputStyle}
                            onFocus={(e) => Object.assign((e.target as HTMLSelectElement).style, focusStyle)}
                            onBlur={(e) => ((e.target as HTMLSelectElement).style.borderColor = "var(--s-input-border)")}
                          >
                            <option value="">No deal selected</option>
                            {deals.map((d) => (
                              <option key={d.id} value={d.id}>{d.companyName}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: "var(--s-text-muted)" }}>
                          Additional Context
                        </label>
                        <textarea
                          rows={3}
                          value={additionalContext}
                          onChange={(e) => setAdditionalContext(e.target.value)}
                          placeholder='e.g. "Founder mentioned they have a patent pending on the core tech. Series A at 40Cr pre-money valuation."'
                          style={{ ...inputStyle, resize: "vertical" as const, lineHeight: "1.6" }}
                          onFocus={(e) => Object.assign((e.target as HTMLTextAreaElement).style, focusStyle)}
                          onBlur={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = "var(--s-input-border)")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 3 — Screen button */}
                  <button
                    onClick={handleScreen}
                    className="w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-3 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #3b7ef6 0%, #2d6fe0 100%)",
                      boxShadow: "0 4px 20px rgba(59,126,246,0.3)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(59,126,246,0.45)";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(59,126,246,0.3)";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                    Screen with AI ✦
                  </button>

                  <p className="text-center text-xs" style={{ color: "var(--s-text-dim)" }}>
                    Make sure you&apos;ve set up your{" "}
                    <Link href="/ai-screener/settings" style={{ color: "var(--s-accent)" }}>
                      investment criteria
                    </Link>{" "}
                    before screening
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
