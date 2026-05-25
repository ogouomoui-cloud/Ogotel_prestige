import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/shared/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/shared/MobileSidebarTrigger";
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

  // ─── Rendu du layout ────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        profile={{
          full_name: profile?.full_name ?? user.email ?? "",
          role: profile?.role ?? "receptionist",
          hotel_name: (profile as any)?.hotels?.name,
        }}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Barre supérieure */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-white/80 px-4 backdrop-blur-md lg:px-6">
          <MobileSidebarTrigger />
          <div className="flex flex-col">
            <span className="font-serif text-lg font-medium text-navy lg:hidden">
              OGOTEL
            </span>
          </div>
          {/* Infos utilisateur (desktop) */}
          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <div className="text-right">
              <p className="text-sm font-medium text-navy">
                {profile?.full_name ?? user.email}
              </p>
              <p className="text-xs text-slate">
                {profile?.role === "super_admin"
                  ? "Super Administrateur"
                  : profile?.role === "hotel_admin"
                    ? "Admin — " + ((profile as any)?.hotels?.name ?? "")
                    : profile?.role === "manager"
                      ? "Manager"
                      : "Réceptionniste"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-ivory">
              {(profile?.full_name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Zone principale */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
