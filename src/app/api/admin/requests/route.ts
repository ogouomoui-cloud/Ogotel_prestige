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

    let query = admin
      .from("subscription_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: requests, error: requestsError } = await query;

    if (requestsError) {
      console.error("Erreur récupération demandes:", requestsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des demandes." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { requests: requests || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur liste des demandes:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
