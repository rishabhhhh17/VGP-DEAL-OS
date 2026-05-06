"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload, FileText, FileSpreadsheet, File, ImageIcon,
  Download, Trash2, FolderOpen, X, Loader2, ChevronDown, ChevronRight,
  Plus, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGES, STAGE_LABELS } from "@/lib/utils";

// ── Category / Subcategory config ─────────────────────────────────────────────

export const DOC_CATEGORIES: Record<string, {
  label: string;
  color: string;       // badge style
  border: string;      // section accent
  subcategories: string[];
}> = {
  LEGAL_ONBOARDING: {
    label: "Legal & Onboarding",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    border: "border-l-purple-400",
    subcategories: ["NDA", "Engagement Letter", "Commercial Agreement", "Other Legal"],
  },
  COLLATERAL: {
    label: "Collateral",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    border: "border-l-violet-400",
    subcategories: ["Pitch Deck", "Financial Model", "Key Highlights / Blurb", "Tearsheet", "Other Collateral"],
  },
  DUE_DILIGENCE: {
    label: "Due Diligence",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    border: "border-l-amber-400",
    subcategories: ["Cap Table", "Audited Financials", "Legal DD", "Technical DD", "Other DD"],
  },
  CORRESPONDENCE: {
    label: "Correspondence",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    border: "border-l-emerald-400",
    subcategories: ["Term Sheet", "LOI", "Email Thread", "Other Correspondence"],
  },
  MISC: {
    label: "Misc",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    border: "border-l-slate-300",
    subcategories: ["Other"],
  },
};

// Legacy category mapping (for docs uploaded before this update)
const LEGACY_MAP: Record<string, string> = {
  PITCH_DECK: "COLLATERAL",
  FINANCIALS: "DUE_DILIGENCE",
  LEGAL: "LEGAL_ONBOARDING",
  DD: "DUE_DILIGENCE",
  OTHER: "MISC",
};

function normaliseCategory(cat: string): string {
  return DOC_CATEGORIES[cat] ? cat : (LEGACY_MAP[cat] ?? "MISC");
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Doc {
  id: string;
  dealId: string | null;
  name: string;
  category: string;
  subcategory: string | null;
  size: number;
  mimeType: string;
  createdAt: string;
  deal: { id: string; companyName: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.includes("pdf"))
    return <FileText className={cn("text-red-500", className)} />;
  if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("csv"))
    return <FileSpreadsheet className={cn("text-emerald-500", className)} />;
  if (mimeType.includes("image"))
    return <ImageIcon className={cn("text-blue-500", className)} />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className={cn("text-blue-600", className)} />;
  return <File className={cn("text-slate-400", className)} />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DocumentsTab({ dealId }: { dealId: string }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [selectedCat, setSelectedCat] = useState("LEGAL_ONBOARDING");
  const [selectedSubcat, setSelectedSubcat] = useState("NDA");
  const [assignedDealId, setAssignedDealId] = useState<string>(dealId);
  const [allDeals, setAllDeals] = useState<{ id: string; companyName: string }[]>([]);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [newDealName, setNewDealName] = useState("");
  const [newDealStage, setNewDealStage] = useState("SOURCING");
  const [creatingDeal, setCreatingDeal] = useState(false);

  // UI state
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // ── Data loading ─────────────────────────────────────────────────────────

  const fetchDocs = useCallback(async () => {
    const res = await fetch(`/api/deals/${dealId}/documents`);
    const data = await res.json();
    setDocs(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    fetchDocs();
    // Load all deals for the assign dropdown
    fetch("/api/deals").then(r => r.json()).then(d => {
      setAllDeals(Array.isArray(d) ? d : []);
    });
  }, [fetchDocs]);

  // When category changes, reset subcategory to first option
  function pickCategory(cat: string) {
    setSelectedCat(cat);
    setSelectedSubcat(DOC_CATEGORIES[cat]?.subcategories[0] ?? "");
  }

  // ── Create new deal inline ────────────────────────────────────────────────

  async function handleCreateDeal() {
    if (!newDealName.trim()) return;
    setCreatingDeal(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: newDealName.trim(), stage: newDealStage }),
      });
      const deal = await res.json();
      setAllDeals(prev => [deal, ...prev]);
      setAssignedDealId(deal.id);
      setShowNewDeal(false);
      setNewDealName("");
    } finally {
      setCreatingDeal(false);
    }
  }

  // ── File upload ───────────────────────────────────────────────────────────

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", selectedCat);
      form.append("subcategory", selectedSubcat);

      // Upload to the assigned deal's endpoint
      const targetDealId = assignedDealId || dealId;
      const res = await fetch(`/api/deals/${targetDealId}/documents`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json();
        setUploadError(data.error ?? "Upload failed.");
        return;
      }
      fetchDocs();
    } catch {
      setUploadError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(uploadFile);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(doc: Doc) {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    fetchDocs();
  }

  // ── Toggle collapse ───────────────────────────────────────────────────────

  function toggleCollapse(cat: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  // ── Group docs by category ────────────────────────────────────────────────

  const grouped = Object.keys(DOC_CATEGORIES).reduce<Record<string, Doc[]>>((acc, cat) => {
    acc[cat] = docs.filter(d => normaliseCategory(d.category) === cat);
    return acc;
  }, {});

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Upload Panel ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Category + Subcategory selectors */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 space-y-3">
          {/* Row 1: Category */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DOC_CATEGORIES).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => pickCategory(key)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                    selectedCat === key
                      ? cfg.color
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Subcategory */}
          <div className="flex flex-wrap gap-2 items-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">Type</p>
            {DOC_CATEGORIES[selectedCat]?.subcategories.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubcat(sub)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md border transition-colors",
                  selectedSubcat === sub
                    ? "bg-[#3b7ef6] text-white border-[#3b7ef6]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                )}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Row 3: Assign to Deal */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assign to Deal</p>
            <div className="flex items-center gap-2">
              <select
                value={showNewDeal ? "__new__" : assignedDealId}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setShowNewDeal(true);
                  } else {
                    setAssignedDealId(e.target.value);
                    setShowNewDeal(false);
                  }
                }}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {allDeals.map(d => (
                  <option key={d.id} value={d.id}>{d.companyName}</option>
                ))}
                <option value="__new__">+ Create new deal…</option>
              </select>
            </div>

            {/* Inline new deal form */}
            {showNewDeal && (
              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> New deal
                </p>
                <input
                  autoFocus
                  placeholder="Company / deal name"
                  value={newDealName}
                  onChange={(e) => setNewDealName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateDeal()}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                />
                <select
                  value={newDealStage}
                  onChange={(e) => setNewDealStage(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  {STAGES.map(s => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateDeal}
                    disabled={!newDealName.trim() || creatingDeal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#3b7ef6] text-white rounded-lg hover:bg-[#2d6fe0] disabled:opacity-50 transition-colors"
                  >
                    {creatingDeal ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    Create deal
                  </button>
                  <button
                    onClick={() => { setShowNewDeal(false); setAssignedDealId(dealId); setNewDealName(""); }}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={cn(
            "m-5 rounded-xl border-2 border-dashed transition-colors cursor-pointer",
            dragOver
              ? "border-violet-400 bg-violet-50"
              : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-2" />
                <p className="text-sm text-slate-600">Uploading…</p>
              </>
            ) : (
              <>
                <Upload className={cn("w-8 h-8 mb-2 transition-colors", dragOver ? "text-violet-500" : "text-slate-300")} />
                <p className="text-sm font-medium text-slate-600">
                  Drop files here or <span className="text-violet-600">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX, PNG, JPG</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {uploadError && (
          <div className="mx-5 mb-5 flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
            <X className="w-3.5 h-3.5 flex-shrink-0" />
            {uploadError}
          </div>
        )}
      </div>

      {/* ── Document List grouped by category ────────────────────────────── */}
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
          <FolderOpen className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-500">No documents yet</p>
          <p className="text-xs text-slate-400 mt-1">Upload pitch decks, NDAs, financials, and more above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(DOC_CATEGORIES).map(([catKey, cfg]) => {
            const catDocs = grouped[catKey];
            if (catDocs.length === 0) return null;
            const isCollapsed = collapsed.has(catKey);

            return (
              <div key={catKey} className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-4", cfg.border)}>
                {/* Category header */}
                <button
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                  onClick={() => toggleCollapse(catKey)}
                >
                  {isCollapsed
                    ? <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  }
                  <span className="text-sm font-semibold text-slate-800">{cfg.label}</span>
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", cfg.color)}>
                    {catDocs.length}
                  </span>
                </button>

                {/* Doc rows */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-50 border-t border-slate-100">
                    {/* Column headers */}
                    <div className="hidden md:grid grid-cols-[1fr_140px_100px_80px_auto] gap-3 px-5 py-2 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      <span>File</span>
                      <span>Deal</span>
                      <span>Date</span>
                      <span>Size</span>
                      <span />
                    </div>
                    {catDocs.map((doc) => (
                      <DocRow
                        key={doc.id}
                        doc={doc}
                        catCfg={cfg}
                        onDelete={() => handleDelete(doc)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── DocRow ────────────────────────────────────────────────────────────────────

function DocRow({
  doc,
  catCfg,
  onDelete,
}: {
  doc: Doc;
  catCfg: { label: string; color: string; subcategories: string[] };
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_140px_100px_80px_auto] gap-2 md:gap-3 items-start md:items-center px-5 py-3 hover:bg-slate-50 transition-colors group">
      {/* File + subcategory */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
          <FileIcon mimeType={doc.mimeType} className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate leading-tight">{doc.name}</p>
          {doc.subcategory && (
            <span className={cn("inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border mt-0.5", catCfg.color)}>
              {doc.subcategory}
            </span>
          )}
        </div>
      </div>

      {/* Deal link */}
      <div className="pl-11 md:pl-0">
        {doc.deal ? (
          <Link
            href={`/deals/${doc.deal.id}`}
            className="text-xs text-violet-600 hover:text-violet-800 hover:underline truncate block max-w-[130px]"
          >
            {doc.deal.companyName}
          </Link>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </div>

      {/* Date */}
      <p className="pl-11 md:pl-0 text-xs text-slate-400 whitespace-nowrap">
        {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>

      {/* Size */}
      <p className="pl-11 md:pl-0 text-xs text-slate-400 whitespace-nowrap">{formatSize(doc.size)}</p>

      {/* Actions */}
      <div className="pl-11 md:pl-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`/api/documents/${doc.id}/file`}
          download={doc.name}
          className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
          title="Download"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
