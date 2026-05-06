"use client";

import { useEffect, useState, useRef } from "react";
import { X, ExternalLink, ChevronDown, Check, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InteractionPayload {
  date: string;
  personName: string;
  companyName: string;
  companyUrl: string;
  context: string;
  mandate: string;
  interactionType: string;
  origination: string;
  referralTouchpoint: string;
  vgpPoc: string; // stored as JSON array string
  outcome: string;
  takeaways: string;
  nextSteps: string;
  deadline: string;
  dealId?: string;
}

export interface Interaction extends InteractionPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
  deal?: { id: string; companyName: string } | null;
}

interface Props {
  interaction?: Interaction | null;
  deals?: { id: string; companyName: string }[];
  defaultDealId?: string;
  onClose: () => void;
  onSaved: (interaction: Interaction) => void;
}

// ── Static option lists ───────────────────────────────────────────────────────

const INTERACTION_TYPES = [
  "Google Meet",
  "Phone Call",
  "Email",
  "WhatsApp",
  "WhatsApp Call",
  "LinkedIn",
  "In-person",
  "Zoom Call",
  "Microsoft Teams",
  "VGP Office",
  "Other",
];

const ORIGINATION_OPTIONS = ["Inbound", "Outbound", "Mutual"];

const OUTCOME_OPTIONS = [
  "To Follow-up",
  "Follow-up scheduled",
  "In progress",
  "Mandated",
  "Handed over",
  "Investing Partners",
  "KIT",
  "Pass",
];

const OUTCOME_STYLES: Record<string, string> = {
  "To Follow-up":        "bg-amber-50 text-amber-700 border-amber-200",
  "Follow-up scheduled": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "In progress":         "bg-blue-50 text-blue-700 border-blue-200",
  "Mandated":            "bg-violet-50 text-violet-700 border-violet-200",
  "Handed over":         "bg-slate-50 text-slate-600 border-slate-200",
  "Investing Partners":  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "KIT":                 "bg-teal-50 text-teal-700 border-teal-200",
  "Pass":                "bg-red-50 text-red-600 border-red-200",
};

// ── Multi-select dropdown ─────────────────────────────────────────────────────

function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-left transition-colors focus:outline-none"
        style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
      >
        <span className="flex-1 truncate" style={{ color: value.length === 0 ? "var(--s-text-dim)" : "var(--s-text)" }}>
          {value.length === 0 ? placeholder : value.join(", ")}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform flex-shrink-0", open && "rotate-180")} style={{ color: "var(--s-text-dim)" }} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg shadow-2xl overflow-hidden"
          style={{ background: "var(--s-raised)", border: "1px solid var(--s-border-strong)" }}
        >
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: value.includes(opt) ? "var(--s-text)" : "var(--s-text-muted)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--s-border-strong)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
            >
              <div className={cn(
                "w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0",
              )}
                style={value.includes(opt)
                  ? { background: "#3b7ef6", borderColor: "#3b7ef6" }
                  : { borderColor: "#2d2d2d" }}
              >
                {value.includes(opt) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single select ─────────────────────────────────────────────────────────────

function Select({
  options,
  value,
  onChange,
  placeholder,
  renderOption,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  renderOption?: (opt: string) => React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors"
        style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{renderOption ? String(renderOption(opt)) : opt}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--s-text-dim)" }} />
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--s-text-dim)" }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] mt-1" style={{ color: "var(--s-text-dim)" }}>{hint}</p>}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function InteractionForm({ interaction, deals = [], defaultDealId, onClose, onSaved }: Props) {
  const isEdit = !!interaction;

  // Parse existing vgpPoc (stored as JSON array string)
  function parsePoc(v: string | undefined): string[] {
    if (!v) return [];
    try { return JSON.parse(v); } catch { return v ? [v] : []; }
  }

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Config fetched from DB
  const [mandates, setMandates] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

  // Form state
  const [date, setDate] = useState(
    interaction?.date
      ? new Date(interaction.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [personName, setPersonName] = useState(interaction?.personName ?? "");
  const [companyName, setCompanyName] = useState(interaction?.companyName ?? "");
  const [companyUrl, setCompanyUrl] = useState(interaction?.companyUrl ?? "");
  const [context, setContext] = useState(interaction?.context ?? "");
  const [mandate, setMandate] = useState(interaction?.mandate ?? "");
  const [interactionType, setInteractionType] = useState(interaction?.interactionType ?? "");
  const [origination, setOrigination] = useState(interaction?.origination ?? "");
  const [referralTouchpoint, setReferralTouchpoint] = useState(interaction?.referralTouchpoint ?? "");
  const [vgpPoc, setVgpPoc] = useState<string[]>(parsePoc(interaction?.vgpPoc));
  const [outcome, setOutcome] = useState(interaction?.outcome ?? "");
  const [takeaways, setTakeaways] = useState(interaction?.takeaways ?? "");
  const [nextSteps, setNextSteps] = useState(interaction?.nextSteps ?? "");
  const [deadline, setDeadline] = useState(
    interaction?.deadline
      ? new Date(interaction.deadline).toISOString().slice(0, 10)
      : ""
  );
  const [dealId, setDealId] = useState(interaction?.deal?.id ?? defaultDealId ?? "");

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.mandates)) setMandates(data.mandates);
        if (Array.isArray(data.teamMembers)) setTeamMembers(data.teamMembers);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!personName.trim()) { setError("Name is required"); return; }
    if (!date) { setError("Date is required"); return; }

    setSaving(true);
    setError("");

    const payload: Partial<InteractionPayload> & { dealId?: string } = {
      date,
      personName: personName.trim(),
      companyName: companyName.trim(),
      companyUrl: companyUrl.trim(),
      context: context.trim(),
      mandate,
      interactionType,
      origination,
      referralTouchpoint: referralTouchpoint.trim(),
      vgpPoc: JSON.stringify(vgpPoc),
      outcome,
      takeaways: takeaways.trim(),
      nextSteps: nextSteps.trim(),
      deadline: deadline || undefined,
      dealId: dealId || undefined,
    };

    try {
      const url = isEdit ? `/api/interactions/${interaction!.id}` : "/api/interactions";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      onSaved(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[480px] flex flex-col slide-in-right"
        style={{ background: "var(--s-surface)", borderLeft: "1px solid var(--s-border-strong)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--s-border)" }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--s-text)" }}>
              {isEdit ? "Edit Interaction" : "Log Interaction"}
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--s-text-dim)" }}>
              {isEdit ? "Update details below" : "Record a new touchpoint"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--s-text-dim)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--s-raised)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--s-text)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = "var(--s-text-dim)"; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Row 1: Date + Name */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date *">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors"
                style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
                required
              />
            </Field>
            <Field label="Name *">
              <input
                type="text"
                value={personName}
                onChange={e => setPersonName(e.target.value)}
                placeholder="Person you met"
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors placeholder:text-[#6b6b6b]"
                style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
                required
              />
            </Field>
          </div>

          {/* Row 2: Company + URL */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company Name">
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Organisation"
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors placeholder:text-[#6b6b6b]"
                style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
              />
            </Field>
            <Field label="Company URL / LinkedIn" hint="Paste LinkedIn or website URL">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={companyUrl}
                  onChange={e => setCompanyUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors placeholder:text-[#6b6b6b]"
                  style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
                />
                {companyUrl && (
                  <a
                    href={companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors flex-shrink-0"
                    style={{ border: "1px solid var(--s-border-strong)", background: "var(--s-input-bg)", color: "var(--s-text-dim)" }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </Field>
          </div>

          {/* Row 3: Interaction Type + Origination */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Interaction Type">
              <Select
                options={INTERACTION_TYPES}
                value={interactionType}
                onChange={setInteractionType}
                placeholder="Select type"
              />
            </Field>
            <Field label="Origination">
              <Select
                options={ORIGINATION_OPTIONS}
                value={origination}
                onChange={setOrigination}
                placeholder="Inbound / Outbound"
              />
            </Field>
          </div>

          {/* Row 4: Mandate + Outcome */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Associated Mandate">
              <Select
                options={mandates}
                value={mandate}
                onChange={setMandate}
                placeholder={mandates.length ? "Select mandate" : "No mandates configured"}
              />
            </Field>
            <Field label="Outcome">
              <Select
                options={OUTCOME_OPTIONS}
                value={outcome}
                onChange={setOutcome}
                placeholder="Select outcome"
              />
            </Field>
          </div>

          {/* Row 5: VGP POC + Referral Touchpoint */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="VGP POC">
              <MultiSelect
                options={teamMembers}
                value={vgpPoc}
                onChange={setVgpPoc}
                placeholder={teamMembers.length ? "Select team member(s)" : "No members configured"}
              />
            </Field>
            <Field label="Referral / Touchpoint">
              <input
                type="text"
                value={referralTouchpoint}
                onChange={e => setReferralTouchpoint(e.target.value)}
                placeholder="Who referred or how you connected"
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors placeholder:text-[#6b6b6b]"
                style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
              />
            </Field>
          </div>

          {/* Row 6: Context */}
          <Field label="Context">
            <textarea
              rows={2}
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="What this meeting was about"
              className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none transition-colors resize-none leading-relaxed placeholder:text-[#6b6b6b]"
              style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
            />
          </Field>

          {/* Row 7: Takeaways */}
          <Field label="Takeaways">
            <textarea
              rows={3}
              value={takeaways}
              onChange={e => setTakeaways(e.target.value)}
              placeholder="Key insights from this interaction"
              className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none transition-colors resize-none leading-relaxed placeholder:text-[#6b6b6b]"
              style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
            />
          </Field>

          {/* Row 8: Next Steps */}
          <Field label="Next Steps">
            <textarea
              rows={2}
              value={nextSteps}
              onChange={e => setNextSteps(e.target.value)}
              placeholder="What needs to happen after this"
              className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none transition-colors resize-none leading-relaxed placeholder:text-[#6b6b6b]"
              style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
            />
          </Field>

          {/* Row 9: Deadline + linked Deal */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Follow-up Deadline">
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors"
                style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
              />
            </Field>
            {deals.length > 0 && (
              <Field label="Link to Deal" hint="Optional">
                <div className="relative">
                  <select
                    value={dealId}
                    onChange={e => setDealId(e.target.value)}
                    className="w-full appearance-none px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors"
        style={{ background: "var(--s-input-bg)", border: "1px solid var(--s-input-border)", color: "var(--s-text)" }}
                  >
                    <option value="">No deal linked</option>
                    {deals.map(d => (
                      <option key={d.id} value={d.id}>{d.companyName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--s-text-dim)" }} />
                </div>
              </Field>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm rounded-lg px-4 py-2.5" style={{ color: "#e54d2e", background: "#2b0d0d", border: "1px solid #5c1e1e" }}>{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ color: "var(--s-text-muted)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--s-raised)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--s-text)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = "var(--s-text-muted)"; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-60"
              style={{ background: "#3b7ef6" }}
              onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#2d6fe0"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#3b7ef6"; }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Log Interaction"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Re-export style helpers for use in pages ──────────────────────────────────

export { OUTCOME_OPTIONS, OUTCOME_STYLES };
