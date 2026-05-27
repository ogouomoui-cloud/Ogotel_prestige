import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/requests/[id]/reject
 *
 * Rejeter une demande d'abonnement (super_admin uniquement).
 */
export async function POST(
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

    // ─── Parser le body ───────────────────────────────────────
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "La raison du refus est requise." },
        { status: 400 }
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

    if (subRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Cette demande n'est plus en attente." },
        { status: 400 }
      );
    }

    // ─── Rejeter la demande ──────────────────────────────────
    const { error: updateError } = await admin
      .from("subscription_requests")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason.trim(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Erreur rejet demande:", updateError);
      return NextResponse.json(
        { error: "Erreur lors du rejet de la demande." },
        { status: 500 }
      );
    }

    // ─── Journaliser l'action ────────────────────────────────
    await admin.from("activity_logs").insert({
      user_id: user.id,
      user_role: "super_admin",
      action: "reject",
      entity_type: "subscription_request",
      entity_id: id,
      details: {
        hotel_name: subRequest.hotel_name,
        rejection_reason: reason.trim(),
      },
      ip_address: request.headers.get("x-forwarded-for"),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Demande rejetée avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur rejet demande:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
