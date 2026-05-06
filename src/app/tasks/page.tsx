import { prisma } from "@/lib/db";
import Link from "next/link";
import { CheckSquare, Square, AlertCircle, Calendar, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  HIGH:   { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500"   },
  MEDIUM: { bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-400" },
  LOW:    { bg: "bg-slate-100", text: "text-slate-500",  dot: "bg-slate-400" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  TODO:        { bg: "bg-slate-100",   text: "text-slate-600"   },
  IN_PROGRESS: { bg: "bg-blue-50",     text: "text-blue-600"    },
  DONE:        { bg: "bg-emerald-50",  text: "text-emerald-700" },
  BACKLOG:     { bg: "bg-slate-50",    text: "text-slate-400"   },
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "To-do", IN_PROGRESS: "In Progress", DONE: "Done", BACKLOG: "Backlog",
};

function isOverdue(task: { dueDate: Date | null; status: string }) {
  if (!task.dueDate || task.status === "DONE") return false;
  return task.dueDate < new Date();
}

function formatDue(date: Date) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  if (d < today) return `Overdue · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  if (d.toDateString() === today.toDateString()) return "Due today";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function TasksPage() {
  // Auto-move overdue tasks to backlog
  await prisma.task.updateMany({
    where: { status: { in: ["TODO", "IN_PROGRESS"] }, dueDate: { lt: new Date() } },
    data: { status: "BACKLOG" },
  });

  const tasks = await prisma.task.findMany({
    include: { deal: { select: { id: true, companyName: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  const open = tasks.filter(t => t.status !== "DONE" && t.status !== "BACKLOG");
  const done = tasks.filter(t => t.status === "DONE");
  const backlog = tasks.filter(t => t.status === "BACKLOG");

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Tasks</h1>
        <p className="text-xs text-slate-500 mt-0.5">{tasks.length} across all deals</p>
      </div>

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
          <CheckSquare className="w-8 h-8 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No tasks yet</p>
          <p className="text-xs text-slate-400 mt-1">Open a deal and add tasks from the Tasks tab</p>
        </div>
      )}

      {[
        { label: "Active", items: open },
        { label: "Done", items: done },
        { label: "Backlog", items: backlog },
      ].map(({ label, items }) => items.length > 0 && (
        <div key={label} className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label} · {items.length}</p>
          <div className="space-y-2">
            {items.map(task => {
              const p = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.MEDIUM;
              const s = STATUS_STYLES[task.status] ?? STATUS_STYLES.TODO;
              const overdue = isOverdue(task);
              return (
                <div key={task.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
                  {task.status === "DONE"
                    ? <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    : <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  }
                  <span className={`flex-1 text-sm min-w-0 truncate ${task.status === "DONE" ? "line-through text-slate-400" : "text-slate-900"}`}>
                    {task.title}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${p.bg} ${p.text}`}>
                    {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                  </span>
                  {task.dueDate && (
                    <span className={`flex items-center gap-1 text-xs flex-shrink-0 ${overdue ? "text-red-500 font-medium" : "text-slate-400"}`}>
                      {overdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                      {formatDue(task.dueDate)}
                    </span>
                  )}
                  <Link
                    href={`/deals/${task.deal.id}`}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 transition-colors flex-shrink-0 border border-slate-200 rounded-lg px-2 py-1 hover:border-violet-300"
                  >
                    {task.deal.companyName}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
