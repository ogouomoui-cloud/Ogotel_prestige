import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const activateSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z
    .string()
    .min(1, "L'e-mail est requis")
    .email("Adresse e-mail invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /[A-Z]/,
      "Le mot de passe doit contenir au moins une majuscule",
    )
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
});

/**
 * POST /api/auth/activate
 *
 * Flow complet d'activation :
 * 1. Valider le code (unused, non expiré, non cancelled)
 * 2. Vérifier qu'aucun admin n'existe pour cet hôtel
 * 3. Créer l'utilisateur Supabase Auth (email confirmé)
 * 4. Mettre à jour le profil → rôle hotel_admin + hotel_id
 * 5. Marquer le code comme utilisé
 * 6. Renvoyer les infos de l'hôtel et du plan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = activateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { code, full_name, email, password } = parsed.data;
    const admin = createAdminClient();

    // ─── 1. Vérifier le code d'activation ────────────────────
    const { data: activationCode, error: codeError } = await admin
      .from("activation_codes")
      .select("id, code, hotel_id, plan_id, status, expires_at")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (codeError || !activationCode) {
      return NextResponse.json(
        { error: "Code d'activation invalide." },
        { status: 400 },
      );
    }

    // Vérifier le statut
    if (activationCode.status !== "unused") {
      const statusMessages: Record<string, string> = {
        used: "Ce code a déjà été utilisé.",
        expired: "Ce code a expiré.",
        cancelled: "Ce code a été annulé.",
      };
      return NextResponse.json(
        {
          error:
            statusMessages[activationCode.status] ??
            "Ce code n'est plus valide.",
        },
        { status: 400 },
      );
    }

    // Vérifier la date d'expiration
    if (
      activationCode.expires_at &&
      new Date(activationCode.expires_at) < new Date()
    ) {
      await admin
        .from("activation_codes")
        .update({ status: "expired" })
        .eq("id", activationCode.id);
      return NextResponse.json(
        { error: "Ce code a expiré. Contactez notre équipe." },
        { status: 400 },
      );
    }

    // ─── 2. Vérifier qu'aucun admin n'existe pour cet hôtel ─
    const { data: existingAdmin } = await admin
      .from("profiles")
      .select("id")
      .eq("hotel_id", activationCode.hotel_id)
      .eq("role", "hotel_admin")
      .limit(1);

    if (existingAdmin && existingAdmin.length > 0) {
      return NextResponse.json(
        { error: "Un administrateur existe déjà pour cet hôtel." },
        { status: 409 },
      );
    }

    // ─── 3. Récupérer les infos hôtel + plan pour la réponse ─
    const [hotelRes, planRes] = await Promise.all([
      admin
        .from("hotels")
        .select("id, name, city, country")
        .eq("id", activationCode.hotel_id)
        .single(),
      admin
        .from("plans")
        .select("id, name, tier, price_monthly, max_rooms, max_users")
        .eq("id", activationCode.plan_id)
        .single(),
    ]);

    // ─── 4. Créer l'utilisateur Supabase Auth ────────────────
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (authError) {
      // Traduire les erreurs Supabase courantes
      const errorMap: Record<string, string> = {
        "user already registered":
          "Un compte existe déjà avec cette adresse e-mail.",
        "email_signup_disabled": "Les inscriptions sont désactivées.",
        "password_characters_exceed_limit":
          "Le mot de passe est trop long (max 72 caractères).",
      };
      return NextResponse.json(
        { error: errorMap[authError.message] ?? authError.message },
        { status: 400 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Impossible de créer le compte. Réessayez." },
        { status: 500 },
      );
    }

    // ─── 5. Mettre à jour le profil (rôle + hôtel) ───────────
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name,
        email: email.toLowerCase().trim(),
        role: "hotel_admin",
        hotel_id: activationCode.hotel_id,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("[activate] Erreur profil:", profileError.message);
      // Nettoyer l'utilisateur créé
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Erreur lors de la création du profil. Réessayez." },
        { status: 500 },
      );
    }

    // ─── 6. Marquer le code comme utilisé ────────────────────
    await admin
      .from("activation_codes")
      .update({
        status: "used",
        used_by: authData.user.id,
        used_at: new Date().toISOString(),
      })
      .eq("id", activationCode.id);

    // ─── 7. Réponse avec infos complètes ─────────────────────
    return NextResponse.json(
      {
        success: true,
        message: "Votre compte a été créé avec succès !",
        user: {
          email: email.toLowerCase().trim(),
          full_name,
          role: "hotel_admin",
        },
        hotel: hotelRes
          ? {
              name: (hotelRes as any).name,
              city: (hotelRes as any).city,
              country: (hotelRes as any).country,
            }
          : null,
        plan: planRes
          ? {
              name: (planRes as any).name,
              tier: (planRes as any).tier,
              price_monthly: (planRes as any).price_monthly,
            }
          : null,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur inattendue. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
