"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth/client";
import { onAuthStateChange } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  User,
  Building2,
  Key,
} from "lucide-react";
import type { Role } from "@/lib/constants";

// ─── Badge de couleur par rôle ─────────────────────────────────────────
const ROLE_STYLES: Record<Role, string> = {
  super_admin: "bg-red-100 text-red-800 border-red-200",
  hotel_admin: "bg-navy/10 text-navy border-navy/20",
  manager: "bg-gold/15 text-gold-dark border-gold/30",
  receptionist: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Administrateur",
  hotel_admin: "Administrateur d'hôtel",
  manager: "Manager",
  receptionist: "Réceptionniste",
};

// ─── Composant principal ────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{
    full_name: string;
    role: Role;
    hotel_name?: string;
  } | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  // ─── Charger l'état d'authentification ───────────────────────────
  useEffect(() => {
    async function loadAuth() {
      try {
        const { user, session } = await getUser();
        setAuthenticated(!!session);

        if (user) {
          setUserEmail(user.email);

          // Tenter de récupérer le profil depuis Supabase
          const supabase = (await import("@/lib/supabase/client")).createBrowserClient();
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("full_name, role, hotels(name)")
            .eq("id", user.id)
            .single();

          if (profile && !error) {
            setProfileData({
              full_name: profile.full_name,
              role: profile.role,
              hotel_name: (profile as any).hotels?.name,
            });
            setDbConnected(true);
          } else {
            setDbConnected(false);
          }
        }
      } catch {
        setAuthenticated(false);
        setDbConnected(null);
      } finally {
        setLoading(false);
      }
    }
    loadAuth();

    // Observer les changements de session en temps réel
    const unsubscribe = onAuthStateChange((session) => {
      setAuthenticated(!!session);
      if (!session) {
        setUserEmail(null);
        setProfileData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // ─── Actions ─────────────────────────────────────────────────────
  async function handleRefresh() {
    setLoading(true);
    const { user, session } = await getUser();
    setAuthenticated(!!session);
    if (user) {
      setUserEmail(user.email);
    }
    setLoading(false);
  }

  async function handleLogout() {
    const { signOut } = await import("@/lib/auth/client");
    await signOut();
    router.push("/connexion");
    router.refresh();
  }

  // ─── État de chargement ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Non connecté (ne devrait pas arriver grâce au middleware) ───
  if (!authenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="mt-4 text-xl text-navy">
              Non connecté
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate">
              Vous devez être connecté pour accéder au tableau de bord.
            </p>
            <Button
              onClick={() => router.push("/connexion")}
              className="w-full bg-navy text-ivory hover:bg-navy-light"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Connecté — afficher le statut ───────────────────────────────
  const role = profileData?.role ?? ("receptionist" as Role);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">
            Bienvenue{profileData?.full_name ? `, ${profileData.full_name}` : ""} 👋
          </h1>
          <p className="mt-1 text-sm text-slate">
            Voici le statut de votre connexion et de votre session.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Grille de statut */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* ─── Carte : Authentification ────────────────────── */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">Connecté</p>
                <p className="text-xs text-green-600">Session active</p>
              </div>
            </div>
            <div className="mt-4 space-y-1 rounded-lg bg-white/80 p-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3.5 w-3.5 text-slate" />
                <span className="text-slate">E-mail :</span>
                <span className="font-medium text-navy truncate">
                  {userEmail ?? "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Carte : Profil & Rôle ───────────────────────── */}
        <Card className={profileData ? "border-gold/30 bg-gold/5" : "border-amber-200 bg-amber-50/50"}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15">
                <ShieldCheck className="h-5 w-5 text-gold-dark" />
              </div>
              <div>
                <p className="font-medium text-navy">Rôle</p>
                <p className="text-xs text-slate">Profil utilisateur</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <Badge className={ROLE_STYLES[role]} variant="outline">
                {ROLE_LABELS[role]}
              </Badge>
              {profileData?.hotel_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-3.5 w-3.5 text-slate" />
                  <span className="text-slate">Hôtel :</span>
                  <span className="font-medium text-navy">
                    {profileData.hotel_name}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Carte : Base de données ─────────────────────── */}
        <Card
          className={
            dbConnected === true
              ? "border-green-200 bg-green-50/50"
              : dbConnected === false
                ? "border-amber-200 bg-amber-50/50"
                : "border-slate-200"
          }
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  dbConnected === true
                    ? "bg-green-100"
                    : dbConnected === false
                      ? "bg-amber-100"
                      : "bg-slate-100"
                }`}
              >
                <Key
                  className={`h-5 w-5 ${
                    dbConnected === true
                      ? "text-green-600"
                      : dbConnected === false
                        ? "text-amber-600"
                        : "text-slate"
                  }`}
                />
              </div>
              <div>
                <p className="font-medium text-navy">Base de données</p>
                <p className="text-xs text-slate">Schéma Supabase</p>
              </div>
            </div>
            <div className="mt-4">
              {dbConnected === true && (
                <p className="text-sm text-green-700">
                  ✅ Connecté — le schéma est bien initialisé.
                </p>
              )}
              {dbConnected === false && (
                <p className="text-sm text-amber-700">
                  ⚠️ Schéma non trouvé. Exécutez{" "}
                  <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono">
                    supabase/schema.sql
                  </code>{" "}
                  dans le SQL Editor.
                </p>
              )}
              {dbConnected === null && (
                <p className="text-sm text-slate">
                  ◌ Impossible de vérifier (pas de profil trouvé).
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section d'aide */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium text-navy">
            Prochaines étapes
          </h3>
          <p className="mt-2 text-sm text-slate">
            Si la base de données est connectée, vous pouvez commencer à utiliser
            l&apos;application. Sinon, exécutez le schéma SQL dans le{" "}
            <a
              href="https://supabase.com/dashboard/project/igkyjfagucwkznwccknd/sql"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gold hover:text-gold-dark underline underline-offset-4"
            >
              SQL Editor Supabase
            </a>
            , puis créez le super administrateur via l&apos;API{" "}
            <code className="rounded bg-ivory px-1.5 py-0.5 text-xs font-mono text-navy">
              POST /api/setup/create-super-admin
            </code>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
