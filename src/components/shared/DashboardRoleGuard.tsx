"use client";

import { usePathname } from "next/navigation";
import { AccessDenied } from "@/components/shared/AccessDenied";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { Role } from "@/lib/constants";

/**
 * Configuration des gardes de route par rôle.
 * Seules les routes listées ici sont protégées.
 * Toutes les autres routes dashboard sont accessibles à tous les rôles connectés.
 */
interface RouteGuardConfig {
  /** Préfixe de chemin */
  path: string;
  /** Rôles autorisés */
  roles: Role[];
}

const ROUTE_GUARDS: RouteGuardConfig[] = [
  {
    path: "/dashboard/admin",
    roles: ["super_admin"],
  },
  {
    path: "/dashboard/personnel",
    roles: ["hotel_admin"],
  },
  {
    path: "/dashboard/mon-hotel",
    roles: ["hotel_admin", "manager"],
  },
  {
    path: "/dashboard/chambres/creer",
    roles: ["hotel_admin", "manager"],
  },
  {
    path: "/dashboard/chambres/",
    roles: ["hotel_admin", "manager"], // modifier also needs manager+
  },
];

/**
 * Composant client de garde de rôle pour le dashboard.
 * Vérifie que l'utilisateur a le droit d'accéder à la route actuelle.
 * Affiche AccessDenied si ce n'est pas le cas.
 */
export function DashboardRoleGuard({
  userRole,
  children,
}: {
  userRole: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Trouver le garde le plus spécifique pour cette route
  const matchedGuard = ROUTE_GUARDS.find((guard) =>
    pathname.startsWith(guard.path)
  );

  if (matchedGuard && !matchedGuard.roles.includes(userRole)) {
    const requiredLabel = matchedGuard.roles
      .map((r) => ROLE_LABELS[r])
      .join(" ou ");
    const userLabel = ROLE_LABELS[userRole];

    return (
      <AccessDenied
        requiredRole={requiredLabel}
        userRole={userLabel}
        message={`Cette section est réservée aux ${requiredLabel.toLowerCase()}. Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.`}
      />
    );
  }

  return <>{children}</>;
}
