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
 * POST /api/subscription/approve
 *
 * Flow (super_admin uniquement) :
 * 1. Valider la demande d'abonnement
 * 2. Créer l'hôtel
 * 3. Récupérer le plan correspondant
 * 4. Créer l'abonnement (trial 14j)
 * 5. Générer le code d'activation
 * 6. Marquer la demande comme approuvée
 */
export async function POST(request: NextRequest) {
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
    const { request_id, notes } = body;

    if (!request_id || typeof request_id !== "string") {
      return NextResponse.json(
        { error: "L'identifiant de la demande est requis." },
        { status: 400 }
      );
    }

    // ─── Récupérer la demande ────────────────────────────────
    const { data: subRequest, error: reqError } = await admin
      .from("subscription_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (reqError || !subRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    if (subRequest.status === "approved") {
      return NextResponse.json(
        { error: "Cette demande a déjà été approuvée." },
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
        city: "Abidjan",
        country: "Côte d'Ivoire",
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
      .eq("id", request_id);

    // ─── 5. Réponse ──────────────────────────────────────────
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
        message: `Demande approuvée. Code d'activation : ${formattedCode}`,
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
