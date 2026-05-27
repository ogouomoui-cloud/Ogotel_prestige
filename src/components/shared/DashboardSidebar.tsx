"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Bell,
  ChevronLeft,
  ShieldCheck,
  CalendarCheck,
  BedDouble,
  Users,
  UserCircle,
  Hotel,
  LayoutDashboard,
  Building2,
  CreditCard,
  ScrollText,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DASHBOARD_NAV, SIDEBAR_ACTIONS } from "@/lib/constants/navigation";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Role, SidebarItem } from "@/lib/constants";

// ─── Props ────────────────────────────────────────────────────────────
interface DashboardSidebarProps {
  profile?: {
    full_name: string;
    role: Role;
    hotel_name?: string;
  };
}

// ─── Section labels ────────────────────────────────────────────────────
function getSectionLabel(item: SidebarItem): string | null {
  // Super admin sections
  if (item.href === "/dashboard" && item.roles.includes("super_admin"))
    return null;
  if (item.href.startsWith("/dashboard/admin")) return "Administration";
  // Hotel admin sections
  if (item.href === "/dashboard") return null;
  if (item.href.startsWith("/dashboard/reservations")) return "Réception";
  if (item.href.startsWith("/dashboard/clients")) return "Réception";
  if (item.href.startsWith("/dashboard/check-in-out")) return "Réception";
  if (item.href.startsWith("/dashboard/paiements")) return "Réception";
  if (item.href.startsWith("/dashboard/chambres")) return "Gestion";
  if (item.href.startsWith("/dashboard/personnel")) return "Gestion";
  if (item.href.startsWith("/dashboard/mon-hotel")) return "Établissement";
  return null;
}

function getSectionIcon(section: string) {
  switch (section) {
    case "Administration": return Building2;
    case "Réception": return CalendarCheck;
    case "Gestion": return BedDouble;
    case "Établissement": return Hotel;
    default: return null;
  }
}

// ─── Composant ────────────────────────────────────────────────────────
export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Filtrer la navigation selon le rôle
  const visibleNav = DASHBOARD_NAV.filter(
    (item) => !profile || item.roles.includes(profile.role),
  );

  // Grouper par sections
  const sections: { label: string; items: SidebarItem[] }[] = [];
  let currentSection: string | null = null;

  for (const item of visibleNav) {
    const section = getSectionLabel(item);
    if (section && section !== currentSection) {
      currentSection = section;
      sections.push({ label: section, items: [item] });
    } else if (section === currentSection) {
      sections[sections.length - 1].items.push(item);
    } else {
      // Page d'accueil (pas de section)
      if (sections.length === 0 || sections[0].label !== "__root") {
        sections.unshift({ label: "__root", items: [item] });
      } else {
        sections[0].items.push(item);
      }
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/connexion");
      router.refresh();
    } catch {
      router.push("/connexion");
    }
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-white transition-all duration-300",
        collapsed ? "w-[70px]" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="flex flex-col items-start select-none"
          >
            <span className="font-serif text-xl font-medium text-navy">
              OGOTEL
            </span>
            <span className="text-[0.55rem] tracking-[0.3em] text-slate">
              PRESTIGE
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-slate hover:text-navy"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180",
            )}
          />
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {sections.map((section) => {
            if (section.label === "__root") {
              // Items without section
              return section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gold/10 text-gold-dark"
                        : "text-slate hover:bg-muted hover:text-navy",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              });
            }

            const SectionIcon = getSectionIcon(section.label);

            return (
              <div key={section.label} className="mt-4 first:mt-0">
                {/* Section header */}
                {!collapsed && (
                  <div className="mb-2 flex items-center gap-2 px-3">
                    {SectionIcon && (
                      <SectionIcon className="h-3.5 w-3.5 text-slate/50" />
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate/60">
                      {section.label}
                    </span>
                  </div>
                )}
                {collapsed && <Separator className="my-3" />}

                {/* Section items */}
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-gold/10 text-gold-dark"
                          : "text-slate hover:bg-muted hover:text-navy",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Utilisateur + Actions */}
      <div className="p-3 space-y-1">
        {!collapsed && profile && (
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-ivory px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-ivory">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-navy">
                {profile.full_name}
              </p>
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-gold" />
                <p className="truncate text-[11px] text-slate">
                  {ROLE_LABELS[profile.role]}
                </p>
              </div>
            </div>
          </div>
        )}

        {SIDEBAR_ACTIONS.map((action) =>
          action.label === "Déconnexion" ? (
            <button
              key={action.label}
              type="button"
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full text-left",
                "text-slate hover:bg-red-50 hover:text-red-600",
              )}
            >
              <action.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{action.label}</span>}
            </button>
          ) : (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-muted hover:text-navy"
            >
              <action.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{action.label}</span>}
            </Link>
          ),
        )}
      </div>
    </aside>
  );
}
