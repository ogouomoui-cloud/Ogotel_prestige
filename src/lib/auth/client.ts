import { createBrowserClient } from "@/lib/supabase/client";
import type { AuthResult, AuthResultWithError } from "./types";

/**
 * Récupère l'utilisateur et la session — CÔTÉ NAVIGATEUR.
 *
 * À utiliser dans les composants 'use client' (useEffect, event handlers).
 * Renvoie { user, session } ou { user: null, session: null } si non connecté.
 */
export async function getUser(): Promise<AuthResult> {
  const supabase = createBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    user: session?.user ?? null,
    session: session ?? null,
  };
}

/**
 * Connexion email/mot de passe — CÔTÉ NAVIGATEUR.
 *
 * @returns user + session si succès, ou error en cas d'échec.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResultWithError> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Traduire les erreurs courantes
    const errorMap: Record<string, string> = {
      "Invalid login credentials":
        "E-mail ou mot de passe incorrect.",
      "Email not confirmed":
        "Veuillez confirmer votre adresse e-mail.",
    };
    return {
      user: null,
      session: null,
      error: errorMap[error.message] ?? error.message,
    };
  }

  return {
    user: data.user,
    session: data.session,
    error: null,
  };
}

/**
 * Déconnexion — CÔTÉ NAVIGATEUR.
 */
export async function signOut(): Promise<void> {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
}

/**
 * Observer les changements de session en temps réel — CÔTÉ NAVIGATEUR.
 *
 * @param callback Fonction appelée à chaque changement de session
 * @returns Fonction de nettoyage (unsubscribe)
 */
export function onAuthStateChange(
  callback: (session: import("@supabase/supabase-js").Session | null) => void,
) {
  const supabase = createBrowserClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}
