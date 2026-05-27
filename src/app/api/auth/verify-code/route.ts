import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const verifySchema = z.object({
  code: z.string().min(1, "Le code est requis"),
});

/**
 * GET /api/auth/verify-code?code=XXXX
 *
 * Vérifie un code d'activation SANS le consommer.
 * Renvoie les informations de l'hôtel et du plan
 * pour affichage dans le formulaire d'activation.
 *
 * Sécurité : uniquement lecture, aucune modification en base.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCode = searchParams.get("code");

    // ─── Validation ──────────────────────────────────────────
    const parsed = verifySchema.safeParse({ code: rawCode });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Veuillez saisir un code d'activation." },
        { status: 400 },
      );
    }

    const code = parsed.data.code.toUpperCase().trim();
    const admin = createAdminClient();

    // ─── Récupérer le code avec jointures hôtel + plan ────────
    const { data: activationCode, error: codeError } = await admin
      .from("activation_codes")
      .select(`
        id,
        code,
        status,
        expires_at,
        created_at,
        hotel_id,
        plan_id,
        activation_codes_hotel_id_fkey:hotels!hotel_id (
          id,
          name,
          city,
          country
        ),
        activation_codes_plan_id_fkey:plans!plan_id (
          id,
          name,
          tier,
          price_monthly,
          max_rooms,
          max_users
        )
      `)
      .eq("code", code)
      .single();

    if (codeError || !activationCode) {
      return NextResponse.json(
        { error: "Code d'activation invalide. Vérifiez votre code et réessayez." },
        { status: 404 },
      );
    }

    // ─── Vérifier le statut ───────────────────────────────────
    if (activationCode.status === "used") {
      return NextResponse.json(
        {
          error:
            "Ce code a déjà été utilisé pour créer un compte. Si vous avez perdu vos accès, contactez notre support.",
        },
        { status: 410 },
      );
    }

    if (activationCode.status === "expired") {
      return NextResponse.json(
        { error: "Ce code a expiré. Contactez notre équipe pour obtenir un nouveau code." },
        { status: 410 },
      );
    }

    if (activationCode.status === "cancelled") {
      return NextResponse.json(
        { error: "Ce code a été annulé. Contactez notre équipe pour plus d'informations." },
        { status: 410 },
      );
    }

    // ─── Vérifier la date d'expiration ────────────────────────
    if (
      activationCode.expires_at &&
      new Date(activationCode.expires_at) < new Date()
    ) {
      await admin
        .from("activation_codes")
        .update({ status: "expired" })
        .eq("id", activationCode.id);

      return NextResponse.json(
        { error: "Ce code a expiré. Contactez notre équipe pour obtenir un nouveau code." },
        { status: 410 },
      );
    }

    // ─── Vérifier si un admin existe déjà pour cet hôtel ─────
    const { data: existingAdmin } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .eq("hotel_id", activationCode.hotel_id)
      .eq("role", "hotel_admin")
      .limit(1);

    if (existingAdmin && existingAdmin.length > 0) {
      return NextResponse.json(
        {
          error: `Un administrateur existe déjà pour l'hôtel « ${
            (activationCode as any)["activation_codes_hotel_id_fkey"]?.name ?? "cet hôtel"
          } ». Contactez notre support si c'est une erreur.`,
        },
        { status: 409 },
      );
    }

    // ─── Succès : renvoyer les infos sans exposer les IDs ─────
    const hotel = (activationCode as any)["activation_codes_hotel_id_fkey"];
    const plan = (activationCode as any)["activation_codes_plan_id_fkey"];

    return NextResponse.json({
      valid: true,
      code: activationCode.code,
      hotel: {
        name: hotel?.name ?? "Hôtel non renseigné",
        city: hotel?.city ?? "Abidjan",
        country: hotel?.country ?? "Côte d'Ivoire",
      },
      plan: {
        name: plan?.name ?? "Plan",
        tier: plan?.tier ?? "starter",
        price_monthly: plan?.price_monthly ?? 0,
        max_rooms: plan?.max_rooms ?? 0,
        max_users: plan?.max_users ?? 0,
      },
      expires_at: activationCode.expires_at,
      created_at: activationCode.created_at,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer dans un instant." },
      { status: 500 },
    );
  }
}
