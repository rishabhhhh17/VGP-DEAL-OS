"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle2, Settings2 } from "lucide-react";

interface Criteria {
  fundMandate: string;
  sectorPrefs: string;
  teamRequirements: string;
  tractionReqs: string;
  marketSize: string;
  dealStructure: string;
  redFlags: string;
  otherCriteria: string;
}

const EMPTY: Criteria = {
  fundMandate: "",
  sectorPrefs: "",
  teamRequirements: "",
  tractionReqs: "",
  marketSize: "",
  dealStructure: "",
  redFlags: "",
  otherCriteria: "",
};

const FIELDS: {
  key: keyof Criteria;
  label: string;
  placeholder: string;
  rows?: number;
}[] = [
  {
    key: "fundMandate",
    label: "Fund Mandate",
    placeholder:
      "We invest in early stage consumer brands in India with a focus on F&B, lifestyle and media companies raising their first institutional round",
    rows: 3,
  },
  {
    key: "sectorPrefs",
    label: "Sector Preferences",
    placeholder:
      "Focus: F&B, consumer tech, media, lifestyle. Avoid: crypto, real estate, pure SaaS",
    rows: 3,
  },
  {
    key: "teamRequirements",
    label: "Founding Team Requirements",
    placeholder:
      "Must have a CTO or in-house tech lead. Founders should have prior startup or domain experience. Prefer second-time founders.",
    rows: 3,
  },
  {
    key: "tractionReqs",
    label: "Traction Requirements",
    placeholder:
      "Minimum 6 months of revenue. Prefer companies doing 10Cr+ ARR or showing 20%+ MoM growth",
    rows: 3,
  },
  {
    key: "marketSize",
    label: "Market Size",
    placeholder:
      "India TAM of at least 5000 Cr. Must have a clear path to 10x in 5 years",
    rows: 3,
  },
  {
    key: "dealStructure",
    label: "Deal Structure Preferences",
    placeholder:
      "Cheque size 1-5Cr. Lead or co-lead only. CCPS preferred. Board seat or observer rights required.",
    rows: 3,
  },
  {
    key: "redFlags",
    label: "Red Flags (Auto-disqualifiers)",
    placeholder:
      "Bootstrapped for more than 5 years without growth. Competing products from large incumbents already at scale. Founders with prior fraud or legal issues.",
    rows: 3,
  },
  {
    key: "otherCriteria",
    label: "Anything Else",
    placeholder:
      "Any other criteria that matters to your fund — e.g. geography, founder demographics, proprietary tech requirements, ESG considerations...",
    rows: 4,
  },
];

export default function ScreenerSettingsPage() {
  const [form, setForm] = useState<Criteria>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/screener/criteria")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setForm({
            fundMandate: data.fundMandate ?? "",
            sectorPrefs: data.sectorPrefs ?? "",
            teamRequirements: data.teamRequirements ?? "",
            tractionReqs: data.tractionReqs ?? "",
            marketSize: data.marketSize ?? "",
            dealStructure: data.dealStructure ?? "",
            redFlags: data.redFlags ?? "",
            otherCriteria: data.otherCriteria ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/screener/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    background: "var(--s-input-bg)",
    border: "1px solid var(--s-input-border)",
    color: "var(--s-text)",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "13px",
    lineHeight: "1.6",
    width: "100%",
    resize: "vertical" as const,
    outline: "none",
    fontFamily: "var(--font-sans)",
    transition: "border-color 0.15s",
  };

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: "var(--s-bg)" }}>
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{
          background: "var(--s-surface)",
          borderBottom: "1px solid var(--s-border-strong)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(59,126,246,0.12)" }}
          >
            <Settings2 className="w-4 h-4" style={{ color: "var(--s-accent)" }} />
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: "var(--s-text)" }}>
              Screener Settings
            </h1>
            <p className="text-xs" style={{ color: "var(--s-text-muted)" }}>
              Define your fund&apos;s investment criteria — the AI uses these to score every deal
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
          style={{
            background: saved ? "#2d9c6e" : "var(--s-accent)",
            opacity: saving ? 0.7 : 1,
            minWidth: 120,
          }}
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Saved ✓
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save Criteria"}
            </>
          )}
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-6 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="space-y-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-20 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {FIELDS.map(({ key, label, placeholder, rows = 3 }, idx) => (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(59,126,246,0.12)",
                      color: "var(--s-accent)",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <label
                    className="text-xs font-semibold"
                    style={{ color: "var(--s-text)" }}
                  >
                    {label}
                  </label>
                </div>
                <textarea
                  rows={rows}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  style={fieldStyle}
                  onFocus={(e) => {
                    (e.target as HTMLTextAreaElement).style.borderColor = "var(--s-accent)";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLTextAreaElement).style.borderColor = "var(--s-input-border)";
                  }}
                />
              </div>
            ))}

            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{
                background: "rgba(59,126,246,0.06)",
                border: "1px solid rgba(59,126,246,0.15)",
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: "var(--s-accent)" }}
              />
              <p className="text-xs" style={{ color: "var(--s-text-muted)" }}>
                These criteria are used every time you screen a deal. Fill in what matters most
                to your fund — you can always come back and update them. The more specific you
                are, the more precise the AI&apos;s scoring will be.
              </p>
            </div>

            <div className="flex justify-end pb-6">
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
                style={{
                  background: saved ? "#2d9c6e" : "var(--s-accent)",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Criteria saved ✓
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {saving ? "Saving…" : "Save Criteria"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
