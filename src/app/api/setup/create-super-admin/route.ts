import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();

    // Vérifier si un super_admin existe déjà
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "super_admin")
      .limit(1);

    if (checkError) {
      console.error("Erreur vérification super admin:", checkError);
      return NextResponse.json(
        { error: "Erreur lors de la vérification." },
        { status: 500 }
      );
    }

    if (existingAdmin && existingAdmin.length > 0) {
      return NextResponse.json(
        { error: "Un super administrateur existe déjà." },
        { status: 400 }
      );
    }

    // Récupérer email/password depuis le body ou les variables d'environnement
    const body = await request.json().catch(() => ({}));
    const email = body.email || process.env.SUPER_ADMIN_EMAIL;
    const password = body.password || process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            "L'e-mail et le mot de passe du super administrateur sont requis.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    // Créer l'utilisateur via l'API admin
    const { data: user, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        emailConfirm: true,
        user_metadata: { full_name: "Super Administrateur" },
      });

    if (userError || !user.user) {
      console.error("Erreur création super admin:", userError);
      return NextResponse.json(
        { error: "Erreur lors de la création du compte." },
        { status: 500 }
      );
    }

    // Mettre à jour le profil
    await supabaseAdmin
      .from("profiles")
      .update({
        role: "super_admin",
        full_name: "Super Administrateur",
      })
      .eq("id", user.user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Super administrateur créé avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur création super admin:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
