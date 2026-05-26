import {
  Hotel,
  LayoutDashboard,
  BedDouble,
  Users,
  CalendarCheck,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck,
  Building2,
  LogOut,
  Bell,
  UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Navigation publique ─────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
}

export const PUBLIC_NAV: NavItem[] = [
  { label: "Accueil",           href: "/#accueil" },
  { label: "Fonctionnalités",   href: "/#fonctionnalites" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "Tarifs",            href: "/#tarifs" },
  { label: "FAQ",               href: "/#faq" },
  { label: "Contact",           href: "/contact" },
];

// ─── Navigation dashboard ────────────────────────────────────────────
export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

export const DASHBOARD_NAV: SidebarItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "hotel_admin", "manager", "receptionist"],
  },
  {
    label: "Réservations",
    href: "/dashboard/reservations",
    icon: CalendarCheck,
    roles: ["super_admin", "hotel_admin", "manager", "receptionist"],
  },
  {
    label: "Chambres",
    href: "/dashboard/chambres",
    icon: BedDouble,
    roles: ["super_admin", "hotel_admin", "manager"],
  },
  {
    label: "Clients",
    href: "/dashboard/clients",
    icon: Users,
    roles: ["super_admin", "hotel_admin", "manager", "receptionist"],
  },
  {
    label: "Facturation",
    href: "/dashboard/facturation",
    icon: Receipt,
    roles: ["super_admin", "hotel_admin", "manager"],
  },
  {
    label: "Personnel",
    href: "/dashboard/personnel",
    icon: UserCircle,
    roles: ["super_admin", "hotel_admin"],
  },
  {
    label: "Mon hôtel",
    href: "/dashboard/mon-hotel",
    icon: Building2,
    roles: ["hotel_admin", "manager"],
  },
  {
    label: "Statistiques",
    href: "/dashboard/statistiques",
    icon: BarChart3,
    roles: ["super_admin", "hotel_admin"],
  },
  {
    label: "Hôtels",
    href: "/dashboard/hotels",
    icon: Hotel,
    roles: ["super_admin"],
  },
  {
    label: "Paramètres",
    href: "/dashboard/parametres",
    icon: Settings,
    roles: ["super_admin", "hotel_admin"],
  },
];

// ─── Actions sidebar (bas) ───────────────────────────────────────────
export const SIDEBAR_ACTIONS = [
  { label: "Notifications", href: "#", icon: Bell },
  { label: "Déconnexion",   href: "/connexion", icon: LogOut },
] as const;

// ─── Liens du pied de page ───────────────────────────────────────────
export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

export const FOOTER_LINKS: FooterLinkGroup[] = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "/fonctionnalites" },
      { label: "Tarifs",          href: "/tarifs" },
      { label: "Sécurité",        href: "/securite" },
      { label: "Mises à jour",    href: "/mises-a-jour" },
      { label: "Roadmap",         href: "/roadmap" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "À propos",   href: "/a-propos" },
      { label: "Contact",    href: "/contact" },
      { label: "Carrières",  href: "/carrieres" },
      { label: "Blog",       href: "/blog" },
      { label: "Partenaires", href: "/partenaires" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales",                href: "/mentions-legales" },
      { label: "Politique de confidentialité",      href: "/confidentialite" },
      { label: "CGU",                               href: "/cgu" },
      { label: "Cookies",                           href: "/cookies" },
    ],
  },
];

// ─── Rôles ───────────────────────────────────────────────────────────
export type Role = "super_admin" | "hotel_admin" | "manager" | "receptionist";
