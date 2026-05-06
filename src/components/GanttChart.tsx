"use client";

import { cn } from "@/lib/utils";

// ── Static data ───────────────────────────────────────────────────────────────

const TOTAL_DAYS = 30;
const TODAY_DAY  = 15; // Day 1 = 15 days ago, so today = Day 15

const TASKS = [
  { name: "Initial Outreach",        owner: "Partner",   start: 1,  end: 3,  status: "Done"        },
  { name: "NDA Signed",              owner: "Legal",     start: 3,  end: 5,  status: "Done"        },
  { name: "Management Presentation", owner: "Associate", start: 6,  end: 8,  status: "Done"        },
  { name: "Due Diligence Kickoff",   owner: "DD Team",   start: 9,  end: 20, status: "In Progress" },
  { name: "Financial Model Review",  owner: "Analyst",   start: 10, end: 15, status: "In Progress" },
  { name: "Legal DD",                owner: "Legal",     start: 12, end: 22, status: "Not Started" },
  { name: "IC Memo Draft",           owner: "Associate", start: 20, end: 25, status: "Not Started" },
  { name: "Investment Committee",    owner: "Partner",   start: 26, end: 27, status: "Not Started" },
  { name: "Term Sheet Issued",       owner: "Partner",   start: 28, end: 30, status: "Not Started" },
] as const;

type Status = "Done" | "In Progress" | "Not Started";

const STATUS: Record<Status, { bar: string; badge: string }> = {
  "Done":        { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "In Progress": { bar: "bg-violet-500",  badge: "bg-violet-50  text-violet-700  border-violet-200"  },
  "Not Started": { bar: "bg-slate-200",   badge: "bg-slate-50   text-slate-500   border-slate-200"   },
};

// Tick marks every 5 days
const TICK_DAYS = [1, 5, 10, 15, 20, 25, 30];

// Converts a day number to a real calendar date label (Day 1 = TODAY_DAY days ago)
function dayLabel(day: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (TODAY_DAY - day));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pct(day: number) {
  return ((day - 1) / (TOTAL_DAYS - 1)) * 100;
}

// ── Column widths ─────────────────────────────────────────────────────────────

const COL_TASK   = 195;
const COL_OWNER  = 100;
const COL_START  = 72;
const COL_END    = 72;
const COL_STATUS = 106;
const LEFT_TOTAL = COL_TASK + COL_OWNER + COL_START + COL_END + COL_STATUS;

// ── Component ─────────────────────────────────────────────────────────────────

export default function GanttChart() {
  const todayPct = pct(TODAY_DAY);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div>
          <p className="text-sm font-semibold text-slate-900">Series B — Acme Corp</p>
          <p className="text-xs text-slate-400 mt-0.5">30-day deal timeline · dummy data</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4">
          {(Object.entries(STATUS) as [Status, { bar: string; badge: string }][]).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={cn("w-3 h-2 rounded-sm", c.bar)} />
              <span className="text-xs text-slate-500">{s}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-4 rounded-full" style={{ background: "#3b7ef6" }} />
            <span className="text-xs text-slate-500">Today</span>
          </div>
        </div>
      </div>

      {/* Scrollable chart body */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: LEFT_TOTAL + 500 }}>

          {/* ── Column header row ── */}
          <div className="flex bg-slate-50 border-b border-slate-100">
            {/* Left cols */}
            <div className="flex flex-shrink-0" style={{ width: LEFT_TOTAL }}>
              {[
                { label: "Task",       width: COL_TASK   },
                { label: "Owner",      width: COL_OWNER  },
                { label: "Start",      width: COL_START  },
                { label: "End",        width: COL_END    },
                { label: "Status",     width: COL_STATUS },
              ].map(({ label, width }) => (
                <div
                  key={label}
                  className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0"
                  style={{ width }}
                >
                  {label}
                </div>
              ))}
            </div>
            {/* Timeline header */}
            <div className="flex-1 relative border-l border-slate-100" style={{ height: 36 }}>
              {TICK_DAYS.map(day => (
                <div
                  key={day}
                  className="absolute top-0 h-full flex items-center"
                  style={{ left: `${pct(day)}%` }}
                >
                  <div className="w-px h-full bg-slate-100" />
                  <span className="text-[10px] text-slate-400 ml-1 mt-1 whitespace-nowrap select-none">
                    {dayLabel(day)}
                  </span>
                </div>
              ))}
              {/* Today marker in header */}
              <div
                className="absolute top-0 h-full w-0.5 rounded-full opacity-70"
                style={{ left: `${todayPct}%`, background: "#3b7ef6" }}
              />
            </div>
          </div>

          {/* ── Task rows ── */}
          {TASKS.map((task, i) => {
            const s = STATUS[task.status as Status];
            const barLeft  = pct(task.start);
            const barWidth = pct(task.end) - pct(task.start);

            return (
              <div
                key={i}
                className="flex border-b border-slate-50 hover:bg-slate-50/60 transition-colors group"
              >
                {/* Left cols */}
                <div className="flex items-center flex-shrink-0" style={{ width: LEFT_TOTAL }}>
                  <div
                    className="px-4 py-3.5 text-sm text-slate-800 font-medium truncate flex-shrink-0"
                    style={{ width: COL_TASK }}
                  >
                    {task.name}
                  </div>
                  <div
                    className="px-3 py-3.5 text-xs text-slate-500 flex-shrink-0"
                    style={{ width: COL_OWNER }}
                  >
                    {task.owner}
                  </div>
                  <div
                    className="px-3 py-3.5 text-xs text-slate-400 whitespace-nowrap flex-shrink-0"
                    style={{ width: COL_START }}
                  >
                    {dayLabel(task.start)}
                  </div>
                  <div
                    className="px-3 py-3.5 text-xs text-slate-400 whitespace-nowrap flex-shrink-0"
                    style={{ width: COL_END }}
                  >
                    {dayLabel(task.end)}
                  </div>
                  <div
                    className="px-3 py-3.5 flex-shrink-0"
                    style={{ width: COL_STATUS }}
                  >
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", s.badge)}>
                      {task.status}
                    </span>
                  </div>
                </div>

                {/* Bar track */}
                <div className="flex-1 relative border-l border-slate-100 py-3 px-2">
                  {/* Grid lines */}
                  {TICK_DAYS.map(day => (
                    <div
                      key={day}
                      className="absolute top-0 h-full w-px bg-slate-100"
                      style={{ left: `${pct(day)}%` }}
                    />
                  ))}
                  {/* Today line */}
                  <div
                    className="absolute top-0 h-full w-0.5 z-10 rounded-full opacity-60"
                    style={{ left: `${todayPct}%`, background: "#3b7ef6" }}
                  />
                  {/* Task bar */}
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 h-5 rounded-md shadow-sm",
                      "flex items-center justify-end pr-1.5",
                      s.bar
                    )}
                    style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                  >
                    {/* Show duration if bar is wide enough */}
                    {(task.end - task.start) >= 4 && (
                      <span className="text-[9px] font-semibold text-white/80 whitespace-nowrap">
                        {task.end - task.start}d
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
