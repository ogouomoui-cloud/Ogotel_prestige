import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Vérifier le rôle
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil non trouvé." },
        { status: 401 }
      );
    }

    if (profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Accès non autorisé." },
        { status: 403 }
      );
    }

    // Filtrer par statut si demandé
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let query = supabaseAdmin
      .from("subscription_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Erreur récupération demandes:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des demandes." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: requests }, { status: 200 });
  } catch (error) {
    console.error("Erreur demandes d'abonnement:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
