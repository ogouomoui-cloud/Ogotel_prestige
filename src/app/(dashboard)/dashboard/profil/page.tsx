"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Calendar,
  Save,
  LogOut,
  Loader2,
} from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants/roles";

// ─── Types ──────────────────────────────────────────────────────────────
interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  hotel_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hotel_name?: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateFull(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Animation ─────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Component ──────────────────────────────────────────────────────────
export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Formulaire ──────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // ─── Fetch profil ────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hotel-admin/profile");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile(data.profile);
      setFullName(data.profile.full_name);
      setPhone(data.profile.phone ?? "");
    } catch {
      toast.error("Impossible de charger le profil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ─── Sauvegarder ─────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Le nom est requis.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/hotel-admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Impossible de mettre à jour le profil.");
        return;
      }

      toast.success("Profil mis à jour avec succès.");
      setProfile(data.profile);
      // Force refresh du layout pour mettre à jour le sidebar
      router.refresh();
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Déconnexion ─────────────────────────────────────────────────
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/connexion");
      router.refresh();
    } catch {
      router.push("/connexion");
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="rounded-xl border-border">
        <CardContent className="py-12 text-center">
          <UserCircle className="mx-auto h-12 w-12 text-slate/40" />
          <p className="mt-4 text-navy font-medium">
            Impossible de charger le profil.
          </p>
        </CardContent>
      </Card>
    );
  }

  const initials = profile.full_name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div
        variants={item}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <UserCircle className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy">
            Mon profil
          </h1>
          <p className="text-sm text-slate">
            Gérez vos informations personnelles.
          </p>
        </div>
      </motion.div>

      {/* ─── Layout ──────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* ─── Colonne gauche : Carte profil ─────────────────────── */}
        <motion.div variants={item}>
          <Card className="rounded-xl border-border shadow-sm overflow-hidden">
            <div className="bg-navy px-6 pt-8 pb-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-ivory ring-4 ring-white/20">
                {initials}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-ivory">
                {profile.full_name}
              </h2>
              <Badge
                className={`mt-2 ${ROLE_COLORS[profile.role as keyof typeof ROLE_COLORS] ?? "bg-slate-100 text-slate"}`}
              >
                <ShieldCheck className="mr-1 h-3 w-3" />
                {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] ?? profile.role}
              </Badge>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Mail className="h-4 w-4 text-slate" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate">E-mail</p>
                  <p className="text-sm font-medium text-navy truncate">
                    {profile.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Phone className="h-4 w-4 text-slate" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate">Téléphone</p>
                  <p className="text-sm font-medium text-navy">
                    {profile.phone || (
                      <span className="text-slate italic">Non renseigné</span>
                    )}
                  </p>
                </div>
              </div>

              {profile.hotel_name && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Building2 className="h-4 w-4 text-slate" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate">Établissement</p>
                    <p className="text-sm font-medium text-navy truncate">
                      {profile.hotel_name}
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Calendar className="h-4 w-4 text-slate" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate">Inscrit le</p>
                  <p className="text-sm font-medium text-navy">
                    {formatDate(profile.created_at)}
                  </p>
                </div>
              </div>

              <Separator />

              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Colonne droite : Formulaire ────────────────────────── */}
        <motion.div variants={item} className="md:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-navy">
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                {/* Nom complet */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-navy">
                    Nom complet <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Votre nom complet"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-xl border-border max-w-md"
                    required
                  />
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-navy">
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+225 XX XX XX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl border-border max-w-md"
                  />
                  <p className="text-xs text-slate">
                    Format : +225 07 00 00 00 00
                  </p>
                </div>

                {/* E-mail (lecture seule) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-navy">
                    Adresse e-mail
                  </Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="rounded-xl border-border max-w-md bg-slate-50"
                  />
                  <p className="text-xs text-slate">
                    L&apos;adresse e-mail est liée à votre compte d&apos;authentification et ne peut pas être modifiée ici.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={saving || fullName === profile.full_name && phone === (profile.phone ?? "")}
                    className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Informations du compte */}
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-navy">
                Informations du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-ivory p-4 space-y-1">
                  <p className="text-xs text-slate">Rôle</p>
                  <p className="text-sm font-semibold text-navy">
                    {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] ?? profile.role}
                  </p>
                </div>
                <div className="rounded-lg bg-ivory p-4 space-y-1">
                  <p className="text-xs text-slate">Statut</p>
                  <Badge
                    variant="outline"
                    className={
                      profile.is_active
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    }
                  >
                    {profile.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <div className="rounded-lg bg-ivory p-4 space-y-1">
                  <p className="text-xs text-slate">ID du profil</p>
                  <p className="text-xs font-mono text-slate break-all">
                    {profile.id}
                  </p>
                </div>
                <div className="rounded-lg bg-ivory p-4 space-y-1">
                  <p className="text-xs text-slate">Dernière modification</p>
                  <p className="text-sm font-medium text-navy">
                    {formatDateFull(profile.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
