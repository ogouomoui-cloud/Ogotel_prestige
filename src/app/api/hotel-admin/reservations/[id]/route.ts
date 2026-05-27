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

// ─── Schéma de validation mise à jour ───────────────────────────────
const updateReservationSchema = z.object({
  guest_name: z.string().min(1, "Le nom du client est requis.").optional(),
  guest_email: z.string().email("E-mail invalide.").nullable().optional(),
  guest_phone: z.string().nullable().optional(),
  room_id: z.string().uuid().nullable().optional(),
  room_type: z
    .enum(["standard", "deluxe", "suite", "presidentielle"], {
      message: "Type de chambre invalide.",
    })
    .optional(),
  check_in: z.string().min(1, "La date d'arrivée est requise.").optional(),
  check_out: z.string().min(1, "La date de départ est requise.").optional(),
  adults: z.number().int().min(1).max(20).optional(),
  children: z.number().int().min(0).max(10).optional(),
  source: z
    .string()
    .optional()
    .transform((v) =>
      v && ["direct", "booking.com", "walk-in", "phone", "email", "whatsapp"].includes(v)
        ? v
        : undefined,
    ),
  notes: z.string().max(1000, "Les notes sont trop longues (max 1000).").nullable().optional(),
  status: z
    .enum(["annulee", "no_show"], {
      message: 'Seuls les statuts "annulee" et "no_show" peuvent être définis manuellement.',
    })
    .optional(),
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

// ─── GET /api/hotel-admin/reservations/[id] ────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const result = await verifyHotelAccess();
    if (result.error) return result.error;
    const { admin, hotelId } = result;

    const { id } = await params;

    // ─── Récupérer la réservation avec jointures ──────────────────
    const { data: reservation, error } = await admin
      .from("reservations")
      .select(
        "*, room:rooms(number, room_type, price_per_night, floor, status), guest:guests(first_name, last_name, phone, email, nationality)",
      )
      .eq("id", id)
      .eq("hotel_id", hotelId)
      .single();

    if (error || !reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404 },
      );
    }

    // ─── Récupérer les paiements associés ─────────────────────────
    const { data: payments } = await admin
      .from("payments")
      .select("*")
      .eq("reservation_id", id)
      .order("paid_at", { ascending: false });

    return NextResponse.json(
      {
        reservation,
        payments: payments ?? [],
        room: reservation.room,
        guest: reservation.guest,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur détail réservation:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 },
    );
  }
}

// ─── PUT /api/hotel-admin/reservations/[id] ────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await verifyHotelAccess();
    if (authResult.error) return authResult.error;
    const { user, admin, profile, hotelId } = authResult;

    const { id } = await params;

    // ─── Vérifier que la réservation existe ───────────────────────
    const { data: existing, error: fetchError } = await admin
      .from("reservations")
      .select("*")
      .eq("id", id)
      .eq("hotel_id", hotelId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404 },
      );
    }

    // ─── Impossible de modifier une réservation terminée ──────────
    if (existing.status === "terminee") {
      return NextResponse.json(
        { error: "Impossible de modifier une réservation terminée." },
        { status: 400 },
      );
    }

    // ─── Valider le corps de la requête ───────────────────────────
    let body: z.infer<typeof updateReservationSchema>;
    try {
      const raw = await request.json();
      body = updateReservationSchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Données invalides.", details: err.flatten().fieldErrors },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
    }

    // ─── Gestion du changement de chambre ─────────────────────────
    if (body.room_id !== undefined && body.room_id !== existing.room_id) {
      // Libérer l'ancienne chambre si elle était réservée
      if (existing.room_id) {
        const { data: oldRoom } = await admin
          .from("rooms")
          .select("id, status")
          .eq("id", existing.room_id)
          .single();

        if (oldRoom && oldRoom.status === "reservee") {
          await admin
            .from("rooms")
            .update({ status: "disponible" })
            .eq("id", existing.room_id);
        }
      }

      // Réserver la nouvelle chambre si fournie
      if (body.room_id) {
        const { data: newRoom, error: newRoomError } = await admin
          .from("rooms")
          .select("id, number, status, hotel_id")
          .eq("id", body.room_id)
          .single();

        if (newRoomError || !newRoom) {
          return NextResponse.json(
            { error: "Nouvelle chambre introuvable." },
            { status: 404 },
          );
        }

        if (newRoom.hotel_id !== hotelId) {
          return NextResponse.json(
            { error: "Cette chambre n'appartient pas à votre hôtel." },
            { status: 403 },
          );
        }

        if (newRoom.status !== "disponible") {
          return NextResponse.json(
            {
              error: `La chambre n° ${newRoom.number} n'est pas disponible (statut : ${newRoom.status}).`,
            },
            { status: 409 },
          );
        }

        await admin
          .from("rooms")
          .update({ status: "reservee" })
          .eq("id", body.room_id);
      }
    }

    // ─── Gestion de l'annulation ──────────────────────────────────
    if (body.status === "annulee" && existing.room_id) {
      const { data: currentRoom } = await admin
        .from("rooms")
        .select("id, status")
        .eq("id", existing.room_id)
        .single();

      if (currentRoom && (currentRoom.status === "reservee" || currentRoom.status === "occupee")) {
        await admin
          .from("rooms")
          .update({ status: "disponible" })
          .eq("id", existing.room_id);
      }
    }

    // ─── Préparer les données de mise à jour ──────────────────────
    const updates: Record<string, unknown> = {};

    if (body.guest_name !== undefined) updates.guest_name = body.guest_name;
    if (body.guest_email !== undefined) updates.guest_email = body.guest_email;
    if (body.guest_phone !== undefined) updates.guest_phone = body.guest_phone;
    if (body.room_id !== undefined) updates.room_id = body.room_id;
    if (body.room_type !== undefined) updates.room_type = body.room_type;
    if (body.adults !== undefined) updates.adults = body.adults;
    if (body.children !== undefined) updates.children = body.children;
    if (body.source !== undefined) updates.source = body.source;
    if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;
    if (body.status !== undefined) updates.status = body.status;

    // ─── Recalcul des dates et montants ───────────────────────────
    const newCheckIn = body.check_in ? new Date(body.check_in) : new Date(existing.check_in);
    const newCheckOut = body.check_out ? new Date(body.check_out) : new Date(existing.check_out);

    if (body.check_in) updates.check_in = newCheckIn.toISOString();
    if (body.check_out) updates.check_out = newCheckOut.toISOString();

    if (body.check_in || body.check_out) {
      const numberOfNights = Math.ceil(
        (newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (numberOfNights < 1) {
        return NextResponse.json(
          { error: "Le séjour doit durer au moins 1 nuit." },
          { status: 400 },
        );
      }

      updates.number_of_nights = numberOfNights;

      // Déterminer le prix
      let pricePerNight = DEFAULT_PRICE_PER_NIGHT[body.room_type || existing.room_type] ?? 15_000;
      const effectiveRoomId = body.room_id !== undefined ? body.room_id : existing.room_id;

      if (effectiveRoomId) {
        const { data: room } = await admin
          .from("rooms")
          .select("price_per_night")
          .eq("id", effectiveRoomId)
          .single();

        if (room) {
          pricePerNight = room.price_per_night;
        }
      }

      updates.total_amount = numberOfNights * pricePerNight;
      updates.deposit_required = Math.ceil((updates.total_amount as number) * 0.3);
    }

    // ─── Appliquer la mise à jour ─────────────────────────────────
    const { data: reservation, error: updateError } = await admin
      .from("reservations")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Erreur mise à jour réservation:", updateError);
      return NextResponse.json(
        { error: "Impossible de mettre à jour la réservation." },
        { status: 500 },
      );
    }

    // ─── Journal d'activité ──────────────────────────────────────
    await admin.from("activity_logs").insert({
      hotel_id: hotelId,
      user_id: user.id,
      user_role: profile.role,
      action: "update",
      entity_type: "reservation",
      entity_id: id,
      details: {
        reservation_id: id,
        changes: Object.keys(updates),
        updated_by: profile.full_name,
        ...(body.status === "annulee" ? { cancelled: true } : {}),
        ...(body.status === "no_show" ? { no_show: true } : {}),
        ...(body.room_id !== undefined && body.room_id !== existing.room_id
          ? { room_changed: { from: existing.room_id, to: body.room_id } }
          : {}),
      },
    });

    return NextResponse.json(
      {
        message: "Réservation mise à jour avec succès.",
        reservation,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur mise à jour réservation:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 },
    );
  }
}
