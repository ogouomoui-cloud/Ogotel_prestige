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

  // ─── Création du client serveur avec cookies ─────────────────────
  const supabase = sbssrServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  // ─── Récupération de l'utilisateur ──────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

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
