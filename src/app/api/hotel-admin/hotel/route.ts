import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Schéma de validation ─────────────────────────────────────────
const hotelUpdateSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").optional(),
  address: z.string().nullable().optional(),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères.").optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Adresse email invalide.").nullable().optional(),
  description: z.string().nullable().optional(),
  star_rating: z.number().int().min(1).max(5).optional(),
});

type HotelUpdateBody = z.infer<typeof hotelUpdateSchema>;

// ─── GET /api/hotel-admin/hotel ────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // ─── Vérifier le rôle hotel_admin ───────────────────────────
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role, hotel_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "hotel_admin") {
      return NextResponse.json(
        { error: "Accès réservé à l'administrateur de l'hôtel." },
        { status: 403 }
      );
    }

    if (!profile.hotel_id) {
      return NextResponse.json(
        { error: "Aucun hôtel rattaché." },
        { status: 403 }
      );
    }

    const hotelId = profile.hotel_id;

    // ─── Récupérer les données en parallèle ─────────────────────
    const [hotelRes, subscriptionRes, userCountRes, roomCountRes] =
      await Promise.all([
        // Données de l'hôtel
        admin
          .from("hotels")
          .select("*")
          .eq("id", hotelId)
          .single(),

        // Abonnement actif avec détails du plan
        admin
          .from("subscriptions")
          .select(
            `
            *,
            plans (
              id,
              name,
              tier,
              price_monthly,
              max_rooms,
              max_users,
              features
            )
          `
          )
          .eq("hotel_id", hotelId)
          .in("status", ["active", "trial"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),

        // Nombre d'utilisateurs de l'hôtel
        admin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("hotel_id", hotelId)
          .eq("is_active", true),

        // Nombre de chambres par statut
        admin
          .from("rooms")
          .select("status")
          .eq("hotel_id", hotelId),
      ]);

    if (hotelRes.error || !hotelRes.data) {
      return NextResponse.json(
        { error: "Hôtel introuvable." },
        { status: 404 }
      );
    }

    // Regrouper les chambres par statut
    const roomsByStatus: Record<string, number> = {};
    for (const room of roomCountRes.data || []) {
      roomsByStatus[room.status] = (roomsByStatus[room.status] || 0) + 1;
    }

    return NextResponse.json(
      {
        hotel: hotelRes.data,
        subscription: subscriptionRes.data ?? null,
        user_count: userCountRes.count ?? 0,
        room_count: {
          total: (roomCountRes.data || []).length,
          by_status: roomsByStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur récupération profil hôtel:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}

// ─── PUT /api/hotel-admin/hotel ────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // ─── Vérifier le rôle hotel_admin ───────────────────────────
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role, hotel_id, full_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "hotel_admin") {
      return NextResponse.json(
        { error: "Accès réservé à l'administrateur de l'hôtel." },
        { status: 403 }
      );
    }

    if (!profile.hotel_id) {
      return NextResponse.json(
        { error: "Aucun hôtel rattaché." },
        { status: 403 }
      );
    }

    // ─── Valider le corps de la requête ─────────────────────────
    const body = (await request.json()) as HotelUpdateBody;
    const result = hotelUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Données invalides.",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // ─── Mettre à jour l'hôtel ──────────────────────────────────
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (result.data.name !== undefined) updateData.name = result.data.name;
    if (result.data.address !== undefined) updateData.address = result.data.address;
    if (result.data.city !== undefined) updateData.city = result.data.city;
    if (result.data.phone !== undefined) updateData.phone = result.data.phone;
    if (result.data.email !== undefined) updateData.email = result.data.email;
    if (result.data.description !== undefined)
      updateData.description = result.data.description;
    if (result.data.star_rating !== undefined)
      updateData.star_rating = result.data.star_rating;

    const { data: updatedHotel, error: updateError } = await admin
      .from("hotels")
      .update(updateData)
      .eq("id", profile.hotel_id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Erreur mise à jour hôtel:", updateError);
      return NextResponse.json(
        { error: "Impossible de mettre à jour l'hôtel." },
        { status: 500 }
      );
    }

    // ─── Journal d'activité ─────────────────────────────────────
    await admin.from("activity_logs").insert({
      hotel_id: profile.hotel_id,
      user_id: user.id,
      user_role: profile.role,
      action: "update",
      entity_type: "hotel",
      entity_id: profile.hotel_id,
      details: {
        updated_fields: Object.keys(result.data),
      },
    });

    return NextResponse.json(
      {
        message: "Hôtel mis à jour avec succès.",
        hotel: updatedHotel,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur mise à jour hôtel:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
