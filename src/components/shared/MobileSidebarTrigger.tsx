"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DASHBOARD_NAV, SIDEBAR_ACTIONS } from "@/lib/constants/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileSidebarTrigger() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
            <Link href="/dashboard" className="flex flex-col items-start select-none">
              <span className="font-serif text-xl font-medium text-navy">OGOTEL</span>
              <span className="text-[0.55rem] tracking-[0.3em] text-slate">PRESTIGE</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <Separator className="mt-2" />
        <ScrollArea className="h-[calc(100vh-5rem)] px-3 py-4">
          <nav className="flex flex-col gap-1">
            {DASHBOARD_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
          </nav>

          <Separator className="my-4" />

          <div className="space-y-1">
            {SIDEBAR_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-muted hover:text-navy"
              >
                <action.icon className="h-5 w-5 shrink-0" />
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
