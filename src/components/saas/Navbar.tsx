"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { PUBLIC_NAV } from "@/lib/constants";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-navy/95 backdrop-blur-md shadow-lg shadow-navy/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-gold text-2xl font-serif font-bold tracking-tight">
              OGOTEL
            </span>
            <span className="hidden sm:inline text-ivory/60 text-sm font-light">
              Prestige
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1">
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-ivory/70 hover:text-ivory text-sm font-medium px-4 py-2 rounded-full transition-colors hover:bg-white/10"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              className="border-ivory/20 text-ivory hover:bg-white/10 hover:text-ivory rounded-full px-5 text-sm"
              asChild
            >
              <Link href="/connexion">Connexion</Link>
            </Button>
            <Button className="bg-gold text-white hover:bg-gold-light rounded-full px-5 text-sm font-semibold">
              Essai gratuit
            </Button>
          </div>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button
                aria-label="Menu"
                className="text-ivory p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-navy border-white/10 p-0">
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 pb-4">
                  <span className="text-gold text-xl font-serif font-bold">
                    OGOTEL
                  </span>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-ivory/60 hover:text-ivory p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="flex-1 px-4">
                  <ul className="space-y-1">
                    {PUBLIC_NAV.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="block text-ivory/70 hover:text-ivory text-base font-medium px-4 py-3 rounded-xl transition-colors hover:bg-white/10"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="p-6 space-y-3 border-t border-white/10">
                  <Button
                    variant="outline"
                    className="w-full border-ivory/20 text-ivory hover:bg-white/10 rounded-full"
                    asChild
                  >
                    <Link href="/connexion" onClick={() => setOpen(false)}>
                      Connexion
                    </Link>
                  </Button>
                  <Button className="w-full bg-gold text-white hover:bg-gold-light rounded-full font-semibold">
                    Essai gratuit
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
