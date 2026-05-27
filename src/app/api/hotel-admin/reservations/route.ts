import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Rôles autorisés pour la réception ──────────────────────────────
const ALLOWED_ROLES = ["hotel_admin", "manager", "receptionist"] as const;

// ─── Constantes prix par défaut (FCFA) ──────────────────────────────
const DEFAULT_PRICE_PER_NIGHT: Record<string, number> = {
  standard: 15_000,
  deluxe: 25_000,
  suite: 50_000,
  presidentielle: 100_000,
};

// ─── Schéma de validation création ──────────────────────────────────
const createReservationSchema = z
  .object({
    guest_id: z.string().uuid().optional(),
    guest_name: z.string().min(1, "Le nom du client est requis."),
    guest_email: z.string().email("E-mail invalide.").nullable().optional(),
    guest_phone: z.string().nullable().optional(),
    room_id: z.string().uuid().optional(),
    room_type: z.enum(["standard", "deluxe", "suite", "presidentielle"], {
      errorMap: () => ({ message: "Type de chambre invalide." }),
    }),
    check_in: z.string().min(1, "La date d'arrivée est requise."),
    check_out: z.string().min(1, "La date de départ est requise."),
    adults: z.number().int().min(1).max(20).default(1),
    children: z.number().int().min(0).max(10).default(0),
    source: z
      .string()
      .default("direct")
      .transform((v) =>
        ["direct", "booking.com", "walk-in", "phone", "email", "whatsapp"].includes(v)
          ? v
          : "direct",
      ),
    notes: z.string().max(1000, "Les notes sont trop longues (max 1000).").nullable().optional(),
  })
  .refine((d) => new Date(d.check_out) > new Date(d.check_in), {
    message: "La date de départ doit être après la date d'arrivée.",
    path: ["check_out"],
  });

// ─── Helper : vérification auth + rôle + hotel_id ──────────────────
async function verifyHotelAccess() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role, hotel_id, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: "Profil introuvable." }, { status: 403 }) };
  }

  if (!ALLOWED_ROLES.includes(profile.role)) {
    return {
      error: NextResponse.json(
        { error: "Accès réservé au personnel autorisé de l'hôtel." },
        { status: 403 },
      ),
    };
  }

  if (!profile.hotel_id) {
    return { error: NextResponse.json({ error: "Aucun hôtel rattaché." }, { status: 403 }) };
  }

  return { user, admin, profile, hotelId: profile.hotel_id };
}

// ─── GET /api/hotel-admin/reservations ─────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const result = await verifyHotelAccess();
    if (result.error) return result.error;
    const { admin, hotelId } = result;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const room_type = searchParams.get("room_type") || "";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";

    // ─── Query de base avec jointures ──────────────────────────────
    let query = admin
      .from("reservations")
      .select(
        "*, room:rooms(number, room_type, price_per_night, floor, status), guest:guests(first_name, last_name)",
      )
      .eq("hotel_id", hotelId)
      .order("created_at", { ascending: false });

    // ─── Filtres ──────────────────────────────────────────────────
    if (
      status &&
      ["confirmee", "en_cours", "terminee", "annulee", "no_show"].includes(status)
    ) {
      query = query.eq("status", status);
    }

    if (
      room_type &&
      ["standard", "deluxe", "suite", "presidentielle"].includes(room_type)
    ) {
      query = query.eq("room_type", room_type);
    }

    if (date_from) {
      query = query.gte("check_in", date_from);
    }

    if (date_to) {
      query = query.lte("check_out", date_to);
    }

    // ─── Recherche par nom client ou numéro de chambre ────────────
    // Supabase ne filtre pas sur les colonnes jointes directement,
    // on filtre en deux passes si search est fourni.
    const { data: reservations, error } = await query;

    if (error) {
      console.error("Erreur récupération réservations:", error);
      return NextResponse.json(
        { error: "Impossible de charger les réservations." },
        { status: 500 },
      );
    }

    let filtered = reservations ?? [];

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter((r) => {
        const guestName = (r.guest_name || "").toLowerCase();
        const roomNumber = (r.room as { number?: string } | null)?.number || "";
        const guestFullName =
          [
            (r.guest as { first_name?: string } | null)?.first_name,
            (r.guest as { last_name?: string } | null)?.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return (
          guestName.includes(term) ||
          roomNumber.toLowerCase().includes(term) ||
          guestFullName.includes(term)
        );
      });
    }

    // ─── Compteurs par statut ─────────────────────────────────────
    const { data: allReservations } = await admin
      .from("reservations")
      .select("status")
      .eq("hotel_id", hotelId);

    const statusCounts: Record<string, number> = {};
    for (const r of allReservations ?? []) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    return NextResponse.json(
      {
        reservations: filtered,
        status_counts: statusCounts,
        filters: { search, status, room_type, date_from, date_to },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur liste réservations:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 },
    );
  }
}

// ─── POST /api/hotel-admin/reservations ────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyHotelAccess();
    if (authResult.error) return authResult.error;
    const { user, admin, profile, hotelId } = authResult;

    // ─── Valider le corps de la requête ───────────────────────────
    let body: z.infer<typeof createReservationSchema>;
    try {
      const raw = await request.json();
      body = createReservationSchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Données invalides.", details: err.flatten().fieldErrors },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
    }

    const checkInDate = new Date(body.check_in);
    const checkOutDate = new Date(body.check_out);
    const numberOfNights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (numberOfNights < 1) {
      return NextResponse.json(
        { error: "Le séjour doit durer au moins 1 nuit." },
        { status: 400 },
      );
    }

    // ─── Déterminer le prix par nuit ──────────────────────────────
    let pricePerNight = DEFAULT_PRICE_PER_NIGHT[body.room_type] ?? 15_000;

    // Si un room_id est fourni, vérifier la chambre et utiliser son prix
    if (body.room_id) {
      const { data: room, error: roomError } = await admin
        .from("rooms")
        .select("id, number, price_per_night, status, hotel_id")
        .eq("id", body.room_id)
        .single();

      if (roomError || !room) {
        return NextResponse.json(
          { error: "Chambre introuvable." },
          { status: 404 },
        );
      }

      if (room.hotel_id !== hotelId) {
        return NextResponse.json(
          { error: "Cette chambre n'appartient pas à votre hôtel." },
          { status: 403 },
        );
      }

      if (room.status !== "disponible") {
        return NextResponse.json(
          { error: `La chambre n° ${room.number} n'est pas disponible (statut : ${room.status}).` },
          { status: 409 },
        );
      }

      pricePerNight = room.price_per_night;

      // Mettre la chambre en "réservée"
      const { error: roomUpdateError } = await admin
        .from("rooms")
        .update({ status: "reservee" })
        .eq("id", body.room_id);

      if (roomUpdateError) {
        console.error("Erreur mise à jour chambre:", roomUpdateError);
        return NextResponse.json(
          { error: "Impossible de réserver la chambre." },
          { status: 500 },
        );
      }
    }

    // ─── Calculs automatiques ─────────────────────────────────────
    const totalAmount = numberOfNights * pricePerNight;
    const depositRequired = Math.ceil(totalAmount * 0.3);

    // ─── Si guest_id fourni, récupérer les infos du client ────────
    let guestName = body.guest_name;
    let guestEmail: string | null = body.guest_email ?? null;
    let guestPhone: string | null = body.guest_phone ?? null;

    if (body.guest_id) {
      const { data: guest, error: guestError } = await admin
        .from("guests")
        .select("id, first_name, last_name, email, phone, hotel_id")
        .eq("id", body.guest_id)
        .single();

      if (guestError || !guest) {
        return NextResponse.json(
          { error: "Client introuvable." },
          { status: 404 },
        );
      }

      if (guest.hotel_id !== hotelId) {
        return NextResponse.json(
          { error: "Ce client n'appartient pas à votre hôtel." },
          { status: 403 },
        );
      }

      guestName = `${guest.first_name} ${guest.last_name}`;
      guestEmail = guest.email;
      guestPhone = guest.phone;
    }

    // ─── Créer la réservation ────────────────────────────────────
    const { data: reservation, error: insertError } = await admin
      .from("reservations")
      .insert({
        hotel_id: hotelId,
        guest_id: body.guest_id ?? null,
        room_id: body.room_id ?? null,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        check_in: checkInDate.toISOString(),
        check_out: checkOutDate.toISOString(),
        number_of_nights: numberOfNights,
        status: "confirmee",
        adults: body.adults ?? 1,
        children: body.children ?? 0,
        room_type: body.room_type,
        total_amount: totalAmount,
        paid_amount: 0,
        deposit_required: depositRequired,
        source: body.source ?? "direct",
        notes: body.notes?.trim() || null,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Erreur création réservation:", insertError);
      return NextResponse.json(
        { error: "Impossible de créer la réservation." },
        { status: 500 },
      );
    }

    // ─── Journal d'activité ──────────────────────────────────────
    await admin.from("activity_logs").insert({
      hotel_id: hotelId,
      user_id: user.id,
      user_role: profile.role,
      action: "create",
      entity_type: "reservation",
      entity_id: reservation.id,
      details: {
        reservation_id: reservation.id,
        guest_name: guestName,
        room_type: body.room_type,
        room_id: body.room_id ?? null,
        check_in: body.check_in,
        check_out: body.check_out,
        number_of_nights: numberOfNights,
        total_amount: totalAmount,
        deposit_required: depositRequired,
        source: body.source ?? "direct",
        created_by: profile.full_name,
      },
    });

    return NextResponse.json(
      {
        message: `Réservation pour ${guestName} créée avec succès.`,
        reservation,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erreur création réservation:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 },
    );
  }
}
