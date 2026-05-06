"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Building2, Users, Calendar, MessageSquare,
  CheckSquare, FileText, Inbox, Briefcase, BarChart3, Plus, Zap,
  Sun, Moon, Sparkles, Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

const NAV = [
  { href: "/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
  { href: "/deals",        label: "Pipeline",      icon: Building2        },
  { href: "/interactions", label: "Interactions",  icon: MessageSquare   },
  { href: "/backlog",      label: "Backlog",       icon: Inbox,  badge: "backlog"  },
  { href: "/mandates",     label: "Live Mandates", icon: Briefcase       },
  { href: "/gantt",        label: "Timeline",      icon: BarChart3       },
  { href: "/contacts",     label: "Contacts",      icon: Users           },
  { href: "/meetings",     label: "Meetings",      icon: Calendar        },
  { href: "/tasks",        label: "Tasks",         icon: CheckSquare, badge: "tasks" },
  { href: "/documents",    label: "Documents",     icon: FileText        },
];

const AI_NAV = [
  { href: "/ai-screener",          label: "Screen a Deal",   icon: Sparkles  },
  { href: "/ai-screener/settings", label: "Screener Setup",  icon: Settings2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [badges, setBadges] = useState({ backlog: 0, tasks: 0 });
  const { theme, toggle } = useTheme();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setBadges({
          backlog: d.stats?.backlogCount ?? 0,
          tasks:   d.stats?.tasksDueThisWeek ?? 0,
        });
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-full sidebar-scroll overflow-y-auto transition-colors"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Logo */}
      <div className="px-4 py-5" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--s-accent)" }}
          >
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">VGP OS</span>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-3 py-3" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <Link
          href="/interactions?new=1"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-semibold transition-all text-white"
          style={{ background: "var(--s-accent)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--s-accent-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--s-accent)")}
        >
          <Plus className="w-3.5 h-3.5" />
          New Interaction
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href
            || (href !== "/dashboard" && href !== "/deals" && pathname.startsWith(href))
            || (href === "/deals" && (pathname === "/deals" || pathname.startsWith("/deals/")));
          const count = badge === "backlog" ? badges.backlog : badge === "tasks" ? badges.tasks : 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 py-2 rounded-md text-sm transition-colors relative",
                active ? "text-white" : "hover:text-slate-200"
              )}
              style={{
                paddingLeft: active ? "10px" : "12px",
                paddingRight: "12px",
                color: active ? "#ffffff" : "var(--sidebar-text)",
                background: active ? "var(--sidebar-active)" : undefined,
                borderLeft: active ? "2px solid var(--s-accent)" : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "var(--sidebar-hover)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "";
              }}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={active ? { color: "var(--s-accent)" } : undefined}
              />
              <span className="flex-1 text-xs font-medium">{label}</span>
              {badge && count > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[18px] text-center"
                  style={{
                    background: active ? "var(--s-accent)" : "#232323",
                    color: active ? "#fff" : "#8a8a8a",
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}

        {/* AI Screener section */}
        <div className="pt-3 pb-1">
          <div
            className="px-3 mb-1.5 flex items-center gap-1.5"
          >
            <div className="flex-1 h-px" style={{ background: "var(--sidebar-border)" }} />
            <span
              className="text-[9px] font-bold uppercase tracking-widest flex-shrink-0"
              style={{ color: "#3b7ef6", opacity: 0.7 }}
            >
              AI Screener
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--sidebar-border)" }} />
          </div>

          {AI_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 py-2 rounded-md text-sm transition-colors relative",
                  active ? "text-white" : "hover:text-slate-200"
                )}
                style={{
                  paddingLeft: active ? "10px" : "12px",
                  paddingRight: "12px",
                  color: active ? "#ffffff" : "var(--sidebar-text)",
                  background: active ? "var(--sidebar-active)" : undefined,
                  borderLeft: active ? "2px solid #3b7ef6" : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "var(--sidebar-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "";
                }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={active ? { color: "#3b7ef6" } : undefined}
                />
                <span className="flex-1 text-xs font-medium">{label}</span>
                {href === "/ai-screener" && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(59,126,246,0.15)", color: "#3b7ef6" }}
                  >
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer: theme toggle + version */}
      <div
        className="px-3 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <p className="text-[10px]" style={{ color: "#2d2d2d" }}>v0.1 · SQLite</p>

        {/* Light / Dark toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all"
          style={{
            background: "var(--sidebar-hover)",
            color: "var(--sidebar-text)",
            border: "1px solid var(--sidebar-border)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--sidebar-active)";
            (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--sidebar-hover)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--sidebar-text)";
          }}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark"
            ? <Sun className="w-3.5 h-3.5" />
            : <Moon className="w-3.5 h-3.5" />
          }
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </aside>
  );
}
