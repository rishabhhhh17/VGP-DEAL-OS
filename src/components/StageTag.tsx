import { STAGE_COLORS, STAGE_LABELS, type Stage } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function StageTag({ stage }: { stage: string }) {
  const s = stage as Stage;
  const colors = STAGE_COLORS[s] ?? { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  const label = STAGE_LABELS[s] ?? stage;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", colors.bg, colors.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
      {label}
    </span>
  );
}
