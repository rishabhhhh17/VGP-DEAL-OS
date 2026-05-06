"use client";

import { useState, useRef, useEffect } from "react";
import {
  X, Sparkles, Calendar, Clock, CheckSquare,
  ChevronDown, ChevronUp, AlertCircle, RotateCcw,
  FileText, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Meeting {
  id: string;
  dealId: string;
  title: string;
  date: string;
  duration: number | null;
  transcript: string | null;
  summary: string | null;
  keyTakeaways: string | null;
  risks: string | null;
  nextSteps: string | null;
  createdAt: string;
}

interface ActionItem { title: string; priority: string }

interface ProcessResult {
  summary: string;
  keyTakeaways: string;
  risks: string;
  nextSteps: string;
  actionItems: ActionItem[];
  tasksCreated: number;
  dealId: string | null;
}

interface Props {
  meeting: Meeting;
  onClose: () => void;
  onUpdate: (updated: Meeting) => void;
}

function parseList(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

const LOADING_STEPS = [
  "Reading your notes…",
  "Extracting insights…",
  "Identifying risks…",
  "Drafting next steps…",
  "Creating action items…",
];

const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  HIGH:   { bg: "bg-red-50",    text: "text-red-600",   dot: "bg-red-500"   },
  MEDIUM: { bg: "bg-amber-50",  text: "text-amber-600", dot: "bg-amber-400" },
  LOW:    { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
};

export default function MeetingDetailPanel({ meeting, onClose, onUpdate }: Props) {
  const [transcript, setTranscript] = useState(meeting.transcript ?? "");
  const [processing, setProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const hasSummary = !!meeting.summary;
  const takeaways = parseList(result?.keyTakeaways ?? meeting.keyTakeaways);
  const risks = parseList(result?.risks ?? meeting.risks);
  const nextSteps = parseList(result?.nextSteps ?? meeting.nextSteps);
  const summary = result?.summary ?? meeting.summary;
  const showResults = !!(result || hasSummary);

  // Cycle through loading steps
  useEffect(() => {
    if (processing) {
      setLoadingStep(0);
      stepTimer.current = setInterval(() => {
        setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1));
      }, 900);
    } else {
      if (stepTimer.current) clearInterval(stepTimer.current);
    }
    return () => { if (stepTimer.current) clearInterval(stepTimer.current); };
  }, [processing]);

  // Scroll results into view + trigger reveal animation
  useEffect(() => {
    if (result) {
      setRevealed(false);
      setTimeout(() => setRevealed(true), 50);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [result]);

  async function handleProcess() {
    if (!transcript.trim()) return;
    setProcessing(true);
    setError("");
    setResult(null);
    setRevealed(false);

    try {
      const res = await fetch(`/api/meetings/${meeting.id}/summarise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error?.includes("ANTHROPIC_API_KEY")
            ? "Add your ANTHROPIC_API_KEY to the .env file to enable AI processing."
            : (data.error ?? "Processing failed. Try again.")
        );
        return;
      }

      setResult(data);
      // Update parent with fresh meeting data
      onUpdate({
        ...meeting,
        transcript,
        summary: data.summary,
        keyTakeaways: data.keyTakeaways,
        risks: data.risks,
        nextSteps: data.nextSteps,
      });
    } catch {
      setError("Could not reach the AI. Check your API key and connection.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{meeting.title}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              {new Date(meeting.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            {meeting.duration && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {meeting.duration} min
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Transcript / Notes input ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Transcript / Notes
            </label>
            {showResults && (
              <button
                onClick={() => setShowRaw(v => !v)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showRaw ? "Hide" : "Show"} raw
              </button>
            )}
          </div>

          {(!showResults || showRaw) && (
            <textarea
              rows={showResults ? 4 : 8}
              placeholder="Paste your meeting transcript, call recording transcript, or rough notes here…"
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              disabled={processing}
              className="w-full px-3 py-2.5 text-xs text-slate-700 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors resize-none font-mono leading-relaxed placeholder:text-slate-400 disabled:opacity-60"
            />
          )}
        </div>

        {/* ── Process button ── */}
        {!processing && (
          <button
            onClick={handleProcess}
            disabled={!transcript.trim()}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all",
              transcript.trim()
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.99]"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            <Sparkles className="w-4 h-4" />
            {showResults ? "Reprocess with AI" : "Process with AI"}
            {showResults && <RotateCcw className="w-3.5 h-3.5 ml-0.5 opacity-70" />}
          </button>
        )}

        {/* ── Loading state ── */}
        {processing && (
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 overflow-hidden">
            {/* Shimmer header */}
            <div className="px-5 py-4 border-b border-violet-100">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 rounded-full bg-violet-200 animate-ping opacity-40" />
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-violet-900">Processing with Claude</p>
                  <p className="text-xs text-violet-600 mt-0.5 transition-all duration-500">
                    {LOADING_STEPS[loadingStep]}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1 bg-violet-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
            {/* Skeleton */}
            <div className="px-5 py-4 space-y-3">
              {[80, 60, 70, 50].map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-300 flex-shrink-0" />
                  <div
                    className="h-3 bg-violet-200 rounded animate-pulse"
                    style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── AI Results ── */}
        {showResults && !processing && (
          <div
            ref={resultsRef}
            className={cn(
              "space-y-4 transition-all duration-500",
              revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            )}
          >
            {/* Summary */}
            {summary && (
              <ResultSection
                label="Summary"
                color="slate"
                delay={0}
                revealed={revealed}
              >
                <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
              </ResultSection>
            )}

            {/* Key Takeaways */}
            {takeaways.length > 0 && (
              <ResultSection label="Key Takeaways" color="violet" delay={100} revealed={revealed}>
                <BulletList items={takeaways} dotColor="bg-violet-400" textColor="text-slate-700" />
              </ResultSection>
            )}

            {/* Risks */}
            {risks.length > 0 && (
              <ResultSection label="Risks & Concerns" color="red" delay={200} revealed={revealed}>
                <BulletList items={risks} dotColor="bg-red-400" textColor="text-slate-700" />
              </ResultSection>
            )}

            {/* Next Steps */}
            {nextSteps.length > 0 && (
              <ResultSection label="Next Steps" color="emerald" delay={300} revealed={revealed}>
                <BulletList items={nextSteps} dotColor="bg-emerald-400" textColor="text-slate-700" />
              </ResultSection>
            )}

            {/* Auto-created tasks banner */}
            {result && result.tasksCreated > 0 && (
              <div
                className={cn(
                  "rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition-all duration-500 delay-500",
                  revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <CheckSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        {result.tasksCreated} task{result.tasksCreated !== 1 ? "s" : ""} created automatically
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Action items from this meeting have been added to the deal's Tasks tab
                      </p>
                      {result.actionItems?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {result.actionItems.map((item, i) => {
                            const p = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.MEDIUM;
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md", p.bg, p.text)}>
                                  {item.priority}
                                </span>
                                <span className="text-xs text-emerald-800">{item.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {result.dealId && (
                    <Link
                      href={`/deals/${result.dealId}?tab=tasks`}
                      className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors flex-shrink-0"
                    >
                      View tasks
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

const SECTION_COLORS = {
  slate:   { border: "border-slate-200",  bg: "bg-slate-50",    label: "text-slate-500",   bar: "bg-slate-400"   },
  violet:  { border: "border-violet-200", bg: "bg-violet-50",   label: "text-violet-600",  bar: "bg-violet-500"  },
  red:     { border: "border-red-200",    bg: "bg-red-50",      label: "text-red-600",     bar: "bg-red-500"     },
  emerald: { border: "border-emerald-200",bg: "bg-emerald-50",  label: "text-emerald-700", bar: "bg-emerald-500" },
};

function ResultSection({
  label, color, delay, revealed, children,
}: {
  label: string;
  color: keyof typeof SECTION_COLORS;
  delay: number;
  revealed: boolean;
  children: React.ReactNode;
}) {
  const c = SECTION_COLORS[color];
  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-500",
        c.border,
        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={cn("px-4 py-2.5 flex items-center gap-2 border-b", c.bg, c.border)}>
        <div className={cn("w-1.5 h-1.5 rounded-full", c.bar)} />
        <p className={cn("text-xs font-semibold uppercase tracking-wide", c.label)}>{label}</p>
      </div>
      <div className="px-4 py-3 bg-white">{children}</div>
    </div>
  );
}

function BulletList({ items, dotColor, textColor }: { items: string[]; dotColor: string; textColor: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", dotColor)} />
          <span className={cn("text-sm leading-relaxed", textColor)}>{item}</span>
        </li>
      ))}
    </ul>
  );
}
