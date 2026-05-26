import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

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

    const supabaseAdmin = createAdminClient();

    // Récupérer le profil avec hotel_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, hotel_id, full_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil non trouvé." },
        { status: 401 }
      );
    }

    // Statistiques pour le super administrateur
    if (profile.role === "super_admin") {
      const [hotelsRes, roomsRes, pendingRes, reservationsRes] =
        await Promise.all([
          supabaseAdmin
            .from("hotels")
            .select("id", { count: "exact", head: true }),
          supabaseAdmin
            .from("rooms")
            .select("id", { count: "exact", head: true }),
          supabaseAdmin
            .from("subscription_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabaseAdmin
            .from("reservations")
            .select("id, created_at", { count: "exact", head: true })
            .gte(
              "created_at",
              new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              ).toISOString()
            ),
        ]);

      return NextResponse.json(
        {
          role: "super_admin",
          full_name: profile.full_name,
          hotels: hotelsRes.count ?? 0,
          rooms: roomsRes.count ?? 0,
          pending_requests: pendingRes.count ?? 0,
          monthly_reservations: reservationsRes.count ?? 0,
        },
        { status: 200 }
      );
    }

    // Statistiques pour un administrateur d'hôtel
    if (profile.hotel_id) {
      const [statsRes, recentRes, roomsRes] = await Promise.all([
        supabaseAdmin.rpc("get_hotel_stats", {
          p_hotel_id: profile.hotel_id,
        }),
        supabaseAdmin.rpc("get_recent_reservations", {
          p_hotel_id: profile.hotel_id,
          p_limit: 10,
        }),
        supabaseAdmin
          .from("rooms")
          .select("room_type, status")
          .eq("hotel_id", profile.hotel_id),
      ]);

      const hotelStats = statsRes.data || {};
      const recentReservations = recentRes.data || [];
      const rooms = roomsRes.data || [];

      // Répartition des chambres par type
      const roomBreakdown: Record<string, { total: number; statuses: Record<string, number> }> = {};
      for (const room of rooms) {
        const type = room.room_type;
        if (!roomBreakdown[type]) {
          roomBreakdown[type] = { total: 0, statuses: {} };
        }
        roomBreakdown[type].total += 1;
        const status = room.status;
        roomBreakdown[type].statuses[status] =
          (roomBreakdown[type].statuses[status] || 0) + 1;
      }

      return NextResponse.json(
        {
          role: profile.role,
          full_name: profile.full_name,
          hotel_id: profile.hotel_id,
          ...hotelStats,
          recent_reservations: recentReservations,
          room_breakdown: roomBreakdown,
        },
        { status: 200 }
      );
    }

    // Utilisateur sans rôle ni hôtel
    return NextResponse.json(
      {
        role: profile.role,
        full_name: profile.full_name,
        message: "Aucune statistique disponible.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur statistiques tableau de bord:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
