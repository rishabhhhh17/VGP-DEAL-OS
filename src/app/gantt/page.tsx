"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { STAGE_LABELS, STAGE_COLORS, type Stage } from "@/lib/utils";

// ── Dummy data ─────────────────────────────────────────────────────────────────

// All dates are relative to "today" so the chart always looks current
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

interface DummyDeal {
  id: string;
  name: string;
  stage: Stage;
  sector: string;
  checkSize: string;
  start: string;       // date string — first contact
  end: string;         // date string — expected close or last activity
  interactions: {
    date: string;
    label: string;
    outcome: string;
    person: string;
    poc: string;
  }[];
}

const DEALS: DummyDeal[] = [
  {
    id: "d1",
    name: "Acme Corp",
    stage: "TERM_SHEET",
    sector: "Fintech",
    checkSize: "$2M",
    start: daysAgo(112),
    end: daysFromNow(18),
    interactions: [
      { date: daysAgo(112), label: "Initial call", outcome: "To Follow-up",        person: "Sarah Chen",    poc: "KJ" },
      { date: daysAgo(91),  label: "Management deck", outcome: "Follow-up scheduled", person: "Sarah Chen", poc: "KJ" },
      { date: daysAgo(70),  label: "DD kickoff",   outcome: "In progress",         person: "Sarah Chen",    poc: "MC" },
      { date: daysAgo(42),  label: "IC Memo",      outcome: "In progress",         person: "Sarah Chen",    poc: "KJ" },
      { date: daysAgo(14),  label: "Term sheet",   outcome: "Mandated",            person: "Sarah Chen",    poc: "KJ" },
    ],
  },
  {
    id: "d2",
    name: "NovaPay",
    stage: "DILIGENCE",
    sector: "Payments",
    checkSize: "$1.5M",
    start: daysAgo(84),
    end: daysFromNow(35),
    interactions: [
      { date: daysAgo(84),  label: "Intro meeting",  outcome: "To Follow-up",      person: "James Obi",     poc: "TS" },
      { date: daysAgo(56),  label: "Product demo",   outcome: "Follow-up scheduled", person: "James Obi",   poc: "TS" },
      { date: daysAgo(28),  label: "DD kickoff",     outcome: "In progress",       person: "James Obi",     poc: "MC" },
      { date: daysAgo(7),   label: "Model review",   outcome: "In progress",       person: "James Obi",     poc: "MC" },
    ],
  },
  {
    id: "d3",
    name: "ClearLedger",
    stage: "INITIAL_CALL",
    sector: "SaaS",
    checkSize: "$750K",
    start: daysAgo(35),
    end: daysFromNow(60),
    interactions: [
      { date: daysAgo(35),  label: "Cold email",    outcome: "To Follow-up",        person: "Priya Nair",    poc: "VJ" },
      { date: daysAgo(21),  label: "Intro call",    outcome: "Follow-up scheduled", person: "Priya Nair",    poc: "VJ" },
      { date: daysAgo(7),   label: "Founder meet",  outcome: "In progress",         person: "Priya Nair",    poc: "KJ" },
    ],
  },
  {
    id: "d4",
    name: "Helix Health",
    stage: "CLOSED",
    sector: "Healthcare",
    checkSize: "$3M",
    start: daysAgo(180),
    end: daysAgo(21),
    interactions: [
      { date: daysAgo(180), label: "Intro",         outcome: "To Follow-up",        person: "Marcus Webb",   poc: "KJ" },
      { date: daysAgo(150), label: "Deep dive",     outcome: "In progress",         person: "Marcus Webb",   poc: "KJ" },
      { date: daysAgo(112), label: "IC Memo",       outcome: "In progress",         person: "Marcus Webb",   poc: "MC" },
      { date: daysAgo(70),  label: "Term sheet",    outcome: "Mandated",            person: "Marcus Webb",   poc: "KJ" },
      { date: daysAgo(42),  label: "Legal review",  outcome: "In progress",         person: "Marcus Webb",   poc: "TS" },
      { date: daysAgo(21),  label: "Close",         outcome: "Mandated",            person: "Marcus Webb",   poc: "KJ" },
    ],
  },
  {
    id: "d5",
    name: "Orion AI",
    stage: "SOURCING",
    sector: "AI/ML",
    checkSize: "$500K",
    start: daysAgo(14),
    end: daysFromNow(90),
    interactions: [
      { date: daysAgo(14),  label: "LinkedIn DM",   outcome: "To Follow-up",        person: "Aisha Kamara",  poc: "VJ" },
      { date: daysAgo(5),   label: "Intro call",    outcome: "To Follow-up",        person: "Aisha Kamara",  poc: "VJ" },
    ],
  },
  {
    id: "d6",
    name: "Slate Networks",
    stage: "PASSED",
    sector: "Infrastructure",
    checkSize: "$1M",
    start: daysAgo(140),
    end: daysAgo(56),
    interactions: [
      { date: daysAgo(140), label: "Intro",         outcome: "To Follow-up",        person: "Tom Reid",      poc: "MC" },
      { date: daysAgo(112), label: "Deep dive",     outcome: "In progress",         person: "Tom Reid",      poc: "MC" },
      { date: daysAgo(84),  label: "IC review",     outcome: "Pass",                person: "Tom Reid",      poc: "KJ" },
      { date: daysAgo(56),  label: "Pass email",    outcome: "Pass",                person: "Tom Reid",      poc: "KJ" },
    ],
  },
];

// ── Date helpers ───────────────────────────────────────────────────────────────

function parseDate(s: string): Date { return new Date(s); }

function toPercent(date: Date, min: Date, max: Date): number {
  const total = max.getTime() - min.getTime();
  if (total === 0) return 0;
  return Math.max(0, Math.min(100, ((date.getTime() - min.getTime()) / total) * 100));
}

function floorToMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}
function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// ── Colours ────────────────────────────────────────────────────────────────────

const OUTCOME_COLOR: Record<string, string> = {
  "To Follow-up":        "#e8a020",
  "Follow-up scheduled": "#d4b800",
  "In progress":         "#3b7ef6",
  "Mandated":            "#2d9c6e",
  "Handed over":         "#8a8a8a",
  "Investing Partners":  "#14b8a6",
  "KIT":                 "#7c66dc",
  "Pass":                "#e54d2e",
};

const POC_COLORS: Record<string, { bg: string; text: string }> = {
  "KJ": { bg: "#1a3060", text: "#3b7ef6" },
  "MC": { bg: "#0d2b1e", text: "#2d9c6e" },
  "TS": { bg: "#2a1f00", text: "#e8a020" },
  "VJ": { bg: "#2b0d0d", text: "#e54d2e" },
};

// ── Tooltip ────────────────────────────────────────────────────────────────────

interface TooltipState {
  x: number; y: number;
  label: string; date: string; outcome: string; person: string; poc: string;
}

// ── Chart ──────────────────────────────────────────────────────────────────────

const LEFT_W = 220;

export default function GanttPage() {
  // Compute date range from all deals
  const allDates = DEALS.flatMap(d => [
    parseDate(d.start), parseDate(d.end),
    ...d.interactions.map(ix => parseDate(ix.date)),
  ]);
  const rawMin = new Date(Math.min(...allDates.map(d => d.getTime())));
  const rawMax = new Date(Math.max(...allDates.map(d => d.getTime())));
  const minDate = addMonths(floorToMonth(rawMin), -1);
  const maxDate = addMonths(floorToMonth(rawMax), 1);
  const todayPct = toPercent(new Date(), minDate, maxDate);

  // Month ticks
  const ticks: { label: string; pct: number }[] = [];
  let cursor = floorToMonth(minDate);
  while (cursor <= maxDate) {
    ticks.push({ label: monthLabel(cursor), pct: toPercent(cursor, minDate, maxDate) });
    cursor = addMonths(cursor, 1);
  }

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--s-bg)" }}>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--s-border)", background: "var(--s-surface)" }}
      >
        <div>
          <h1 className="text-sm font-semibold" style={{ color: "var(--s-text)" }}>Deal Timeline</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--s-text-dim)" }}>
            {DEALS.length} deals · sample data
          </p>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-4 flex-wrap">
          {Object.entries(OUTCOME_COLOR).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[10px]" style={{ color: "var(--s-text-dim)" }}>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 border-l pl-4" style={{ borderColor: "var(--s-border-strong)" }}>
            <div className="w-px h-4 rounded-full" style={{ background: "#3b7ef6" }} />
            <span className="text-[10px]" style={{ color: "var(--s-text-dim)" }}>Today</span>
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: LEFT_W + 700 }}>

          {/* X-axis header */}
          <div
            className="flex sticky top-0 z-20"
            style={{
              background: "var(--s-surface)",
              borderBottom: "1px solid var(--s-border-strong)",
              boxShadow: "0 1px 8px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="flex-shrink-0"
              style={{ width: LEFT_W, borderRight: "1px solid var(--s-border-strong)" }}
            />
            <div className="flex-1 relative" style={{ height: 34 }}>
              {ticks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full flex items-center"
                  style={{ left: `${tick.pct}%` }}
                >
                  <div className="w-px h-full" style={{ background: "var(--s-border)" }} />
                  <span
                    className="text-[10px] ml-1.5 whitespace-nowrap select-none font-medium"
                    style={{ color: "var(--s-text-dim)" }}
                  >
                    {tick.label}
                  </span>
                </div>
              ))}
              {/* Today marker */}
              <div
                className="absolute top-0 h-full w-0.5 rounded-full"
                style={{ left: `${todayPct}%`, background: "#3b7ef6", opacity: 0.8 }}
              />
            </div>
          </div>

          {/* Deal rows */}
          {DEALS.map((deal) => {
            const stageColors = STAGE_COLORS[deal.stage] ?? STAGE_COLORS.SOURCING;
            const barStart = toPercent(parseDate(deal.start), minDate, maxDate);
            const barEnd   = toPercent(parseDate(deal.end),   minDate, maxDate);
            const barWidth = barEnd - barStart;

            // Stage bar colour (inline, theme-aware)
            const barBgMap: Record<Stage, string> = {
              SOURCING:     "#1a2d44",
              INITIAL_CALL: "#1a2d44",
              DILIGENCE:    "#2a1f00",
              TERM_SHEET:   "#1a1a00",
              CLOSED:       "#0d2b1e",
              PASSED:       "#232323",
            };
            const barAccentMap: Record<Stage, string> = {
              SOURCING:     "#3b7ef6",
              INITIAL_CALL: "#7c66dc",
              DILIGENCE:    "#e8a020",
              TERM_SHEET:   "#e87820",
              CLOSED:       "#2d9c6e",
              PASSED:       "#6b6b6b",
            };
            const barBg     = barBgMap[deal.stage]     ?? "#1a1a1a";
            const barAccent = barAccentMap[deal.stage]  ?? "#3b7ef6";

            return (
              <div
                key={deal.id}
                className="flex group transition-colors"
                style={{
                  borderBottom: "1px solid var(--s-border)",
                  background: "var(--s-surface)",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--s-raised)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--s-surface)")}
              >
                {/* Left label panel */}
                <div
                  className="flex-shrink-0 px-4 py-3 flex flex-col justify-center gap-1"
                  style={{ width: LEFT_W, borderRight: "1px solid var(--s-border)" }}
                >
                  <p
                    className="text-sm font-semibold truncate leading-tight"
                    style={{ color: "var(--s-text)" }}
                  >
                    {deal.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium", stageColors.bg, stageColors.text)}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", stageColors.dot)} />
                      {STAGE_LABELS[deal.stage]}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--s-text-dim)" }}>
                      {deal.sector}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--s-text-dim)" }}>
                    {deal.checkSize}
                  </p>
                </div>

                {/* Timeline lane */}
                <div className="flex-1 relative" style={{ height: 72 }}>
                  {/* Grid lines */}
                  {ticks.map((tick, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full w-px"
                      style={{ left: `${tick.pct}%`, background: "var(--s-border)" }}
                    />
                  ))}

                  {/* Today line */}
                  <div
                    className="absolute top-0 h-full w-0.5"
                    style={{ left: `${todayPct}%`, background: "#3b7ef6", opacity: 0.15, zIndex: 1 }}
                  />

                  {/* Deal duration bar */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-md"
                    style={{
                      left: `${barStart}%`,
                      width: `${Math.max(barWidth, 1)}%`,
                      height: 14,
                      background: barBg,
                      borderLeft: `3px solid ${barAccent}`,
                      zIndex: 2,
                    }}
                  />

                  {/* Interaction dots */}
                  {deal.interactions.map((ix, j) => {
                    const pct = toPercent(parseDate(ix.date), minDate, maxDate);
                    const color = OUTCOME_COLOR[ix.outcome] ?? "#8a8a8a";
                    const pocStyle = POC_COLORS[ix.poc];
                    return (
                      <button
                        key={j}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full ring-2 ring-offset-1 transition-transform hover:scale-150 focus:outline-none"
                        style={{
                          left: `${pct}%`,
                          width: 11,
                          height: 11,
                          background: color,
                          zIndex: 10,
                          outline: `2px solid var(--s-surface)`,
                          outlineOffset: "1px",
                        }}
                        onMouseEnter={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setTooltip({ x: rect.left + rect.width / 2, y: rect.top, ...ix });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Legend footer */}
          <div
            className="px-6 py-3 flex items-center gap-4 flex-wrap"
            style={{ borderTop: "1px solid var(--s-border)", background: "var(--s-surface)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest mr-2" style={{ color: "var(--s-text-dim)" }}>Outcomes</span>
            {Object.entries(OUTCOME_COLOR).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-[10px]" style={{ color: "var(--s-text-dim)" }}>{label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl p-3 shadow-2xl"
          style={{
            left: Math.min(tooltip.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 230),
            top: tooltip.y - 12,
            transform: "translate(-50%, -100%)",
            background: "var(--s-raised)",
            border: "1px solid var(--s-border-strong)",
            minWidth: 200,
          }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--s-text)" }}>{tooltip.label}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--s-text-muted)" }}>{tooltip.person}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--s-text-dim)" }}>
            {new Date(tooltip.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: OUTCOME_COLOR[tooltip.outcome] ?? "#8a8a8a" }}
            />
            <span className="text-[11px] font-medium" style={{ color: OUTCOME_COLOR[tooltip.outcome] ?? "var(--s-text-muted)" }}>
              {tooltip.outcome}
            </span>
          </div>
          {tooltip.poc && POC_COLORS[tooltip.poc] && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                style={{ background: POC_COLORS[tooltip.poc].bg, color: POC_COLORS[tooltip.poc].text }}
              >
                {tooltip.poc}
              </span>
              <span className="text-[10px]" style={{ color: "var(--s-text-dim)" }}>VGP POC</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
