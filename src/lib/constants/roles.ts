export type Role = "super_admin" | "hotel_admin" | "manager" | "receptionist";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin:  "Super Administrateur",
  hotel_admin:  "Administrateur d'hôtel",
  manager:      "Manager",
  receptionist: "Réceptionniste",
};

export const ROLE_COLORS: Record<Role, string> = {
  super_admin:  "bg-red-100 text-red-800",
  hotel_admin:  "bg-navy/10 text-navy",
  manager:      "bg-gold/15 text-gold-dark",
  receptionist: "bg-emerald-100 text-emerald-800",
};

/**
 * Détermine si un rôle possède un niveau d'accès suffisant.
 * La hiérarchie est : super_admin > hotel_admin > manager > receptionist
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin:  4,
  hotel_admin:  3,
  manager:      2,
  receptionist: 1,
};

export function hasMinRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 20_000,
    period: "/ mois",
    features: [
      "1 hôtel",
      "Jusqu'à 20 chambres",
      "2 utilisateurs",
      "Réservations basiques",
      "Facturation",
      "Support par e-mail",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 50_000,
    period: "/ mois",
    features: [
      "1 hôtel",
      "Jusqu'à 100 chambres",
      "10 utilisateurs",
      "Réservations avancées",
      "Facturation & comptabilité",
      "Statistiques détaillées",
      "Support prioritaire WhatsApp",
      "Personnalisation",
    ],
    popular: true,
  },
  {
    id: "prestige",
    name: "Prestige",
    price: 90_000,
    period: "/ mois",
    features: [
      "Multi-hôtels",
      "Chambres illimitées",
      "Utilisateurs illimités",
      "Toutes les fonctionnalités",
      "API & intégrations",
      "Formation dédiée",
      "Manager de compte dédié",
      "Support 24/7",
    ],
    popular: false,
  },
] as const;
