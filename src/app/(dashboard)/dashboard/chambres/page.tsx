"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BedDouble,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Pencil,
  Trash2,
  Bed,
  Bath,
  Wifi,
  Tv,
  Wind,
  Coffee,
  Car,
  UsersRound,
  Building,
  Eye,
} from "lucide-react";
import {
  ROOM_TYPE_LABELS,
  ROOM_STATUS_LABELS,
  type RoomType,
  type RoomStatus,
} from "@/types";
import EmptyState from "@/components/shared/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────
interface Room {
  id: string;
  hotel_id: string;
  number: string;
  floor: number;
  room_type: RoomType;
  status: RoomStatus;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  description: string | null;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Quota {
  used: number;
  max: number;
  remaining: number;
}

interface StatusCounts {
  [key: string]: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────
function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function getRoomTypeIcon(type: RoomType) {
  switch (type) {
    case "standard": return <Bed className="h-4 w-4" />;
    case "deluxe": return <Bath className="h-4 w-4" />;
    case "suite": return <Building className="h-4 w-4" />;
    case "presidentielle": return <BedDouble className="h-4 w-4" />;
    default: return <Bed className="h-4 w-4" />;
  }
}

function getRoomTypeColor(type: RoomType): string {
  switch (type) {
    case "standard": return "bg-slate-100 text-slate-700 border-slate-200";
    case "deluxe": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "suite": return "bg-gold/10 text-gold-dark border-gold/30";
    case "presidentielle": return "bg-navy/5 text-navy border-navy/20";
    default: return "bg-slate-100 text-slate border-slate-200";
  }
}

function getStatusColor(status: RoomStatus): string {
  switch (status) {
    case "disponible": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "occupee": return "bg-red-100 text-red-700 border-red-200";
    case "reservee": return "bg-blue-100 text-blue-700 border-blue-200";
    case "nettoyage": return "bg-amber-100 text-amber-700 border-amber-200";
    case "maintenance": return "bg-orange-100 text-orange-700 border-orange-200";
    default: return "bg-slate-100 text-slate border-slate-200";
  }
}

function getStatusDotColor(status: RoomStatus): string {
  switch (status) {
    case "disponible": return "bg-emerald-500";
    case "occupee": return "bg-red-500";
    case "reservee": return "bg-blue-500";
    case "nettoyage": return "bg-amber-500";
    case "maintenance": return "bg-orange-500";
    default: return "bg-slate-400";
  }
}

function getAmenityIcon(amenity: string) {
  const a = amenity.toLowerCase();
  if (a.includes("wifi")) return <Wifi className="h-3 w-3" />;
  if (a.includes("tv") || a.includes("télé")) return <Tv className="h-3 w-3" />;
  if (a.includes("clim") || a.includes("air")) return <Wind className="h-3 w-3" />;
  if (a.includes("café") || a.includes("coffee") || a.includes("minibar")) return <Coffee className="h-3 w-3" />;
  if (a.includes("parking") || a.includes("voitur")) return <Car className="h-3 w-3" />;
  return <BedDouble className="h-3 w-3" />;
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
  { value: "", label: "Tous" },
  { value: "disponible", label: "Disponible" },
  { value: "occupee", label: "Occupée" },
  { value: "reservee", label: "Réservée" },
  { value: "nettoyage", label: "Nettoyage" },
  { value: "maintenance", label: "Maintenance" },
];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "standard", label: "Standard" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suite" },
  { value: "presidentielle", label: "Présidentielle" },
];

// ─── Component ──────────────────────────────────────────────────────────
export default function ChambresPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Filtres ─────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const quotaFull = quota ? quota.remaining <= 0 : false;
  const hasFilters = search || statusFilter || typeFilter;

  // ─── Fetch rooms ────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("room_type", typeFilter);

      const res = await fetch(`/api/hotel-admin/rooms?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRooms(data.rooms ?? []);
      setQuota(data.quota ?? null);
      setStatusCounts(data.status_counts ?? {});
    } catch {
      toast.error("Impossible de charger les chambres.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // ─── Suppression douce ──────────────────────────────────────────
  async function deleteRoom(id: string, number: string) {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/hotel-admin/rooms/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors de la suppression.");
        return;
      }
      toast.success(data.message);
      fetchRooms();
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Clear filters ──────────────────────────────────────────────
  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <BedDouble className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">Chambres</h1>
            <p className="text-sm text-slate">Gérez les chambres de votre établissement.</p>
          </div>
        </div>
        <Button
          asChild
          disabled={quotaFull}
          className="rounded-xl bg-navy text-ivory hover:bg-navy-light disabled:opacity-50"
        >
          <Link href="/dashboard/chambres/creer">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une chambre
          </Link>
        </Button>
      </motion.div>

      {/* ─── Quota Banner ────────────────────────────────────────── */}
      {quota && (
        <motion.div variants={item}>
          <Card className={`rounded-xl border ${
            quotaFull
              ? "border-red-200 bg-red-50/50"
              : quota.remaining <= 3
                ? "border-amber-200 bg-amber-50/50"
                : "border-emerald-200 bg-emerald-50/50"
          }`}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <BedDouble className={`h-5 w-5 ${quotaFull ? "text-red-500" : quota.remaining <= 3 ? "text-amber-600" : "text-emerald-600"}`} />
                <div>
                  <p className="text-sm font-medium text-navy">
                    {quota.used} / {quota.max > 999 ? "∞" : quota.max} chambre{quota.max > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-slate">
                    {quotaFull
                      ? "Quota atteint — mettez à niveau votre abonnement."
                      : `${quota.remaining} place${quota.remaining > 1 ? "s" : ""} restante${quota.remaining > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="h-2 w-32 rounded-full bg-white">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      quotaFull ? "bg-red-500" : quota.remaining <= 3 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (quota.used / Math.max(1, quota.max)) * 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold ${
                  quotaFull ? "text-red-600" : quota.remaining <= 3 ? "text-amber-600" : "text-emerald-600"
                }`}>
                  {quota.max > 999 ? "Illimité" : `${quota.used}/${quota.max}`}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Status summary chips ────────────────────────────────── */}
      {Object.keys(statusCounts).length > 0 && (
        <motion.div variants={item} className="flex flex-wrap gap-2">
          {(Object.entries(statusCounts) as [RoomStatus, number][]).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === status
                  ? getStatusColor(status)
                  : "border-border bg-white text-slate hover:border-slate-300"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${getStatusDotColor(status)}`} />
              {ROOM_STATUS_LABELS[status]}
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
              placeholder="Rechercher par numéro ou description..."
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
                    <label className="text-xs font-medium text-slate">Type</label>
                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
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
                    <label className="text-xs font-medium text-slate">Statut</label>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
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

      {/* ─── Room Grid ───────────────────────────────────────────── */}
      <motion.div variants={item}>
        {rooms.length === 0 ? (
          <Card className="rounded-xl border-border shadow-sm overflow-hidden">
            <EmptyState
              icon={BedDouble}
              title={hasFilters ? "Aucun résultat" : "Aucune chambre"}
              description={
                hasFilters
                  ? "Essayez de modifier vos critères de recherche."
                  : "Commencez par ajouter votre première chambre."
              }
              action={!quotaFull && !hasFilters ? { label: "Ajouter une chambre", href: "/dashboard/chambres/creer" } : undefined}
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
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">Chambre</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">Type</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">Étage</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">Prix / nuit</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">Statut</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">Capacité</th>
                        <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {rooms.map((room) => (
                        <tr key={room.id} className="group transition-colors hover:bg-ivory/30">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${
                                room.status === "disponible"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : room.status === "occupee"
                                    ? "bg-red-100 text-red-700"
                                    : room.status === "reservee"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-slate-100 text-slate"
                              }`}>
                                {room.number}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-navy">Chambre {room.number}</p>
                                {room.description && (
                                  <p className="max-w-[180px] truncate text-xs text-slate">{room.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant="outline" className={getRoomTypeColor(room.room_type)}>
                              {getRoomTypeIcon(room.room_type)}
                              <span className="ml-1">{ROOM_TYPE_LABELS[room.room_type]}</span>
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm text-slate">
                              {room.floor === 0 ? "RDC" : room.floor < 0 ? `Sous-sol ${Math.abs(room.floor)}` : `${room.floor}ᵉ`}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-navy">{formatFCFA(room.price_per_night)}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${getStatusDotColor(room.status)}`} />
                              <Badge variant="outline" className={getStatusColor(room.status)}>
                                {ROOM_STATUS_LABELS[room.status]}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1 text-xs text-slate">
                              <UsersRound className="h-3.5 w-3.5" />
                              {room.capacity} pers.
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/chambres/${room.id}/modifier`)}
                                className="h-8 w-8 p-0 text-slate hover:text-navy hover:bg-navy/10"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={deletingId === room.id}
                                    className="h-8 w-8 p-0 text-slate hover:text-red-600 hover:bg-red-50"
                                  >
                                    {deletingId === room.id
                                      ? <Loader2 className="h-4 w-4 animate-spin" />
                                      : <Trash2 className="h-4 w-4" />
                                    }
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-serif text-navy">
                                      Supprimer la chambre n° {room.number} ?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action désactivera la chambre. Elle ne sera plus visible dans la gestion.
                                      Les réservations terminées resteront accessibles.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteRoom(room.id, room.number)}
                                      className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
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
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  deletingId={deletingId}
                  onEdit={(id) => router.push(`/dashboard/chambres/${id}/modifier`)}
                  onDelete={(id, number) => deleteRoom(id, number)}
                />
              ))}
            </div>

            {/* Results count */}
            <p className="mt-4 text-center text-xs text-slate">
              {rooms.length} chambre{rooms.length > 1 ? "s" : ""} affichée{rooms.length > 1 ? "s" : ""}
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Room Card (mobile) ────────────────────────────────────────────────
function RoomCard({
  room,
  deletingId,
  onEdit,
  onDelete,
}: {
  room: Room;
  deletingId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string, number: string) => void;
}) {
  return (
    <Card className="rounded-xl border-border shadow-sm overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
              room.status === "disponible"
                ? "bg-emerald-100 text-emerald-700"
                : room.status === "occupee"
                  ? "bg-red-100 text-red-700"
                  : room.status === "reservee"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate"
            }`}>
              {room.number}
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">Chambre {room.number}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getRoomTypeColor(room.room_type)}`}>
                  {ROOM_TYPE_LABELS[room.room_type]}
                </Badge>
                <span className="text-[11px] text-slate">
                  {room.floor === 0 ? "RDC" : room.floor < 0 ? `SS${Math.abs(room.floor)}` : `${room.floor}ᵉ`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${getStatusDotColor(room.status)}`} />
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusColor(room.status)}`}>
              {ROOM_STATUS_LABELS[room.status]}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-navy">{formatFCFA(room.price_per_night)}<span className="text-xs font-normal text-slate"> / nuit</span></span>
          <div className="flex items-center gap-1 text-xs text-slate">
            <UsersRound className="h-3.5 w-3.5" />
            {room.capacity} pers.
          </div>
        </div>

        {/* Amenities */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {room.amenities.slice(0, 4).map((amenity, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-md bg-ivory px-2 py-0.5 text-[11px] text-slate">
                {getAmenityIcon(amenity)}
                {amenity}
              </span>
            ))}
            {room.amenities.length > 4 && (
              <span className="text-[11px] text-slate">+{room.amenities.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(room.id)}
            className="flex-1 h-8 rounded-lg text-xs text-navy hover:bg-navy/10"
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Modifier
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={deletingId === room.id}
                className="flex-1 h-8 rounded-lg text-xs text-red-600 hover:bg-red-50"
              >
                {deletingId === room.id
                  ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="mr-1 h-3.5 w-3.5" />
                }
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-navy">
                  Supprimer la chambre n° {room.number} ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action désactivera la chambre.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(room.id, room.number)}
                  className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
