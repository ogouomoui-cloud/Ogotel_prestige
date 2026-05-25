import { createClient } from "@supabase/supabase-js";

/**
 * Client admin Supabase — utilise la SERVICE_ROLE_KEY.
 *
 * ⚠️ Ce client contourne le RLS. À utiliser UNIQUEMENT côté serveur
 *    (Server Components, API Routes, Server Actions).
 *
 * Ne JAMAIS importer ce fichier dans un composant 'use client'.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY n'est pas définie dans .env.local");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
