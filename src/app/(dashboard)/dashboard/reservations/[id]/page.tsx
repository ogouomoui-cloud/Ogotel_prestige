"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CalendarCheck,
  ArrowLeft,
  Loader2,
  LogIn,
  LogOut,
  Ban,
  Plus,
  BedDouble,
  Phone,
  Mail,
  Users,
  CreditCard,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  RESERVATION_STATUS_LABELS,
  ROOM_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type ReservationStatus,
  type RoomType,
  type PaymentMethod,
} from "@/types";

// ─── Types ──────────────────────────────────────────────────────────────
interface Room {
  id: string;
  number: string;
  room_type: string;
  price_per_night: number;
  floor: number;
  status: string;
}

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
}

interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  reference: string | null;
  paid_by: string | null;
  paid_at: string;
  notes: string | null;
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
  guest?: Guest;
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

function getPaymentMethodColor(method: PaymentMethod): string {
  switch (method) {
    case "especes":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "carte":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "mobile_money":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "virement":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "cheque":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate border-slate-200";
  }
}

function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "payee":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "en_attente":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "annulee":
      return "bg-red-100 text-red-700 border-red-200";
    case "remboursee":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate border-slate-200";
  }
}

function getSourceLabel(source: string): string {
  const map: Record<string, string> = {
    direct: "Direct",
    booking_com: "Booking.com",
    walk_in: "Walk-in",
    telephone: "Téléphone",
    email: "Email",
    whatsapp: "WhatsApp",
  };
  return map[source] ?? source;
}

// ─── Animation ─────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Component ──────────────────────────────────────────────────────────
export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Action states
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentPaidBy, setPaymentPaidBy] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // ─── Fetch reservation detail ───────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hotel-admin/reservations/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReservation(data.reservation);
      setPayments(data.payments ?? []);
    } catch {
      toast.error("Impossible de charger la réservation.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Check-in ──────────────────────────────────────────────────
  async function handleCheckIn() {
    if (!reservation) return;
    try {
      setCheckingIn(true);
      const res = await fetch(`/api/hotel-admin/reservations/${id}/checkin`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors du check-in.");
        return;
      }
      toast.success("Check-in effectué avec succès !");
      fetchData();
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setCheckingIn(false);
    }
  }

  // ─── Check-out ─────────────────────────────────────────────────
  async function handleCheckOut() {
    if (!reservation) return;
    try {
      setCheckingOut(true);
      const res = await fetch(
        `/api/hotel-admin/reservations/${id}/checkout`,
        { method: "PATCH" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors du check-out.");
        return;
      }
      toast.success("Check-out effectué avec succès !");
      fetchData();
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setCheckingOut(false);
    }
  }

  // ─── Cancel reservation ────────────────────────────────────────
  async function handleCancel() {
    if (!reservation) return;
    try {
      setCancelling(true);
      const res = await fetch(`/api/hotel-admin/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "annulee" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors de l'annulation.");
        return;
      }
      toast.success("Réservation annulée.");
      fetchData();
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setCancelling(false);
    }
  }

  // ─── Submit payment ────────────────────────────────────────────
  async function submitPayment() {
    if (!paymentAmount || !paymentMethod) return;
    try {
      setPaymentSubmitting(true);
      const res = await fetch("/api/hotel-admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: id,
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          reference: paymentReference.trim() || null,
          paid_by: paymentPaidBy.trim() || null,
          notes: paymentNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors de l'enregistrement.");
        return;
      }
      toast.success("Paiement enregistré !");
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentMethod("");
      setPaymentReference("");
      setPaymentPaidBy("");
      setPaymentNotes("");
      fetchData();
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setPaymentSubmitting(false);
    }
  }

  // ─── Computed values ───────────────────────────────────────────
  const remaining = reservation
    ? Math.max(0, reservation.total_amount - reservation.paid_amount)
    : 0;
  const paidPercent = reservation
    ? reservation.total_amount > 0
      ? Math.min(100, (reservation.paid_amount / reservation.total_amount) * 100)
      : 0
    : 0;

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  // ─── Status timeline steps ─────────────────────────────────────
  const statusSteps: { key: ReservationStatus; label: string }[] = [
    { key: "confirmee", label: "Confirmée" },
    { key: "en_cours", label: "En cours" },
    { key: "terminee", label: "Terminée" },
  ];

  function getStepState(stepKey: ReservationStatus) {
    if (!reservation) return "upcoming";
    if (reservation.status === "annulee" || reservation.status === "no_show")
      return reservation.status === stepKey ? "current" : "skipped";
    const order = ["confirmee", "en_cours", "terminee"];
    const currentIdx = order.indexOf(reservation.status);
    const stepIdx = order.indexOf(stepKey);
    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return "current";
    return "upcoming";
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate">Réservation introuvable.</p>
        <Button
          variant="link"
          asChild
          className="mt-2 text-navy"
        >
          <Link href="/dashboard/reservations">Retour aux réservations</Link>
        </Button>
      </div>
    );
  }

  const isClosed =
    reservation.status === "terminee" || reservation.status === "annulee";

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-9 w-9 rounded-xl hover:bg-ivory"
        >
          <Link href="/dashboard/reservations">
            <ArrowLeft className="h-4 w-4 text-slate" />
          </Link>
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <CalendarCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-2xl font-semibold text-navy">
                Réservation #{reservation.id.slice(0, 8).toUpperCase()}
              </h1>
              <Badge
                variant="outline"
                className={getStatusColor(reservation.status)}
              >
                {RESERVATION_STATUS_LABELS[reservation.status]}
              </Badge>
            </div>
            <p className="text-sm text-slate">
              Créée le {formatDate(reservation.created_at)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── Status timeline ─────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, idx) => {
                const state = getStepState(step.key);
                const isLast = idx === statusSteps.length - 1;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                          state === "completed"
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : state === "current"
                              ? step.key === "en_cours"
                                ? "border-emerald-500 bg-emerald-100 text-emerald-600"
                                : step.key === "confirmee"
                                  ? "border-blue-500 bg-blue-100 text-blue-600"
                                  : "border-slate-300 bg-slate-100 text-slate"
                              : state === "skipped"
                                ? "border-red-300 bg-red-50 text-red-400"
                                : "border-slate-200 bg-slate-50 text-slate-400"
                        }`}
                      >
                        {state === "completed" ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : state === "skipped" ? (
                          <XCircle className="h-5 w-5" />
                        ) : state === "current" ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <span className="text-xs font-semibold">{idx + 1}</span>
                        )}
                      </div>
                      <span
                        className={`mt-1.5 text-xs font-medium ${
                          state === "completed"
                            ? "text-emerald-600"
                            : state === "current"
                              ? "text-navy"
                              : state === "skipped"
                                ? "text-red-400"
                                : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className={`mx-2 h-0.5 flex-1 rounded-full transition-all ${
                          state === "completed"
                            ? "bg-emerald-500"
                            : state === "skipped"
                              ? "bg-red-200"
                              : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
              {/* Show cancelled/no-show if applicable */}
              {(reservation.status === "annulee" ||
                reservation.status === "no_show") && (
                <>
                  <div className="h-0.5 w-8 rounded-full bg-red-300 mx-2" />
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-400 bg-red-100 text-red-600">
                      <XCircle className="h-5 w-5" />
                    </div>
                    <span className="mt-1.5 text-xs font-medium text-red-600">
                      {RESERVATION_STATUS_LABELS[reservation.status]}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Action buttons ─────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4">
            {reservation.status === "confirmee" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="lg"
                      disabled={checkingIn}
                      className="flex-1 h-12 text-base rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white sm:max-w-xs"
                    >
                      {checkingIn ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <LogIn className="mr-2 h-5 w-5" />
                      )}
                      Effectuer le check-in
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-serif text-navy">
                        Confirmer le check-in
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Confirmer le check-in pour{" "}
                        <strong>{reservation.guest_name}</strong>
                        {reservation.room
                          ? ` en chambre <strong>${reservation.room.number}</strong> ?`
                          : " ?"}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">
                        Annuler
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCheckIn}
                        className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Confirmer le check-in
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      disabled={cancelling}
                      className="flex-1 h-12 text-base rounded-xl border-red-200 text-red-600 hover:bg-red-50 sm:max-w-xs"
                    >
                      {cancelling ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Ban className="mr-2 h-5 w-5" />
                      )}
                      Annuler la réservation
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-serif text-navy">
                        Annuler la réservation
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir annuler la réservation de{" "}
                        <strong>{reservation.guest_name}</strong> ? Cette action
                        est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">
                        Retour
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                      >
                        Annuler la réservation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {reservation.status === "en_cours" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="lg"
                      disabled={checkingOut}
                      className="flex-1 h-12 text-base rounded-xl bg-amber-600 hover:bg-amber-700 text-white sm:max-w-xs"
                    >
                      {checkingOut ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-5 w-5" />
                      )}
                      Effectuer le check-out
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-serif text-navy">
                        Confirmer le check-out
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Confirmer le check-out pour{" "}
                        <strong>{reservation.guest_name}</strong> ? Le statut
                        de la chambre passera à &quot;Nettoyage&quot;.
                      </AlertDialogDescription>
                      {remaining > 0 && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 mt-2">
                          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-amber-800">
                              Solde restant
                            </p>
                            <p className="text-amber-700">
                              Il reste <strong>{formatFCFA(remaining)}</strong> à
                              payer.
                            </p>
                          </div>
                        </div>
                      )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">
                        Annuler
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCheckOut}
                        className="rounded-xl bg-amber-600 text-white hover:bg-amber-700"
                      >
                        Confirmer le check-out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      disabled={cancelling}
                      className="flex-1 h-12 text-base rounded-xl border-red-200 text-red-600 hover:bg-red-50 sm:max-w-xs"
                    >
                      {cancelling ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Ban className="mr-2 h-5 w-5" />
                      )}
                      Annuler la réservation
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-serif text-navy">
                        Annuler la réservation
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir annuler la réservation de{" "}
                        <strong>{reservation.guest_name}</strong> ? Le client
                        est actuellement en cours de séjour.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">
                        Retour
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                      >
                        Annuler la réservation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {isClosed && (
              <div className="flex items-center gap-2 text-slate">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Réservation clôturée —{" "}
                  {RESERVATION_STATUS_LABELS[reservation.status]}
                </span>
              </div>
            )}

            {reservation.status === "no_show" && (
              <div className="flex items-center gap-2 text-slate">
                <XCircle className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">
                  No-show — le client ne s&apos;est pas présenté
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Info grid ───────────────────────────────────────────── */}
      <motion.div
        variants={item}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {/* Client */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate" />
              <h3 className="text-xs font-semibold text-slate uppercase tracking-wide">
                Client
              </h3>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-navy">
                {reservation.guest_name}
              </p>
              {reservation.guest_phone && (
                <p className="flex items-center gap-1.5 text-xs text-slate">
                  <Phone className="h-3 w-3" />
                  {reservation.guest_phone}
                </p>
              )}
              {reservation.guest_email && (
                <p className="flex items-center gap-1.5 text-xs text-slate">
                  <Mail className="h-3 w-3" />
                  {reservation.guest_email}
                </p>
              )}
              {reservation.guest_id && (
                <Link
                  href={`/dashboard/clients/${reservation.guest_id}`}
                  className="inline-block text-xs text-blue-600 hover:underline"
                >
                  Voir la fiche client →
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chambre */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-slate" />
              <h3 className="text-xs font-semibold text-slate uppercase tracking-wide">
                Chambre
              </h3>
            </div>
            {reservation.room ? (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-navy">
                  Chambre {reservation.room.number}
                </p>
                <Badge
                  variant="outline"
                  className="bg-slate-50 text-slate-700 border-slate-200"
                >
                  {ROOM_TYPE_LABELS[reservation.room.room_type as RoomType]}
                </Badge>
                <p className="text-xs text-slate">
                  Étage{" "}
                  {reservation.room.floor === 0
                    ? "RDC"
                    : reservation.room.floor < 0
                      ? `SS ${Math.abs(reservation.room.floor)}`
                      : `${reservation.room.floor}ᵉ`}{" "}
                  · {formatFCFA(reservation.room.price_per_night)}/nuit
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate italic">
                Chambre non assignée
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-slate" />
              <h3 className="text-xs font-semibold text-slate uppercase tracking-wide">
                Dates
              </h3>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate">Arrivée</span>
                <span className="font-medium text-navy">
                  {formatDate(reservation.check_in)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">Départ</span>
                <span className="font-medium text-navy">
                  {formatDate(reservation.check_out)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-slate">Durée</span>
                <span className="font-semibold text-navy">
                  {reservation.number_of_nights} nuit
                  {reservation.number_of_nights > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Montant */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate" />
              <h3 className="text-xs font-semibold text-slate uppercase tracking-wide">
                Montant
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate">Total</span>
                <span className="font-semibold text-navy">
                  {formatFCFA(reservation.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">Payé</span>
                <span className="font-medium text-emerald-600">
                  {formatFCFA(reservation.paid_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">Reste</span>
                <span
                  className={`font-semibold ${remaining > 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {formatFCFA(remaining)}
                </span>
              </div>
              {/* Progress bar */}
              <div className="pt-1">
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      paidPercent >= 100
                        ? "bg-emerald-500"
                        : paidPercent >= 50
                          ? "bg-blue-500"
                          : paidPercent > 0
                            ? "bg-amber-500"
                            : "bg-slate-200"
                    }`}
                    style={{ width: `${paidPercent}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-right text-slate">
                  {paidPercent.toFixed(0)}% payé · Acompte:{" "}
                  {formatFCFA(reservation.deposit_required)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Source & Détails */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-slate" />
              <h3 className="text-xs font-semibold text-slate uppercase tracking-wide">
                Détails
              </h3>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate">Source</span>
                <span className="font-medium text-navy">
                  {getSourceLabel(reservation.source)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">Adultes</span>
                <span className="font-medium text-navy">
                  {reservation.adults}
                </span>
              </div>
              {reservation.children > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate">Enfants</span>
                  <span className="font-medium text-navy">
                    {reservation.children}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {reservation.notes && (
          <Card className="rounded-xl border-border shadow-sm">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate uppercase tracking-wide">
                Notes
              </h3>
              <p className="text-sm text-slate whitespace-pre-wrap">
                {reservation.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* ─── Paiements ───────────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-slate" />
              <CardTitle className="font-serif text-navy text-base">
                Paiements
              </CardTitle>
              <Badge variant="outline" className="bg-navy/5 text-navy border-navy/20 text-xs">
                {formatFCFA(totalPayments)}
              </Badge>
            </div>
            {!isClosed && (
              <Dialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Enregistrer un paiement
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-navy">
                      Enregistrer un paiement
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    {/* Montant */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Montant (FCFA) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="0"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="rounded-xl border-border"
                      />
                      {remaining > 0 && (
                        <p className="text-xs text-slate">
                          Reste à payer: {formatFCFA(remaining)}
                        </p>
                      )}
                    </div>

                    {/* Méthode */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Méthode <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(v) =>
                          setPaymentMethod(v as PaymentMethod)
                        }
                      >
                        <SelectTrigger className="rounded-xl border-border">
                          <SelectValue placeholder="Sélectionnez une méthode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="especes">Espèces</SelectItem>
                          <SelectItem value="carte">Carte</SelectItem>
                          <SelectItem value="mobile_money">
                            Mobile Money
                          </SelectItem>
                          <SelectItem value="virement">Virement</SelectItem>
                          <SelectItem value="cheque">Chèque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Référence */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Référence</Label>
                      <Input
                        placeholder="N° de référence optionnel"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="rounded-xl border-border"
                      />
                    </div>

                    {/* Nom du payeur */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Nom du payeur
                      </Label>
                      <Input
                        placeholder="Nom optionnel"
                        value={paymentPaidBy}
                        onChange={(e) => setPaymentPaidBy(e.target.value)}
                        className="rounded-xl border-border"
                      />
                    </div>

                    {/* Notes paiement */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Notes</Label>
                      <Textarea
                        placeholder="Notes optionnelles"
                        rows={2}
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className="rounded-xl border-border resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPaymentDialogOpen(false)}
                        className="rounded-xl border-border hover:bg-ivory"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={submitPayment}
                        disabled={
                          paymentSubmitting ||
                          !paymentAmount ||
                          !paymentMethod
                        }
                        className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
                      >
                        {paymentSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CreditCard className="mr-2 h-4 w-4" />
                        )}
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {payments.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Receipt className="mb-2 h-8 w-8 text-gold/40" />
                <p className="text-sm text-slate">Aucun paiement enregistré.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-navy">
                          {formatFCFA(payment.amount)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${getPaymentMethodColor(payment.method)}`}
                        >
                          {PAYMENT_METHOD_LABELS[payment.method]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${getPaymentStatusColor(payment.status)}`}
                        >
                          {PAYMENT_STATUS_LABELS[payment.status as keyof typeof PAYMENT_STATUS_LABELS] ?? payment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate mt-0.5">
                        <span>{formatDate(payment.paid_at)}</span>
                        {payment.reference && <span>· Réf: {payment.reference}</span>}
                        {payment.paid_by && <span>· {payment.paid_by}</span>}
                      </div>
                    </div>
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
