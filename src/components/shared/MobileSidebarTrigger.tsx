"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DASHBOARD_NAV, SIDEBAR_ACTIONS } from "@/lib/constants/navigation";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Role, SidebarItem } from "@/lib/constants";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CalendarCheck,
  BedDouble,
  Building2,
  Hotel,
} from "lucide-react";

interface MobileSidebarTriggerProps {
  profile?: {
    role: Role;
  };
}

// ─── Section grouping ──────────────────────────────────────────────────
function getSectionLabel(item: SidebarItem): string | null {
  if (item.href === "/dashboard") return null;
  if (item.href.startsWith("/dashboard/admin")) return "Administration";
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

export function MobileSidebarTrigger({ profile }: MobileSidebarTriggerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Filtrer et grouper la navigation selon le rôle
  const visibleNav = DASHBOARD_NAV.filter(
    (item) => !profile || item.roles.includes(profile.role),
  );

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
      if (sections.length === 0 || sections[0].label !== "__root") {
        sections.unshift({ label: "__root", items: [item] });
      } else {
        sections[0].items.push(item);
      }
    }
  }

  async function handleLogout() {
    setOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/connexion");
      router.refresh();
    } catch {
      router.push("/connexion");
    }
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden text-slate hover:text-navy">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle asChild>
            <Link href="/dashboard" onClick={handleClose} className="flex flex-col items-start select-none">
              <span className="font-serif text-xl font-medium text-navy">OGOTEL</span>
              <span className="text-[0.55rem] tracking-[0.3em] text-slate">PRESTIGE</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <Separator className="mt-2" />
        <ScrollArea className="h-[calc(100vh-5rem)] px-3 py-4">
          <nav className="flex flex-col gap-1">
            {sections.map((section) => {
              if (section.label === "__root") {
                return section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-gold/10 text-gold-dark"
                          : "text-slate hover:bg-muted hover:text-navy"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                });
              }

              const SectionIcon = getSectionIcon(section.label);

              return (
                <div key={section.label} className="mt-4 first:mt-0">
                  <div className="mb-2 flex items-center gap-2 px-3">
                      {SectionIcon && (
                        <SectionIcon className="h-3.5 w-3.5 text-slate/50" />
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate/60">
                        {section.label}
                      </span>
                    </div>
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-gold/10 text-gold-dark"
                            : "text-slate hover:bg-muted hover:text-navy"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <Separator className="my-4" />

          <div className="space-y-1">
            {SIDEBAR_ACTIONS.map((action) =>
              action.label === "Déconnexion" ? (
                <button
                  key={action.label}
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-red-50 hover:text-red-600 w-full text-left"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span>{action.label}</span>
                </button>
              ) : (
                <Link
                  key={action.label}
                  href={action.href}
                  onClick={handleClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-muted hover:text-navy"
                >
                  <action.icon className="h-5 w-5 shrink-0" />
                  <span>{action.label}</span>
                </Link>
              ),
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
