import { prisma } from "@/lib/db";
import Link from "next/link";
import { Mail, ExternalLink, Users } from "lucide-react";

export const dynamic = "force-dynamic";

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
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    include: { deal: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Group by deal
  const byDeal = contacts.reduce<Record<string, typeof contacts>>((acc, c) => {
    const key = c.deal.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Contacts</h1>
        <p className="text-xs text-slate-500 mt-0.5">{contacts.length} across all deals</p>
      </div>

      {contacts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
          <Users className="w-8 h-8 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No contacts yet</p>
          <p className="text-xs text-slate-400 mt-1">Open a deal and add contacts from the Contacts tab</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(byDeal).map(([dealId, dealContacts]) => (
          <div key={dealId}>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/deals/${dealId}`}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-violet-600 transition-colors"
              >
                {dealContacts[0].deal.companyName}
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="text-xs text-slate-400">{dealContacts.length} contact{dealContacts.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {dealContacts.map(contact => (
                <div key={contact.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold ${avatarColor(contact.name)}`}>
                    {initials(contact.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{contact.name}</span>
                      {contact.role && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{contact.role}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 transition-colors">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </a>
                      )}
                      {contact.linkedin && (
                        <a
                          href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-600 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
