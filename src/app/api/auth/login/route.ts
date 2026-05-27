import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { UserProfile } from "@/types";
import type { Role } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(6, "Le mot de passe est requis"),
});

// Mapping des erreurs Supabase Auth → messages en français
const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials":
    "E-mail ou mot de passe incorrect.",
  "Email not confirmed":
    "Veuillez confirmer votre adresse e-mail avant de vous connecter.",
  "Too many requests":
    "Trop de tentatives. Veuillez patienter quelques instants.",
  "User not found":
    "Aucun compte trouvé avec cette adresse e-mail.",
};

// Mapping rôle → chemin de redirection
const ROLE_REDIRECT_MAP: Record<Role, string> = {
  super_admin: "/dashboard",
  hotel_admin: "/dashboard",
  manager: "/dashboard",
  receptionist: "/dashboard",
};

/**
 * POST /api/auth/login
 *
 * 1. Valide email + mot de passe (Zod)
 * 2. Authentifie via Supabase Auth (signInWithPassword)
 * 3. Récupère le profil dans `profiles` (admin client, bypass RLS)
 * 4. Vérifie que le compte est actif
 * 5. Retourne le profil + l'URL de redirection selon le rôle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createServerClient();

    // ─── 1. Authentification Supabase ────────────────────────────
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

    if (authError) {
      const message =
        AUTH_ERROR_MAP[authError.message] ?? authError.message;
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: "Impossible d'établir la session." },
        { status: 500 }
      );
    }

    // ─── 2. Récupération du profil ──────────────────────────────
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("*, hotels(name)")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      console.error(
        "[auth/login] Erreur récupération profil:",
        profileError.message
      );
      return NextResponse.json(
        {
          error:
            "Profil introuvable. Contactez le support si le problème persiste.",
        },
        { status: 403 }
      );
    }

    const typedProfile = profile as UserProfile & {
      hotels?: { name: string };
    };

    // ─── 3. Vérification de l'activation du compte ─────────────
    if (!typedProfile.is_active) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error:
            "Votre compte a été désactivé. Contactez le support pour plus d'informations.",
        },
        { status: 403 }
      );
    }

    // ─── 4. Réponse avec profil + redirection ──────────────────
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: typedProfile.full_name,
        role: typedProfile.role,
        hotel_id: typedProfile.hotel_id,
        hotel_name: typedProfile.hotels?.name ?? null,
      },
      redirect_url: ROLE_REDIRECT_MAP[typedProfile.role] ?? "/dashboard",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
