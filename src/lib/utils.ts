import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STAGES = [
  "SOURCING",
  "INITIAL_CALL",
  "DILIGENCE",
  "TERM_SHEET",
  "CLOSED",
  "PASSED",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  SOURCING: "Sourcing",
  INITIAL_CALL: "Initial Call",
  DILIGENCE: "Diligence",
  TERM_SHEET: "Term Sheet",
  CLOSED: "Closed",
  PASSED: "Passed",
};

export const STAGE_COLORS: Record<Stage, { bg: string; text: string; dot: string }> = {
  SOURCING: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  INITIAL_CALL: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
  DILIGENCE: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  TERM_SHEET: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  CLOSED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  PASSED: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
};

export const STAGE_COLUMN_COLORS: Record<Stage, string> = {
  SOURCING: "border-t-blue-400",
  INITIAL_CALL: "border-t-violet-400",
  DILIGENCE: "border-t-amber-400",
  TERM_SHEET: "border-t-orange-400",
  CLOSED: "border-t-emerald-500",
  PASSED: "border-t-slate-400",
};
