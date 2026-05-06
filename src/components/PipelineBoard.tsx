"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Building2, Tag, DollarSign, CheckSquare, MessageSquare, Clock, Sparkles } from "lucide-react";
import {
  STAGES, STAGE_LABELS, STAGE_COLORS, cn, type Stage,
} from "@/lib/utils";
import NewDealModal from "./NewDealModal";

interface DealWithCounts {
  id: string;
  companyName: string;
  stage: string;
  sector: string | null;
  checkSize: string | null;
  source: string | null;
  thesis: string | null;
  createdAt: string;
  _count: { tasks: number; interactions: number };
  interactions: { date: string }[];
  screeningResults: { overallScore: number; fitLevel: string }[];
}

interface Props { deals: DealWithCounts[] }

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return fmtDate(dateStr);
}

export default function PipelineBoard({ deals }: Props) {
  const [showModal, setShowModal] = useState(false);

  const grouped = STAGES.reduce<Record<Stage, DealWithCounts[]>>((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage);
    return acc;
  }, {} as Record<Stage, DealWithCounts[]>);

  const activeStages = STAGES.filter((s) => grouped[s].length > 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">{deals.length} deal{deals.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-white text-sm font-medium rounded-lg transition-colors"
          style={{ background: "#3b7ef6" }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Deal
        </button>
      </div>

      {/* Grid */}
      <div className="p-6 space-y-8">
        {deals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <Building2 className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-500">No deals yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Add your first deal to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors"
              style={{ background: "#3b7ef6" }}
            >
              <Plus className="w-4 h-4" />
              New Deal
            </button>
          </div>
        )}

        {activeStages.map((stage) => {
          const stageDeals = grouped[stage];
          const colors = STAGE_COLORS[stage];
          return (
            <div key={stage}>
              {/* Stage header */}
              <div className="flex items-center gap-2.5 mb-4">
                <span className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                <h2 className="text-sm font-semibold text-slate-700">{STAGE_LABELS[stage]}</h2>
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md", colors.bg, colors.text)}>
                  {stageDeals.length}
                </span>
              </div>
              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stageDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} stage={stage} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && <NewDealModal onClose={() => setShowModal(false)} />}
    </>
  );
}

const FIT_SCORE_COLORS: Record<string, string> = {
  strong:    "#2d9c6e",
  potential: "#e8a020",
  weak:      "#e87820",
  poor:      "#e54d2e",
};

function DealCard({ deal, stage }: { deal: DealWithCounts; stage: Stage }) {
  const colors = STAGE_COLORS[stage];
  const lastActivity = deal.interactions[0]?.date;
  const latestScreening = deal.screeningResults?.[0] ?? null;
  const screenColor = latestScreening ? (FIT_SCORE_COLORS[latestScreening.fitLevel] ?? "#8a8a8a") : null;

  return (
    <Link href={`/deals/${deal.id}`}>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 hover:border-slate-300 transition-all duration-200 cursor-pointer group flex flex-col gap-3 h-full">
        {/* Top row: sector + stage */}
        <div className="flex items-center gap-2 flex-wrap">
          {deal.sector && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
              <Tag className="w-2.5 h-2.5" />
              {deal.sector}
            </span>
          )}
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
            {STAGE_LABELS[stage]}
          </span>
          {latestScreening && screenColor && (
            <span
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
              style={{
                background: `${screenColor}18`,
                color: screenColor,
                border: `1px solid ${screenColor}30`,
              }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {latestScreening.overallScore}
            </span>
          )}
        </div>

        {/* Company name */}
        <div className="flex items-start gap-2.5">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors", colors.bg)}>
            <Building2 className={cn("w-4 h-4", colors.text)} />
          </div>
          <p className="text-sm font-bold text-slate-900 leading-tight group-hover:text-[#3b7ef6] transition-colors">
            {deal.companyName}
          </p>
        </div>

        {/* Meta */}
        {deal.checkSize && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <DollarSign className="w-3 h-3 text-slate-400" />
            {deal.checkSize}
          </div>
        )}

        {/* Footer: badges + last activity */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-50">
          {deal._count.tasks > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
              <CheckSquare className="w-2.5 h-2.5" />
              {deal._count.tasks}
            </span>
          )}
          {deal._count.interactions > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[#3b7ef6] bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-full">
              <MessageSquare className="w-2.5 h-2.5" />
              {deal._count.interactions}
            </span>
          )}
          {lastActivity && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="w-2.5 h-2.5" />
              {timeAgo(lastActivity)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
