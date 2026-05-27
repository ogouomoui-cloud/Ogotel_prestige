"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  Users,
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Star,
  CalendarDays,
  Moon,
  Banknote,
  Loader2,
  FileText,
  CalendarCheck,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────
interface Guest {
  id: string;
  hotel_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  id_document_type: string | null;
  id_document_number: string | null;
  nationality: string;
  city: string | null;
  notes: string | null;
  is_vip: boolean;
  created_at: string;
  updated_at: string;
}

interface GuestStats {
  total_reservations: number;
  total_spent: number;
  total_nights: number;
}

interface Reservation {
  id: string;
  room_id: string | null;
  guest_name: string;
  room_type: string;
  check_in: string;
  check_out: string;
  number_of_nights: number;
  status: string;
  total_amount: number;
  paid_amount: number;
  created_at: string;
  room: { number?: string; room_type?: string; price_per_night?: number } | null;
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

function getReservationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    confirmee: "Confirmée",
    en_cours: "En cours",
    terminee: "Terminée",
    annulee: "Annulée",
    no_show: "No-show",
  };
  return labels[status] || status;
}

function getReservationStatusColor(status: string): string {
  switch (status) {
    case "confirmee":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "en_cours":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "terminee":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "annulee":
      return "bg-red-100 text-red-700 border-red-200";
    case "no_show":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate border-slate-200";
  }
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-purple-100 text-purple-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
    "bg-orange-100 text-orange-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ─── Schéma de validation ──────────────────────────────────────────────
const editClientSchema = z.object({
  first_name: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères.")
    .max(100, "Le prénom est trop long."),
  last_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom est trop long."),
  phone: z
    .string()
    .min(1, "Le numéro de téléphone est requis.")
    .max(20, "Le numéro de téléphone est trop long."),
  email: z
    .string()
    .email("Adresse e-mail invalide.")
    .max(255, "L'adresse e-mail est trop longue.")
    .nullable()
    .optional(),
  nationality: z
    .string()
    .min(1, "La nationalité est requise.")
    .max(100, "La nationalité est trop longue."),
  city: z
    .string()
    .max(100, "La ville est trop longue.")
    .nullable()
    .optional(),
  id_document_type: z
    .string()
    .max(50, "Le type de document est trop long.")
    .nullable()
    .optional(),
  id_document_number: z
    .string()
    .max(100, "Le numéro de document est trop long.")
    .nullable()
    .optional(),
  is_vip: z.boolean(),
  notes: z
    .string()
    .max(500, "Les notes ne doivent pas dépasser 500 caractères.")
    .nullable()
    .optional(),
});

type EditClientFormValues = z.infer<typeof editClientSchema>;

// ─── Document types ────────────────────────────────────────────────────
const DOCUMENT_TYPES = [
  { value: "CNI", label: "CNI" },
  { value: "Passeport", label: "Passeport" },
  { value: "Carte consulaire", label: "Carte consulaire" },
  { value: "Permis de conduire", label: "Permis de conduire" },
];

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
export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit form
  const form = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      nationality: "Ivoirienne",
      city: "",
      id_document_type: "",
      id_document_number: "",
      is_vip: false,
      notes: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = form;

  const selectedDocType = watch("id_document_type");
  const isVip = watch("is_vip");

  // ─── Fetch guest data ───────────────────────────────────────────
  const fetchGuest = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hotel-admin/clients/${clientId}`);
      if (!res.ok) {
        toast.error("Client introuvable.");
        router.push("/dashboard/clients");
        return;
      }
      const data = await res.json();
      setGuest(data.guest);
      setStats(data.stats);
    } catch {
      toast.error("Impossible de charger le client.");
      router.push("/dashboard/clients");
    } finally {
      setLoading(false);
    }
  }, [clientId, router]);

  // ─── Fetch reservations ────────────────────────────────────────
  const fetchReservations = useCallback(async () => {
    try {
      setReservationsLoading(true);
      const res = await fetch("/api/hotel-admin/reservations");
      if (!res.ok) return;
      const data = await res.json();
      // Filter by guest_id on client side
      const filtered = (data.reservations ?? [])
        .filter(
          (r: Reservation & { guest_id?: string }) =>
            r.guest_id === clientId
        )
        .slice(0, 5);
      setReservations(filtered);
    } catch {
      // Silently fail
    } finally {
      setReservationsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchGuest();
  }, [fetchGuest]);

  useEffect(() => {
    if (guest) {
      fetchReservations();
    }
  }, [guest, fetchReservations]);

  // ─── Open edit dialog with current data ───────────────────────
  function openEditDialog() {
    if (!guest) return;
    reset({
      first_name: guest.first_name,
      last_name: guest.last_name,
      phone: guest.phone,
      email: guest.email ?? "",
      nationality: guest.nationality || "Ivoirienne",
      city: guest.city ?? "",
      id_document_type: guest.id_document_type ?? "",
      id_document_number: guest.id_document_number ?? "",
      is_vip: guest.is_vip,
      notes: guest.notes ?? "",
    });
    setEditOpen(true);
  }

  // ─── Submit edit ──────────────────────────────────────────────
  async function onSubmitEdit(values: EditClientFormValues) {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/hotel-admin/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          email: values.email?.trim() || null,
          city: values.city?.trim() || null,
          id_document_type: values.id_document_type?.trim() || null,
          id_document_number: values.id_document_number?.trim() || null,
          notes: values.notes?.trim() || null,
          nationality: values.nationality?.trim() || "Ivoirienne",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors de la modification.");
        return;
      }

      toast.success(data.message);
      setEditOpen(false);
      // Refresh data
      setGuest(data.guest);
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!guest) return null;

  const fullName = `${guest.first_name} ${guest.last_name}`;

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
          <Link href="/dashboard/clients">
            <ArrowLeft className="h-4 w-4 text-slate" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${getAvatarColor(
              fullName
            )}`}
          >
            {getInitials(guest.first_name, guest.last_name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-semibold text-navy">
                Fiche client
              </h1>
              {guest.is_vip && (
                <Badge
                  variant="outline"
                  className="bg-gold/10 border-gold/30 text-gold-dark"
                >
                  <Star className="mr-1 h-3 w-3 fill-gold" />
                  VIP
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate">{fullName}</p>
          </div>
        </div>
      </motion.div>

      {/* ─── Stats Cards ────────────────────────────────────────── */}
      <motion.div
        variants={item}
        className="grid gap-4 sm:grid-cols-3"
      >
        {/* Total réservations */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate">Total réservations</p>
              <p className="text-lg font-bold text-navy">
                {stats?.total_reservations ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total dépenses */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Banknote className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate">Total dépenses</p>
              <p className="text-lg font-bold text-navy">
                {stats?.total_spent
                  ? formatFCFA(stats.total_spent)
                  : "0 FCFA"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total nuits */}
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Moon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate">Total nuits</p>
              <p className="text-lg font-bold text-navy">
                {stats?.total_nights ?? 0} nuit
                {(stats?.total_nights ?? 0) > 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Client Info Card ────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
                Informations du client
              </h3>
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openEditDialog}
                    className="rounded-xl border-border text-xs hover:bg-navy/10 hover:text-navy"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Modifier
                  </Button>
                </DialogTrigger>

                {/* ─── Edit Dialog ───────────────────────────────── */}
                <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-navy">
                      Modifier le client
                    </DialogTitle>
                    <DialogDescription>
                      Mettez à jour les informations de {fullName}.
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={handleSubmit(onSubmitEdit)}
                    className="space-y-4 mt-2"
                  >
                    {/* Prénom & Nom */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="edit-firstname"
                          className="text-sm font-medium"
                        >
                          Prénom <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="edit-firstname"
                          className={`rounded-xl border-border text-sm ${
                            errors.first_name ? "border-red-300" : ""
                          }`}
                          {...register("first_name")}
                        />
                        {errors.first_name && (
                          <p className="text-xs text-red-500">
                            {errors.first_name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="edit-lastname"
                          className="text-sm font-medium"
                        >
                          Nom <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="edit-lastname"
                          className={`rounded-xl border-border text-sm ${
                            errors.last_name ? "border-red-300" : ""
                          }`}
                          {...register("last_name")}
                        />
                        {errors.last_name && (
                          <p className="text-xs text-red-500">
                            {errors.last_name.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Téléphone & Email */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="edit-phone"
                          className="text-sm font-medium"
                        >
                          Téléphone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="edit-phone"
                          className={`rounded-xl border-border text-sm ${
                            errors.phone ? "border-red-300" : ""
                          }`}
                          {...register("phone")}
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-500">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="edit-email"
                          className="text-sm font-medium"
                        >
                          Email
                        </Label>
                        <Input
                          id="edit-email"
                          type="email"
                          className={`rounded-xl border-border text-sm ${
                            errors.email ? "border-red-300" : ""
                          }`}
                          {...register("email")}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Nationalité & Ville */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="edit-nationality"
                          className="text-sm font-medium"
                        >
                          Nationalité
                        </Label>
                        <Input
                          id="edit-nationality"
                          className={`rounded-xl border-border text-sm ${
                            errors.nationality ? "border-red-300" : ""
                          }`}
                          {...register("nationality")}
                        />
                        {errors.nationality && (
                          <p className="text-xs text-red-500">
                            {errors.nationality.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="edit-city"
                          className="text-sm font-medium"
                        >
                          Ville
                        </Label>
                        <Input
                          id="edit-city"
                          className={`rounded-xl border-border text-sm ${
                            errors.city ? "border-red-300" : ""
                          }`}
                          {...register("city")}
                        />
                        {errors.city && (
                          <p className="text-xs text-red-500">
                            {errors.city.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Type & Numéro de pièce */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">
                          Type de pièce
                        </Label>
                        <Select
                          value={selectedDocType || undefined}
                          onValueChange={(val) =>
                            setValue(
                              "id_document_type",
                              val === "none" ? "" : val
                            )
                          }
                        >
                          <SelectTrigger className="rounded-xl border-border text-sm">
                            <SelectValue placeholder="Aucune" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucune</SelectItem>
                            {DOCUMENT_TYPES.map((doc) => (
                              <SelectItem key={doc.value} value={doc.value}>
                                {doc.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="edit-doc-number"
                          className="text-sm font-medium"
                        >
                          Numéro de pièce
                        </Label>
                        <Input
                          id="edit-doc-number"
                          className={`rounded-xl border-border text-sm ${
                            errors.id_document_number
                              ? "border-red-300"
                              : ""
                          }`}
                          {...register("id_document_number")}
                        />
                        {errors.id_document_number && (
                          <p className="text-xs text-red-500">
                            {errors.id_document_number.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* VIP toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2">
                        <Star
                          className={`h-4 w-4 ${
                            isVip
                              ? "fill-gold text-gold-dark"
                              : "text-slate"
                          }`}
                        />
                        <span className="text-sm font-medium text-navy">
                          Client VIP
                        </span>
                      </div>
                      <Switch
                        checked={isVip}
                        onCheckedChange={(checked) =>
                          setValue("is_vip", checked, {
                            shouldValidate: true,
                          })
                        }
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="edit-notes"
                        className="text-sm font-medium"
                      >
                        Notes
                      </Label>
                      <Textarea
                        id="edit-notes"
                        rows={3}
                        className={`rounded-xl border-border text-sm resize-none ${
                          errors.notes ? "border-red-300" : ""
                        }`}
                        {...register("notes")}
                      />
                      <div className="flex justify-between">
                        {errors.notes && (
                          <p className="text-xs text-red-500">
                            {errors.notes.message}
                          </p>
                        )}
                        <p className="text-xs text-slate ml-auto">
                          {(watch("notes")?.length ?? 0)} / 500
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <DialogFooter className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditOpen(false)}
                        className="rounded-xl border-border"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Pencil className="mr-2 h-4 w-4" />{" "}
                            Enregistrer
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Info grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Phone */}
              <div className="flex items-center gap-3 rounded-lg bg-ivory/50 p-3">
                <Phone className="h-4 w-4 text-slate shrink-0" />
                <div>
                  <p className="text-xs text-slate">Téléphone</p>
                  <p className="text-sm font-medium text-navy">
                    {guest.phone}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 rounded-lg bg-ivory/50 p-3">
                <Mail className="h-4 w-4 text-slate shrink-0" />
                <div>
                  <p className="text-xs text-slate">Email</p>
                  <p className="text-sm font-medium text-navy">
                    {guest.email || "—"}
                  </p>
                </div>
              </div>

              {/* Nationality */}
              <div className="flex items-center gap-3 rounded-lg bg-ivory/50 p-3">
                <Users className="h-4 w-4 text-slate shrink-0" />
                <div>
                  <p className="text-xs text-slate">Nationalité</p>
                  <p className="text-sm font-medium text-navy">
                    {guest.nationality || "—"}
                  </p>
                </div>
              </div>

              {/* City */}
              <div className="flex items-center gap-3 rounded-lg bg-ivory/50 p-3">
                <MapPin className="h-4 w-4 text-slate shrink-0" />
                <div>
                  <p className="text-xs text-slate">Ville</p>
                  <p className="text-sm font-medium text-navy">
                    {guest.city || "—"}
                  </p>
                </div>
              </div>

              {/* Document type */}
              <div className="flex items-center gap-3 rounded-lg bg-ivory/50 p-3">
                <FileText className="h-4 w-4 text-slate shrink-0" />
                <div>
                  <p className="text-xs text-slate">Type de pièce</p>
                  <p className="text-sm font-medium text-navy">
                    {guest.id_document_type || "—"}
                  </p>
                </div>
              </div>

              {/* Document number */}
              <div className="flex items-center gap-3 rounded-lg bg-ivory/50 p-3">
                <FileText className="h-4 w-4 text-slate shrink-0" />
                <div>
                  <p className="text-xs text-slate">N° de pièce</p>
                  <p className="text-sm font-medium text-navy">
                    {guest.id_document_number || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {guest.notes && (
              <div className="mt-4">
                <Separator className="mb-3" />
                <p className="text-xs font-medium text-slate uppercase tracking-wide mb-1">
                  Notes
                </p>
                <p className="text-sm text-navy whitespace-pre-wrap">
                  {guest.notes}
                </p>
              </div>
            )}

            {/* Meta info */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Ajouté le {formatDate(guest.created_at)}
              </span>
              {guest.updated_at !== guest.created_at && (
                <span>
                  Modifié le {formatDate(guest.updated_at)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Recent Reservations ─────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-navy uppercase tracking-wide mb-4">
              Réservations récentes
            </h3>

            {reservationsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : reservations.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CalendarCheck className="mb-3 h-10 w-10 text-gold/40" />
                <p className="text-sm font-medium text-navy">
                  Aucune réservation
                </p>
                <p className="text-xs text-slate mt-1">
                  Ce client n&apos;a pas encore de réservation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-ivory/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ivory">
                        <CalendarDays className="h-4 w-4 text-slate" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-navy">
                            {res.room?.number
                              ? `Chambre ${res.room.number}`
                              : res.room_type}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${getReservationStatusColor(
                              res.status
                            )}`}
                          >
                            {getReservationStatusLabel(res.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate mt-0.5">
                          {formatDateShort(res.check_in)} →{" "}
                          {formatDateShort(res.check_out)}{" "}
                          <span className="text-navy font-medium">
                            ({res.number_of_nights} nuit
                            {res.number_of_nights > 1 ? "s" : ""})
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-navy">
                        {formatFCFA(res.total_amount)}
                      </p>
                      {res.paid_amount > 0 && (
                        <p className="text-[11px] text-emerald-600">
                          Payé : {formatFCFA(res.paid_amount)}
                        </p>
                      )}
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
