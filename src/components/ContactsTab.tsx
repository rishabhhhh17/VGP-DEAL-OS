"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Mail, ExternalLink, Trash2, Edit3, Check, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  dealId: string;
  name: string;
  role: string | null;
  email: string | null;
  linkedin: string | null;
  notes: string | null;
  createdAt: string;
}

const ROLES = [
  "CEO", "CTO", "CFO", "COO", "Founder", "Co-Founder",
  "Partner", "VP", "Director", "Associate", "Analyst", "Other",
];

// Deterministic colour from name
const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500",
];
function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function ContactsTab({ dealId }: { dealId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    const res = await fetch(`/api/deals/${dealId}/contacts`);
    setContacts(await res.json());
    setLoading(false);
  }, [dealId]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  async function handleDelete(id: string) {
    if (!confirm("Remove this contact?")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    fetchContacts();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Contact
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <ContactForm
          dealId={dealId}
          onSaved={() => { setShowForm(false); fetchContacts(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Empty state */}
      {contacts.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">No contacts yet</p>
          <p className="text-xs text-slate-400 mt-1">Add the people behind this deal</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            Add first contact
          </button>
        </div>
      )}

      {/* Contact cards */}
      {contacts.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {contacts.map((contact) =>
            editingId === contact.id ? (
              <ContactForm
                key={contact.id}
                dealId={dealId}
                existing={contact}
                onSaved={() => { setEditingId(null); fetchContacts(); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={() => setEditingId(contact.id)}
                onDelete={() => handleDelete(contact.id)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = avatarColor(contact.name);

  return (
    <div className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors group">
      {/* Avatar */}
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold", color)}>
        {initials(contact.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900">{contact.name}</span>
          {contact.role && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {contact.role}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="w-3 h-3" />
              {contact.email}
            </a>
          )}
          {contact.linkedin && (
            <a
              href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              LinkedIn
            </a>
          )}
        </div>

        {contact.notes && (
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{contact.notes}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ContactForm({
  dealId,
  existing,
  onSaved,
  onCancel,
}: {
  dealId: string;
  existing?: Contact;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    role: existing?.role ?? "",
    email: existing?.email ?? "",
    linkedin: existing?.linkedin ?? "",
    notes: existing?.notes ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    try {
      if (existing) {
        await fetch(`/api/contacts/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch(`/api/deals/${dealId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  // Show avatar preview while typing
  const previewColor = form.name ? avatarColor(form.name) : "bg-slate-300";
  const previewInitials = form.name ? initials(form.name) : "?";

  return (
    <div className="bg-white rounded-xl border border-violet-200 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-3 mb-1">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold transition-colors", previewColor)}>
          {previewInitials}
        </div>
        <p className="text-sm font-medium text-slate-700">{existing ? "Edit contact" : "New contact"}</p>
      </div>

      {/* Name + Role */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Patrick Collison"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Role</label>
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
          >
            <option value="">— select —</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Email + LinkedIn */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
          <input
            type="email"
            placeholder="patrick@stripe.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">LinkedIn URL</label>
          <input
            type="text"
            placeholder="linkedin.com/in/..."
            value={form.linkedin}
            onChange={(e) => set("linkedin", e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
        <textarea
          rows={2}
          placeholder="Any context on this person…"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-60 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? "Saving…" : existing ? "Update" : "Add Contact"}
        </button>
      </div>
    </div>
  );
}
