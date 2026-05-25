import { createServerClient as sbssrServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase — CÔTÉ SERVEUR uniquement.
 *
 * Utilise la ANON_KEY mais avec le contexte cookies du serveur.
 * Permet de lire/écrire les cookies de session SSR.
 *
 * À utiliser dans : Server Components, Server Actions, API Routes.
 * Ne JAMAIS importer dans un composant 'use client'.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return sbssrServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll est appelé depuis un Server Component.
            // Impossible de modifier les cookies ici —
            // le middleware se charge de rafraîchir la session.
          }
        },
      },
    },
  );
}
