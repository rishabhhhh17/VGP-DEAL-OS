"use client";

import { useEffect, useState } from "react";
import { Briefcase, ExternalLink, Loader2, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import InteractionForm, { type Interaction } from "@/components/InteractionForm";

function parsePoc(v: string | null | undefined): string[] {
  if (!v) return [];
  try { return JSON.parse(v); } catch { return v ? [v] : []; }
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Collapsible mandate group ─────────────────────────────────────────────────

function MandateGroup({
  mandate,
  items,
  deals,
  onEdit,
}: {
  mandate: string;
  items: Interaction[];
  deals: { id: string; companyName: string }[];
  onEdit: (i: Interaction) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      {/* Group header */}
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">{mandate}</p>
            <p className="text-xs text-slate-500">{items.length} mandate{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Rows */}
      {open && (
        <div className="divide-y divide-slate-50">
          {items.map(item => {
            const poc = parsePoc(item.vgpPoc);
            return (
              <div key={item.id} className="group flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">{item.personName}</span>
                    {item.companyName && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500">{item.companyName}</span>
                        {item.companyUrl && (
                          <a
                            href={item.companyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-violet-600 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                    <span className="text-xs text-slate-400">{fmtDate(item.date)}</span>
                  </div>

                  {item.context && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.context}</p>
                  )}

                  {item.takeaways && (
                    <div className="mt-1.5 flex items-start gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5 flex-shrink-0">Takeaway:</span>
                      <p className="text-xs text-slate-700 leading-relaxed">{item.takeaways}</p>
                    </div>
                  )}

                  {item.nextSteps && (
                    <div className="mt-1 flex items-start gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5 flex-shrink-0">Next:</span>
                      <p className="text-xs text-slate-700 leading-relaxed">{item.nextSteps}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {item.origination && (
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {item.origination}
                      </span>
                    )}
                    {item.interactionType && (
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {item.interactionType}
                      </span>
                    )}
                    {poc.map(p => (
                      <span key={p} className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  {item.deadline && (
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                      {fmtDate(item.deadline)}
                    </span>
                  )}
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MandatesPage() {
  const [grouped, setGrouped] = useState<Record<string, Interaction[]>>({});
  const [deals, setDeals] = useState<{ id: string; companyName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Interaction | null>(null);
  const [mandateOptions, setMandateOptions] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    const [iRes, dRes, cRes] = await Promise.all([
      fetch("/api/interactions?outcome=Mandated"),
      fetch("/api/deals"),
      fetch("/api/config"),
    ]);
    const [iData, dData, cData] = await Promise.all([iRes.json(), dRes.json(), cRes.json()]);

    // Group by mandate
    const all: Interaction[] = Array.isArray(iData) ? iData : [];
    const groups: Record<string, Interaction[]> = {};

    // Sort by configured mandate order if available
    const configuredMandates: string[] = Array.isArray(cData.mandates) ? cData.mandates : [];
    setMandateOptions(configuredMandates);

    for (const item of all) {
      const key = item.mandate || "Uncategorised";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }

    // Sort within each group by date desc
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    setGrouped(groups);
    setDeals(Array.isArray(dData) ? dData : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleSaved() {
    setEditTarget(null);
    load();
  }

  // Sort group keys by configured mandate order
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const ai = mandateOptions.indexOf(a);
    const bi = mandateOptions.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const totalCount = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Live Mandates</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {loading ? "Loading…" : `${totalCount} interaction${totalCount !== 1 ? "s" : ""} across ${sortedKeys.length} mandate${sortedKeys.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : sortedKeys.length === 0 ? (
        <div className={cn(
          "flex flex-col items-center justify-center py-20 text-center",
          "border border-dashed border-slate-200 rounded-2xl bg-white"
        )}>
          <Briefcase className="w-8 h-8 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No live mandates yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Set an interaction's outcome to "Mandated" to see it here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedKeys.map(mandate => (
            <MandateGroup
              key={mandate}
              mandate={mandate}
              items={grouped[mandate]}
              deals={deals}
              onEdit={setEditTarget}
            />
          ))}
        </div>
      )}

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
