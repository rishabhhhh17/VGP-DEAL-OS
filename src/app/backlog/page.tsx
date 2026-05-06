"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle, Clock, CheckCircle2, ExternalLink,
  Loader2, Pencil, Activity, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import InteractionForm, { type Interaction, OUTCOME_STYLES } from "@/components/InteractionForm";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePoc(v: string | null | undefined): string[] {
  if (!v) return [];
  try { return JSON.parse(v); } catch { return v ? [v] : []; }
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Urgency = "overdue" | "today" | "soon" | "ok";

function deadlineInfo(deadlineStr: string): { label: string; urgency: Urgency } {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d   = new Date(deadlineStr); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0)  return { label: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? "s" : ""}`, urgency: "overdue" };
  if (diff === 0) return { label: "Due today", urgency: "today" };
  if (diff <= 3)  return { label: `${diff} day${diff !== 1 ? "s" : ""} left`, urgency: "soon" };
  return { label: `${diff} days left`, urgency: "ok" };
}

// Dark theme urgency styles
const URGENCY_ROW_STYLE: Record<Urgency, React.CSSProperties> = {
  overdue: { borderLeft: "3px solid #e54d2e", background: "var(--color-red-50)" },
  today:   { borderLeft: "3px solid #e8a020", background: "var(--color-amber-50)" },
  soon:    { borderLeft: "3px solid #d4b800", background: "var(--color-yellow-50)" },
  ok:      { borderLeft: "3px solid transparent" },
};

const URGENCY_BADGE_STYLE: Record<Urgency, React.CSSProperties> = {
  overdue: { background: "var(--color-red-50)",    color: "var(--color-red-600)",    border: "1px solid var(--color-red-200)"    },
  today:   { background: "var(--color-amber-50)",  color: "var(--color-amber-600)",  border: "1px solid var(--color-amber-200)"  },
  soon:    { background: "var(--color-yellow-50)", color: "var(--color-yellow-700)", border: "1px solid var(--color-yellow-200)" },
  ok:      { background: "var(--s-raised)",         color: "var(--s-text-muted)",     border: "1px solid var(--s-border-strong)"  },
};

const URGENCY_ICON: Record<Urgency, React.ElementType> = {
  overdue: AlertTriangle,
  today:   Clock,
  soon:    Clock,
  ok:      CheckCircle2,
};

const URGENCY_ICON_COLOR: Record<Urgency, string> = {
  overdue: "#e54d2e",
  today:   "#e8a020",
  soon:    "#d4b800",
  ok:      "#6b6b6b",
};

// ── Row component ─────────────────────────────────────────────────────────────

function BacklogRow({
  item,
  urgency,
  onEdit,
  onComplete,
}: {
  item: Interaction;
  urgency: Urgency;
  onEdit: () => void;
  onComplete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);
  const poc = parsePoc(item.vgpPoc);
  const { label: dLabel } = deadlineInfo(item.deadline!);
  const outStyle = item.outcome ? OUTCOME_STYLES[item.outcome] : null;

  async function handleComplete() {
    setCompleting(true);
    try {
      await fetch(`/api/interactions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complete: true }),
      });
      onComplete(item.id);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <>
      <tr
        className="group transition-colors"
        style={{ ...URGENCY_ROW_STYLE[urgency], borderBottom: "1px solid var(--s-border)" }}
      >
        {/* Complete checkbox */}
        <td className="px-3 py-3 align-top w-8">
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
            style={{ borderColor: "var(--s-border-strong)", background: "#1a1a1a" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2d9c6e"; (e.currentTarget as HTMLButtonElement).style.background = "#0d2b1e"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2d2d2d"; (e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a"; }}
            title="Mark complete"
          >
            {completing && <Loader2 className="w-2.5 h-2.5 animate-spin" style={{ color: "var(--s-text-dim)" }} />}
          </button>
        </td>

        {/* Date */}
        <td className="px-3 py-3 text-xs whitespace-nowrap align-top" style={{ color: "var(--s-text-dim)" }}>
          {fmtDate(item.date)}
        </td>

        {/* Name / Company */}
        <td className="px-3 py-3 align-top">
          <p className="text-sm font-semibold leading-tight" style={{ color: "var(--s-text)" }}>{item.personName}</p>
          {item.companyName && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs" style={{ color: "var(--s-text-dim)" }}>{item.companyName}</span>
              {item.companyUrl && (
                <a href={item.companyUrl} target="_blank" rel="noopener noreferrer"
                  className="transition-colors" style={{ color: "var(--s-text-dim)" }}>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
          {poc.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {poc.map(p => (
                <span key={p} className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ color: "var(--s-text-muted)", background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)" }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </td>

        {/* Context */}
        <td className="px-3 py-3 hidden md:table-cell align-top max-w-xs">
          {item.context ? (
            <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--s-text-muted)" }}>{item.context}</p>
          ) : <span style={{ color: "var(--s-border-strong)" }}>—</span>}
        </td>

        {/* Outcome */}
        <td className="px-3 py-3 align-top">
          {item.outcome && outStyle ? (
            <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap", outStyle)}>
              {item.outcome}
            </span>
          ) : <span style={{ color: "var(--s-border-strong)" }}>—</span>}
        </td>

        {/* Deadline */}
        <td className="px-3 py-3 align-top whitespace-nowrap">
          <span className="text-[11px] font-semibold px-2 py-1 rounded-md"
            style={URGENCY_BADGE_STYLE[urgency]}>
            {dLabel}
          </span>
          <p className="text-[10px] mt-1" style={{ color: "var(--s-text-dim)" }}>{fmtDate(item.deadline!)}</p>
        </td>

        {/* Actions */}
        <td className="px-2 py-3 align-top">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--s-text-dim)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a"; (e.currentTarget as HTMLButtonElement).style.color = "#ededec"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = "#6b6b6b"; }}
              title="Show details"
            >
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--s-text-dim)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a"; (e.currentTarget as HTMLButtonElement).style.color = "#3b7ef6"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = "#6b6b6b"; }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Inline expansion */}
      {expanded && (item.takeaways || item.nextSteps) && (
        <tr style={{ borderBottom: "1px solid var(--s-border)", background: "var(--s-bg)" }}>
          <td colSpan={7} className="px-6 py-3">
            <div className="grid grid-cols-2 gap-6">
              {item.takeaways && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--s-text-dim)" }}>Takeaways</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--s-text-muted)" }}>{item.takeaways}</p>
                </div>
              )}
              {item.nextSteps && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--s-text-dim)" }}>Next Steps</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--s-text-muted)" }}>{item.nextSteps}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BacklogPage() {
  const [items, setItems] = useState<Interaction[]>([]);
  const [deals, setDeals] = useState<{ id: string; companyName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Interaction | null>(null);

  async function load() {
    setLoading(true);
    const [iRes, dRes] = await Promise.all([
      fetch("/api/interactions?backlog=true"),
      fetch("/api/deals"),
    ]);
    const [iData, dData] = await Promise.all([iRes.json(), dRes.json()]);
    setItems(Array.isArray(iData) ? iData : []);
    setDeals(Array.isArray(dData) ? dData : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleSaved() {
    setEditTarget(null);
    load();
  }

  function handleComplete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const overdue = items.filter(i => i.deadline && deadlineInfo(i.deadline).urgency === "overdue");
  const today   = items.filter(i => i.deadline && deadlineInfo(i.deadline).urgency === "today");
  const soon    = items.filter(i => i.deadline && deadlineInfo(i.deadline).urgency === "soon");
  const ok      = items.filter(i => i.deadline && deadlineInfo(i.deadline).urgency === "ok");

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--s-border)", background: "var(--s-surface)" }}
      >
        <div>
          <h1 className="text-sm font-semibold" style={{ color: "var(--s-text)" }}>Backlog</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--s-text-dim)" }}>
            {loading
              ? "Loading…"
              : `${items.length} open follow-up${items.length !== 1 ? "s" : ""} with deadlines · sorted by urgency`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {!loading && overdue.length > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md font-medium"
              style={{ background: "#2b0d0d", color: "#e54d2e", border: "1px solid #5c1e1e" }}>
              <AlertTriangle className="w-3 h-3" /> {overdue.length} overdue
            </span>
          )}
          {!loading && today.length > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md font-medium"
              style={{ background: "#2a1f00", color: "#e8a020", border: "1px solid #5c4500" }}>
              <Clock className="w-3 h-3" /> {today.length} today
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--s-text-dim)" }} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Activity className="w-8 h-8 mb-3" style={{ color: "var(--s-border-strong)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--s-text-muted)" }}>Backlog is clear</p>
            <p className="text-xs mt-1" style={{ color: "var(--s-text-dim)" }}>
              No open follow-ups with deadlines.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10" style={{ background: "var(--s-surface)" }}>
              <tr style={{ borderBottom: "1px solid var(--s-border)" }}>
                <th className="px-3 py-2.5 w-8" />
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest w-24" style={{ color: "var(--s-text-dim)" }}>Date</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--s-text-dim)" }}>Name / Company</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest hidden md:table-cell" style={{ color: "var(--s-text-dim)" }}>Context</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--s-text-dim)" }}>Outcome</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--s-text-dim)" }}>Deadline</th>
                <th className="px-3 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Overdue",         group: overdue, urgency: "overdue" as Urgency },
                { label: "Due Today",       group: today,   urgency: "today"   as Urgency },
                { label: "Due in 1–3 Days", group: soon,    urgency: "soon"    as Urgency },
                { label: "Upcoming",        group: ok,      urgency: "ok"      as Urgency },
              ].map(({ label, group, urgency }) => {
                if (group.length === 0) return null;
                const Icon = URGENCY_ICON[urgency];
                return [
                  <tr key={`section-${label}`}>
                    <td colSpan={7} className="px-4 pt-5 pb-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3" style={{ color: URGENCY_ICON_COLOR[urgency] }} />
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--s-text-dim)" }}>{label}</span>
                        <span className="text-[10px]" style={{ color: "var(--s-border-strong)" }}>({group.length})</span>
                      </div>
                    </td>
                  </tr>,
                  ...group.map(item => (
                    <BacklogRow
                      key={item.id}
                      item={item}
                      urgency={urgency}
                      onEdit={() => setEditTarget(item)}
                      onComplete={handleComplete}
                    />
                  )),
                ];
              })}
            </tbody>
          </table>
        )}
      </div>

      {editTarget && (
        <InteractionForm
          interaction={editTarget}
          deals={deals}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
