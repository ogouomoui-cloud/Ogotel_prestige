import { updateSession } from "@/lib/supabase/middleware";

export const config = {
  matcher: [
    /*
     * Correspond à toutes les routes SAUF :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico (icône navigateur)
     * - Dossier public (assets, images, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

export async function middleware(request: Request) {
  return await updateSession(request as any);
}
