"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Star,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Users,
  BedDouble,
  Key,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { PLAN_TIER_LABELS, SUBSCRIPTION_STATUS_LABELS } from "@/types";
import type {
  Hotel,
  Subscription,
  ActivationCode,
  CodeStatus,
  PlanTier,
  SubscriptionStatus,
} from "@/types";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants/roles";
import type { Role } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────────────────────
interface HotelDetail extends Hotel {
  subscription?: Subscription & { plan?: { name: string; tier: PlanTier } };
  admin?: {
    id: string;
    full_name: string;
    email: string;
    role: Role;
  };
  activation_codes?: ActivationCode[];
}

// ─── Status badge styles ────────────────────────────────────────────────
const SUBSCRIPTION_STATUS_STYLES: Record<SubscriptionStatus, string> = {
  trial: "bg-blue-100 text-blue-800 border-blue-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  past_due: "bg-amber-100 text-amber-800 border-amber-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-slate-100 text-slate-700 border-slate-200",
};

const CODE_STATUS_STYLES: Record<CodeStatus, string> = {
  unused: "bg-blue-100 text-blue-800 border-blue-200",
  used: "bg-emerald-100 text-emerald-800 border-emerald-200",
  expired: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const CODE_STATUS_LABELS: Record<CodeStatus, string> = {
  unused: "Non utilisé",
  used: "Utilisé",
  expired: "Expiré",
  cancelled: "Annulé",
};

// ─── Helpers ────────────────────────────────────────────────────────────
function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

// ─── Component ──────────────────────────────────────────────────────────
export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"suspend" | "reactivate" | null>(null);

  const fetchHotel = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/hotels/${id}`);
      if (!res.ok) throw new Error("Hôtel introuvable");
      const data = await res.json();
      setHotel(data);
    } catch {
      toast.error("Impossible de charger l'hôtel");
      router.push("/dashboard/admin/hotels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotel();
  }, [id]);

  // ─── Suspend / Reactivate ─────────────────────────────────────────
  function openConfirm(action: "suspend" | "reactivate") {
    setConfirmAction(action);
    setConfirmOpen(true);
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    try {
      setActionLoading(true);
      const endpoint = confirmAction === "suspend" ? "suspend" : "reactivate";
      const res = await fetch(`/api/admin/hotels/${id}/${endpoint}`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur lors de l'action");
      }
      toast.success(
        confirmAction === "suspend"
          ? "Hôtel suspendu avec succès"
          : "Hôtel réactivé avec succès"
      );
      setConfirmOpen(false);
      setConfirmAction(null);
      fetchHotel();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'action");
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Info row helper ──────────────────────────────────────────────
  function InfoRow({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
  }) {
    return (
      <div className="flex items-start gap-3 py-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate" />
        <div>
          <p className="text-xs text-slate">{label}</p>
          <p className="text-sm font-medium text-navy">{value}</p>
        </div>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!hotel) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Back + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="hover:bg-ivory">
            <Link href="/dashboard/admin/hotels">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              {hotel.name}
            </h1>
            <p className="text-sm text-slate">
              {hotel.city}{hotel.country !== hotel.city ? `, ${hotel.country}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`px-3 py-1 ${
              hotel.is_active
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-red-100 text-red-800 border-red-200"
            }`}
          >
            {hotel.is_active ? "Actif" : "Suspendu"}
          </Badge>

          {hotel.is_active ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openConfirm("suspend")}
              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <PauseCircle className="mr-2 h-4 w-4" />
              Suspendre
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openConfirm("reactivate")}
              className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Réactiver
            </Button>
          )}
        </div>
      </div>

      {/* Hotel Info + Admin */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hotel details */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-navy">
              <Building2 className="h-5 w-5 text-gold-dark" />
              Informations de l&apos;hôtel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Building2} label="Nom" value={hotel.name} />
            <InfoRow
              icon={MapPin}
              label="Adresse"
              value={hotel.address ?? "Non renseignée"}
            />
            <InfoRow icon={MapPin} label="Ville" value={hotel.city} />
            <InfoRow icon={MapPin} label="Pays" value={hotel.country} />
            <Separator className="my-2" />
            <InfoRow
              icon={Star}
              label="Classification"
              value={
                hotel.star_rating > 0 ? (
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < hotel.star_rating
                            ? "fill-gold text-gold"
                            : "text-slate/30"
                        }`}
                      />
                    ))}
                  </div>
                ) : (
                  "Non classé"
                )
              }
            />
            <InfoRow
              icon={BedDouble}
              label="Total chambres"
              value={hotel.total_rooms}
            />
            <InfoRow
              icon={Phone}
              label="Téléphone"
              value={hotel.phone ?? "Non renseigné"}
            />
            <InfoRow
              icon={Mail}
              label="Email"
              value={hotel.email ?? "Non renseigné"}
            />
            <Separator className="my-2" />
            <InfoRow
              icon={Calendar}
              label="Créé le"
              value={formatDateTime(hotel.created_at)}
            />
          </CardContent>
        </Card>

        {/* Admin profile */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-navy">
              <ShieldCheck className="h-5 w-5 text-gold-dark" />
              Administrateur de l&apos;hôtel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hotel.admin ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-xl font-semibold text-ivory">
                    {hotel.admin.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-navy">
                      {hotel.admin.full_name}
                    </p>
                    <Badge
                      variant="outline"
                      className={ROLE_COLORS[hotel.admin.role] ?? "bg-slate-100 text-slate"}
                    >
                      {ROLE_LABELS[hotel.admin.role] ?? hotel.admin.role}
                    </Badge>
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center gap-2 text-sm text-slate">
                  <Mail className="h-4 w-4" />
                  <span>{hotel.admin.email}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <Users className="mb-3 h-10 w-10 text-slate/40" />
                <p className="text-sm text-slate">
                  Aucun administrateur assigné
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscription info */}
      {hotel.subscription && (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-navy">
              <CreditCard className="h-5 w-5 text-gold-dark" />
              Abonnement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs text-slate">Plan</p>
                <Badge
                  variant="outline"
                  className="border-gold/30 text-gold-dark bg-gold/5"
                >
                  {hotel.subscription.plan?.name ??
                    PLAN_TIER_LABELS[hotel.subscription.plan?.tier as PlanTier] ??
                    "—"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate">Statut</p>
                <Badge
                  variant="outline"
                  className={
                    SUBSCRIPTION_STATUS_STYLES[
                      hotel.subscription.status as SubscriptionStatus
                    ]
                  }
                >
                  {SUBSCRIPTION_STATUS_LABELS[
                    hotel.subscription.status as SubscriptionStatus
                  ] ?? hotel.subscription.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate">Début</p>
                <p className="text-sm font-medium text-navy">
                  {formatDate(hotel.subscription.starts_at)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate">Fin</p>
                <p className="text-sm font-medium text-navy">
                  {formatDate(hotel.subscription.ends_at)}
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-slate" />
                <span className="text-sm text-slate">
                  Max chambres :{" "}
                  <span className="font-medium text-navy">
                    {hotel.subscription.max_rooms}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate" />
                <span className="text-sm text-slate">
                  Max utilisateurs :{" "}
                  <span className="font-medium text-navy">
                    {hotel.subscription.max_users}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activation codes */}
      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-navy">
            <Key className="h-5 w-5 text-gold-dark" />
            Codes d&apos;activation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hotel.activation_codes || hotel.activation_codes.length === 0 ? (
            <div className="py-6 text-center">
              <Key className="mx-auto mb-3 h-8 w-8 text-slate/40" />
              <p className="text-sm text-slate">Aucun code d&apos;activation</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5 sm:-mx-6 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-ivory/60 hover:bg-ivory/60">
                    <TableHead>Code</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Utilisé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotel.activation_codes.map((code) => (
                    <TableRow key={code.id} className="hover:bg-ivory/30">
                      <TableCell>
                        <code className="rounded bg-ivory px-2 py-1 text-sm font-mono font-semibold text-navy">
                          {code.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={CODE_STATUS_STYLES[code.status]}
                        >
                          {CODE_STATUS_LABELS[code.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate">
                        {formatDateTime(code.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-slate">
                        {formatDateTime(code.used_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-navy flex items-center gap-2">
              {confirmAction === "suspend" ? (
                <>
                  <PauseCircle className="h-5 w-5 text-red-600" />
                  Suspendre l&apos;hôtel
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5 text-emerald-600" />
                  Réactiver l&apos;hôtel
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "suspend"
                ? `Voulez-vous vraiment suspendre "${hotel.name}" ? L'accès à la plateforme sera bloqué pour tous les utilisateurs de cet hôtel.`
                : `Voulez-vous vraiment réactiver "${hotel.name}" ? L'accès à la plateforme sera restauré pour tous les utilisateurs.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Cette action est immédiate.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={actionLoading}
              className={`rounded-xl text-white ${
                confirmAction === "suspend"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {actionLoading
                ? "Traitement..."
                : confirmAction === "suspend"
                  ? "Suspendre"
                  : "Réactiver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
