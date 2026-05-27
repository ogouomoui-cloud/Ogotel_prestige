import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// ─── Schéma ────────────────────────────────────────────────────────────
const initSchema = z.object({
  email: z.string().email("E-mail invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .max(128, "Le mot de passe est trop long."),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
});

/**
 * POST /api/setup/init
 *
 * Initialise l'application :
 * 1. Vérifie que Supabase est accessible
 * 2. Vérifie que la base est initialisée (tables existent)
 * 3. Vérifie qu'aucun super_admin n'existe
 * 4. Crée le super administrateur
 *
 * ⚠️ Cette route doit être protégée en production (ex: secret header)
 */
export async function POST(request: NextRequest) {
  try {
    // ─── 1. Vérifier Supabase ──────────────────────────────────
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json(
        {
          error:
            "Supabase n'est pas configuré. Veuillez ajouter les variables d'environnement dans .env.local (voir .env.local.example).",
          step: "env",
        },
        { status: 500 }
      );
    }

    // ─── 2. Vérifier que la base est initialisée ────────────────
    const { data: isInit, error: initError } = await admin.rpc(
      "is_db_initialized"
    );

    if (initError || !isInit) {
      return NextResponse.json(
        {
          error:
            "La base de données n'est pas initialisée. Veuillez exécuter le fichier supabase/schema.sql dans Supabase → SQL Editor → Run.",
          step: "schema",
        },
        { status: 500 }
      );
    }

    // ─── 3. Vérifier qu'aucun super_admin n'existe ────────────
    const { data: existingAdmin } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "super_admin")
      .limit(1);

    if (existingAdmin && existingAdmin.length > 0) {
      return NextResponse.json(
        {
          error:
            "Un super administrateur existe déjà. Connectez-vous avec vos identifiants.",
          step: "login",
        },
        { status: 400 }
      );
    }

    // ─── 4. Valider les données ─────────────────────────────────
    let body: z.infer<typeof initSchema>;
    try {
      const raw = await request.json();
      body = initSchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Données invalides.",
            details: err.flatten().fieldErrors,
            step: "form",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Corps de requête invalide.", step: "form" },
        { status: 400 }
      );
    }

    // ─── 5. Créer l'utilisateur ───────────────────────────────
    const { data: user, error: userError } =
      await admin.auth.admin.createUser({
        email: body.email.toLowerCase().trim(),
        password: body.password,
        email_confirm: true,
        user_metadata: { full_name: body.name },
      });

    if (userError || !user.user) {
      const msg = userError?.message ?? "Erreur inconnue";
      console.error("Erreur création super admin:", msg);

      if (msg.includes("already registered")) {
        return NextResponse.json(
          {
            error:
              "Cet e-mail est déjà utilisé. Choisissez un autre e-mail ou connectez-vous.",
            step: "form",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Erreur lors de la création du compte.", step: "create" },
        { status: 500 }
      );
    }

    // ─── 6. Mettre à jour le profil en super_admin ──────────────
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        role: "super_admin",
        full_name: body.name,
        is_active: true,
      })
      .eq("id", user.user.id);

    if (profileError) {
      console.error("Erreur mise à jour profil:", profileError.message);
    }

    // ─── 7. Insérer les plans d'abonnement ──────────────────────
    const { data: existingPlans } = await admin
      .from("plans")
      .select("id")
      .limit(1);

    if (!existingPlans || existingPlans.length === 0) {
      await admin.from("plans").insert([
        {
          name: "Starter",
          tier: "starter",
          price_monthly: 20_000,
          max_hotels: 1,
          max_rooms: 20,
          max_users: 2,
          features: [
            "1 hôtel",
            "Jusqu'à 20 chambres",
            "2 utilisateurs",
            "Réservations basiques",
            "Gestion des paiements",
            "Support par e-mail",
          ],
          is_active: true,
        },
        {
          name: "Pro",
          tier: "pro",
          price_monthly: 50_000,
          max_hotels: 1,
          max_rooms: 100,
          max_users: 10,
          features: [
            "1 hôtel",
            "Jusqu'à 100 chambres",
            "10 utilisateurs",
            "Réservations avancées",
            "Check-in / Check-out",
            "Statistiques détaillées",
            "Support prioritaire WhatsApp",
            "Personnalisation",
          ],
          is_active: true,
        },
        {
          name: "Prestige",
          tier: "prestige",
          price_monthly: 90_000,
          max_hotels: 5,
          max_rooms: 500,
          max_users: 50,
          features: [
            "Multi-hôtels (5 max)",
            "Jusqu'à 500 chambres",
            "Utilisateurs illimités",
            "Toutes les fonctionnalités",
            "API & intégrations",
            "Formation dédiée",
            "Manager de compte dédié",
            "Support 24/7",
          ],
          is_active: true,
        },
      ]);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Super administrateur créé avec succès ! Vous pouvez maintenant vous connecter.",
        email: body.email,
        step: "done",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur init:", error);
    return NextResponse.json(
      {
        error: "Une erreur inattendue s'est produite.",
        step: "unknown",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup/init
 *
 * Vérifie l'état de l'initialisation :
 * - env: Supabase configuré ?
 * - schema: Base de données initialisée ?
 * - admin: Super admin existe ?
 */
export async function GET() {
  try {
    // ─── 1. Vérifier Supabase ──────────────────────────────────
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json({
        env_ready: false,
        schema_ready: false,
        admin_exists: false,
        message: "Supabase n'est pas configuré.",
        step: "env",
      });
    }

    // ─── 2. Vérifier le schéma ─────────────────────────────────
    const { data: isInit, error: initError } = await admin.rpc(
      "is_db_initialized"
    );

    if (initError || !isInit) {
      return NextResponse.json({
        env_ready: true,
        schema_ready: false,
        admin_exists: false,
        message: "Le schéma de base de données n'est pas installé.",
        step: "schema",
      });
    }

    // ─── 3. Vérifier super admin ───────────────────────────────
    const { data: admins } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .eq("role", "super_admin")
      .limit(1);

    const adminExists = admins && admins.length > 0;

    return NextResponse.json({
      env_ready: true,
      schema_ready: true,
      admin_exists: adminExists,
      admin_email: adminExists ? admins[0].email : null,
      message: adminExists
        ? "L'application est prête. Connectez-vous."
        : "Prêt pour créer le super administrateur.",
      step: adminExists ? "login" : "create_admin",
    });
  } catch {
    return NextResponse.json({
      env_ready: false,
      schema_ready: false,
      admin_exists: false,
      message: "Erreur lors de la vérification.",
      step: "env",
    });
  }
}
