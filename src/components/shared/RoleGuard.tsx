"use client";

import { useRouter, usePathname } from "next/navigation";
import { AccessDenied } from "@/components/shared/AccessDenied";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { Role } from "@/lib/constants";

// ─── Configuration des guards par route ─────────────────────────────────
interface RouteGuard {
  /** Pattern de chemin (startsWith) */
  path: string;
  /** Rôles autorisés */
  roles: Role[];
}

const ROUTE_GUARDS: RouteGuard[] = [
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
];

/**
 * Vérifie si un rôle possède les permissions requises.
 */
function hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
  const hierarchy: Record<Role, number> = {
    super_admin: 4,
    hotel_admin: 3,
    manager: 2,
    receptionist: 1,
  };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}

/**
 * Composant wrapper qui protège les pages par rôle.
 * À utiliser dans les layouts ou pages qui nécessitent un contrôle d'accès.
 */
export function RoleGuard({
  userRole,
  requiredRole,
  children,
}: {
  userRole: Role | null;
  requiredRole?: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check explicit required role
  if (requiredRole && userRole && !hasRequiredRole(userRole, requiredRole)) {
    return (
      <AccessDenied
        requiredRole={ROLE_LABELS[requiredRole]}
        userRole={ROLE_LABELS[userRole]}
      />
    );
  }

  // Check route-based guards
  const guard = ROUTE_GUARDS.find((g) => pathname.startsWith(g.path));
  if (guard && userRole && !guard.roles.includes(userRole)) {
    return (
      <AccessDenied
        requiredRole={guard.roles.map((r) => ROLE_LABELS[r]).join(", ")}
        userRole={ROLE_LABELS[userRole]}
        message="Cette section est réservée aux administrateurs de votre établissement."
      />
    );
  }

  return <>{children}</>;
}
