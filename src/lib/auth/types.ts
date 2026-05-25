import type { User, Session } from "@supabase/supabase-js";

// ─── Résultat typé pour les helpers ──────────────────────────────────────

export interface AuthResult {
  user: User | null;
  session: Session | null;
}

export interface AuthResultWithError {
  user: User | null;
  session: Session | null;
  error: string | null;
}
