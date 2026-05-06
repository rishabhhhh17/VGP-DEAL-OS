"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, Clock, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import MeetingModal from "./MeetingModal";
import MeetingDetailPanel from "./MeetingDetailPanel";

interface Meeting {
  id: string;
  dealId: string;
  title: string;
  date: string;
  duration: number | null;
  transcript: string | null;
  summary: string | null;
  keyTakeaways: string | null;
  risks: string | null;
  nextSteps: string | null;
  createdAt: string;
}

export default function MeetingsTab({ dealId }: { dealId: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const fetchMeetings = useCallback(async () => {
    const res = await fetch(`/api/deals/${dealId}/meetings`);
    const data = await res.json();
    setMeetings(data);
    setLoading(false);
  }, [dealId]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this meeting?")) return;
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    if (selectedMeeting?.id === id) setSelectedMeeting(null);
    fetchMeetings();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className={cn("flex gap-4", selectedMeeting ? "items-start" : "")}>
      {/* Left: meeting list */}
      <div className={cn("flex flex-col gap-3", selectedMeeting ? "w-72 flex-shrink-0" : "flex-1")}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Log Meeting
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No meetings yet</p>
            <p className="text-xs text-slate-400 mt-1">Log a meeting to start tracking your interactions</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
            >
              Log first meeting
            </button>
          </div>
        ) : (
          meetings.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMeeting(m.id === selectedMeeting?.id ? null : m)}
              className={cn(
                "w-full text-left bg-white rounded-xl border p-4 hover:border-violet-200 hover:shadow-sm transition-all group",
                selectedMeeting?.id === m.id ? "border-violet-300 shadow-sm" : "border-slate-200"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{m.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {m.duration && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {m.duration}m
                      </span>
                    )}
                  </div>
                  {m.summary && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{m.summary}</p>
                  )}
                  {!m.summary && m.transcript && (
                    <span className="inline-block mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Has transcript</span>
                  )}
                  {m.summary && (
                    <span className="inline-block mt-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">AI summarised</span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => handleDelete(m.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className={cn(
                    "w-4 h-4 text-slate-400 transition-transform",
                    selectedMeeting?.id === m.id && "rotate-90"
                  )} />
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Right: detail panel */}
      {selectedMeeting && (
        <div className="flex-1 min-w-0">
          <MeetingDetailPanel
            meeting={selectedMeeting}
            onClose={() => setSelectedMeeting(null)}
            onUpdate={(updated) => {
              setSelectedMeeting(updated);
              fetchMeetings();
            }}
          />
        </div>
      )}

      {showModal && (
        <MeetingModal
          dealId={dealId}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchMeetings(); }}
        />
      )}
    </div>
  );
}
