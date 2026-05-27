import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // ─── Récupérer l'hôtel ───────────────────────────────────
    const { id } = await params;

    const { data: hotel, error: hotelError } = await admin
      .from("hotels")
      .select("*")
      .eq("id", id)
      .single();

    if (hotelError || !hotel) {
      return NextResponse.json(
        { error: "Hôtel non trouvé." },
        { status: 404 }
      );
    }

    // ─── Récupérer l'abonnement actif + plan ─────────────────
    const { data: subscription } = await admin
      .from("subscriptions")
      .select(`
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
      `)
      .eq("hotel_id", id)
      .in("status", ["active", "trial"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // ─── Récupérer l'administrateur de l'hôtel ───────────────
    const { data: adminProfile } = await admin
      .from("profiles")
      .select("id, email, full_name, role, is_active, created_at")
      .eq("hotel_id", id)
      .eq("role", "hotel_admin")
      .single();

    // ─── Récupérer les codes d'activation ────────────────────
    const { data: activationCodes } = await admin
      .from("activation_codes")
      .select("*")
      .eq("hotel_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json(
      {
        hotel: {
          ...hotel,
          room_count: hotel.total_rooms || 0,
        },
        subscription: subscription || null,
        admin_profile: adminProfile || null,
        activation_codes: activationCodes || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur détail hôtel:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
