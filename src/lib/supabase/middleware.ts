import { createServerClient as sbssrServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware principal — gère la session et protège les routes.
 *
 * Exécuté sur CHAQUE requête (sauf assets statiques).
 * Utilise le cookie de session pour identifier l'utilisateur.
 *
 * Routes protégées :
 *   /dashboard/* → redirige vers /connexion si non connecté
 *
 * Redirections intelligentes :
 *   /connexion   → redirige vers /dashboard si déjà connecté
 *   /activer     → redirige vers /dashboard si déjà connecté
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  // ─── Graceful fallback si Supabase n'est pas configuré ──────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // En développement sans Supabase, on laisse passer les routes publiques
    // et on redirige les routes dashboard vers connexion
    if (pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ─── Création du client serveur avec cookies ─────────────────────
  const supabase = sbssrServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // ─── Récupération de l'utilisateur ──────────────────────────────
  let user: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  } catch {
    // Session invalide ou erreur réseau — on considère non connecté
  }

  // ─── 1. Protection des routes dashboard ────────────────────────
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ─── 2. Redirection si déjà connecté ────────────────────────────
  const isAuthPage = pathname === "/connexion" || pathname === "/activer";

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ─── 3. Headers de sécurité pour les routes protégées ───────────
  if (user && isDashboardRoute) {
    supabaseResponse.headers.set("x-user-authenticated", "true");
    supabaseResponse.headers.set("x-user-id", user.id);
  }

  return supabaseResponse;
}
