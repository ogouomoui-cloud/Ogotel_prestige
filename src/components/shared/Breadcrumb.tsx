"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

// ─── Map des labels de route ────────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  reservations: "Réservations",
  creer: "Nouveau",
  chambres: "Chambres",
  clients: "Clients",
  "mon-hotel": "Mon hôtel",
  modifier: "Modifier",
  personnel: "Personnel",
  admin: "Administration",
  demandes: "Demandes",
  hotels: "Hôtels",
  abonnements: "Abonnements",
  journal: "Journal d'activité",
};

/**
 * Breadcrumb de navigation — affiche le chemin courant.
 * S'utilise dans les pages de détail et de création.
 */
export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Fil d'Ariane" className="mb-6">
      <ol className="flex items-center gap-1.5 text-sm text-slate flex-wrap">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-slate transition-colors hover:bg-muted hover:text-navy"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Accueil</span>
          </Link>
        </li>

        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const label = ROUTE_LABELS[segment] ?? segment;
          const isLast = index === segments.length - 1;

          // Skip dynamic segments like UUIDs
          if (isLast && segment.length > 12 && /^[a-f0-9-]+$/.test(segment)) {
            return null;
          }

          return (
            <Fragment key={href}>
              <li>
                <ChevronRight className="h-3.5 w-3.5 text-slate/40" />
              </li>
              <li>
                {isLast ? (
                  <span className="rounded-md px-1.5 py-1 font-medium text-navy">
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="rounded-md px-1.5 py-1 text-slate transition-colors hover:bg-muted hover:text-navy"
                  >
                    {label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
