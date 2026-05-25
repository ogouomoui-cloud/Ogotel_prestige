import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes SAUF :
     * - _next/static     → fichiers statiques
     * - _next/image      → optimisation d'images
     * - favicon.ico      → favicon
     * - images/          → assets publics
     * - logo.svg         → logo
     * - robots.txt       → SEO
     * - Fichiers médias  → svg, png, jpg, jpeg, gif, webp, ico
     */
    "/((?!_next/static|_next/image|favicon\\.ico|images|logo\\.svg|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
