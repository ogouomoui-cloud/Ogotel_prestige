import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory/30 px-4">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-lg">
          <span className="font-serif text-7xl font-bold text-navy/20">404</span>
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-14 w-14 items-center justify-center rounded-full bg-gold shadow-md">
          <Search className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Content */}
      <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">
        Page introuvable
      </h1>
      <p className="mt-3 max-w-md text-center text-sm text-slate">
        Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
        Vérifiez l&apos;URL ou retournez à l&apos;accueil.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
        >
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-border hover:bg-ivory"
        >
          <Link href="/contact">Nous contacter</Link>
        </Button>
      </div>

      {/* Branding */}
      <div className="mt-12 flex flex-col items-center">
        <Link href="/" className="flex flex-col items-center select-none">
          <span className="font-serif text-lg font-medium text-navy">
            OGOTEL
          </span>
          <span className="text-[0.5rem] tracking-[0.3em] text-slate">
            PRESTIGE
          </span>
        </Link>
      </div>
    </div>
  );
}
