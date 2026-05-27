"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  BedDouble,
  CalendarCheck,
  Wallet,
  Users,
  LogIn,
  LogOut,
  ArrowRight,
  AlertTriangle,
  Activity,
  TrendingUp,
  Star,
  Hotel,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Moon,
} from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants/roles";
import {
  ACTIVITY_ACTION_LABELS,
  PLAN_TIER_LABELS,
  ROOM_TYPE_LABELS,
  ROOM_STATUS_LABELS,
  RESERVATION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type ActivityAction,
  type ActivityLog,
  type RoomType,
  type RoomStatus,
  type ReservationStatus,
} from "@/types";
import type { Role } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────────────────────
interface SuperAdminStats {
  role: "super_admin";
  full_name: string;
  hotels: number;
  active_hotels?: number;
  pending_requests: number;
  active_subscriptions: number;
  total_users: number;
  recent_activity: ActivityLog[];
}

interface HotelAdminStats {
  role: string;
  full_name: string;
  hotel_name: string | null;
  hotel_star_rating: number;
  hotel_is_active: boolean;
  stats: {
    total_rooms: number;
    available_rooms: number;
    occupied_rooms: number;
    maintenance_rooms: number;
    reserved_rooms: number;
    total_reservations: number;
    active_reservations: number;
    today_checkins: number;
    today_checkouts: number;
    monthly_revenue: number;
    pending_payments: number;
    total_guests: number;
    occupancy_rate: number;
  } | null;
  recent_reservations: Array<{
    id: string;
    guest_name: string;
    room_number: string | null;
    check_in: string;
    check_out: string;
    status: ReservationStatus;
    total_amount: number;
    source: string;
  }>;
  room_breakdown: Record<string, Record<string, number>>;
  subscription: {
    id: string;
    status: string;
    starts_at: string;
    ends_at: string | null;
    max_rooms: number;
    max_users: number;
    plans: {
      name: string;
      tier: string;
      price_monthly: number;
      max_rooms: number;
      max_users: number;
      features: string[];
    } | null;
  } | null;
}

interface OtherStats {
  role: string;
  full_name: string;
  message?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function getRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  return formatDate(date);
}

function getActionIcon(action: ActivityAction) {
  switch (action) {
    case "create":    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "update":    return <TrendingUp className="h-4 w-4 text-blue-500" />;
    case "delete":    return <XCircle className="h-4 w-4 text-red-500" />;
    case "login":     return <LogIn className="h-4 w-4 text-navy" />;
    case "logout":    return <LogOut className="h-4 w-4 text-slate" />;
    case "approve":   return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "reject":    return <XCircle className="h-4 w-4 text-red-500" />;
    case "activate":  return <Star className="h-4 w-4 text-gold" />;
    case "export":    return <ArrowRight className="h-4 w-4 text-slate" />;
    default:          return <Activity className="h-4 w-4 text-slate" />;
  }
}

function getReservationStatusColor(status: ReservationStatus): string {
  switch (status) {
    case "confirmee":  return "bg-blue-100 text-blue-700 border-blue-200";
    case "en_cours":   return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "terminee":   return "bg-slate-100 text-slate-600 border-slate-200";
    case "annulee":    return "bg-red-100 text-red-700 border-red-200";
    case "no_show":    return "bg-amber-100 text-amber-700 border-amber-200";
    default:           return "bg-slate-100 text-slate border-slate-200";
  }
}

// ─── Super Admin KPI Config ─────────────────────────────────────────────
const SA_KPIS = [
  { key: "hotels",              label: "Hôtels",              icon: Building2,   border: "border-l-emerald-500",  bg: "bg-emerald-50",  iconColor: "text-emerald-600" },
  { key: "pending_requests",    label: "Demandes en attente", icon: CalendarCheck, border: "border-l-amber-500",   bg: "bg-amber-50",    iconColor: "text-amber-600" },
  { key: "active_subscriptions",label: "Abonnements actifs",  icon: Wallet,      border: "border-l-blue-500",     bg: "bg-blue-50",     iconColor: "text-blue-600" },
  { key: "total_users",         label: "Utilisateurs",        icon: Users,       border: "border-l-purple-500",   bg: "bg-purple-50",   iconColor: "text-purple-600" },
] as const;

// ─── Animation variants ─────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Reusable KPI Card ──────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  border,
  bg,
  iconColor,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  border: string;
  bg: string;
  iconColor: string;
  subtitle?: string;
}) {
  return (
    <Card className={`rounded-xl border border-border border-l-4 ${border} bg-white shadow-sm transition-shadow hover:shadow-md`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate">{label}</p>
            <p className="text-2xl font-bold text-navy sm:text-3xl">
              {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
            </p>
            {subtitle && (
              <p className="text-xs text-slate">{subtitle}</p>
            )}
          </div>
          <div className={`rounded-lg ${bg} p-2.5`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [saStats, setSaStats] = useState<SuperAdminStats | null>(null);
  const [haData, setHaData] = useState<HotelAdminStats | null>(null);
  const [otherData, setOtherData] = useState<OtherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Try super_admin first
        const saRes = await fetch("/api/admin/stats");
        if (saRes.ok) {
          const saData = await saRes.json();
          if (saData.role === "super_admin") {
            setSaStats(saData as SuperAdminStats);
            return;
          }
        }

        // Try hotel_admin
        const haRes = await fetch("/api/hotel-admin/stats");
        if (haRes.ok) {
          const haResult = await haRes.json();
          if (["hotel_admin", "manager"].includes(haResult.role)) {
            setHaData(haResult as HotelAdminStats);
            return;
          }
        }

        // Fallback
        const fallbackRes = await fetch("/api/dashboard/stats");
        if (fallbackRes.ok) {
          setOtherData(await fallbackRes.json());
        } else {
          setError("Impossible de charger les données.");
        }
      } catch {
        setError("Impossible de charger les données.");
        toast.error("Erreur de chargement des statistiques");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-navy">Erreur de chargement</h2>
            <p className="mt-2 text-sm text-slate">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-navy text-ivory hover:bg-navy-light">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Other role fallback ──────────────────────────────────────────
  if (otherData) {
    const role = otherData.role as Role;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy">Bienvenue, {otherData.full_name} 👋</h1>
          <p className="mt-1 text-sm text-slate">{otherData.message ?? "Voici votre espace de travail."}</p>
        </div>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-xl font-semibold text-ivory">
                {otherData.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-navy">{otherData.full_name}</p>
                <Badge variant="outline" className={ROLE_COLORS[role] ?? "bg-slate-100 text-slate"}>
                  {ROLE_LABELS[role] ?? role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ─── Super Admin Dashboard ───────────────────────────────────────
  if (saStats) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        {/* Header */}
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">Bonjour, {saStats.full_name} 👋</h1>
            <p className="mt-1 text-sm text-slate">Voici un aperçu de votre plateforme OGOTEL Prestige.</p>
          </div>
          <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800 w-fit">Super Administrateur</Badge>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SA_KPIS.map((kpi) => (
            <motion.div key={kpi.key} variants={item}>
              <KpiCard
                label={kpi.label}
                value={saStats[kpi.key as keyof SuperAdminStats] as number}
                icon={kpi.icon}
                border={kpi.border}
                bg={kpi.bg}
                iconColor={kpi.iconColor}
              />
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div variants={item} className="flex flex-wrap gap-3">
          <Button asChild className="rounded-xl bg-navy text-ivory hover:bg-navy-light">
            <Link href="/dashboard/admin/demandes">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Voir les demandes
              {saStats.pending_requests > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white hover:bg-amber-600">{saStats.pending_requests}</Badge>
              )}
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl border-border hover:bg-ivory">
            <Link href="/dashboard/admin/hotels">
              <Building2 className="mr-2 h-4 w-4" />
              Gérer les hôtels
            </Link>
          </Button>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item}>
          <Card className="rounded-xl border-border shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gold-dark" />
                  <h2 className="font-serif text-lg font-semibold text-navy">Activité récente</h2>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-gold-dark hover:text-gold hover:bg-gold/10">
                  <Link href="/dashboard/admin/journal">Tout voir <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
              {!saStats.recent_activity || saStats.recent_activity.length === 0 ? (
                <div className="py-8 text-center">
                  <Activity className="mx-auto mb-3 h-10 w-10 text-slate/40" />
                  <p className="text-sm text-slate">Aucune activité récente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {saStats.recent_activity.slice(0, 10).map((log: ActivityLog) => (
                    <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border/50 px-4 py-3 transition-colors hover:bg-ivory/50">
                      {getActionIcon(log.action as ActivityAction)}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-navy">{(log.details?.user_name as string) ?? "Utilisateur"}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[log.user_role as Role] ?? "bg-slate-100 text-slate"}`}>
                            {log.user_role ? (ROLE_LABELS[log.user_role as Role] ?? log.user_role) : ""}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-slate">
                          <span className="font-medium text-navy/80">{ACTIVITY_ACTION_LABELS[log.action as ActivityAction] ?? log.action}</span>
                          {log.entity_type && <span> — {log.entity_type}{log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ""}</span>}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-xs text-slate">{getRelativeTime(log.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Hotel Admin Dashboard ───────────────────────────────────────
  if (!haData) return null;

  const s = haData.stats;
  const hasStats = s !== null;
  const roomBreakdown = haData.room_breakdown;
  const subs = haData.subscription;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy">
            Bonjour, {haData.full_name} 👋
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate">
              {haData.hotel_name ? (
                <>
                  <Hotel className="mr-1 inline-block h-4 w-4" />
                  {haData.hotel_name}
                  {haData.hotel_star_rating > 0 && (
                    <span className="ml-1 text-gold">
                      {"★".repeat(haData.hotel_star_rating)}
                    </span>
                  )}
                </>
              ) : "Aucun hôtel rattaché"}
            </span>
            {subs && (
              <Badge variant="outline" className="border-gold/30 text-gold-dark bg-gold/5">
                Plan {subs.plans?.name ?? ""}
              </Badge>
            )}
            {!haData.hotel_is_active && haData.hotel_name && (
              <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                Hôtel suspendu
              </Badge>
            )}
          </div>
        </div>
        <Button asChild variant="outline" className="rounded-xl border-border hover:bg-ivory w-fit">
          <Link href="/dashboard/mon-hotel">
            <Hotel className="mr-2 h-4 w-4" />
            Ma fiche hôtel
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>

      {/* ─── Subscription Banner ─────────────────────────────────── */}
      {subs && (
        <motion.div variants={item}>
          <Card className={`rounded-xl border bg-gradient-to-r ${
            subs.status === "active" || subs.status === "trial"
              ? "from-navy to-navy-light border-gold/30 text-ivory"
              : "from-red-50 to-white border-red-200"
          }`}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${subs.status === "active" || subs.status === "trial" ? "bg-gold/20" : "bg-red-100"}`}>
                    <Star className={`h-5 w-5 ${subs.status === "active" || subs.status === "trial" ? "text-gold" : "text-red-600"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${subs.status === "active" || subs.status === "trial" ? "text-ivory/70" : "text-slate"}`}>
                      Abonnement {SUBSCRIPTION_STATUS_LABELS[subs.status as keyof typeof SUBSCRIPTION_STATUS_LABELS] ?? subs.status}
                    </p>
                    <p className={`text-lg font-semibold ${subs.status === "active" || subs.status === "trial" ? "text-ivory" : "text-red-800"}`}>
                      Plan {subs.plans?.name ?? "—"} · {formatFCFA(subs.plans?.price_monthly ?? 0)}/mois
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="text-center">
                    <p className={`font-semibold ${subs.status === "active" || subs.status === "trial" ? "text-ivory" : "text-navy"}`}>{subs.max_rooms}</p>
                    <p className={`text-xs ${subs.status === "active" || subs.status === "trial" ? "text-ivory/60" : "text-slate"}`}>Chambres max</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-semibold ${subs.status === "active" || subs.status === "trial" ? "text-ivory" : "text-navy"}`}>{subs.max_users}</p>
                    <p className={`text-xs ${subs.status === "active" || subs.status === "trial" ? "text-ivory/60" : "text-slate"}`}>Utilisateurs max</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-semibold ${subs.status === "active" || subs.status === "trial" ? "text-ivory" : "text-navy"}`}>{subs.ends_at ? formatDateShort(subs.ends_at) : "—"}</p>
                    <p className={`text-xs ${subs.status === "active" || subs.status === "trial" ? "text-ivory/60" : "text-slate"}`}>Expire le</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <KpiCard
            label="Chambres"
            value={hasStats ? `${s!.available_rooms}/${s!.total_rooms}` : "—"}
            icon={BedDouble}
            border="border-l-emerald-500"
            bg="bg-emerald-50"
            iconColor="text-emerald-600"
            subtitle={hasStats ? `${s!.occupied_rooms} occupées · ${s!.maintenance_rooms} maintenance` : ""}
          />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard
            label="Réservations actives"
            value={hasStats ? s!.active_reservations : "—"}
            icon={CalendarCheck}
            border="border-l-blue-500"
            bg="bg-blue-50"
            iconColor="text-blue-600"
            subtitle={hasStats ? `${s!.today_checkins} arrivées · ${s!.today_checkouts} départs aujourd'hui` : ""}
          />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard
            label="Clients enregistrés"
            value={hasStats ? s!.total_guests : "—"}
            icon={Users}
            border="border-l-purple-500"
            bg="bg-purple-50"
            iconColor="text-purple-600"
          />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard
            label="Revenus du mois"
            value={hasStats ? formatFCFA(s!.monthly_revenue) : "—"}
            icon={Wallet}
            border="border-l-gold"
            bg="bg-gold/10"
            iconColor="text-gold-dark"
            subtitle={hasStats && s!.pending_payments > 0 ? `${s!.pending_payments} paiements en attente` : ""}
          />
        </motion.div>
      </div>

      {/* ─── Occupancy + Room Breakdown ──────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Occupancy gauge */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="rounded-xl border-border shadow-sm h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gold-dark" />
                <CardTitle className="font-serif text-base">Taux d&apos;occupation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col items-center py-4">
                <div className="relative mb-4">
                  <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f0ece4" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={hasStats && s!.occupancy_rate >= 70 ? "#16a34a" : hasStats && s!.occupancy_rate >= 40 ? "#c8a97e" : "#dc2626"}
                      strokeWidth="10"
                      strokeDasharray={`${(hasStats ? s!.occupancy_rate : 0) * 3.14} 314`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-navy">{hasStats ? s!.occupancy_rate : 0}%</span>
                    <span className="text-xs text-slate">Occupé</span>
                  </div>
                </div>
                <div className="grid w-full grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                    <p className="text-sm font-semibold text-emerald-700">{hasStats ? s!.available_rooms : 0}</p>
                    <p className="text-[11px] text-slate">Disponibles</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 px-2 py-1.5">
                    <p className="text-sm font-semibold text-blue-700">{hasStats ? s!.reserved_rooms : 0}</p>
                    <p className="text-[11px] text-slate">Réservées</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                    <p className="text-sm font-semibold text-amber-700">{hasStats ? s!.maintenance_rooms : 0}</p>
                    <p className="text-[11px] text-slate">Maintenance</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Room breakdown */}
        <motion.div variants={item} className="lg:col-span-3">
          <Card className="rounded-xl border-border shadow-sm h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-gold-dark" />
                <CardTitle className="font-serif text-base">État des chambres</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {Object.keys(roomBreakdown).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BedDouble className="mb-2 h-10 w-10 text-slate/30" />
                  <p className="text-sm text-slate">Aucune chambre enregistrée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(Object.entries(roomBreakdown) as [RoomType, Record<string, number>][]).map(([roomType, statuses]) => {
                    const total = Object.values(statuses).reduce((a, b) => a + b, 0);
                    const available = statuses["disponible"] ?? 0;
                    const pct = total > 0 ? Math.round((available / total) * 100) : 0;
                    return (
                      <div key={roomType}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-sm font-medium text-navy">
                            {ROOM_TYPE_LABELS[roomType] ?? roomType}
                          </span>
                          <span className="text-xs text-slate">
                            {available}/{total} disponibles
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {(["disponible", "reservee", "occupee", "maintenance"] as RoomStatus[]).map((status) => {
                            const count = statuses[status] ?? 0;
                            if (count === 0) return null;
                            const widthPct = total > 0 ? (count / total) * 100 : 0;
                            const colors: Record<RoomStatus, string> = {
                              disponible: "bg-emerald-500",
                              reservee: "bg-blue-400",
                              occupee: "bg-gold",
                              maintenance: "bg-amber-400",
                              nettoyage: "bg-cyan-400",
                            };
                            return (
                              <div
                                key={status}
                                className={`h-2 rounded-full ${colors[status]} first:rounded-l-full last:rounded-r-full transition-all duration-500`}
                                style={{ width: `${widthPct}%` }}
                                title={`${ROOM_STATUS_LABELS[status]}: ${count}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {([
                      { status: "disponible" as RoomStatus, color: "bg-emerald-500" },
                      { status: "reservee" as RoomStatus, color: "bg-blue-400" },
                      { status: "occupee" as RoomStatus, color: "bg-gold" },
                      { status: "maintenance" as RoomStatus, color: "bg-amber-400" },
                    ]).map(({ status, color }) => (
                      <div key={status} className="flex items-center gap-1.5">
                        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                        <span className="text-xs text-slate">{ROOM_STATUS_LABELS[status]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Recent Reservations ─────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-gold-dark" />
                <CardTitle className="font-serif text-base">Réservations récentes</CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-gold-dark hover:text-gold hover:bg-gold/10">
                <Link href="/dashboard/reservations">Tout voir <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {!haData.recent_reservations || haData.recent_reservations.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CalendarCheck className="mb-2 h-10 w-10 text-slate/30" />
                <p className="text-sm text-slate">Aucune réservation</p>
              </div>
            ) : (
              <div className="space-y-2">
                {haData.recent_reservations.map((res) => (
                  <div key={res.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-4 py-3 transition-colors hover:bg-ivory/50">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-navy truncate max-w-[180px]">{res.guest_name}</span>
                        <Badge variant="outline" className={`text-[11px] ${getReservationStatusColor(res.status)}`}>
                          {RESERVATION_STATUS_LABELS[res.status]}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate">
                        {res.room_number && <span>Ch. {res.room_number}</span>}
                        <span>{formatDateShort(res.check_in)} → {formatDateShort(res.check_out)}</span>
                        <span className="font-medium text-navy">{formatFCFA(res.total_amount)}</span>
                      </div>
                    </div>
                    <Clock className="h-4 w-4 shrink-0 text-slate/40" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Quick Actions ───────────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild variant="outline" className="rounded-xl h-auto p-4 border-border hover:bg-ivory justify-start">
            <Link href="/dashboard/reservations">
              <CalendarCheck className="mr-3 h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-navy">Réservations</p>
                <p className="text-xs text-slate">{hasStats ? `${s!.active_reservations} en cours` : "Gérer"}</p>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl h-auto p-4 border-border hover:bg-ivory justify-start">
            <Link href="/dashboard/chambres">
              <BedDouble className="mr-3 h-5 w-5 text-emerald-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-navy">Chambres</p>
                <p className="text-xs text-slate">{hasStats ? `${s!.available_rooms} disponibles` : "Gérer"}</p>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl h-auto p-4 border-border hover:bg-ivory justify-start">
            <Link href="/dashboard/clients">
              <Users className="mr-3 h-5 w-5 text-purple-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-navy">Clients</p>
                <p className="text-xs text-slate">{hasStats ? `${s!.total_guests} enregistrés` : "Gérer"}</p>
              </div>
            </Link>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
