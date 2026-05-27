import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Schéma de validation modification ────────────────────────────────
const updateRoomSchema = z.object({
  number: z
    .string()
    .min(1, "Le numéro de chambre est requis.")
    .max(10, "Le numéro ne doit pas dépasser 10 caractères.")
    .optional(),
  room_type: z
    .enum(["standard", "deluxe", "suite", "presidentielle"])
    .optional(),
  floor: z
    .number()
    .int()
    .min(-2)
    .max(99)
    .optional(),
  price_per_night: z
    .number()
    .min(0)
    .max(10_000_000)
    .optional(),
  status: z
    .enum(["disponible", "occupee", "reservee", "nettoyage", "maintenance"])
    .optional(),
  capacity: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional(),
  amenities: z.array(z.string()).optional(),
  description: z
    .string()
    .max(500, "La description est trop longue.")
    .nullable()
    .optional(),
  is_active: z.boolean().optional(),
});

// ─── Helper : vérification auth + rôle + hotel_id ─────────────────────
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

  if (!["hotel_admin", "manager"].includes(profile.role)) {
    return {
      error: NextResponse.json(
        { error: "Accès réservé aux administrateurs et managers de l'hôtel." },
        { status: 403 }
      ),
    };
  }

  if (!profile.hotel_id) {
    return { error: NextResponse.json({ error: "Aucun hôtel rattaché." }, { status: 403 }) };
  }

  return { user, admin, profile, hotelId: profile.hotel_id };
}

// ─── GET /api/hotel-admin/rooms/[id] ─────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await verifyHotelAccess();
    if (result.error) return result.error;
    const { admin, hotelId } = result;
    const { id } = await params;

    const { data: room, error } = await admin
      .from("rooms")
      .select("*")
      .eq("id", id)
      .eq("hotel_id", hotelId)
      .single();

    if (error || !room) {
      return NextResponse.json({ error: "Chambre introuvable." }, { status: 404 });
    }

    return NextResponse.json({ room }, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération chambre:", error);
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
}

// ─── PUT /api/hotel-admin/rooms/[id] ─────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyHotelAccess();
    if (authResult.error) return authResult.error;
    const { user, admin, profile, hotelId } = authResult;
    const { id } = await params;

    // ─── Vérifier que la chambre existe et appartient à l'hôtel ────
    const { data: existingRoom, error: fetchError } = await admin
      .from("rooms")
      .select("*")
      .eq("id", id)
      .eq("hotel_id", hotelId)
      .single();

    if (fetchError || !existingRoom) {
      return NextResponse.json({ error: "Chambre introuvable." }, { status: 404 });
    }

    // ─── Valider le corps de la requête ───────────────────────────
    const raw = await request.json();
    const parsed = updateRoomSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.number !== undefined) updateData.number = parsed.data.number.trim();
    if (parsed.data.room_type !== undefined) updateData.room_type = parsed.data.room_type;
    if (parsed.data.floor !== undefined) updateData.floor = parsed.data.floor;
    if (parsed.data.price_per_night !== undefined) updateData.price_per_night = parsed.data.price_per_night;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.capacity !== undefined) updateData.capacity = parsed.data.capacity;
    if (parsed.data.amenities !== undefined) updateData.amenities = parsed.data.amenities;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description?.trim() || null;
    if (parsed.data.is_active !== undefined) updateData.is_active = parsed.data.is_active;

    // ─── Vérifier l'unicité du numéro si modifié ─────────────────
    if (parsed.data.number && parsed.data.number.trim() !== existingRoom.number) {
      const { data: duplicate } = await admin
        .from("rooms")
        .select("id")
        .eq("hotel_id", hotelId)
        .eq("number", parsed.data.number.trim())
        .eq("is_active", true)
        .neq("id", id)
        .single();

      if (duplicate) {
        return NextResponse.json(
          { error: `La chambre n° ${parsed.data.number.trim()} existe déjà.` },
          { status: 409 }
        );
      }
    }

    // ─── Mettre à jour la chambre ────────────────────────────────
    const { data: room, error: updateError } = await admin
      .from("rooms")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Erreur mise à jour chambre:", updateError);
      return NextResponse.json({ error: "Impossible de mettre à jour la chambre." }, { status: 500 });
    }

    // ─── Journal d'activité ──────────────────────────────────────
    const changedFields = Object.keys(parsed.data);
    await admin.from("activity_logs").insert({
      hotel_id: hotelId,
      user_id: user.id,
      user_role: profile.role,
      action: "update",
      entity_type: "room",
      entity_id: id,
      details: {
        room_number: existingRoom.number,
        changed_fields: changedFields,
        old_values: {
          number: existingRoom.number,
          room_type: existingRoom.room_type,
          status: existingRoom.status,
          price_per_night: existingRoom.price_per_night,
        },
        new_values: {
          number: room.number,
          room_type: room.room_type,
          status: room.status,
          price_per_night: room.price_per_night,
        },
        updated_by: profile.full_name,
      },
    });

    return NextResponse.json(
      { message: `Chambre n° ${room.number} mise à jour.`, room },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur mise à jour chambre:", error);
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
}

// ─── DELETE /api/hotel-admin/rooms/[id] (suppression douce) ──────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyHotelAccess();
    if (authResult.error) return authResult.error;
    const { user, admin, profile, hotelId } = authResult;
    const { id } = await params;

    // ─── Vérifier que la chambre existe ───────────────────────────
    const { data: existingRoom, error: fetchError } = await admin
      .from("rooms")
      .select("*, reservations!inner(id)")
      .eq("id", id)
      .eq("hotel_id", hotelId)
      .maybeSingle();

    if (fetchError) {
      console.error("Erreur récupération chambre:", fetchError);
      return NextResponse.json({ error: "Impossible de vérifier la chambre." }, { status: 500 });
    }

    if (!existingRoom) {
      return NextResponse.json({ error: "Chambre introuvable." }, { status: 404 });
    }

    // ─── Vérifier s'il y a des réservations actives ────────────────
    const { data: activeReservations } = await admin
      .from("reservations")
      .select("id, status")
      .eq("room_id", id)
      .in("status", ["confirmee", "en_cours"]);

    if (activeReservations && activeReservations.length > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cette chambre : ${activeReservations.length} réservation(s) active(s).`,
          active_reservations: activeReservations.length,
        },
        { status: 409 }
      );
    }

    // ─── Suppression douce ───────────────────────────────────────
    const { error: deleteError } = await admin
      .from("rooms")
      .update({
        is_active: false,
        status: "maintenance",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (deleteError) {
      console.error("Erreur suppression chambre:", deleteError);
      return NextResponse.json({ error: "Impossible de supprimer la chambre." }, { status: 500 });
    }

    // ─── Journal d'activité ──────────────────────────────────────
    await admin.from("activity_logs").insert({
      hotel_id: hotelId,
      user_id: user.id,
      user_role: profile.role,
      action: "delete",
      entity_type: "room",
      entity_id: id,
      details: {
        room_number: existingRoom.number,
        room_type: existingRoom.room_type,
        deleted_by: profile.full_name,
      },
    });

    return NextResponse.json(
      { message: `Chambre n° ${existingRoom.number} supprimée.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur suppression chambre:", error);
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
}
