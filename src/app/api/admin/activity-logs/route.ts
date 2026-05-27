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
    const action = searchParams.get("action");
    const entityType = searchParams.get("entity_type");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // ─── Construire la requête ───────────────────────────────
    let query = admin
      .from("activity_logs")
      .select(`
        *,
        profiles:user_id (
          full_name,
          role
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (action) {
      query = query.eq("action", action);
    }

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error("Erreur récupération logs:", logsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des journaux d'activité." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { logs: logs || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur journaux d'activité:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
