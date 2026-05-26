"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Bell,
  ChevronLeft,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DASHBOARD_NAV, SIDEBAR_ACTIONS } from "@/lib/constants/navigation";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Role } from "@/lib/constants";

// ─── Props ────────────────────────────────────────────────────────────
interface DashboardSidebarProps {
  profile?: {
    full_name: string;
    role: Role;
    hotel_name?: string;
  };
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
          {visibleNav.map((item) => {
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
