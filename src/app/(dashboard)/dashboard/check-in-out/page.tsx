"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LogIn,
  LogOut,
  Search,
  Eye,
  BedDouble,
  Users,
  CalendarCheck,
  Phone,
  X,
  ArrowRightLeft,
} from "lucide-react";
import {
  RESERVATION_STATUS_LABELS,
  ROOM_TYPE_LABELS,
  type ReservationStatus,
  type RoomType,
} from "@/types";
import EmptyState from "@/components/shared/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────
interface Room {
  id: string;
  number: string;
  room_type: string;
  price_per_night: number;
  floor: number;
  status: string;
}

interface Reservation {
  id: string;
  hotel_id: string;
  guest_id: string | null;
  room_id: string | null;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  number_of_nights: number;
  status: ReservationStatus;
  adults: number;
  children: number;
  room_type: RoomType;
  total_amount: number;
  paid_amount: number;
  deposit_required: number;
  source: string;
  notes: string | null;
  actual_check_in: string | null;
  actual_check_out: string | null;
  created_at: string;
  room?: Room;
}

// ─── Helpers ────────────────────────────────────────────────────────────
function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function getActionType(status: ReservationStatus): "checkin" | "checkout" | null {
  if (status === "confirmee") return "checkin";
  if (status === "en_cours") return "checkout";
  return null;
}

function isToday(date: string): boolean {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
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
export default function CheckInOutPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Filtres ─────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "checkin" | "checkout">("all");

  // ─── Confirmation dialog ─────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    reservation: Reservation | null;
    action: "checkin" | "checkout";
  }>({ open: false, reservation: null, action: "checkin" });
  const [processing, setProcessing] = useState(false);

  // ─── Fetch réservations éligibles ────────────────────────────────
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch confirmées (éligibles check-in) et en_cours (éligibles check-out)
      const [res1, res2] = await Promise.all([
        fetch("/api/hotel-admin/reservations?status=confirmee"),
        fetch("/api/hotel-admin/reservations?status=en_cours"),
      ]);

      let all: Reservation[] = [];
      if (res1.ok) {
        const data = await res1.json();
        all = [...(data.reservations ?? [])];
      }
      if (res2.ok) {
        const data2 = await res2.json();
        all = [...all, ...(data2.reservations ?? [])];
      }

      // Trier : les arrivées du jour en premier, puis par date de check-in
      all.sort((a, b) => {
        const aToday = isToday(a.check_in) && a.status === "confirmee" ? 0 : 1;
        const bToday = isToday(b.check_in) && b.status === "confirmee" ? 0 : 1;
        if (aToday !== bToday) return aToday - bToday;
        return new Date(a.check_in).getTime() - new Date(b.check_in).getTime();
      });

      setReservations(all);
    } catch {
      toast.error("Impossible de charger les réservations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // ─── Filtre recherche ─────────────────────────────────────────────
  const filteredReservations = reservations.filter((r) => {
    // Tab filter
    if (tabFilter === "checkin" && r.status !== "confirmee") return false;
    if (tabFilter === "checkout" && r.status !== "en_cours") return false;

    // Search filter
    if (search) {
      const term = search.toLowerCase();
      const guestName = (r.guest_name || "").toLowerCase();
      const roomNumber = r.room?.number?.toLowerCase() ?? "";
      return guestName.includes(term) || roomNumber.includes(term);
    }
    return true;
  });

  // ─── Compteurs ───────────────────────────────────────────────────
  const checkinCount = reservations.filter((r) => r.status === "confirmee").length;
  const checkoutCount = reservations.filter((r) => r.status === "en_cours").length;
  const todayArrivals = reservations.filter(
    (r) => r.status === "confirmee" && isToday(r.check_in)
  ).length;
  const todayDepartures = reservations.filter(
    (r) => r.status === "en_cours" && isToday(r.check_out)
  ).length;

  // ─── Action check-in / check-out ────────────────────────────────
  async function handleAction() {
    const { reservation, action } = confirmDialog;
    if (!reservation) return;

    try {
      setProcessing(true);
      const endpoint =
        action === "checkin"
          ? `/api/hotel-admin/reservations/${reservation.id}/checkin`
          : `/api/hotel-admin/reservations/${reservation.id}/checkout`;

      const res = await fetch(endpoint, { method: "PATCH" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Impossible d'effectuer l'opération.");
        return;
      }

      toast.success(
        action === "checkin"
          ? `Check-in effectué pour ${reservation.guest_name}.`
          : `Check-out effectué pour ${reservation.guest_name}.`
      );

      setConfirmDialog({ open: false, reservation: null, action: "checkin" });
      fetchReservations();
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setProcessing(false);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

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
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
            <ArrowRightLeft className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Check-in / Check-out
            </h1>
            <p className="text-sm text-slate">
              Gérez les arrivées et départs de vos clients.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── Stats du jour ────────────────────────────────────────── */}
      <motion.div
        variants={item}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <LogIn className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate">Arrivées aujourd&apos;hui</p>
              <p className="text-lg font-bold text-emerald-600">{todayArrivals}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
              <LogOut className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate">Départs aujourd&apos;hui</p>
              <p className="text-lg font-bold text-blue-600">{todayDepartures}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <CalendarCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate">Check-ins en attente</p>
              <p className="text-lg font-bold text-navy">{checkinCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate">Check-outs en attente</p>
              <p className="text-lg font-bold text-navy">{checkoutCount}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Tabs + Search ────────────────────────────────────────── */}
      <motion.div variants={item} className="space-y-3">
        {/* Tab filter */}
        <div className="flex gap-2">
          {(
            [
              { value: "all" as const, label: "Tous", count: reservations.length },
              { value: "checkin" as const, label: "Check-in", count: checkinCount },
              { value: "checkout" as const, label: "Check-out", count: checkoutCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTabFilter(tab.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                tabFilter === tab.value
                  ? "border-navy bg-navy text-ivory"
                  : "border-border bg-white text-slate hover:border-navy/30 hover:text-navy"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  tabFilter === tab.value
                    ? "bg-white/20 text-ivory"
                    : "bg-slate-100 text-slate"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            placeholder="Rechercher par client ou numéro de chambre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-border pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-navy"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* ─── Réservations List ───────────────────────────────────── */}
      <motion.div variants={item}>
        {filteredReservations.length === 0 ? (
          <Card className="rounded-xl border-border shadow-sm overflow-hidden">
            <EmptyState
              icon={ArrowRightLeft}
              title={
                hasFilters()
                  ? "Aucun résultat"
                  : "Aucun check-in/out en attente"
              }
              description={
                hasFilters()
                  ? "Essayez de modifier vos critères de recherche."
                  : "Toutes les réservations sont à jour. Aucune action n'est requise."
              }
              action={
                !hasFilters()
                  ? {
                      label: "Voir les réservations",
                      href: "/dashboard/reservations",
                    }
                  : undefined
              }
            />
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <Card className="rounded-xl border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-ivory/60">
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Client
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Chambre
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Dates
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Montant
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Paiement
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredReservations.map((r) => (
                        <CheckInOutRow
                          key={r.id}
                          reservation={r}
                          onAction={(action) =>
                            setConfirmDialog({
                              open: true,
                              reservation: r,
                              action,
                            })
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {filteredReservations.map((r) => (
                <CheckInOutCard
                  key={r.id}
                  reservation={r}
                  onAction={(action) =>
                    setConfirmDialog({
                      open: true,
                      reservation: r,
                      action,
                    })
                  }
                />
              ))}
            </div>

            {/* Results count */}
            <p className="mt-4 text-center text-xs text-slate">
              {filteredReservations.length} réservation
              {filteredReservations.length > 1 ? "s" : ""}
            </p>
          </>
        )}
      </motion.div>

      {/* ─── Confirmation Dialog ─────────────────────────────────── */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ open, reservation: null, action: "checkin" })
        }
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "checkin"
                ? "Confirmer le check-in"
                : "Confirmer le check-out"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "checkin" ? (
                <>
                  Vous allez effectuer le check-in de{" "}
                  <span className="font-semibold text-navy">
                    {confirmDialog.reservation?.guest_name}
                  </span>{" "}
                  pour la chambre{" "}
                  <span className="font-semibold text-navy">
                    {confirmDialog.reservation?.room?.number ?? "non assignée"}
                  </span>
                  . La chambre sera marquée comme occupée.
                </>
              ) : (
                <>
                  Vous allez effectuer le check-out de{" "}
                  <span className="font-semibold text-navy">
                    {confirmDialog.reservation?.guest_name}
                  </span>{" "}
                  (chambre{" "}
                  <span className="font-semibold text-navy">
                    {confirmDialog.reservation?.room?.number ?? "N/A"}
                  </span>
                  ).
                  {confirmDialog.reservation &&
                    confirmDialog.reservation.paid_amount <
                      confirmDialog.reservation.total_amount && (
                      <span className="mt-2 block rounded-lg bg-amber-50 p-2 text-sm text-amber-700">
                        ⚠️ Attention : le client n&apos;a pas réglé l&apos;intégralité
                        de son séjour (reste :{" "}
                        {formatFCFA(
                          confirmDialog.reservation.total_amount -
                            confirmDialog.reservation.paid_amount
                        )}
                        ).
                      </span>
                    )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={processing}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={processing}
              className={
                confirmDialog.action === "checkin"
                  ? "rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                  : "rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              }
            >
              {processing
                ? "Traitement..."
                : confirmDialog.action === "checkin"
                  ? "Effectuer le check-in"
                  : "Effectuer le check-out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

// ─── Helper ────────────────────────────────────────────────────────────
function hasFilters(): boolean {
  return false; // Will be set by parent scope
}

// ─── Desktop Row ───────────────────────────────────────────────────────
function CheckInOutRow({
  reservation: r,
  onAction,
}: {
  reservation: Reservation;
  onAction: (action: "checkin" | "checkout") => void;
}) {
  const actionType = getActionType(r.status);
  const isArrivalToday = isToday(r.check_in);
  const isDepartureToday = isToday(r.check_out);
  const paidPercent =
    r.total_amount > 0
      ? Math.round((r.paid_amount / r.total_amount) * 100)
      : 0;

  return (
    <tr className="group transition-colors hover:bg-ivory/30">
      <td className="px-5 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-navy">{r.guest_name}</p>
            {isArrivalToday && r.status === "confirmee" && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                Arrivée aujourd&apos;hui
              </Badge>
            )}
            {isDepartureToday && r.status === "en_cours" && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
                Départ aujourd&apos;hui
              </Badge>
            )}
          </div>
          {r.guest_phone && (
            <p className="flex items-center gap-1 text-xs text-slate">
              <Phone className="h-3 w-3" />
              {r.guest_phone}
            </p>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <BedDouble className="h-3.5 w-3.5 text-slate" />
          <span className="text-sm text-navy">
            {r.room?.number ?? (
              <span className="text-red-500 italic">Non assignée</span>
            )}
          </span>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="text-sm">
          <p className="text-navy">
            {formatDateShort(r.check_in)} → {formatDateShort(r.check_out)}
          </p>
          <p className="text-xs text-slate">
            {r.number_of_nights} nuit{r.number_of_nights > 1 ? "s" : ""}
          </p>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-sm font-semibold text-navy">
          {formatFCFA(r.total_amount)}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${
                  paidPercent >= 100
                    ? "bg-emerald-500"
                    : paidPercent >= 30
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${Math.min(100, paidPercent)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate">{paidPercent}%</span>
          </div>
          <p className="text-xs text-slate">
            {formatFCFA(r.paid_amount)} / {formatFCFA(r.total_amount)}
          </p>
        </div>
      </td>
      <td className="px-5 py-3.5">
        {actionType ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onAction(actionType)}
              disabled={!r.room_id}
              className={`rounded-xl text-white ${
                actionType === "checkin"
                  ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300"
                  : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
              }`}
            >
              {actionType === "checkin" ? (
                <>
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Check-in
                </>
              ) : (
                <>
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Check-out
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" asChild className="rounded-xl">
              <Link href={`/dashboard/reservations/${r.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" asChild className="rounded-xl">
            <Link href={`/dashboard/reservations/${r.id}`}>
              <Eye className="mr-1.5 h-4 w-4" />
              Détails
            </Link>
          </Button>
        )}
      </td>
    </tr>
  );
}

// ─── Mobile Card ───────────────────────────────────────────────────────
function CheckInOutCard({
  reservation: r,
  onAction,
}: {
  reservation: Reservation;
  onAction: (action: "checkin" | "checkout") => void;
}) {
  const actionType = getActionType(r.status);
  const paidPercent =
    r.total_amount > 0
      ? Math.round((r.paid_amount / r.total_amount) * 100)
      : 0;

  return (
    <Card
      className={`rounded-xl border-border shadow-sm overflow-hidden ${
        r.status === "confirmee"
          ? "border-l-4 border-l-emerald-400"
          : "border-l-4 border-l-blue-400"
      }`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-navy">{r.guest_name}</p>
            {r.guest_phone && (
              <p className="flex items-center gap-1 text-xs text-slate">
                <Phone className="h-3 w-3" />
                {r.guest_phone}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${
              r.status === "confirmee"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-blue-100 text-blue-700 border-blue-200"
            }`}
          >
            {RESERVATION_STATUS_LABELS[r.status]}
          </Badge>
        </div>

        {/* Room */}
        <div className="flex items-center gap-2 text-sm">
          <BedDouble className="h-3.5 w-3.5 text-slate" />
          <span className="text-navy">
            {r.room?.number ?? (
              <span className="text-red-500 italic">Non assignée</span>
            )}
          </span>
          <span className="text-slate">·</span>
          <span className="text-slate">
            {formatDateShort(r.check_in)} → {formatDateShort(r.check_out)}
          </span>
        </div>

        {/* Payment progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate">
              {formatFCFA(r.paid_amount)} / {formatFCFA(r.total_amount)}
            </span>
            <span className="font-medium text-slate">{paidPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                paidPercent >= 100
                  ? "bg-emerald-500"
                  : paidPercent >= 30
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, paidPercent)}%` }}
            />
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          {actionType && (
            <Button
              size="sm"
              onClick={() => onAction(actionType)}
              disabled={!r.room_id}
              className={`flex-1 rounded-xl text-white ${
                actionType === "checkin"
                  ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300"
                  : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
              }`}
            >
              {actionType === "checkin" ? (
                <>
                  <LogIn className="mr-1.5 h-3.5 w-3.5" />
                  Check-in
                </>
              ) : (
                <>
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  Check-out
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <Link href={`/dashboard/reservations/${r.id}`}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Détails
            </Link>
          </Button>
        </div>

        {!r.room_id && r.status === "confirmee" && (
          <p className="text-xs text-amber-600">
            ⚠️ Aucune chambre assignée. Assignez une chambre avant le check-in.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
