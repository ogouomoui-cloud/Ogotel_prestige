import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Schéma de validation création ────────────────────────────────────
const createRoomSchema = z.object({
  number: z
    .string()
    .min(1, "Le numéro de chambre est requis.")
    .max(10, "Le numéro ne doit pas dépasser 10 caractères."),
  room_type: z.enum(["standard", "deluxe", "suite", "presidentielle"], {
    errorMap: () => ({ message: "Type de chambre invalide." }),
  }),
  floor: z
    .number()
    .int()
    .min(-2, "L'étage minimum est -2.")
    .max(99, "L'étage maximum est 99."),
  price_per_night: z
    .number()
    .min(0, "Le prix ne peut pas être négatif.")
    .max(10_000_000, "Le prix est trop élevé."),
  status: z
    .enum(["disponible", "occupee", "reservee", "nettoyage", "maintenance"])
    .default("disponible"),
  capacity: z
    .number()
    .int()
    .min(1, "La capacité minimale est 1.")
    .max(20, "La capacité maximale est 20.")
    .default(2),
  amenities: z.array(z.string()).default([]),
  description: z.string().max(500, "La description est trop longue.").nullable().optional(),
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

// ─── GET /api/hotel-admin/rooms ──────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const result = await verifyHotelAccess();
    if (result.error) return result.error;
    const { admin, hotelId } = result;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const room_type = searchParams.get("room_type") || "";
    const floor = searchParams.get("floor") || "";

    // ─── Query de base ────────────────────────────────────────────
    let query = admin
      .from("rooms")
      .select("*")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .order("floor", { ascending: true })
      .order("number", { ascending: true });

    // ─── Filtres ─────────────────────────────────────────────────
    if (search) {
      query = query.or(`number.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (status && ["disponible", "occupee", "reservee", "nettoyage", "maintenance"].includes(status)) {
      query = query.eq("status", status);
    }
    if (room_type && ["standard", "deluxe", "suite", "presidentielle"].includes(room_type)) {
      query = query.eq("room_type", room_type);
    }
    if (floor) {
      query = query.eq("floor", parseInt(floor, 10));
    }

    const { data: rooms, error } = await query;

    if (error) {
      console.error("Erreur récupération chambres:", error);
      return NextResponse.json({ error: "Impossible de charger les chambres." }, { status: 500 });
    }

    // ─── Quota chambres ──────────────────────────────────────────
    const { count: totalActive } = await admin
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("hotel_id", hotelId)
      .eq("is_active", true);

    const { data: subscription } = await admin
      .from("subscriptions")
      .select("max_rooms")
      .eq("hotel_id", hotelId)
      .in("status", ["active", "trial"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const maxRooms = (subscription as { max_rooms?: number } | null)?.max_rooms ?? 20;

    // ─── Stats par statut ────────────────────────────────────────
    const { data: allRooms } = await admin
      .from("rooms")
      .select("status")
      .eq("hotel_id", hotelId)
      .eq("is_active", true);

    const statusCounts: Record<string, number> = {};
    for (const r of allRooms ?? []) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    return NextResponse.json(
      {
        rooms: rooms ?? [],
        filters: { search, status, room_type, floor },
        quota: {
          used: totalActive ?? 0,
          max: maxRooms,
          remaining: Math.max(0, maxRooms - (totalActive ?? 0)),
        },
        status_counts: statusCounts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur liste chambres:", error);
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
}

// ─── POST /api/hotel-admin/rooms ──────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyHotelAccess();
    if (authResult.error) return authResult.error;
    const { user, admin, profile, hotelId } = authResult;

    // ─── Valider le corps de la requête ───────────────────────────
    let body: z.infer<typeof createRoomSchema>;
    try {
      const raw = await request.json();
      body = createRoomSchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Données invalides.", details: err.flatten().fieldErrors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
    }

    // ─── Vérifier le quota de chambres ────────────────────────────
    const { count: currentCount } = await admin
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("hotel_id", hotelId)
      .eq("is_active", true);

    const { data: subscription } = await admin
      .from("subscriptions")
      .select("max_rooms")
      .eq("hotel_id", hotelId)
      .in("status", ["active", "trial"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const maxRooms = (subscription as { max_rooms?: number } | null)?.max_rooms ?? 20;
    const usedCount = currentCount ?? 0;

    if (usedCount >= maxRooms) {
      return NextResponse.json(
        {
          error: `Quota de chambres atteint (${usedCount}/${maxRooms}). Mettez à niveau votre abonnement.`,
          quota: { used: usedCount, max: maxRooms, remaining: 0 },
        },
        { status: 403 }
      );
    }

    // ─── Vérifier que le numéro n'existe pas déjà ─────────────────
    const { data: existingRoom } = await admin
      .from("rooms")
      .select("id")
      .eq("hotel_id", hotelId)
      .eq("number", body.number.trim())
      .eq("is_active", true)
      .single();

    if (existingRoom) {
      return NextResponse.json(
        { error: `La chambre n° ${body.number.trim()} existe déjà dans votre hôtel.` },
        { status: 409 }
      );
    }

    // ─── Créer la chambre ────────────────────────────────────────
    const { data: room, error: insertError } = await admin
      .from("rooms")
      .insert({
        hotel_id: hotelId,
        number: body.number.trim(),
        room_type: body.room_type,
        floor: body.floor,
        price_per_night: body.price_per_night,
        status: body.status ?? "disponible",
        capacity: body.capacity ?? 2,
        amenities: body.amenities ?? [],
        description: body.description?.trim() || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Erreur création chambre:", insertError);
      return NextResponse.json(
        { error: "Impossible de créer la chambre." },
        { status: 500 }
      );
    }

    // ─── Journal d'activité ──────────────────────────────────────
    await admin.from("activity_logs").insert({
      hotel_id: hotelId,
      user_id: user.id,
      user_role: profile.role,
      action: "create",
      entity_type: "room",
      entity_id: room.id,
      details: {
        room_number: body.number.trim(),
        room_type: body.room_type,
        floor: body.floor,
        price_per_night: body.price_per_night,
        created_by: profile.full_name,
      },
    });

    return NextResponse.json(
      {
        message: `Chambre n° ${body.number.trim()} créée avec succès.`,
        room,
        quota: {
          used: usedCount + 1,
          max: maxRooms,
          remaining: Math.max(0, maxRooms - (usedCount + 1)),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création chambre:", error);
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
}
