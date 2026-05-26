import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const activateSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  full_name: z.string().min(2, "Nom requis (min. 2 car.)"),
  email: z.string().min(1, "E-mail requis").email("E-mail invalide"),
  password: z.string().min(8, "Min. 8 caractères"),
});

/**
 * POST /api/auth/activate
 *
 * Flow :
 * 1. Valider le code d'activation (unused, non expiré)
 * 2. Créer l'utilisateur Supabase Auth
 * 3. Mettre à jour le profil avec hotel_id + rôle hotel_admin
 * 4. Marquer le code comme utilisé
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = activateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { code, full_name, email, password } = parsed.data;
    const admin = createAdminClient();

    // ─── 1. Vérifier le code d'activation ────────────────────
    const { data: activationCode, error: codeError } = await admin
      .from("activation_codes")
      .select("id, hotel_id, plan_id, status, expires_at")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (codeError || !activationCode) {
      return NextResponse.json(
        { error: "Code d'activation invalide." },
        { status: 400 }
      );
    }

    if (activationCode.status !== "unused") {
      return NextResponse.json(
        { error: "Ce code a déjà été utilisé ou est expiré." },
        { status: 400 }
      );
    }

    if (
      activationCode.expires_at &&
      new Date(activationCode.expires_at) < new Date()
    ) {
      // Marquer comme expiré
      await admin
        .from("activation_codes")
        .update({ status: "expired" })
        .eq("id", activationCode.id);
      return NextResponse.json(
        { error: "Ce code a expiré." },
        { status: 400 }
      );
    }

    // ─── 2. Vérifier qu'aucun compte n'existe déjà pour cet hôtel
    const { data: existingHotelAdmin } = await admin
      .from("profiles")
      .select("id")
      .eq("hotel_id", activationCode.hotel_id)
      .eq("role", "hotel_admin")
      .limit(1);

    if (existingHotelAdmin && existingHotelAdmin.length > 0) {
      return NextResponse.json(
        { error: "Un administrateur existe déjà pour cet hôtel." },
        { status: 400 }
      );
    }

    // ─── 3. Créer l'utilisateur Supabase Auth ─────────────────
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        emailConfirm: true,
        userMetadata: { full_name },
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Impossible de créer le compte." },
        { status: 500 }
      );
    }

    // ─── 4. Mettre à jour le profil (rôle + hôtel) ───────────
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name,
        email,
        role: "hotel_admin",
        hotel_id: activationCode.hotel_id,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Erreur mise à jour profil:", profileError);
      // Nettoyer l'utilisateur créé
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Erreur lors de la création du profil." },
        { status: 500 }
      );
    }

    // ─── 5. Marquer le code comme utilisé ────────────────────
    await admin
      .from("activation_codes")
      .update({
        status: "used",
        used_by: authData.user.id,
        used_at: new Date().toISOString(),
      })
      .eq("id", activationCode.id);

    return NextResponse.json(
      {
        message: "Compte créé avec succès ! Connectez-vous maintenant.",
        user_id: authData.user.id,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
