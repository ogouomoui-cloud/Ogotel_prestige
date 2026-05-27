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

    // ─── Récupérer les abonnements avec hôtel et plan ────────
    let query = admin
      .from("subscriptions")
      .select(`
        *,
        hotels (
          id,
          name,
          city,
          is_active
        ),
        plans (
          id,
          name,
          tier,
          price_monthly
        )
      `)
      .order("created_at", { ascending: false });

    if (
      status &&
      ["active", "trial", "past_due", "cancelled", "expired"].includes(status)
    ) {
      query = query.eq("status", status);
    }

    const { data: subscriptions, error: subsError } = await query;

    if (subsError) {
      console.error("Erreur récupération abonnements:", subsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des abonnements." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { subscriptions: subscriptions || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur liste des abonnements:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
