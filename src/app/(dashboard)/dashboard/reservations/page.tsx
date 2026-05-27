"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  CalendarCheck,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Eye,
  Users,
  BedDouble,
  Phone,
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
  created_by: string | null;
  created_at: string;
  updated_at: string;
  room?: Room;
}

interface StatusCounts {
  [key: string]: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────
function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function getStatusColor(status: ReservationStatus): string {
  switch (status) {
    case "confirmee":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "en_cours":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "terminee":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "annulee":
      return "bg-red-100 text-red-700 border-red-200";
    case "no_show":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate border-slate-200";
  }
}

function getStatusDotColor(status: ReservationStatus): string {
  switch (status) {
    case "confirmee":
      return "bg-blue-500";
    case "en_cours":
      return "bg-emerald-500";
    case "terminee":
      return "bg-slate-400";
    case "annulee":
      return "bg-red-500";
    case "no_show":
      return "bg-amber-500";
    default:
      return "bg-slate-400";
  }
}

function getStatusRowBg(status: ReservationStatus): string {
  switch (status) {
    case "confirmee":
      return "hover:bg-blue-50/40";
    case "en_cours":
      return "hover:bg-emerald-50/40";
    case "annulee":
      return "hover:bg-red-50/40";
    case "no_show":
      return "hover:bg-amber-50/40";
    default:
      return "hover:bg-ivory/30";
  }
}

function getStatusLeftBorder(status: ReservationStatus): string {
  switch (status) {
    case "confirmee":
      return "border-l-4 border-l-blue-400";
    case "en_cours":
      return "border-l-4 border-l-emerald-400";
    case "terminee":
      return "border-l-4 border-l-slate-300";
    case "annulee":
      return "border-l-4 border-l-red-400";
    case "no_show":
      return "border-l-4 border-l-amber-400";
    default:
      return "";
  }
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

// ─── Filter chips config ───────────────────────────────────────────────
const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "confirmee", label: "Confirmée" },
  { value: "en_cours", label: "En cours" },
  { value: "terminee", label: "Terminée" },
  { value: "annulee", label: "Annulée" },
  { value: "no_show", label: "No-show" },
];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "standard", label: "Standard" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suite" },
  { value: "presidentielle", label: "Présidentielle" },
];

// ─── Component ──────────────────────────────────────────────────────────
export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [loading, setLoading] = useState(true);

  // ─── Filtres ─────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = search || statusFilter || typeFilter || dateFrom || dateTo;

  // ─── Fetch reservations ──────────────────────────────────────────
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("room_type", typeFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(
        `/api/hotel-admin/reservations?${params.toString()}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReservations(data.reservations ?? []);
      setStatusCounts(data.status_counts ?? {});
    } catch {
      toast.error("Impossible de charger les réservations.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // ─── Clear filters ──────────────────────────────────────────────
  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <CalendarCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Réservations
            </h1>
            <p className="text-sm text-slate">
              Gérez les réservations de votre établissement.
            </p>
          </div>
        </div>
        <Button
          asChild
          className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
        >
          <Link href="/dashboard/reservations/creer">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle réservation
          </Link>
        </Button>
      </motion.div>

      {/* ─── Status summary chips ────────────────────────────────── */}
      {Object.keys(statusCounts).length > 0 && (
        <motion.div variants={item} className="flex flex-wrap gap-2">
          {(
            Object.entries(statusCounts) as [ReservationStatus, number][]
          ).map(([status, count]) => (
            <button
              key={status}
              onClick={() =>
                setStatusFilter(statusFilter === status ? "" : status)
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === status
                  ? getStatusColor(status)
                  : "border-border bg-white text-slate hover:border-slate-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${getStatusDotColor(status)}`}
              />
              {RESERVATION_STATUS_LABELS[status]}
              <span className="ml-0.5 font-semibold">{count}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* ─── Search & Filters ────────────────────────────────────── */}
      <motion.div variants={item} className="space-y-3">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <Input
              placeholder="Rechercher par client ou chambre..."
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
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-xl border-border ${showFilters ? "bg-navy text-ivory hover:bg-navy-light" : ""}`}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtres
          </Button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="rounded-xl border-border">
                <CardContent className="flex flex-wrap items-end gap-4 p-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate">
                      Statut
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
                    >
                      <SelectTrigger className="w-[160px] rounded-xl border-border">
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_FILTERS.map((s) => (
                          <SelectItem key={s.value} value={s.value || "all"}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate">
                      Type de chambre
                    </label>
                    <Select
                      value={typeFilter}
                      onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}
                    >
                      <SelectTrigger className="w-[160px] rounded-xl border-border">
                        <SelectValue placeholder="Tous les types" />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_FILTERS.map((t) => (
                          <SelectItem key={t.value} value={t.value || "all"}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate">
                      Date d&apos;arrivée (de)
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-[160px] rounded-xl border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate">
                      Date d&apos;arrivée (jusqu&apos;au)
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-[160px] rounded-xl border-border"
                    />
                  </div>

                  {hasFilters && (
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="rounded-xl text-slate hover:text-navy"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Réinitialiser
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Reservations List ───────────────────────────────────── */}
      <motion.div variants={item}>
        {reservations.length === 0 ? (
          <Card className="rounded-xl border-border shadow-sm overflow-hidden">
            <EmptyState
              icon={CalendarCheck}
              title={hasFilters ? "Aucun résultat" : "Aucune réservation"}
              description={
                hasFilters
                  ? "Essayez de modifier vos critères de recherche."
                  : "Commencez par créer votre première réservation."
              }
              action={
                !hasFilters
                  ? {
                      label: "Nouvelle réservation",
                      href: "/dashboard/reservations/creer",
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
                          Type
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Dates
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Montant
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Statut
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {reservations.map((r) => (
                        <tr
                          key={r.id}
                          className={`group transition-colors ${getStatusRowBg(r.status)} ${getStatusLeftBorder(r.status)}`}
                        >
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="text-sm font-medium text-navy">
                                {r.guest_name}
                              </p>
                              {r.guest_phone && (
                                <p className="flex items-center gap-1 text-xs text-slate">
                                  <Phone className="h-3 w-3" />
                                  {r.guest_phone}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm text-navy">
                              {r.room?.number ?? (
                                <span className="text-slate italic">
                                  Non assignée
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant="outline"
                              className="bg-slate-50 text-slate-700 border-slate-200"
                            >
                              <BedDouble className="mr-1 h-3 w-3" />
                              {ROOM_TYPE_LABELS[r.room_type]}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-sm">
                              <p className="text-navy">
                                {formatDateShort(r.check_in)} →{" "}
                                {formatDateShort(r.check_out)}
                              </p>
                              <p className="text-xs text-slate">
                                {r.number_of_nights} nuit
                                {r.number_of_nights > 1 ? "s" : ""}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-semibold text-navy">
                              {formatFCFA(r.total_amount)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${getStatusDotColor(r.status)}`}
                              />
                              <Badge
                                variant="outline"
                                className={getStatusColor(r.status)}
                              >
                                {RESERVATION_STATUS_LABELS[r.status]}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0 text-slate hover:text-navy hover:bg-navy/10"
                            >
                              <Link href={`/dashboard/reservations/${r.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {reservations.map((r) => (
                <ReservationCard key={r.id} reservation={r} />
              ))}
            </div>

            {/* Results count */}
            <p className="mt-4 text-center text-xs text-slate">
              {reservations.length} réservation
              {reservations.length > 1 ? "s" : ""} affichée
              {reservations.length > 1 ? "s" : ""}
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Reservation Card (mobile) ─────────────────────────────────────────
function ReservationCard({ reservation: r }: { reservation: Reservation }) {
  return (
    <Card
      className={`rounded-xl border-border shadow-sm overflow-hidden ${getStatusLeftBorder(r.status)}`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
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
            className={`text-[10px] px-1.5 py-0 ${getStatusColor(r.status)}`}
          >
            {RESERVATION_STATUS_LABELS[r.status]}
          </Badge>
        </div>

        {/* Room & Type */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5 text-slate" />
            <span className="text-navy">
              {r.room?.number ?? (
                <span className="text-slate italic">Non assignée</span>
              )}
            </span>
          </div>
          <Badge
            variant="outline"
            className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] px-1.5 py-0"
          >
            {ROOM_TYPE_LABELS[r.room_type]}
          </Badge>
        </div>

        {/* Dates */}
        <div className="text-xs text-slate">
          <p>
            {formatDateShort(r.check_in)} → {formatDateShort(r.check_out)}
          </p>
          <p>
            {r.number_of_nights} nuit{r.number_of_nights > 1 ? "s" : ""}
          </p>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-sm font-semibold text-navy">
            {formatFCFA(r.total_amount)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-7 text-xs text-navy hover:bg-navy/10 rounded-lg"
          >
            <Link href={`/dashboard/reservations/${r.id}`}>
              <Eye className="mr-1 h-3.5 w-3.5" />
              Voir
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
