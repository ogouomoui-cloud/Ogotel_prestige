import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

// ─── Rôles autorisés pour la réception ──────────────────────────────
const ALLOWED_ROLES = ["hotel_admin", "manager", "receptionist"] as const;

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

// ─── PATCH /api/hotel-admin/reservations/[id]/checkin ──────────────
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await verifyHotelAccess();
    if (authResult.error) return authResult.error;
    const { user, admin, profile, hotelId } = authResult;

    const { id } = await params;

    // ─── Vérifier que la réservation existe ───────────────────────
    const { data: reservation, error: fetchError } = await admin
      .from("reservations")
      .select(
        "*, room:rooms(number, room_type, status)",
      )
      .eq("id", id)
      .eq("hotel_id", hotelId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404 },
      );
    }

    // ─── Vérifier le statut (seule "confirmee" peut check-in) ─────
    if (reservation.status !== "confirmee") {
      return NextResponse.json(
        {
          error: `Impossible d'effectuer le check-in pour une réservation au statut "${reservation.status}". Seule une réservation confirmée peut faire l'objet d'un check-in.`,
        },
        { status: 400 },
      );
    }

    // ─── Vérifier qu'une chambre est assignée ─────────────────────
    if (!reservation.room_id) {
      return NextResponse.json(
        { error: "Aucune chambre n'est assignée à cette réservation. Veuillez d'abord attribuer une chambre." },
        { status: 400 },
      );
    }

    // ─── Mettre à jour la réservation → "en_cours" ────────────────
    const { data: updatedReservation, error: updateResError } = await admin
      .from("reservations")
      .update({
        status: "en_cours",
        actual_check_in: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateResError) {
      console.error("Erreur mise à jour réservation check-in:", updateResError);
      return NextResponse.json(
        { error: "Impossible d'effectuer le check-in." },
        { status: 500 },
      );
    }

    // ─── Mettre à jour la chambre → "occupee" ────────────────────
    const { error: roomUpdateError } = await admin
      .from("rooms")
      .update({ status: "occupee" })
      .eq("id", reservation.room_id);

    if (roomUpdateError) {
      console.error("Erreur mise à jour chambre check-in:", roomUpdateError);
      // Ne pas bloquer le check-in si la chambre ne se met pas à jour
    }

    // ─── Journal d'activité ──────────────────────────────────────
    const roomNumber =
      (reservation.room as { number?: string } | null)?.number ?? "non assignée";

    await admin.from("activity_logs").insert({
      hotel_id: hotelId,
      user_id: user.id,
      user_role: profile.role,
      action: "update",
      entity_type: "reservation",
      entity_id: id,
      details: {
        event: "check_in",
        reservation_id: id,
        guest_name: reservation.guest_name,
        room_number: roomNumber,
        room_id: reservation.room_id,
        check_in_date: new Date().toISOString(),
        performed_by: profile.full_name,
      },
    });

    return NextResponse.json(
      {
        message: "Check-in effectué avec succès.",
        reservation: updatedReservation,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur check-in:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 },
    );
  }
}
