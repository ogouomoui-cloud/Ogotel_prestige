import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { RoomType, RoomStatus } from "@/types";

// ─── GET /api/hotel-admin/stats ────────────────────────────────────
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

    // ─── Vérifier le rôle hotel_admin ou manager ─────────────────
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role, full_name, hotel_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil introuvable." },
        { status: 403 }
      );
    }

    if (!["hotel_admin", "manager"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs d'hôtel." },
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

    // ─── Récupérer toutes les données en parallèle ──────────────
    const [
      mainStatsRes,
      recentReservationsRes,
      roomsRes,
      hotelRes,
      subscriptionRes,
    ] = await Promise.all([
      // Statistiques principales via RPC
      admin.rpc("get_hotel_stats", { p_hotel_id: hotelId }),

      // Réservations récentes via RPC
      admin.rpc("get_recent_reservations", {
        p_hotel_id: hotelId,
        p_limit: 5,
      }),

      // Chambres — breakdown par type et statut
      admin
        .from("rooms")
        .select("room_type, status")
        .eq("hotel_id", hotelId),

      // Nom de l'hôtel
      admin
        .from("hotels")
        .select("name, star_rating, is_active")
        .eq("id", hotelId)
        .single(),

      // Abonnement actif avec détails du plan
      admin
        .from("subscriptions")
        .select(
          `
          id,
          status,
          starts_at,
          ends_at,
          trial_ends_at,
          max_rooms,
          max_users,
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
    ]);

    // ─── Construire le room_breakdown ───────────────────────────
    const rooms = roomsRes.data || [];

    const roomBreakdown: Record<string, Record<string, number>> = {};
    for (const room of rooms) {
      const rType: RoomType = room.room_type;
      const rStatus: RoomStatus = room.status;

      if (!roomBreakdown[rType]) {
        roomBreakdown[rType] = {
          disponible: 0,
          occupee: 0,
          maintenance: 0,
          reservee: 0,
        };
      }
      roomBreakdown[rType][rStatus] = (roomBreakdown[rType][rStatus] || 0) + 1;
    }

    // ─── Réponse ────────────────────────────────────────────────
    return NextResponse.json(
      {
        role: profile.role,
        full_name: profile.full_name,
        hotel_name: hotelRes.data?.name ?? null,
        hotel_star_rating: hotelRes.data?.star_rating ?? 0,
        hotel_is_active: hotelRes.data?.is_active ?? false,
        stats: mainStatsRes.data ?? null,
        recent_reservations: recentReservationsRes.data ?? [],
        room_breakdown: roomBreakdown,
        subscription: subscriptionRes.data ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur statistiques hotel_admin:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
