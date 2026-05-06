"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, CheckSquare, Square, Trash2, Edit3,
  Check, X, Flag, Calendar, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  dealId: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

const PRIORITIES = [
  { value: "HIGH",   label: "High",   color: "text-red-600",    bg: "bg-red-50",    dot: "bg-red-500"   },
  { value: "MEDIUM", label: "Medium", color: "text-amber-600",  bg: "bg-amber-50",  dot: "bg-amber-400" },
  { value: "LOW",    label: "Low",    color: "text-slate-500",  bg: "bg-slate-100", dot: "bg-slate-400" },
];

const STATUSES = [
  { value: "TODO",        label: "To-do",       color: "text-slate-600",   bg: "bg-slate-100"   },
  { value: "IN_PROGRESS", label: "In Progress", color: "text-blue-600",    bg: "bg-blue-50"     },
  { value: "DONE",        label: "Done",         color: "text-emerald-600", bg: "bg-emerald-50"  },
  { value: "BACKLOG",     label: "Backlog",      color: "text-slate-400",   bg: "bg-slate-50"    },
];

const STATUS_ORDER = ["TODO", "IN_PROGRESS", "DONE", "BACKLOG"];

function getPriority(value: string) {
  return PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[1];
}
function isOverdue(task: Task) {
  if (!task.dueDate || task.status === "DONE") return false;
  return new Date(task.dueDate) < new Date();
}
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d < today) return `Overdue · ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  if (d.toDateString() === today.toDateString()) return "Due today";
  if (d.toDateString() === tomorrow.toDateString()) return "Due tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TasksTab({ dealId }: { dealId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    const res = await fetch(`/api/deals/${dealId}/tasks`);
    setTasks(await res.json());
    setLoading(false);
  }, [dealId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function toggleDone(task: Task) {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>;
  }

  // Group by status in defined order
  const grouped = STATUS_ORDER.reduce<Record<string, Task[]>>((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  const hasAny = tasks.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          {tasks.filter((t) => isOverdue(t)).length > 0 && (
            <span className="ml-2 text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
              {tasks.filter((t) => isOverdue(t)).length} overdue → backlog
            </span>
          )}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Task
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <TaskForm
          dealId={dealId}
          onSaved={() => { setShowForm(false); fetchTasks(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Empty state */}
      {!hasAny && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <CheckSquare className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">No tasks yet</p>
          <p className="text-xs text-slate-400 mt-1">Track action items and follow-ups for this deal</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            Add first task
          </button>
        </div>
      )}

      {/* Status groups */}
      {hasAny && STATUS_ORDER.map((statusValue) => {
        const group = grouped[statusValue];
        if (group.length === 0) return null;
        const statusMeta = STATUSES.find((s) => s.value === statusValue)!;

        return (
          <div key={statusValue}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md", statusMeta.bg, statusMeta.color)}>
                {statusMeta.label}
              </span>
              <span className="text-xs text-slate-400">{group.length}</span>
            </div>

            <div className="space-y-1.5">
              {group.map((task) =>
                editingId === task.id ? (
                  <TaskForm
                    key={task.id}
                    dealId={dealId}
                    existing={task}
                    onSaved={() => { setEditingId(null); fetchTasks(); }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleDone(task)}
                    onEdit={() => setEditingId(task.id)}
                    onDelete={() => handleDelete(task.id)}
                    onStatusChange={async (s) => {
                      await fetch(`/api/tasks/${task.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: s }),
                      });
                      fetchTasks();
                    }}
                  />
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: string) => void;
}) {
  const priority = getPriority(task.priority);
  const done = task.status === "DONE";
  const overdue = isOverdue(task);

  return (
    <div className={cn(
      "flex items-center gap-3 bg-white rounded-xl border px-4 py-3 group transition-colors",
      done ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-slate-300"
    )}>
      {/* Checkbox */}
      <button onClick={onToggle} className="flex-shrink-0 text-slate-400 hover:text-violet-600 transition-colors">
        {done
          ? <CheckSquare className="w-4 h-4 text-emerald-500" />
          : <Square className="w-4 h-4" />
        }
      </button>

      {/* Title */}
      <span className={cn("flex-1 text-sm min-w-0 truncate", done ? "line-through text-slate-400" : "text-slate-900")}>
        {task.title}
      </span>

      {/* Priority */}
      <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0", priority.bg, priority.color)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
        {priority.label}
      </span>

      {/* Due date */}
      {task.dueDate && (
        <span className={cn(
          "flex items-center gap-1 text-xs flex-shrink-0",
          overdue ? "text-red-500 font-medium" : "text-slate-400"
        )}>
          {overdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          {formatDate(task.dueDate)}
        </span>
      )}

      {/* Status selector (hidden until hover) */}
      <select
        value={task.status}
        onChange={(e) => onStatusChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-100 text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none transition-opacity"
      >
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {/* Edit / delete */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function TaskForm({
  dealId,
  existing,
  onSaved,
  onCancel,
}: {
  dealId: string;
  existing?: Task;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    priority: existing?.priority ?? "MEDIUM",
    status: existing?.status ?? "TODO",
    dueDate: existing?.dueDate ? existing.dueDate.split("T")[0] : "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    try {
      if (existing) {
        await fetch(`/api/tasks/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, dueDate: form.dueDate || null }),
        });
      } else {
        await fetch(`/api/deals/${dealId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, dueDate: form.dueDate || null }),
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  // Allow submitting with Enter key in the title field
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onCancel();
  }

  return (
    <div className="bg-white rounded-xl border border-violet-200 shadow-sm p-4 space-y-3">
      {/* Title */}
      <input
        autoFocus
        type="text"
        placeholder="Task title…"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors placeholder:text-slate-400"
      />

      {/* Priority + Status + Due date */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Priority</label>
          <div className="flex gap-1">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => set("priority", p.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  form.priority === p.value
                    ? `${p.bg} ${p.color} border-transparent`
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", p.dot)} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="w-full px-2 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            className="w-full px-2 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-60 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? "Saving…" : existing ? "Update" : "Add Task"}
        </button>
      </div>
    </div>
  );
}
