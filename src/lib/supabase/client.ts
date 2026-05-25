import { createBrowserClient as sbssrBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase — CÔTÉ NAVIGATEUR uniquement.
 *
 * Utilise la ANON_KEY (publique). Sujet au RLS.
 * À importer uniquement dans les composants 'use client'.
 */
export function createBrowserClient() {
  return sbssrBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
