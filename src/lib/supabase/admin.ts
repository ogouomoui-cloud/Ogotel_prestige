import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase Admin — SERVICE ROLE KEY.
 *
 * ⚠️  CONTOURNE LE RLS. À utiliser UNIQUEMENT côté serveur :
 *     - API Routes (route.ts)
 *     - Server Actions
 *     - Server Components
 *
 * Ne JAMAIS :
 *     - Exposer cette clé dans les variables NEXT_PUBLIC_*
 *     - Importer ce fichier dans un composant 'use client'
 *     - Retourner ce client ou ses résultats directement au client
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Configuration Supabase manquante. Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local",
    );
  }

  // ─── Garde de sécurité : interdire l'utilisation côté client ────
  if (typeof window !== "undefined") {
    throw new Error(
      "[SECURITY] createAdminClient() ne peut PAS être appelé côté navigateur. " +
      "Utilisez createBrowserClient() à la place."
    );
  }

  return createSupabaseClient(url, key);
}
