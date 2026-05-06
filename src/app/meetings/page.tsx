import { prisma } from "@/lib/db";
import Link from "next/link";
import { Calendar, Clock, ExternalLink, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const meetings = await prisma.meeting.findMany({
    include: { deal: { select: { id: true, companyName: true } } },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Meetings</h1>
        <p className="text-xs text-slate-500 mt-0.5">{meetings.length} across all deals</p>
      </div>

      {meetings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
          <Calendar className="w-8 h-8 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No meetings yet</p>
          <p className="text-xs text-slate-400 mt-1">Open a deal and log meetings from the Meetings tab</p>
        </div>
      )}

      <div className="space-y-2">
        {meetings.map(meeting => (
          <div key={meeting.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-900">{meeting.title}</span>
                  {meeting.summary && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI summarised
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(meeting.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {meeting.duration && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {meeting.duration}m
                    </span>
                  )}
                </div>
                {meeting.summary && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{meeting.summary}</p>
                )}
              </div>
              <Link
                href={`/deals/${meeting.deal.id}`}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 transition-colors flex-shrink-0 border border-slate-200 rounded-lg px-2 py-1 hover:border-violet-300"
              >
                {meeting.deal.companyName}
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
