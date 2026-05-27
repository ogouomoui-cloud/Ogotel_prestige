import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/shared/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/shared/MobileSidebarTrigger";
import { DashboardRoleGuard } from "@/components/shared/DashboardRoleGuard";
import type { UserProfile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ─── Garde d'accès : non connecté → redirection ────────────────
  if (!user) redirect("/connexion");

  // ─── Récupération du profil ─────────────────────────────────────
  let profile: UserProfile | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("*, hotels(name)")
      .eq("id", user.id)
      .single();
    profile = data as UserProfile & { hotels?: { name: string } } | null;
  } catch {
    // Profil non trouvé — la table n'existe peut-être pas encore
  }

  const userRole = profile?.role ?? "receptionist";
  const fullName = profile?.full_name ?? user.email ?? "";
  const hotelName = (profile as any)?.hotels?.name;
  const initial = fullName.charAt(0).toUpperCase();

  // ─── Label du rôle pour l'en-tête ──────────────────────────────
  const roleLabel =
    userRole === "super_admin"
      ? "Super Administrateur"
      : userRole === "hotel_admin"
        ? `Admin — ${hotelName ?? ""}`
        : userRole === "manager"
          ? "Manager"
          : "Réceptionniste";

  // ─── Rendu du layout ────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        profile={{
          full_name: fullName,
          role: userRole,
          hotel_name: hotelName,
        }}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Barre supérieure */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-white/80 px-4 backdrop-blur-md lg:px-6">
          <MobileSidebarTrigger
            profile={{
              role: userRole,
            }}
          />
          <div className="flex flex-col">
            <span className="font-serif text-lg font-medium text-navy lg:hidden">
              OGOTEL
            </span>
          </div>
          {/* Infos utilisateur (desktop) */}
          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <div className="text-right">
              <p className="text-sm font-medium text-navy">{fullName}</p>
              <p className="text-xs text-slate">{roleLabel}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-ivory">
              {initial}
            </div>
          </div>
        </header>

        {/* Zone principale */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <DashboardRoleGuard userRole={userRole}>
              {children}
            </DashboardRoleGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
