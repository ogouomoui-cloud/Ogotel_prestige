import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

// ─── GET /api/hotel-admin/activity ─────────────────────────────────
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
      .select("role, hotel_id")
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

    // ─── Récupérer les journaux d'activité ──────────────────────
    const { data: logs, error: logsError } = await admin
      .from("activity_logs")
      .select(
        `
        id,
        hotel_id,
        user_id,
        user_role,
        action,
        entity_type,
        entity_id,
        details,
        ip_address,
        created_at,
        profiles:user_id (
          id,
          full_name,
          email,
          role
        )
      `
      )
      .eq("hotel_id", hotelId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (logsError) {
      console.error("Erreur récupération journaux d'activité:", logsError);
      return NextResponse.json(
        { error: "Impossible de récupérer les journaux d'activité." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        logs: logs || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur journaux d'activité hotel_admin:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
