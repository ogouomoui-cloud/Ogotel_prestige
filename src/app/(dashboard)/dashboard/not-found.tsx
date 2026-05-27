import Link from "next/link";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      {/* Icon */}
      <div className="relative mb-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-ivory">
          <FileQuestion className="h-14 w-14 text-slate/30" />
        </div>
      </div>

      {/* Content */}
      <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">
        Page introuvable
      </h1>
      <p className="mt-3 max-w-md text-center text-sm text-slate">
        La page que vous recherchez n&apos;existe pas dans votre espace de travail.
        Vérifiez l&apos;adresse ou retournez au tableau de bord.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
        >
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Tableau de bord
          </Link>
        </Button>
      </div>
    </div>
  );
}
