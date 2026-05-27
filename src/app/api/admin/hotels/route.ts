import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    // ─── Vérifier le rôle super_admin ─────────────────────────
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Accès réservé au super administrateur." },
        { status: 403 }
      );
    }

    // ─── Paramètres de filtre ────────────────────────────────
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // ─── Récupérer les hôtels avec abonnement et plan ────────
    let hotelsQuery = admin
      .from("hotels")
      .select(`
        *,
        subscriptions!inner (
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
            price_monthly
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (status && ["active", "suspended"].includes(status)) {
      hotelsQuery = hotelsQuery.eq(
        "is_active",
        status === "active"
      );
    }

    if (search) {
      hotelsQuery = hotelsQuery.ilike("name", `%${search}%`);
    }

    const { data: hotels, error: hotelsError } = await hotelsQuery;

    if (hotelsError) {
      console.error("Erreur récupération hôtels:", hotelsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des hôtels." },
        { status: 500 }
      );
    }

    // ─── Récupérer le nombre d'utilisateurs par hôtel ────────
    const hotelIds = (hotels || []).map((h) => h.id);

    let userCounts: Record<string, number> = {};
    if (hotelIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("hotel_id")
        .in("hotel_id", hotelIds)
        .eq("is_active", true);

      userCounts = (profiles || []).reduce<Record<string, number>>(
        (acc, p) => {
          if (p.hotel_id) {
            acc[p.hotel_id] = (acc[p.hotel_id] || 0) + 1;
          }
          return acc;
        },
        {}
      );
    }

    // ─── Enrichir les hôtels avec le nombre d'utilisateurs ───
    const enrichedHotels = (hotels || []).map((hotel) => ({
      ...hotel,
      user_count: userCounts[hotel.id] || 0,
    }));

    return NextResponse.json(
      { hotels: enrichedHotels },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur liste des hôtels:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
