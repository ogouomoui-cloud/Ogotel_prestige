"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Hotel,
  MapPin,
  Phone,
  Mail,
  Star,
  Globe,
  Users,
  BedDouble,
  CalendarCheck,
  Clock,
  Pencil,
  CreditCard,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  SUBSCRIPTION_STATUS_LABELS,
  PLAN_TIER_LABELS,
  ROOM_STATUS_LABELS,
  type SubscriptionStatus,
} from "@/types";

// ─── Types ──────────────────────────────────────────────────────────────
interface HotelData {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string;
  country: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  star_rating: number;
  description: string | null;
  total_rooms: number;
  timezone: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionData {
  id: string;
  status: SubscriptionStatus;
  starts_at: string;
  ends_at: string | null;
  trial_ends_at: string | null;
  max_rooms: number;
  max_users: number;
  plans: {
    id: string;
    name: string;
    tier: string;
    price_monthly: number;
    max_rooms: number;
    max_users: number;
    features: string[];
  } | null;
}

interface ApiResponse {
  hotel: HotelData;
  subscription: SubscriptionData | null;
  user_count: number;
  room_count: {
    total: number;
    by_status: Record<string, number>;
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

// ─── Animation variants ─────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Component ──────────────────────────────────────────────────────────
export default function MonHotelPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHotel() {
      try {
        const res = await fetch("/api/hotel-admin/hotel");
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erreur" }));
          setError(err.error ?? "Impossible de charger la fiche.");
          return;
        }
        setData(await res.json());
      } catch {
        setError("Erreur de connexion.");
      } finally {
        setLoading(false);
      }
    }
    fetchHotel();
  }, []);

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-navy">Erreur</h2>
            <p className="mt-2 text-sm text-slate">{error ?? "Données indisponibles."}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-navy text-ivory hover:bg-navy-light">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { hotel, subscription, user_count, room_count } = data;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
            <Hotel className="h-5 w-5 text-gold-dark" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">Ma fiche hôtel</h1>
            <p className="text-sm text-slate">Informations et paramètres de votre établissement.</p>
          </div>
        </div>
        <Button asChild className="rounded-xl bg-navy text-ivory hover:bg-navy-light w-fit">
          <Link href="/dashboard/mon-hotel/modifier">
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </motion.div>

      {/* ─── Hotel Card + Subscription ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hotel Info Card */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="rounded-xl border-border shadow-sm overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-navy to-navy-light px-6 py-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {hotel.logo_url ? (
                    <img
                      src={hotel.logo_url}
                      alt={`Logo ${hotel.name}`}
                      className="h-16 w-16 rounded-xl border-2 border-gold/30 object-cover bg-white"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gold/20 text-2xl font-bold text-gold">
                      {hotel.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-ivory">{hotel.name}</h2>
                    <div className="mt-1 flex items-center gap-2">
                      {hotel.star_rating > 0 && (
                        <span className="text-gold text-sm">
                          {"★".repeat(hotel.star_rating)}{"☆".repeat(5 - hotel.star_rating)}
                        </span>
                      )}
                      {!hotel.is_active && (
                        <Badge variant="outline" className="border-red-300 bg-red-500/20 text-red-200 text-xs">
                          Suspendu
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Description */}
              {hotel.description && (
                <p className="text-sm text-slate leading-relaxed">{hotel.description}</p>
              )}

              <Separator />

              {/* Contact info grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={MapPin} label="Adresse" value={hotel.address ? `${hotel.address}, ${hotel.city}, ${hotel.country}` : `${hotel.city}, ${hotel.country}`} />
                <InfoRow icon={Phone} label="Téléphone" value={hotel.phone ?? "Non renseigné"} />
                <InfoRow icon={Mail} label="Email" value={hotel.email ?? "Non renseigné"} />
                <InfoRow icon={Globe} label="Fuseau horaire" value={hotel.timezone} />
                <InfoRow icon={Clock} label="Devise" value={hotel.currency} />
                <InfoRow icon={CalendarCheck} label="Inscrit le" value={formatDate(hotel.created_at)} />
              </div>

              <Separator />

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center rounded-lg bg-ivory/50 px-3 py-3">
                  <BedDouble className="mb-1 h-5 w-5 text-emerald-600" />
                  <span className="text-lg font-bold text-navy">{room_count.total}</span>
                  <span className="text-xs text-slate">Chambres</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-ivory/50 px-3 py-3">
                  <Users className="mb-1 h-5 w-5 text-blue-600" />
                  <span className="text-lg font-bold text-navy">{user_count}</span>
                  <span className="text-xs text-slate">Utilisateurs</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-ivory/50 px-3 py-3">
                  <ShieldCheck className="mb-1 h-5 w-5 text-gold-dark" />
                  <span className="text-lg font-bold text-navy">
                    {room_count.by_status["disponible"] ?? 0}
                  </span>
                  <span className="text-xs text-slate">Disponibles</span>
                </div>
              </div>

              {/* Room status breakdown */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(room_count.by_status).map(([status, count]) => {
                  const colors: Record<string, string> = {
                    disponible: "bg-emerald-100 text-emerald-700 border-emerald-200",
                    occupee: "bg-gold/15 text-gold-dark border-gold/30",
                    reservee: "bg-blue-100 text-blue-700 border-blue-200",
                    maintenance: "bg-amber-100 text-amber-700 border-amber-200",
                  };
                  return (
                    <Badge key={status} variant="outline" className={colors[status] ?? "bg-slate-100 text-slate"}>
                      {ROOM_STATUS_LABELS[status as keyof typeof ROOM_STATUS_LABELS] ?? status}: {count}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Card */}
        <motion.div variants={item} className="space-y-6">
          {subscription ? (
            <Card className="rounded-xl border-border shadow-sm overflow-hidden">
              <div className={`px-5 py-4 ${
                subscription.status === "active" || subscription.status === "trial"
                  ? "bg-gradient-to-r from-gold/10 to-gold/5 border-b border-gold/20"
                  : "bg-gradient-to-r from-red-50 to-white border-b border-red-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gold-dark" />
                    <h3 className="font-serif text-sm font-semibold text-navy">Abonnement</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      subscription.status === "active" || subscription.status === "trial"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }
                  >
                    {subscription.status === "active" || subscription.status === "trial" ? (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    ) : (
                      <AlertTriangle className="mr-1 h-3 w-3" />
                    )}
                    {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-5 space-y-5">
                {/* Plan info */}
                <div>
                  <p className="text-xs text-slate">Plan actuel</p>
                  <p className="text-lg font-semibold text-navy">
                    {subscription.plans?.name ?? "—"}
                  </p>
                  <p className="text-sm text-gold-dark font-medium">
                    {formatFCFA(subscription.plans?.price_monthly ?? 0)}/mois
                  </p>
                </div>

                <Separator />

                {/* Dates */}
                <div className="space-y-2">
                  <DateRow label="Début" date={subscription.starts_at} />
                  {subscription.ends_at && <DateRow label="Fin" date={subscription.ends_at} />}
                  {subscription.trial_ends_at && (
                    <DateRow label="Fin d'essai" date={subscription.trial_ends_at} />
                  )}
                </div>

                <Separator />

                {/* Limits */}
                <div className="space-y-3">
                  <LimitRow
                    label="Chambres"
                    current={room_count.total}
                    max={subscription.max_rooms}
                  />
                  <LimitRow
                    label="Utilisateurs"
                    current={user_count}
                    max={subscription.max_users}
                  />
                </div>

                <Separator />

                {/* Features */}
                {subscription.plans?.features && subscription.plans.features.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate uppercase tracking-wide">Fonctionnalités incluses</p>
                    <ul className="space-y-1.5">
                      {subscription.plans.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl border-border shadow-sm">
              <CardContent className="p-6 text-center">
                <CreditCard className="mx-auto mb-3 h-10 w-10 text-slate/30" />
                <p className="text-sm font-medium text-navy">Aucun abonnement actif</p>
                <p className="mt-1 text-xs text-slate">Contactez le support pour activer votre abonnement.</p>
              </CardContent>
            </Card>
          )}

          {/* Quick links */}
          <Card className="rounded-xl border-border shadow-sm">
            <CardContent className="p-4 space-y-1">
              <Button asChild variant="ghost" className="w-full justify-between rounded-lg px-3 hover:bg-ivory/50">
                <Link href="/dashboard/mon-hotel/modifier">
                  <span className="text-sm">Modifier les informations</span>
                  <ChevronRight className="h-4 w-4 text-slate" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between rounded-lg px-3 hover:bg-ivory/50">
                <Link href="/dashboard/chambres">
                  <span className="text-sm">Gérer les chambres</span>
                  <ChevronRight className="h-4 w-4 text-slate" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between rounded-lg px-3 hover:bg-ivory/50">
                <Link href="/dashboard/personnel">
                  <span className="text-sm">Gérer le personnel</span>
                  <ChevronRight className="h-4 w-4 text-slate" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-ivory p-2">
        <Icon className="h-4 w-4 text-gold-dark" />
      </div>
      <div>
        <p className="text-xs text-slate">{label}</p>
        <p className="text-sm font-medium text-navy">{value}</p>
      </div>
    </div>
  );
}

function DateRow({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate">{label}</span>
      <span className="font-medium text-navy">{formatDate(date)}</span>
    </div>
  );
}

function LimitRow({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = Math.min(Math.round((current / max) * 100), 100);
  const isNear = pct >= 80;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate">{label}</span>
        <span className={`font-medium ${isNear ? "text-amber-600" : "text-navy"}`}>
          {current} / {max}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-ivory">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isNear ? "bg-amber-500" : pct >= 50 ? "bg-gold" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
