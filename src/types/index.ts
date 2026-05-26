import type { Role } from "@/lib/constants";

// ─── Plans d'abonnement ──────────────────────────────────────────
export type PlanTier = "starter" | "pro" | "prestige";

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  price_monthly: number; // en FCFA
  max_hotels: number;
  max_rooms: number;
  max_users: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  hotel_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string;
  ends_at: string | null;
  trial_ends_at: string | null;
  max_rooms: number;
  max_users: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Jointures optionnelles
  plan?: Plan;
  hotel?: Hotel;
}

// ─── Hôtel ───────────────────────────────────────────────────────
export interface Hotel {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string;
  country: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  star_rating: number;
  description: string | null;
  total_rooms: number;
  timezone: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Profil utilisateur ──────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  hotel_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Jointures optionnelles
  hotel?: { name: string };
}

// ─── Demandes d'abonnement ───────────────────────────────────────
export type RequestStatus = "pending" | "approved" | "rejected" | "expired";

export interface SubscriptionRequest {
  id: string;
  hotel_name: string;
  contact_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  city: string | null;
  room_count: number | null;
  desired_plan: PlanTier;
  message: string | null;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Codes d'activation ──────────────────────────────────────────
export type CodeStatus = "unused" | "used" | "expired" | "cancelled";

export interface ActivationCode {
  id: string;
  code: string;
  hotel_id: string;
  plan_id: string;
  status: CodeStatus;
  created_by: string | null;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Chambres ────────────────────────────────────────────────────
export type RoomType = "standard" | "deluxe" | "suite" | "presidentielle";
export type RoomStatus = "disponible" | "occupee" | "maintenance" | "reservee";

export interface Room {
  id: string;
  hotel_id: string;
  number: string;
  floor: number;
  room_type: RoomType;
  status: RoomStatus;
  price_per_night: number; // en FCFA
  capacity: number;
  amenities: string[];
  description: string | null;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Clients ─────────────────────────────────────────────────────
export interface Guest {
  id: string;
  hotel_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  id_document_type: string | null;
  id_document_number: string | null;
  nationality: string;
  city: string | null;
  notes: string | null;
  is_vip: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Réservations ───────────────────────────────────────────────
export type ReservationStatus =
  | "confirmee"
  | "en_cours"
  | "terminee"
  | "annulee"
  | "no_show";

export interface Reservation {
  id: string;
  hotel_id: string;
  guest_id: string | null;
  room_id: string | null;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  number_of_nights: number;
  status: ReservationStatus;
  adults: number;
  children: number;
  room_type: RoomType;
  total_amount: number; // en FCFA
  paid_amount: number; // en FCFA
  deposit_required: number;
  source: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Jointures optionnelles
  room?: Room;
  guest?: Guest;
}

// ─── Paiements ───────────────────────────────────────────────────
export type PaymentMethod =
  | "especes"
  | "carte"
  | "mobile_money"
  | "virement"
  | "cheque";

export type PaymentStatus =
  | "en_attente"
  | "payee"
  | "annulee"
  | "remboursee";

export interface Payment {
  id: string;
  hotel_id: string;
  reservation_id: string | null;
  guest_id: string | null;
  amount: number; // en FCFA
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  paid_by: string | null;
  paid_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Jointures optionnelles
  reservation?: Reservation;
  guest?: Guest;
}

// ─── Journaux d'activité ─────────────────────────────────────────
export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "approve"
  | "reject"
  | "activate"
  | "export";

export interface ActivityLog {
  id: string;
  hotel_id: string | null;
  user_id: string | null;
  user_role: Role | null;
  action: ActivityAction;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// ─── Labels pour l'affichage ─────────────────────────────────────
export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  starter: "Starter",
  pro: "Pro",
  prestige: "Prestige",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: "Essai",
  active: "Actif",
  past_due: "En retard",
  cancelled: "Annulé",
  expired: "Expiré",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
  expired: "Expirée",
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  standard: "Standard",
  deluxe: "Deluxe",
  suite: "Suite",
  presidentielle: "Présidentielle",
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  disponible: "Disponible",
  occupee: "Occupée",
  maintenance: "Maintenance",
  reservee: "Réservée",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  confirmee: "Confirmée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
  no_show: "No-show",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  especes: "Espèces",
  carte: "Carte",
  mobile_money: "Mobile Money",
  virement: "Virement",
  cheque: "Chèque",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  en_attente: "En attente",
  payee: "Payé",
  annulee: "Annulé",
  remboursee: "Remboursé",
};

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  login: "Connexion",
  logout: "Déconnexion",
  approve: "Approbation",
  reject: "Rejet",
  activate: "Activation",
  export: "Export",
};
