"use client";

import { useEffect, useState, useRef } from "react";
import {
  Activity, Plus, Upload, Search, Filter, ExternalLink,
  X, ChevronDown, Loader2, Pencil, Trash2, FileUp, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import InteractionForm, { type Interaction, OUTCOME_STYLES } from "@/components/InteractionForm";

// ── POC Avatar ────────────────────────────────────────────────────────────────

const POC_COLORS: Record<string, { bg: string; text: string }> = {
  "KJ": { bg: "#1a3060", text: "#3b7ef6" },
  "MC": { bg: "#0d2b1e", text: "#2d9c6e" },
  "TS": { bg: "#2a1f00", text: "#e8a020" },
  "VJ": { bg: "#2b0d0d", text: "#e54d2e" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PocAvatar({ name }: { name: string }) {
  const initials = getInitials(name);
  const colors = POC_COLORS[initials] ?? { bg: "#f1f5f9", text: "#475569" };
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold flex-shrink-0 ring-1 ring-white"
      style={{ background: colors.bg, color: colors.text }}
      title={name}
    >
      {initials}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePoc(v: string | null | undefined): string[] {
  if (!v) return [];
  try { return JSON.parse(v); } catch { return v ? [v] : []; }
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

const OUTCOME_DOT: Record<string, string> = {
  "To Follow-up":        "bg-amber-500",
  "Follow-up scheduled": "bg-yellow-500",
  "In progress":         "bg-[#3b7ef6]",
  "Mandated":            "bg-emerald-500",
  "Handed over":         "bg-slate-500",
  "Investing Partners":  "bg-teal-500",
  "KIT":                 "bg-purple-500",
  "Pass":                "bg-red-500",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImportBatch {
  id: string;
  filename: string;
  rowCount: number;
  errorCount: number;
  importedAt: string;
  _count: { interactions: number };
}

// ── Import modal ──────────────────────────────────────────────────────────────

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; silentlySkipped?: number; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/interactions/import", { method: "POST", body: fd });
    const data = await res.json();
    setResult(data);
    setLoading(false);
    if (data.imported > 0) setTimeout(onDone, 2000);
  }

  const isExcel = file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Import Interactions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Excel (.xlsx) or CSV — up to 1,000 rows</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format hint */}
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Excel column order (A→T):</p>
          <p className="font-mono text-[11px] text-slate-500 leading-relaxed">
            A: ignore · B: Date · C: Name · D: Company · E: Context · F: Mandate ·
            G: Type · H: Origination · I: Referral · J: POC · K: Outcome ·
            L: Takeaways · M: Next Steps · N: Deadline · O: Complete?
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
        />

        {file ? (
          <div className="flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold",
              isExcel ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700")}>
              {isExcel ? "XLS" : "CSV"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
              <button onClick={() => inputRef.current?.click()}
                className="text-xs text-violet-600 hover:text-violet-800 transition-colors mt-0.5">
                {(file.size / 1024).toFixed(1)} KB · choose different file
              </button>
            </div>
            <button
              onClick={() => { setFile(null); setResult(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-8 border-2 border-dashed border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50/50 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 text-slate-400" />
            <span className="text-sm text-slate-500">Click to choose an Excel or CSV file</span>
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
            <Loader2 className="w-4 h-4 text-violet-600 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-violet-800">Importing…</p>
              <p className="text-xs text-violet-600">Parsing rows, normalising values, writing to database</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className={cn("mt-4 rounded-xl border text-sm overflow-hidden",
            result.imported > 0 ? "border-emerald-200" : "border-red-200")}>
            <div className={cn("px-4 py-3", result.imported > 0 ? "bg-emerald-50" : "bg-red-50")}>
              <p className={cn("font-semibold", result.imported > 0 ? "text-emerald-800" : "text-red-700")}>
                {result.imported > 0
                  ? `✓ ${result.imported} row${result.imported !== 1 ? "s" : ""} imported`
                  : "No rows imported"}
                {result.skipped > 0 && ` · ${result.skipped} skipped`}
                {result.silentlySkipped ? ` · ${result.silentlySkipped} blank rows ignored` : ""}
              </p>
              {result.imported > 0 && (
                <p className="text-xs text-emerald-700 mt-0.5">Redirecting to Backlog to verify your data…</p>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="px-4 py-3 bg-white border-t border-slate-100 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-slate-500 mb-1">Skipped rows:</p>
                <ul className="space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs text-slate-500 font-mono">{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Uploads tab ───────────────────────────────────────────────────────────────

function UploadsTab({ onDeleted }: { onDeleted: () => void }) {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function loadBatches() {
    setLoading(true);
    const res = await fetch("/api/import-batches");
    setBatches(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadBatches(); }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/import-batches/${id}`, { method: "DELETE" });
    setBatches(prev => prev.filter(b => b.id !== id));
    setDeletingId(null);
    setConfirmId(null);
    onDeleted();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileUp className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No uploads yet</p>
        <p className="text-xs text-slate-400 mt-1">Use the Import CSV button to upload your Google Sheet export</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-3">
      <p className="text-xs text-slate-400 mb-4">
        Deleting an upload removes all interactions that were imported with it.
      </p>
      {batches.map(batch => (
        <div
          key={batch.id}
          className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-slate-300 transition-colors"
        >
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
            <FileUp className="w-5 h-5 text-violet-500" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{batch.filename}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500">{fmtDateTime(batch.importedAt)}</span>
              <span className="text-xs text-emerald-600 font-medium">
                {batch._count.interactions} row{batch._count.interactions !== 1 ? "s" : ""}
              </span>
              {batch.errorCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="w-3 h-3" />
                  {batch.errorCount} skipped
                </span>
              )}
            </div>
          </div>

          {/* Delete action */}
          {confirmId === batch.id ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-500">Delete {batch._count.interactions} rows?</span>
              <button
                onClick={() => handleDelete(batch.id)}
                disabled={deletingId === batch.id}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60"
              >
                {deletingId === batch.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Confirm
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmId(batch.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────

function InteractionRow({
  interaction,
  selected,
  onToggle,
  onEdit,
  onDelete,
}: {
  interaction: Interaction;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const poc = parsePoc(interaction.vgpPoc);
  const outStyle = interaction.outcome ? OUTCOME_STYLES[interaction.outcome] : null;
  const dot = interaction.outcome ? (OUTCOME_DOT[interaction.outcome] ?? "bg-slate-400") : null;

  return (
    <tr className={cn("group transition-colors", selected ? "bg-violet-50" : "hover:bg-slate-50")}>
      <td className="pl-4 pr-2 py-3 w-8">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-3.5 h-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500/30 cursor-pointer"
        />
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap w-28">
        {fmtDate(interaction.date)}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-slate-900 leading-tight">{interaction.personName}</p>
        {interaction.companyName && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-slate-500">{interaction.companyName}</span>
            {interaction.companyUrl && (
              <a href={interaction.companyUrl} target="_blank" rel="noopener noreferrer"
                className="text-slate-400 hover:text-violet-600 transition-colors">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        {interaction.interactionType ? (
          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            {interaction.interactionType}
          </span>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {interaction.mandate ? (
          <span className="text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
            {interaction.mandate}
          </span>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3">
        {interaction.outcome && outStyle ? (
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border", outStyle)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
            {interaction.outcome}
          </span>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {poc.length > 0 ? (
          <div className="flex items-center gap-0.5 flex-wrap">
            {poc.map(p => <PocAvatar key={p} name={p} />)}
          </div>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3 hidden xl:table-cell">
        {interaction.deadline ? (
          <span className="text-xs text-slate-600">{fmtDate(interaction.deadline)}</span>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "all" | "uploads";
type SortKey = "date" | "personName" | "outcome";

export default function InteractionsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [deals, setDeals] = useState<{ id: string; companyName: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Interaction | null>(null);
  const [showImport, setShowImport] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("");
  const [filterMandate, setFilterMandate] = useState("");
  const [mandateOptions, setMandateOptions] = useState<string[]>([]);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  async function load() {
    setLoading(true);
    setSelected(new Set());
    const params = new URLSearchParams();
    if (filterOutcome) params.set("outcome", filterOutcome);
    if (filterMandate) params.set("mandate", filterMandate);
    const [iRes, dRes, cRes] = await Promise.all([
      fetch(`/api/interactions?${params}`),
      fetch("/api/deals"),
      fetch("/api/config"),
    ]);
    const [iData, dData, cData] = await Promise.all([iRes.json(), dRes.json(), cRes.json()]);
    setInteractions(Array.isArray(iData) ? iData : []);
    setDeals(Array.isArray(dData) ? dData : []);
    if (Array.isArray(cData.mandates)) setMandateOptions(cData.mandates);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterOutcome, filterMandate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open form when ?new=1
  useEffect(() => {
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    if (searchParams?.get("new") === "1") {
      setEditTarget(null);
      setShowForm(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = interactions.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.personName.toLowerCase().includes(q) ||
      (i.companyName ?? "").toLowerCase().includes(q) ||
      (i.context ?? "").toLowerCase().includes(q) ||
      (i.mandate ?? "").toLowerCase().includes(q)
    );
  });

  const sorted = [...displayed].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    if (sortKey === "date") { av = new Date(a.date).getTime(); bv = new Date(b.date).getTime(); }
    else if (sortKey === "personName") { av = a.personName.toLowerCase(); bv = b.personName.toLowerCase(); }
    else if (sortKey === "outcome") { av = a.outcome ?? ""; bv = b.outcome ?? ""; }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const allDisplayedSelected = displayed.length > 0 && displayed.every(i => selected.has(i.id));
  const someSelected = selected.size > 0;

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allDisplayedSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        displayed.forEach(i => next.delete(i.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        displayed.forEach(i => next.add(i.id));
        return next;
      });
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Permanently delete ${selected.size} interaction${selected.size !== 1 ? "s" : ""}?`)) return;
    setBulkDeleting(true);
    await Promise.all([...selected].map(id => fetch(`/api/interactions/${id}`, { method: "DELETE" })));
    setInteractions(prev => prev.filter(i => !selected.has(i.id)));
    setSelected(new Set());
    setBulkDeleting(false);
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this interaction?")) return;
    await fetch(`/api/interactions/${id}`, { method: "DELETE" });
    setInteractions(prev => prev.filter(i => i.id !== id));
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
  }

  const OUTCOMES = ["To Follow-up", "In Progress", "Mandated", "Handed Over", "Invested", "Pass"];

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Interactions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? "Loading…" : `${displayed.length} interaction${displayed.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            onClick={() => { setEditTarget(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 shadow-sm shadow-violet-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Interaction
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 px-6 pt-3 pb-0 border-b border-slate-100 bg-white flex-shrink-0">
        {(["all", "uploads"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === t
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {t === "all" ? "All Interactions" : "Uploads"}
          </button>
        ))}
      </div>

      {/* ── All Interactions ── */}
      {tab === "all" && (
        <>
          {/* Filter bar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-white flex-shrink-0 flex-wrap">
            <div className="relative flex-1 min-w-48 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, company, context…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterOutcome}
                onChange={e => setFilterOutcome(e.target.value)}
                className="appearance-none pl-8 pr-7 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
              >
                <option value="">All outcomes</option>
                {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {mandateOptions.length > 0 && (
              <div className="relative">
                <select
                  value={filterMandate}
                  onChange={e => setFilterMandate(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
                >
                  <option value="">All mandates</option>
                  {mandateOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            )}

            {(filterOutcome || filterMandate) && (
              <button
                onClick={() => { setFilterOutcome(""); setFilterMandate(""); }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>

          {/* Bulk action bar */}
          {someSelected && (
            <div className="flex items-center gap-3 px-6 py-2.5 bg-violet-50 border-b border-violet-200 flex-shrink-0">
              <span className="text-xs font-semibold text-violet-700">
                {selected.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60"
              >
                {bulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {bulkDeleting ? "Deleting…" : "Delete selected"}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-violet-600 hover:text-violet-800 transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Activity className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">No interactions found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {interactions.length === 0
                    ? 'Click \u201cLog Interaction\u201d to add your first, or import from CSV'
                    : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pl-4 pr-2 py-2.5 w-8">
                      <input
                        type="checkbox"
                        checked={allDisplayedSelected}
                        onChange={toggleAll}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500/30 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700 w-28"
                        onClick={() => toggleSort("date")}>
                      Date {sortKey === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700"
                        onClick={() => toggleSort("personName")}>
                      Name / Company {sortKey === "personName" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Mandate</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700"
                        onClick={() => toggleSort("outcome")}>
                      Outcome {sortKey === "outcome" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">POC</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Deadline</th>
                    <th className="px-4 py-2.5 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sorted.map(i => (
                    <InteractionRow
                      key={i.id}
                      interaction={i}
                      selected={selected.has(i.id)}
                      onToggle={() => toggleOne(i.id)}
                      onEdit={() => { setEditTarget(i); setShowForm(true); }}
                      onDelete={() => handleDelete(i.id)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Uploads tab ── */}
      {tab === "uploads" && (
        <div className="flex-1 overflow-auto">
          <UploadsTab onDeleted={load} />
        </div>
      )}

      {/* ── Modals ── */}
      {showForm && (
        <InteractionForm
          interaction={editTarget}
          deals={deals}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); window.location.href = "/backlog"; }}
        />
      )}
    </div>
  );
}
