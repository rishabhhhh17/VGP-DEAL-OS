"use client";

import { useState } from "react";
import { X, Sparkles, Loader2, AlertCircle } from "lucide-react";

interface Props {
  dealId: string;
  onClose: () => void;
  onSaved: () => void;
}

interface AISummary {
  summary: string;
  keyTakeaways: string;
  risks: string;
  nextSteps: string;
}

export default function MeetingModal({ dealId, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [summarising, setSummarising] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    duration: "",
    transcript: "",
  });
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSummarise() {
    if (!form.transcript.trim()) return;
    setSummarising(true);
    setAiError("");
    try {
      // We pass a placeholder id since summarise doesn't need a real meeting id yet
      const res = await fetch(`/api/meetings/new/summarise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: form.transcript }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("ANTHROPIC_API_KEY")) {
          setAiError("Add your ANTHROPIC_API_KEY to .env to enable AI summaries.");
        } else {
          setAiError(data.error ?? "AI summarisation failed.");
        }
        return;
      }
      setAiSummary(data);
    } catch {
      setAiError("Could not reach AI. Check your API key.");
    } finally {
      setSummarising(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.date) { setError("Date is required."); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(aiSummary ?? {}),
        }),
      });
      if (!res.ok) throw new Error();
      onSaved();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Log Meeting</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Meeting Title <span className="text-red-400">*</span></label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Intro call with CEO"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
            />
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Date <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Duration (minutes)</label>
              <input
                type="number"
                placeholder="e.g. 45"
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
              />
            </div>
          </div>

          {/* Transcript */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-600">Transcript / Notes</label>
              <button
                type="button"
                onClick={handleSummarise}
                disabled={summarising || !form.transcript.trim()}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-violet-700 bg-violet-50 rounded-lg hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {summarising ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {summarising ? "Summarising…" : "Summarise with AI"}
              </button>
            </div>
            <textarea
              rows={6}
              placeholder="Paste your meeting transcript or notes here, then click 'Summarise with AI'…"
              value={form.transcript}
              onChange={(e) => set("transcript", e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors resize-none font-mono"
            />
          </div>

          {/* AI error */}
          {aiError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {aiError}
            </div>
          )}

          {/* AI Results */}
          {aiSummary && (
            <div className="space-y-3 p-4 bg-violet-50 rounded-xl border border-violet-100">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs font-semibold text-violet-700">AI Summary</span>
              </div>

              <AISummarySection
                label="Summary"
                value={aiSummary.summary}
                onChange={(v) => setAiSummary((s) => s ? { ...s, summary: v } : s)}
              />
              <AISummaryListSection
                label="Key Takeaways"
                value={aiSummary.keyTakeaways}
                onChange={(v) => setAiSummary((s) => s ? { ...s, keyTakeaways: v } : s)}
              />
              <AISummaryListSection
                label="Risks"
                value={aiSummary.risks}
                onChange={(v) => setAiSummary((s) => s ? { ...s, risks: v } : s)}
              />
              <AISummaryListSection
                label="Next Steps"
                value={aiSummary.nextSteps}
                onChange={(v) => setAiSummary((s) => s ? { ...s, nextSteps: v } : s)}
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving…" : "Save Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AISummarySection({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs text-slate-700 bg-white rounded-lg border border-violet-200 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
      />
    </div>
  );
}

function AISummaryListSection({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  let items: string[] = [];
  try { items = JSON.parse(value); } catch { items = []; }

  function updateItem(i: number, v: string) {
    const next = [...items];
    next[i] = v;
    onChange(JSON.stringify(next));
  }

  return (
    <div>
      <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-violet-400 mt-1.5 text-xs">•</span>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              className="flex-1 text-xs text-slate-700 bg-white rounded border border-violet-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-400 italic">None identified</p>}
      </div>
    </div>
  );
}
