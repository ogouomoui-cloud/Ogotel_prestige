import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

/**
 * POST /api/admin/requests/[id]/approve
 *
 * Workflow complet (super_admin uniquement) :
 * 1. Valider la demande d'abonnement
 * 2. Créer l'hôtel
 * 3. Récupérer le plan correspondant
 * 4. Créer l'abonnement (trial 14j)
 * 5. Générer le code d'activation via RPC
 * 6. Marquer la demande comme approuvée
 * 7. Journaliser l'action
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
    const { notes } = body;

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

    // ─── Récupérer le plan correspondant ──────────────────────
    const { data: plan, error: planError } = await admin
      .from("plans")
      .select("*")
      .eq("tier", subRequest.desired_plan)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Plan non trouvé pour le tier " + subRequest.desired_plan },
        { status: 500 }
      );
    }

    // ─── 1. Créer l'hôtel ────────────────────────────────────
    const { data: hotel, error: hotelError } = await admin
      .from("hotels")
      .insert({
        name: subRequest.hotel_name,
        slug: slugify(subRequest.hotel_name),
        email: subRequest.email,
        phone: subRequest.phone,
        city: subRequest.city || "Abidjan",
        country: "Côte d'Ivoire",
        total_rooms: subRequest.room_count || 0,
      })
      .select("id")
      .single();

    if (hotelError || !hotel) {
      console.error("Erreur création hôtel:", hotelError);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'hôtel." },
        { status: 500 }
      );
    }

    // ─── 2. Créer l'abonnement (trial 14 jours) ──────────────
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { error: subError } = await admin.from("subscriptions").insert({
      hotel_id: hotel.id,
      plan_id: plan.id,
      status: "trial",
      starts_at: new Date().toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      max_rooms: plan.max_rooms,
      max_users: plan.max_users,
      notes: notes || null,
    });

    if (subError) {
      console.error("Erreur création abonnement:", subError);
      // Nettoyer l'hôtel créé
      await admin.from("hotels").delete().eq("id", hotel.id);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'abonnement." },
        { status: 500 }
      );
    }

    // ─── 3. Générer le code d'activation ──────────────────────
    const { data: activationCode, error: codeError } = await admin.rpc(
      "generate_activation_code",
      { p_hotel_id: hotel.id, p_plan_id: plan.id }
    );

    if (codeError || !activationCode) {
      console.error("Erreur génération code:", codeError);
      return NextResponse.json(
        { error: "Erreur lors de la génération du code d'activation." },
        { status: 500 }
      );
    }

    // ─── 4. Mettre à jour la demande ─────────────────────────
    await admin
      .from("subscription_requests")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq("id", id);

    // ─── 5. Journaliser l'action ─────────────────────────────
    await admin.from("activity_logs").insert({
      hotel_id: hotel.id,
      user_id: user.id,
      user_role: "super_admin",
      action: "approve",
      entity_type: "subscription_request",
      entity_id: id,
      details: {
        hotel_name: subRequest.hotel_name,
        plan_name: plan.name,
        activation_code: activationCode,
      },
      ip_address: request.headers.get("x-forwarded-for"),
    });

    // ─── 6. Réponse ──────────────────────────────────────────
    const formattedCode = (activationCode as string).replace(
      /(.{4})(?=.)/g,
      "$1-"
    );

    return NextResponse.json(
      {
        success: true,
        activation_code: activationCode,
        hotel_id: hotel.id,
        hotel_name: subRequest.hotel_name,
        plan_name: plan.name,
        formatted_code: formattedCode,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur approbation demande:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
