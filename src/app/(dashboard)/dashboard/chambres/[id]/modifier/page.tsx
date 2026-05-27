"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  BedDouble,
  Loader2,
  ArrowLeft,
  Bed,
  Bath,
  Building,
  Wifi,
  Tv,
  Wind,
  Coffee,
  Car,
  Snowflake,
  UtensilsCrossed,
  Monitor,
  Shield,
  X,
} from "lucide-react";
import { ROOM_TYPE_LABELS, ROOM_STATUS_LABELS, type RoomType, type RoomStatus } from "@/types";

// ─── Schéma de validation ──────────────────────────────────────────────
const roomSchema = z.object({
  number: z
    .string()
    .min(1, "Le numéro est requis.")
    .max(10, "Max 10 caractères."),
  room_type: z.enum(["standard", "deluxe", "suite", "presidentielle"], {
    message: "Sélectionnez un type.",
  }),
  floor: z.coerce
    .number()
    .int()
    .min(-2, "Min -2")
    .max(99, "Max 99"),
  price_per_night: z.coerce
    .number()
    .min(0, "Le prix ne peut pas être négatif.")
    .max(10_000_000, "Prix trop élevé."),
  status: z.enum(["disponible", "occupee", "reservee", "nettoyage", "maintenance"]),
  capacity: z.coerce
    .number()
    .int()
    .min(1, "Min 1")
    .max(20, "Max 20"),
  amenities: z.array(z.string()).default([]),
  description: z.string().max(500, "Max 500 caractères.").nullable().optional(),
});

type RoomFormValues = z.infer<typeof roomSchema>;

// ─── Amenities disponibles ─────────────────────────────────────────────
const AVAILABLE_AMENITIES = [
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "tv", label: "TV", icon: Tv },
  { id: "climatisation", label: "Climatisation", icon: Wind },
  { id: "minibar", label: "Minibar", icon: Coffee },
  { id: "coffre", label: "Coffre-fort", icon: Shield },
  { id: "baignoire", label: "Baignoire", icon: Bath },
  { id: "room_service", label: "Room service", icon: UtensilsCrossed },
  { id: "parking", label: "Parking", icon: Car },
  { id: "bureau", label: "Bureau", icon: Monitor },
  { id: "sdb_privee", label: "SdB privée", icon: Bed },
  { id: "balcon", label: "Balcon", icon: Building },
  { id: "plancher_chaud", label: "Plancher chauffant", icon: Snowflake },
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
export default function ModifierChambrePage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [roomNumber, setRoomNumber] = useState("");

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      number: "",
      room_type: "standard",
      floor: 0,
      price_per_night: 0,
      status: "disponible",
      capacity: 2,
      amenities: [],
      description: "",
    },
  });

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = form;
  const selectedType = watch("room_type");
  const selectedStatus = watch("status");

  // ─── Fetch room data ───────────────────────────────────────────
  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`/api/hotel-admin/rooms/${roomId}`);
        if (!res.ok) {
          toast.error("Chambre introuvable.");
          router.push("/dashboard/chambres");
          return;
        }
        const data = await res.json();
        const room = data.room;
        setRoomNumber(room.number);
        setSelectedAmenities(room.amenities ?? []);
        reset({
          number: room.number,
          room_type: room.room_type,
          floor: room.floor,
          price_per_night: room.price_per_night,
          status: room.status,
          capacity: room.capacity,
          amenities: room.amenities ?? [],
          description: room.description ?? "",
        });
      } catch {
        toast.error("Impossible de charger la chambre.");
        router.push("/dashboard/chambres");
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [roomId, router, reset]);

  // ─── Toggle amenity ────────────────────────────────────────────
  function toggleAmenity(id: string) {
    const updated = selectedAmenities.includes(id)
      ? selectedAmenities.filter((a) => a !== id)
      : [...selectedAmenities, id];
    setSelectedAmenities(updated);
    setValue("amenities", updated, { shouldValidate: true });
  }

  // ─── Submit ─────────────────────────────────────────────────────
  async function onSubmit(values: RoomFormValues) {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/hotel-admin/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          description: values.description?.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors de la modification.");
        return;
      }

      toast.success(data.message);
      router.push("/dashboard/chambres");
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-2xl">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-9 w-9 rounded-xl hover:bg-ivory"
        >
          <Link href="/dashboard/chambres">
            <ArrowLeft className="h-4 w-4 text-slate" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <BedDouble className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Chambre n° {roomNumber}
            </h1>
            <p className="text-sm text-slate">Modifiez les informations de la chambre.</p>
          </div>
        </div>
      </motion.div>

      {/* ─── Form ───────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* ─── Informations de base ──────────────────────────── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">Informations de base</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Numéro */}
                  <div className="space-y-2">
                    <Label htmlFor="room-number" className="text-sm font-medium">
                      Numéro de chambre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="room-number"
                      placeholder="Ex: 101, A12, PR1"
                      className={`rounded-xl border-border ${errors.number ? "border-red-300" : ""}`}
                      {...register("number")}
                    />
                    {errors.number && (
                      <p className="text-xs text-red-500">{errors.number.message}</p>
                    )}
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Type de chambre <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedType}
                      onValueChange={(val) => setValue("room_type", val as RoomType, { shouldValidate: true })}
                    >
                      <SelectTrigger className={`rounded-xl border-border ${errors.room_type ? "border-red-300" : ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">
                          <span className="flex items-center gap-2">
                            <Bed className="h-4 w-4 text-slate" />
                            Standard
                          </span>
                        </SelectItem>
                        <SelectItem value="deluxe">
                          <span className="flex items-center gap-2">
                            <Bath className="h-4 w-4 text-emerald-600" />
                            Deluxe
                          </span>
                        </SelectItem>
                        <SelectItem value="suite">
                          <span className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gold-dark" />
                            Suite
                          </span>
                        </SelectItem>
                        <SelectItem value="presidentielle">
                          <span className="flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-navy" />
                            Présidentielle
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.room_type && (
                      <p className="text-xs text-red-500">{errors.room_type.message}</p>
                    )}
                  </div>

                  {/* Étage */}
                  <div className="space-y-2">
                    <Label htmlFor="room-floor" className="text-sm font-medium">
                      Étage <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="room-floor"
                      type="number"
                      placeholder="0"
                      className={`rounded-xl border-border ${errors.floor ? "border-red-300" : ""}`}
                      {...register("floor")}
                    />
                    {errors.floor && (
                      <p className="text-xs text-red-500">{errors.floor.message}</p>
                    )}
                  </div>

                  {/* Capacité */}
                  <div className="space-y-2">
                    <Label htmlFor="room-capacity" className="text-sm font-medium">
                      Capacité <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="room-capacity"
                      type="number"
                      placeholder="2"
                      className={`rounded-xl border-border ${errors.capacity ? "border-red-300" : ""}`}
                      {...register("capacity")}
                    />
                    {errors.capacity && (
                      <p className="text-xs text-red-500">{errors.capacity.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Tarification & Statut ─────────────────────────── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">Tarification & Statut</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Prix */}
                  <div className="space-y-2">
                    <Label htmlFor="room-price" className="text-sm font-medium">
                      Prix par nuit (FCFA) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="room-price"
                      type="number"
                      placeholder="25000"
                      className={`rounded-xl border-border ${errors.price_per_night ? "border-red-300" : ""}`}
                      {...register("price_per_night")}
                    />
                    {errors.price_per_night && (
                      <p className="text-xs text-red-500">{errors.price_per_night.message}</p>
                    )}
                  </div>

                  {/* Statut */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Statut <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={(val) => setValue("status", val as RoomStatus, { shouldValidate: true })}
                    >
                      <SelectTrigger className={`rounded-xl border-border ${errors.status ? "border-red-300" : ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["disponible", "occupee", "reservee", "nettoyage", "maintenance"] as RoomStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {ROOM_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-xs text-red-500">{errors.status.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Équipements ──────────────────────────────────── */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">Équipements</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {AVAILABLE_AMENITIES.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity.id);
                    const Icon = amenity.icon;
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-border bg-white text-slate hover:border-emerald-200 hover:bg-emerald-50/50"
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-emerald-600" : "text-slate"}`} />
                        {amenity.label}
                        {isSelected && <X className="ml-auto h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
                {selectedAmenities.length > 0 && (
                  <p className="text-xs text-slate">
                    {selectedAmenities.length} équipement{selectedAmenities.length > 1 ? "s" : ""} sélectionné{selectedAmenities.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* ─── Description ───────────────────────────────────── */}
              <div className="space-y-2">
                <Label htmlFor="room-description" className="text-sm font-medium">
                  Description courte
                </Label>
                <Textarea
                  id="room-description"
                  placeholder="Description optionnelle de la chambre..."
                  rows={3}
                  className={`rounded-xl border-border resize-none ${errors.description ? "border-red-300" : ""}`}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>

              {/* ─── Actions ───────────────────────────────────────── */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="rounded-xl border-border hover:bg-ivory"
                >
                  <Link href="/dashboard/chambres">Annuler</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</>
                  ) : (
                    <><BedDouble className="mr-2 h-4 w-4" /> Enregistrer les modifications</>
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
