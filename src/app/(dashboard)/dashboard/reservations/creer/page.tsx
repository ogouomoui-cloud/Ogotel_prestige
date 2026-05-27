"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CalendarCheck,
  Loader2,
  Plus,
  ArrowLeft,
  Search,
  Users,
  BedDouble,
  X,
  UserCheck,
} from "lucide-react";
import {
  ROOM_TYPE_LABELS,
  type RoomType,
} from "@/types";

// ─── Types ──────────────────────────────────────────────────────────────
interface AvailableRoom {
  id: string;
  number: string;
  room_type: string;
  price_per_night: number;
  floor: number;
  status: string;
}

interface ClientResult {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
}

// ─── Default prices per type ───────────────────────────────────────────
const DEFAULT_PRICES: Record<string, number> = {
  standard: 15000,
  deluxe: 25000,
  suite: 50000,
  presidentielle: 100000,
};

const SOURCE_OPTIONS = [
  { value: "direct", label: "Direct" },
  { value: "booking_com", label: "Booking.com" },
  { value: "walk_in", label: "Walk-in" },
  { value: "telephone", label: "Téléphone" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
];

// ─── Schema ────────────────────────────────────────────────────────────
const reservationSchema = z
  .object({
    guest_first_name: z.string().min(1, "Le prénom est requis."),
    guest_last_name: z.string().min(1, "Le nom est requis."),
    guest_email: z.string().email("Email invalide.").nullable().optional(),
    guest_phone: z.string().nullable().optional(),
    check_in: z.string().min(1, "La date d'arrivée est requise."),
    check_out: z.string().min(1, "La date de départ est requise."),
    room_type: z.enum(["standard", "deluxe", "suite", "presidentielle"], {
      message: "Sélectionnez un type.",
    }),
    room_id: z.string().nullable().optional(),
    source: z.string().min(1, "La source est requise."),
    adults: z.coerce.number().int().min(1, "Min 1").max(20, "Max 20"),
    children: z.coerce.number().int().min(0, "Min 0").max(20, "Max 20"),
    notes: z.string().max(500, "Max 500 caractères.").nullable().optional(),
  })
  .refine((data) => !data.check_in || !data.check_out || data.check_out > data.check_in, {
    message: "La date de départ doit être après la date d'arrivée.",
    path: ["check_out"],
  });

type ReservationFormValues = z.infer<typeof reservationSchema>;

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
export default function CreerReservationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Client search dialog state
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<ClientResult[]>([]);
  const [clientSearching, setClientSearching] = useState(false);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema) as any,
    defaultValues: {
      guest_first_name: "",
      guest_last_name: "",
      guest_email: "",
      guest_phone: "",
      check_in: "",
      check_out: "",
      room_type: undefined,
      room_id: null,
      source: "direct",
      adults: 1,
      children: 0,
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

  const checkIn = watch("check_in");
  const checkOut = watch("check_out");
  const roomType = watch("room_type");
  const roomId = watch("room_id");

  // ─── Fetch available rooms ───────────────────────────────────────
  useEffect(() => {
    async function fetchRooms() {
      try {
        setRoomsLoading(true);
        const res = await fetch("/api/hotel-admin/rooms?status=disponible");
        if (!res.ok) return;
        const data = await res.json();
        setAvailableRooms(data.rooms ?? []);
      } catch {
        /* ignore */
      } finally {
        setRoomsLoading(false);
      }
    }
    fetchRooms();
  }, []);

  // ─── Filter rooms by type ───────────────────────────────────────
  const filteredRooms = useMemo(() => {
    if (!roomType) return [];
    return availableRooms.filter((r) => r.room_type === roomType);
  }, [availableRooms, roomType]);

  // ─── Auto-clear room_id when type changes ───────────────────────
  useEffect(() => {
    if (roomId && roomType) {
      const currentRoom = availableRooms.find((r) => r.id === roomId);
      if (currentRoom && currentRoom.room_type !== roomType) {
        setValue("room_id", null);
      }
    }
  }, [roomType, roomId, availableRooms, setValue]);

  // ─── Calculate nights and totals ────────────────────────────────
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [checkIn, checkOut]);

  const selectedRoom = useMemo(
    () => availableRooms.find((r) => r.id === roomId),
    [availableRooms, roomId]
  );

  const pricePerNight = selectedRoom
    ? selectedRoom.price_per_night
    : roomType
      ? DEFAULT_PRICES[roomType] ?? 0
      : 0;

  const totalEstimate = nights * pricePerNight;
  const depositEstimate = Math.ceil(totalEstimate * 0.3);

  // ─── Search clients ─────────────────────────────────────────────
  async function searchClients() {
    if (!clientSearch.trim()) return;
    try {
      setClientSearching(true);
      const res = await fetch(
        `/api/hotel-admin/clients?search=${encodeURIComponent(clientSearch)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setClientResults(data.clients ?? []);
    } catch {
      /* ignore */
    } finally {
      setClientSearching(false);
    }
  }

  // ─── Select client ──────────────────────────────────────────────
  function selectClient(client: ClientResult) {
    setValue("guest_first_name", client.first_name, { shouldValidate: true });
    setValue("guest_last_name", client.last_name, { shouldValidate: true });
    setValue("guest_email", client.email ?? "", { shouldValidate: true });
    setValue("guest_phone", client.phone, { shouldValidate: true });
    setClientDialogOpen(false);
    setClientSearch("");
    toast.success(`Client ${client.first_name} ${client.last_name} sélectionné.`);
  }

  // ─── Submit ─────────────────────────────────────────────────────
  async function onSubmit(values: ReservationFormValues) {
    try {
      setSubmitting(true);
      const res = await fetch("/api/hotel-admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_first_name: values.guest_first_name,
          guest_last_name: values.guest_last_name,
          guest_email: values.guest_email || null,
          guest_phone: values.guest_phone || null,
          check_in: values.check_in,
          check_out: values.check_out,
          room_type: values.room_type,
          room_id: values.room_id || null,
          source: values.source,
          adults: values.adults,
          children: values.children,
          notes: values.notes?.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors de la création.");
        return;
      }

      toast.success("Réservation créée avec succès !");
      router.push(`/dashboard/reservations/${data.reservation.id}`);
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-3xl"
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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <CalendarCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Nouvelle réservation
            </h1>
            <p className="text-sm text-slate">
              Enregistrez une nouvelle réservation.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── Form ───────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* ─── Client section ───────────────────────────────── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
                    Client
                  </h3>
                  <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border text-xs"
                      >
                        <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                        Rechercher un client
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-navy">
                          Rechercher un client existant
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 pt-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                            <Input
                              placeholder="Nom, téléphone..."
                              value={clientSearch}
                              onChange={(e) => setClientSearch(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchClients())}
                              className="rounded-xl border-border pl-9"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={searchClients}
                            disabled={clientSearching}
                            className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
                          >
                            {clientSearching ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {clientResults.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate">
                              {clientSearch
                                ? "Aucun client trouvé."
                                : "Tapez pour rechercher..."}
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {clientResults.map((client) => (
                                <button
                                  key={client.id}
                                  type="button"
                                  onClick={() => selectClient(client)}
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-ivory"
                                >
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10">
                                    <Users className="h-4 w-4 text-navy" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-navy truncate">
                                      {client.first_name} {client.last_name}
                                    </p>
                                    <p className="text-xs text-slate">
                                      {client.phone}
                                      {client.email
                                        ? ` · ${client.email}`
                                        : ""}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Prénom */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="guest-first-name"
                      className="text-sm font-medium"
                    >
                      Prénom du client <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guest-first-name"
                      placeholder="Ex: Jean"
                      className={`rounded-xl border-border ${errors.guest_first_name ? "border-red-300" : ""}`}
                      {...register("guest_first_name")}
                    />
                    {errors.guest_first_name && (
                      <p className="text-xs text-red-500">
                        {errors.guest_first_name.message}
                      </p>
                    )}
                  </div>

                  {/* Nom */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="guest-last-name"
                      className="text-sm font-medium"
                    >
                      Nom du client <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guest-last-name"
                      placeholder="Ex: Kouamé"
                      className={`rounded-xl border-border ${errors.guest_last_name ? "border-red-300" : ""}`}
                      {...register("guest_last_name")}
                    />
                    {errors.guest_last_name && (
                      <p className="text-xs text-red-500">
                        {errors.guest_last_name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="guest-email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="guest-email"
                      type="email"
                      placeholder="jean@email.com"
                      className={`rounded-xl border-border ${errors.guest_email ? "border-red-300" : ""}`}
                      {...register("guest_email")}
                    />
                    {errors.guest_email && (
                      <p className="text-xs text-red-500">
                        {errors.guest_email.message}
                      </p>
                    )}
                  </div>

                  {/* Téléphone */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="guest-phone"
                      className="text-sm font-medium"
                    >
                      Téléphone
                    </Label>
                    <Input
                      id="guest-phone"
                      placeholder="+225 07 00 00 00"
                      className="rounded-xl border-border"
                      {...register("guest_phone")}
                    />
                  </div>
                </div>
              </div>

              {/* ─── Séjour section ───────────────────────────────── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
                  Séjour
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Date d'arrivée */}
                  <div className="space-y-2">
                    <Label htmlFor="check-in" className="text-sm font-medium">
                      Date d&apos;arrivée <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="check-in"
                      type="date"
                      className={`rounded-xl border-border ${errors.check_in ? "border-red-300" : ""}`}
                      {...register("check_in")}
                    />
                    {errors.check_in && (
                      <p className="text-xs text-red-500">
                        {errors.check_in.message}
                      </p>
                    )}
                  </div>

                  {/* Date de départ */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="check-out"
                      className="text-sm font-medium"
                    >
                      Date de départ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="check-out"
                      type="date"
                      className={`rounded-xl border-border ${errors.check_out ? "border-red-300" : ""}`}
                      {...register("check_out")}
                    />
                    {errors.check_out && (
                      <p className="text-xs text-red-500">
                        {errors.check_out.message}
                      </p>
                    )}
                  </div>

                  {/* Type de chambre */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Type de chambre <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={roomType}
                      onValueChange={(val) =>
                        setValue("room_type", val as RoomType, {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        className={`rounded-xl border-border ${errors.room_type ? "border-red-300" : ""}`}
                      >
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="deluxe">Deluxe</SelectItem>
                        <SelectItem value="suite">Suite</SelectItem>
                        <SelectItem value="presidentielle">Présidentielle</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.room_type && (
                      <p className="text-xs text-red-500">
                        {errors.room_type.message}
                      </p>
                    )}
                  </div>

                  {/* Chambre */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Chambre</Label>
                    <Select
                      value={roomId ?? "none"}
                      onValueChange={(v) =>
                        setValue("room_id", v === "none" ? null : v)
                      }
                    >
                      <SelectTrigger
                        className="rounded-xl border-border"
                        disabled={!roomType || roomsLoading}
                      >
                        <SelectValue
                          placeholder={
                            roomsLoading
                              ? "Chargement..."
                              : roomType
                                ? "Non assignée"
                                : "Choisissez d'abord le type"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non assignée</SelectItem>
                        {filteredRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Chambre {room.number} —{" "}
                            {new Intl.NumberFormat("fr-FR").format(
                              room.price_per_night
                            )}{" "}
                            FCFA/nuit
                          </SelectItem>
                        ))}
                        {roomType &&
                          filteredRooms.length === 0 &&
                          !roomsLoading && (
                            <SelectItem value="none" disabled>
                              Aucune chambre disponible
                            </SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                    {!roomType && (
                      <p className="text-xs text-slate">
                        Sélectionnez d&apos;abord un type de chambre.
                      </p>
                    )}
                  </div>

                  {/* Source */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Source <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch("source")}
                      onValueChange={(val) =>
                        setValue("source", val, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger
                        className={`rounded-xl border-border ${errors.source ? "border-red-300" : ""}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.source && (
                      <p className="text-xs text-red-500">
                        {errors.source.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Auto-display: nights, price, total */}
                {roomType && checkIn && checkOut && nights > 0 && (
                  <div className="grid grid-cols-3 gap-3 rounded-xl bg-ivory/60 p-4">
                    <div className="text-center">
                      <p className="text-xs text-slate">Nuits</p>
                      <p className="text-lg font-semibold text-navy">
                        {nights}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate">Prix / nuit</p>
                      <p className="text-lg font-semibold text-navy">
                        {new Intl.NumberFormat("fr-FR").format(pricePerNight)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate">Total estimé</p>
                      <p className="text-lg font-semibold text-navy">
                        {new Intl.NumberFormat("fr-FR").format(totalEstimate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Détails section ───────────────────────────────── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
                  Détails
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Adultes */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="adults"
                      className="text-sm font-medium"
                    >
                      Adultes <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="adults"
                      type="number"
                      min={1}
                      max={20}
                      className={`rounded-xl border-border ${errors.adults ? "border-red-300" : ""}`}
                      {...register("adults")}
                    />
                    {errors.adults && (
                      <p className="text-xs text-red-500">
                        {errors.adults.message}
                      </p>
                    )}
                  </div>

                  {/* Enfants */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="children"
                      className="text-sm font-medium"
                    >
                      Enfants
                    </Label>
                    <Input
                      id="children"
                      type="number"
                      min={0}
                      max={20}
                      className={`rounded-xl border-border ${errors.children ? "border-red-300" : ""}`}
                      {...register("children")}
                    />
                    {errors.children && (
                      <p className="text-xs text-red-500">
                        {errors.children.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Notes optionnelles..."
                    rows={3}
                    className={`rounded-xl border-border resize-none ${errors.notes ? "border-red-300" : ""}`}
                    {...register("notes")}
                  />
                  {errors.notes && (
                    <p className="text-xs text-red-500">
                      {errors.notes.message}
                    </p>
                  )}
                </div>
              </div>

              {/* ─── Summary card ─────────────────────────────────── */}
              {nights > 0 && roomType && (
                <Card className="rounded-xl border-gold/30 bg-gold/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-navy">
                      Récapitulatif
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate">
                        {nights} nuit{nights > 1 ? "s" : ""} × {ROOM_TYPE_LABELS[roomType]}
                      </span>
                      <span className="font-medium text-navy">
                        {new Intl.NumberFormat("fr-FR").format(pricePerNight)} FCFA/nuit
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gold/20 pt-2">
                      <span className="font-semibold text-navy">Total estimé</span>
                      <span className="text-lg font-bold text-navy">
                        {new Intl.NumberFormat("fr-FR").format(totalEstimate)} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate">
                      <span>Acompte (30%)</span>
                      <span>{new Intl.NumberFormat("fr-FR").format(depositEstimate)} FCFA</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ─── Actions ───────────────────────────────────────── */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="rounded-xl border-border hover:bg-ivory"
                >
                  <Link href="/dashboard/reservations">Annuler</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer la réservation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
