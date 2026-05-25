import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const activateSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  full_name: z.string().min(2, "Nom requis (min. 2 car.)"),
  email: z.string().min(1, "E-mail requis").email("E-mail invalide"),
  password: z.string().min(8, "Min. 8 caractères"),
});

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

    const supabase = await createServerClient();

    // Vérifier que le code d'activation est valide
    const { data: activationCode, error: codeError } = await supabase
      .from("activation_codes")
      .select("id, hotel_id, used")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (codeError || !activationCode) {
      return NextResponse.json(
        { error: "Code d'activation invalide." },
        { status: 400 }
      );
    }

    if (activationCode.used) {
      return NextResponse.json(
        { error: "Ce code a déjà été utilisé." },
        { status: 400 }
      );
    }

    // Créer l'utilisateur Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
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

    // Insérer le profil utilisateur
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name,
      email,
      role: "proprietaire",
      hotel_id: activationCode.hotel_id,
    });

    if (profileError) {
      // Nettoyer l'utilisateur créé si le profil échoue
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Erreur lors de la création du profil." },
        { status: 500 }
      );
    }

    // Marquer le code comme utilisé
    await supabase
      .from("activation_codes")
      .update({ used: true, used_by: authData.user.id, used_at: new Date().toISOString() })
      .eq("id", activationCode.id);

    return NextResponse.json(
      { message: "Compte créé avec succès ! Connectez-vous maintenant." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
