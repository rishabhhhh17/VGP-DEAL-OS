"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Activity, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import InteractionForm, { type Interaction, OUTCOME_STYLES } from "@/components/InteractionForm";

function parsePoc(v: string | null | undefined): string[] {
  if (!v) return [];
  try { return JSON.parse(v); } catch { return v ? [v] : []; }
}

const OUTCOME_DOT: Record<string, string> = {
  "To Follow-up": "bg-amber-400",
  "In Progress":  "bg-blue-400",
  "Mandated":     "bg-violet-500",
  "Handed Over":  "bg-slate-400",
  "Invested":     "bg-emerald-500",
  "Pass":         "bg-red-400",
};

export default function InteractionsTab({ dealId }: { dealId: string }) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [deal, setDeal] = useState<{ id: string; companyName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Interaction | null>(null);

  const fetchInteractions = useCallback(async () => {
    const [iRes, dRes] = await Promise.all([
      fetch(`/api/deals/${dealId}/interactions`),
      fetch(`/api/deals/${dealId}`),
    ]);
    setInteractions(await iRes.json());
    const d = await dRes.json();
    setDeal({ id: d.id, companyName: d.companyName });
    setLoading(false);
  }, [dealId]);

  useEffect(() => { fetchInteractions(); }, [fetchInteractions]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this interaction?")) return;
    await fetch(`/api/interactions/${id}`, { method: "DELETE" });
    setInteractions(prev => prev.filter(i => i.id !== id));
  }

  function handleSaved(saved: Interaction) {
    setInteractions(prev => {
      const idx = prev.findIndex(i => i.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditTarget(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {interactions.length} interaction{interactions.length !== 1 ? "s" : ""}
        </h3>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-violet-700 hover:to-indigo-700 shadow-sm shadow-violet-500/20 transition-all"
        >
          <Plus className="w-3 h-3" />
          Log Interaction
        </button>
      </div>

      {/* Empty state */}
      {interactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">No interactions yet</p>
          <p className="text-xs text-slate-400 mt-1">Log every meeting, call, and email to build your deal history</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-violet-700 hover:to-indigo-700 shadow-sm shadow-violet-500/20 transition-all"
          >
            Log first interaction
          </button>
        </div>
      ) : (
        /* Timeline list */
        <div className="relative">
          <div className="absolute left-[19px] top-5 bottom-5 w-px bg-slate-200" />
          <div className="space-y-2">
            {interactions.map(interaction => {
              const poc = parsePoc(interaction.vgpPoc);
              const outStyle = interaction.outcome ? OUTCOME_STYLES[interaction.outcome] : null;
              const dot = interaction.outcome ? (OUTCOME_DOT[interaction.outcome] ?? "bg-slate-400") : null;
              return (
                <div key={interaction.id} className="flex items-start gap-3 group">
                  {/* Dot */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm bg-violet-100 text-violet-600">
                    <span className="text-xs font-bold">{interaction.interactionType?.slice(0, 2).toUpperCase() || "—"}</span>
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        {/* Name + Company */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900">{interaction.personName}</span>
                          {interaction.companyName && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500">{interaction.companyName}</span>
                              {interaction.companyUrl && (
                                <a href={interaction.companyUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-violet-600 transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(interaction.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {interaction.interactionType && (
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {interaction.interactionType}
                            </span>
                          )}
                          {interaction.origination && (
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {interaction.origination}
                            </span>
                          )}
                          {interaction.mandate && (
                            <span className="text-[11px] text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                              {interaction.mandate}
                            </span>
                          )}
                          {interaction.outcome && outStyle && (
                            <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border", outStyle)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
                              {interaction.outcome}
                            </span>
                          )}
                          {poc.map(p => (
                            <span key={p} className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => { setEditTarget(interaction); setShowForm(true); }}
                          className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(interaction.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Details */}
                    {interaction.context && (
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{interaction.context}</p>
                    )}
                    {interaction.takeaways && (
                      <div className="mt-1.5 flex items-start gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5 flex-shrink-0">Takeaway:</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{interaction.takeaways}</p>
                      </div>
                    )}
                    {interaction.nextSteps && (
                      <div className="mt-1 flex items-start gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5 flex-shrink-0">Next:</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{interaction.nextSteps}</p>
                      </div>
                    )}
                    {interaction.deadline && (
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Deadline: {new Date(interaction.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <InteractionForm
          interaction={editTarget ? { ...editTarget, deal: deal ?? undefined } : null}
          deals={deal ? [deal] : []}
          defaultDealId={editTarget ? undefined : dealId}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
