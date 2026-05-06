"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, DollarSign, User, Tag,
  FileText, Edit3, Save, X, Trash2,
} from "lucide-react";
import { STAGES, STAGE_LABELS, STAGE_COLORS, cn, type Stage } from "@/lib/utils";
import StageTag from "./StageTag";
import MeetingsTab from "./MeetingsTab";
import InteractionsTab from "./InteractionsTab";
import ContactsTab from "./ContactsTab";
import TasksTab from "./TasksTab";
import DocumentsTab from "./DocumentsTab";
import GanttChart from "./GanttChart";

interface Deal {
  id: string;
  companyName: string;
  stage: string;
  sector: string | null;
  checkSize: string | null;
  source: string | null;
  thesis: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { meetings: number; contacts: number; interactions: number; tasks: number; documents: number };
}

const SECTORS = [
  "Fintech", "SaaS", "Consumer", "Healthcare", "DeepTech", "Climate",
  "Web3", "AI/ML", "Marketplace", "Infrastructure", "Media", "Other",
];

function getTabs(counts?: Deal["_count"]) {
  return [
    { id: "overview",     label: "Overview",      count: 0 },
    { id: "meetings",     label: "Meetings",      count: counts?.meetings ?? 0 },
    { id: "contacts",     label: "Contacts",      count: counts?.contacts ?? 0 },
    { id: "interactions", label: "Interactions",  count: counts?.interactions ?? 0 },
    { id: "tasks",        label: "Tasks",         count: counts?.tasks ?? 0 },
    { id: "documents",    label: "Documents",     count: counts?.documents ?? 0 },
    { id: "timeline",     label: "Timeline",      count: 0 },
  ];
}

export default function DealDetail({ deal }: { deal: Deal }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: deal.companyName,
    stage: deal.stage,
    sector: deal.sector ?? "",
    checkSize: deal.checkSize ?? "",
    source: deal.source ?? "",
    thesis: deal.thesis ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/deals/${deal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      router.refresh();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${deal.companyName}"? This cannot be undone.`)) return;
    await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
    router.push("/deals");
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Back */}
      <Link href="/deals" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Pipeline
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="h-[2px] bg-gradient-to-r from-[#3b7ef6] via-[#2d9c6e] to-[#7c66dc]" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-slate-400" />
              </div>
              <div className="min-w-0">
                {editing ? (
                  <input
                    autoFocus
                    value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    className="text-xl font-bold text-slate-900 border-b-2 border-violet-400 bg-transparent outline-none w-full"
                  />
                ) : (
                  <h1 className="text-xl font-bold text-slate-900">{deal.companyName}</h1>
                )}
                <div className="mt-2">
                  {editing ? (
                    <select
                      value={form.stage}
                      onChange={(e) => set("stage", e.target.value)}
                      className="text-xs px-2 py-1 rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                      ))}
                    </select>
                  ) : (
                    <StageTag stage={deal.stage} />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {editing ? (
                <>
                  <button onClick={() => { setEditing(false); setForm({ companyName: deal.companyName, stage: deal.stage, sector: deal.sector ?? "", checkSize: deal.checkSize ?? "", source: deal.source ?? "", thesis: deal.thesis ?? "" }); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-60 transition-colors">
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Meta pills */}
          {!editing && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
              {deal.sector && <MetaPill icon={<Tag className="w-3 h-3" />} label={deal.sector} />}
              {deal.checkSize && <MetaPill icon={<DollarSign className="w-3 h-3" />} label={deal.checkSize} />}
              {deal.source && <MetaPill icon={<User className="w-3 h-3" />} label={deal.source} />}
            </div>
          )}

          {editing && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-50">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Sector</label>
                <select value={form.sector} onChange={(e) => set("sector", e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="">—</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Check Size</label>
                <input type="text" value={form.checkSize} onChange={(e) => set("checkSize", e.target.value)} placeholder="e.g. $500K" className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Source</label>
                <input type="text" value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="e.g. Intro via John" className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-slate-100 px-6">
          {getTabs(deal._count).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center",
                activeTab === tab.id
                  ? "border-violet-500 text-violet-600"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Thesis / Notes</h3>
          </div>
          {editing ? (
            <textarea
              rows={8}
              value={form.thesis}
              onChange={(e) => set("thesis", e.target.value)}
              placeholder="Why are you excited about this deal? What's the investment thesis?"
              className="w-full text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 resize-none transition-colors"
            />
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {deal.thesis || <span className="text-slate-400 italic">No thesis added yet. Click Edit to add notes.</span>}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-50">
            Created {new Date(deal.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      )}

      {activeTab === "meetings"      && <MeetingsTab dealId={deal.id} />}
      {activeTab === "interactions"  && <InteractionsTab dealId={deal.id} />}
      {activeTab === "contacts"      && <ContactsTab dealId={deal.id} />}
      {activeTab === "tasks"         && <TasksTab dealId={deal.id} />}
      {activeTab === "documents"     && <DocumentsTab dealId={deal.id} />}
      {activeTab === "timeline"      && <GanttChart />}
    </div>
  );
}

function MetaPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <span className="text-slate-400">{icon}</span>
      {label}
    </span>
  );
}
