"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, Activity, Clock, CheckSquare,
  Inbox, Briefcase, MessageSquare, Phone, Mail,
  Share2, Users, BarChart3, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  activeDeals: number;
  interactionsThisMonth: number;
  tasksDueThisWeek: number;
  backlogCount: number;
  mandatedCount: number;
}

interface RecentInteraction {
  id: string;
  personName: string;
  companyName: string | null;
  interactionType: string | null;
  date: string;
  outcome: string | null;
}

interface Deadline {
  id: string;
  personName: string;
  companyName: string | null;
  deadline: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return "just now";
}

function deadlineInfo(dl: string): { label: string; color: string } {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d   = new Date(dl); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0)  return { label: `Overdue ${Math.abs(diff)}d`, color: "text-red-600 bg-red-50 border-red-200" };
  if (diff === 0) return { label: "Due today",                  color: "text-amber-600 bg-amber-50 border-amber-200" };
  if (diff <= 7)  return { label: `${diff}d left`,             color: "text-amber-500 bg-amber-50 border-amber-100" };
  return             { label: `${diff}d left`,                  color: "text-slate-500 bg-slate-100 border-slate-200" };
}

function TypeIcon({ type }: { type: string | null }) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("phone") || t.includes("call")) return <Phone className="w-3.5 h-3.5" />;
  if (t.includes("email")) return <Mail className="w-3.5 h-3.5" />;
  if (t.includes("linkedin")) return <Share2 className="w-3.5 h-3.5" />;
  if (t.includes("meet") || t.includes("zoom") || t.includes("teams")) return <Users className="w-3.5 h-3.5" />;
  return <MessageSquare className="w-3.5 h-3.5" />;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3">
      <div className="skeleton h-8 w-8 rounded-xl" />
      <div className="skeleton h-8 w-16" />
      <div className="skeleton h-3 w-24" />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, href, color, bg,
}: {
  label: string; value: number; icon: React.ElementType;
  href: string; color: string; bg: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
          <Icon className={cn("w-4.5 h-4.5", color)} style={{ width: 18, height: 18 }} />
        </div>
        <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 group-hover:text-slate-700 transition-colors">
          {label}
          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-0.5 transition-all" />
        </p>
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInteractions, setRecentInteractions] = useState<RecentInteraction[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setRecentInteractions(d.recentInteractions);
        setUpcomingDeadlines(d.upcomingDeadlines);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-transparent">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-white flex-shrink-0">
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
          ) : stats ? (
            <>
              <StatCard label="Active Deals"         value={stats.activeDeals}           icon={Building2}    href="/deals"       color="text-[#3b7ef6]"   bg="bg-violet-50" />
              <StatCard label="Interactions This Month" value={stats.interactionsThisMonth} icon={Activity}     href="/interactions" color="text-emerald-600" bg="bg-emerald-50" />
              <StatCard label="Tasks Due This Week"  value={stats.tasksDueThisWeek}      icon={CheckSquare}  href="/tasks"       color="text-amber-600"  bg="bg-amber-50"  />
              <StatCard label="Open Backlog"         value={stats.backlogCount}           icon={Inbox}        href="/backlog"     color="text-red-500"    bg="bg-red-50"    />
              <StatCard label="Mandated"             value={stats.mandatedCount}          icon={Briefcase}    href="/mandates"    color="text-violet-600" bg="bg-violet-50" />
            </>
          ) : null}
        </div>

        {/* ── Two-column widgets ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Upcoming Deadlines */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-900">Upcoming Deadlines</p>
              </div>
              <Link href="/backlog" className="text-xs text-[#3b7ef6] hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-4 flex-1" />
                    <div className="skeleton h-5 w-16 rounded-full" />
                  </div>
                ))
              ) : upcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                  <CheckSquare className="w-7 h-7 text-emerald-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">All clear!</p>
                  <p className="text-xs text-slate-400 mt-0.5">No upcoming deadlines</p>
                </div>
              ) : (
                upcomingDeadlines.map((d) => {
                  const { label, color } = deadlineInfo(d.deadline);
                  return (
                    <Link key={d.id} href="/backlog" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{d.personName}</p>
                        {d.companyName && <p className="text-xs text-slate-400 truncate">{d.companyName}</p>}
                      </div>
                      <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0", color)}>
                        {label}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-900">Recent Activity</p>
              </div>
              <Link href="/interactions" className="text-xs text-[#3b7ef6] hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <div className="skeleton h-7 w-7 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="skeleton h-3 w-28" />
                      <div className="skeleton h-3 w-16" />
                    </div>
                  </div>
                ))
              ) : recentInteractions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                  <MessageSquare className="w-7 h-7 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">No interactions yet</p>
                </div>
              ) : (
                recentInteractions.map((ix) => (
                  <Link key={ix.id} href="/interactions" className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                      <TypeIcon type={ix.interactionType} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{ix.personName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{ix.companyName ?? "—"}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(ix.date)}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Quick nav to Pipeline ── */}
        <div className="flex items-center gap-3">
          <Link
            href="/deals"
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors"
            style={{ background: "#3b7ef6" }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = "#2d6fe0")}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = "#3b7ef6")}
          >
            <Building2 className="w-4 h-4" />
            View Full Pipeline
          </Link>
          <Link
            href="/interactions"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Activity className="w-4 h-4" />
            All Interactions
          </Link>
          <Link
            href="/gantt"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Timeline
          </Link>
        </div>
      </div>
    </div>
  );
}
