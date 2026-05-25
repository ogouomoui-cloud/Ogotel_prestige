import type { Role } from "@/lib/constants";

// ─── Profil utilisateur ──────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: Role;
  hotel_id?: string;
  is_active: boolean;
  created_at: string;
}

// ─── Hôtel ───────────────────────────────────────────────────────────
export interface Hotel {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  logo_url?: string;
  star_rating: number;
  total_rooms: number;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Chambre ────────────────────────────────────────────────────────
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
  created_at: string;
}

export type RoomType = "standard" | "deluxe" | "suite" | "presidentielle";
export type RoomStatus = "disponible" | "occupée" | "maintenance" | "réservée";

// ─── Réservation ─────────────────────────────────────────────────────
export interface Reservation {
  id: string;
  hotel_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room_id: string;
  check_in: string;
  check_out: string;
  status: ReservationStatus;
  total_amount: number; // en FCFA
  notes?: string;
  created_at: string;
}

export type ReservationStatus =
  | "confirmée"
  | "en cours"
  | "terminée"
  | "annulée";

// ─── Facture ────────────────────────────────────────────────────────
export interface Invoice {
  id: string;
  hotel_id: string;
  reservation_id: string;
  amount: number;
  status: InvoiceStatus;
  issued_at: string;
  due_date: string;
}

export type InvoiceStatus = "payée" | "en attente" | "en retard";
