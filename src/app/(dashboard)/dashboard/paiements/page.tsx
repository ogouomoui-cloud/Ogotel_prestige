"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowDownToLine,
  RotateCcw,
  Clock,
  Filter,
} from "lucide-react";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentMethod,
  type PaymentStatus,
} from "@/types";
import EmptyState from "@/components/shared/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────
interface ReservationInfo {
  id: string;
  guest_name: string;
  room_id: string;
  rooms: { number: string }[];
}

interface Payment {
  id: string;
  hotel_id: string;
  reservation_id: string | null;
  guest_id: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  paid_by: string | null;
  paid_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  reservation?: ReservationInfo;
}

interface Reservation {
  id: string;
  guest_name: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  room?: { number: string };
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

function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMethodIcon(method: PaymentMethod) {
  switch (method) {
    case "especes":
      return Banknote;
    case "carte":
      return CreditCard;
    case "mobile_money":
      return Smartphone;
    default:
      return ArrowDownToLine;
  }
}

function getMethodColor(method: PaymentMethod): string {
  switch (method) {
    case "especes":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "carte":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "mobile_money":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "virement":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "cheque":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate border-slate-200";
  }
}

function getStatusColor(status: PaymentStatus): string {
  switch (status) {
    case "payee":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "en_attente":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "annulee":
      return "bg-red-100 text-red-700 border-red-200";
    case "remboursee":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-slate-100 text-slate border-slate-200";
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

// ─── Filter configs ────────────────────────────────────────────────────
const METHOD_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "especes", label: "Espèces" },
  { value: "carte", label: "Carte" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "virement", label: "Virement" },
  { value: "cheque", label: "Chèque" },
];

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "payee", label: "Payé" },
  { value: "en_attente", label: "En attente" },
  { value: "annulee", label: "Annulé" },
  { value: "remboursee", label: "Remboursé" },
];

// ─── Component ──────────────────────────────────────────────────────────
export default function PaiementsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // ─── Filtres ─────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = search || methodFilter || statusFilter || dateFrom || dateTo;

  // ─── Formulaire nouveau paiement ──────────────────────────────────
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [formReservationId, setFormReservationId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState<PaymentMethod>("especes");
  const [formReference, setFormReference] = useState("");
  const [formPaidBy, setFormPaidBy] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedReservation = reservations.find((r) => r.id === formReservationId);
  const remaining = selectedReservation
    ? Math.max(0, selectedReservation.total_amount - selectedReservation.paid_amount)
    : 0;

  // ─── Fetch paiements ──────────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (methodFilter) params.set("method", methodFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(`/api/hotel-admin/payments?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPayments(data.payments ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Impossible de charger les paiements.");
    } finally {
      setLoading(false);
    }
  }, [methodFilter, statusFilter, dateFrom, dateTo]);

  // ─── Fetch réservations actives pour le formulaire ─────────────────
  const fetchReservations = useCallback(async () => {
    try {
      const res = await fetch("/api/hotel-admin/reservations?status=en_cours");
      if (!res.ok) return;
      const data = await res.json();
      // Ajouter aussi les confirmées
      const res2 = await fetch("/api/hotel-admin/reservations?status=confirmee");
      if (res2.ok) {
        const data2 = await res2.json();
        const all = [...(data.reservations ?? []), ...(data2.reservations ?? [])];
        setReservations(all.filter(
          (r, i, arr) => arr.findIndex((a) => a.id === r.id) === i
        ));
      } else {
        setReservations(data.reservations ?? []);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (dialogOpen) fetchReservations();
  }, [dialogOpen, fetchReservations]);

  // ─── Clear filters ──────────────────────────────────────────────
  function clearFilters() {
    setSearch("");
    setMethodFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  }

  // ─── Filtre recherche client ─────────────────────────────────────
  const filteredPayments = search
    ? payments.filter((p) => {
        const term = search.toLowerCase();
        const guestName = p.reservation?.guest_name?.toLowerCase() ?? "";
        const ref = p.reference?.toLowerCase() ?? "";
        const paidBy = p.paid_by?.toLowerCase() ?? "";
        return guestName.includes(term) || ref.includes(term) || paidBy.includes(term);
      })
    : payments;

  // ─── Submit nouveau paiement ─────────────────────────────────────
  async function handleSubmitPayment(e: React.FormEvent) {
    e.preventDefault();

    if (!formReservationId) {
      toast.error("Veuillez sélectionner une réservation.");
      return;
    }
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error("Veuillez entrer un montant valide.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/hotel-admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: formReservationId,
          amount: Number(formAmount),
          method: formMethod,
          status: "payee",
          reference: formReference.trim() || null,
          paid_by: formPaidBy.trim() || null,
          notes: formNotes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Impossible d'enregistrer le paiement.");
        return;
      }

      toast.success(data.message || "Paiement enregistré avec succès.");
      if (data.warning) {
        toast.warning(data.warning);
      }

      // Reset form
      setDialogOpen(false);
      setFormReservationId("");
      setFormAmount("");
      setFormMethod("especes");
      setFormReference("");
      setFormPaidBy("");
      setFormNotes("");
      fetchPayments();
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Compteurs rapides ───────────────────────────────────────────
  const payeeCount = payments.filter((p) => p.status === "payee").length;
  const enAttenteCount = payments.filter((p) => p.status === "en_attente").length;
  const payeeTotal = payments
    .filter((p) => p.status === "payee")
    .reduce((sum, p) => sum + p.amount, 0);

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Paiements
            </h1>
            <p className="text-sm text-slate">
              Suivez et gérez les paiements de votre établissement.
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-navy text-ivory hover:bg-navy-light">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau paiement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enregistrer un paiement</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau paiement pour une réservation en cours.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Réservation */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy">
                  Réservation <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formReservationId}
                  onValueChange={setFormReservationId}
                >
                  <SelectTrigger className="rounded-xl border-border">
                    <SelectValue placeholder="Sélectionner une réservation" />
                  </SelectTrigger>
                  <SelectContent>
                    {reservations.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.guest_name} — {r.room?.number ?? "N/A"} —{" "}
                        {formatFCFA(r.total_amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedReservation && (
                  <p className="text-xs text-slate">
                    Reste à payer :{" "}
                    <span className="font-semibold text-navy">
                      {formatFCFA(remaining)}
                    </span>
                  </p>
                )}
              </div>

              {/* Montant */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy">
                  Montant (FCFA) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="rounded-xl border-border"
                  min={1}
                />
              </div>

              {/* Méthode */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy">
                  Méthode de paiement
                </label>
                <Select
                  value={formMethod}
                  onValueChange={(v) => setFormMethod(v as PaymentMethod)}
                >
                  <SelectTrigger className="rounded-xl border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Référence */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy">
                  Référence
                </label>
                <Input
                  placeholder="N° de transaction (optionnel)"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  className="rounded-xl border-border"
                />
              </div>

              {/* Nom du payeur */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy">
                  Nom du payeur
                </label>
                <Input
                  placeholder="Nom (optionnel)"
                  value={formPaidBy}
                  onChange={(e) => setFormPaidBy(e.target.value)}
                  className="rounded-xl border-border"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy">Notes</label>
                <Textarea
                  placeholder="Notes internes (optionnel)"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="rounded-xl border-border resize-none"
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-xl"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
                >
                  {submitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* ─── Stats rapides ────────────────────────────────────────── */}
      <motion.div
        variants={item}
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate">Total encaissé</p>
              <p className="text-lg font-bold text-navy">{formatFCFA(payeeTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate">Paiements validés</p>
              <p className="text-lg font-bold text-navy">{payeeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate">En attente</p>
              <p className="text-lg font-bold text-navy">{enAttenteCount}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Search & Filters ────────────────────────────────────── */}
      <motion.div variants={item} className="space-y-3">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <Input
              placeholder="Rechercher par client, référence ou payeur..."
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
                    <label className="text-xs font-medium text-slate">Méthode</label>
                    <Select
                      value={methodFilter}
                      onValueChange={(v) => setMethodFilter(v === "all" ? "" : v)}
                    >
                      <SelectTrigger className="w-[160px] rounded-xl border-border">
                        <SelectValue placeholder="Toutes les méthodes" />
                      </SelectTrigger>
                      <SelectContent>
                        {METHOD_FILTERS.map((m) => (
                          <SelectItem key={m.value} value={m.value || "all"}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate">Statut</label>
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
                    <label className="text-xs font-medium text-slate">Date (de)</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-[160px] rounded-xl border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate">Date (jusqu&apos;au)</label>
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

      {/* ─── Payments List ───────────────────────────────────────── */}
      <motion.div variants={item}>
        {filteredPayments.length === 0 ? (
          <Card className="rounded-xl border-border shadow-sm overflow-hidden">
            <EmptyState
              icon={Wallet}
              title={hasFilters ? "Aucun résultat" : "Aucun paiement"}
              description={
                hasFilters
                  ? "Essayez de modifier vos critères de recherche."
                  : "Les paiements apparaîtront ici une fois enregistrés."
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
                          Client / Réservation
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Montant
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Méthode
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Statut
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Référence
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredPayments.map((p) => {
                        const MethodIcon = getMethodIcon(p.method);
                        return (
                          <tr
                            key={p.id}
                            className="group transition-colors hover:bg-ivory/30"
                          >
                            <td className="px-5 py-3.5">
                              <div>
                                <p className="text-sm font-medium text-navy">
                                  {p.reservation?.guest_name ?? "—"}
                                </p>
                                <p className="text-xs text-slate">
                                  Chambre{" "}
                                  {p.reservation?.rooms?.[0]?.number ?? "N/A"}
                                </p>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-sm font-bold text-navy">
                                {formatFCFA(p.amount)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge
                                variant="outline"
                                className={getMethodColor(p.method)}
                              >
                                <MethodIcon className="mr-1 h-3 w-3" />
                                {PAYMENT_METHOD_LABELS[p.method]}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge
                                variant="outline"
                                className={getStatusColor(p.status)}
                              >
                                {PAYMENT_STATUS_LABELS[p.status]}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-sm text-slate">
                                {p.reference || "—"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-sm text-slate">
                                {formatDateTime(p.paid_at)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Total footer */}
                    <tfoot>
                      <tr className="border-t-2 border-navy/10 bg-ivory/40">
                        <td colSpan={6} className="px-5 py-3 text-right">
                          <span className="text-sm font-semibold text-slate">
                            Total filtré :{" "}
                            <span className="text-lg text-navy">
                              {formatFCFA(
                                filteredPayments.reduce((s, p) => s + p.amount, 0)
                              )}
                            </span>
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {filteredPayments.map((p) => {
                const MethodIcon = getMethodIcon(p.method);
                return (
                  <Card
                    key={p.id}
                    className="rounded-xl border-border shadow-sm overflow-hidden"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-navy">
                            {p.reservation?.guest_name ?? "—"}
                          </p>
                          <p className="text-xs text-slate">
                            Chambre {p.reservation?.rooms?.[0]?.number ?? "N/A"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={getStatusColor(p.status)}
                        >
                          {PAYMENT_STATUS_LABELS[p.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-navy">
                          {formatFCFA(p.amount)}
                        </span>
                        <Badge
                          variant="outline"
                          className={getMethodColor(p.method)}
                        >
                          <MethodIcon className="mr-1 h-3 w-3" />
                          {PAYMENT_METHOD_LABELS[p.method]}
                        </Badge>
                      </div>
                      {p.reference && (
                        <p className="text-xs text-slate">
                          Réf : {p.reference}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-xs text-slate">
                          {formatDateTime(p.paid_at)}
                        </span>
                        {p.paid_by && (
                          <span className="text-xs text-slate">
                            Par : {p.paid_by}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-center text-xs text-slate">
                {filteredPayments.length} paiement
                {filteredPayments.length > 1 ? "s" : ""} affiché
                {filteredPayments.length > 1 ? "s" : ""}
              </p>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-slate hover:text-navy rounded-xl"
                >
                  <Filter className="mr-1 h-3 w-3" />
                  Effacer les filtres
                </Button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
