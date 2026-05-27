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

    // ─── Récupérer la demande ────────────────────────────────
    const { id } = await params;

    const { data: subRequest, error: reqError } = await admin
      .from("subscription_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (reqError || !subRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    // ─── Si approuvée, récupérer les codes d'activation ─────
    let activationCodes: unknown[] = [];
    if (subRequest.status === "approved") {
      const { data: hotel } = await admin
        .from("hotels")
        .select("id")
        .eq("name", subRequest.hotel_name)
        .single();

      if (hotel) {
        const { data: codes } = await admin
          .from("activation_codes")
          .select("*")
          .eq("hotel_id", hotel.id)
          .order("created_at", { ascending: false });

        activationCodes = codes || [];
      }
    }

    return NextResponse.json(
      { request: subRequest, activation_codes: activationCodes },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur détail demande:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
