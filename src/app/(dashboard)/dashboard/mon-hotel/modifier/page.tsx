"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Hotel,
  Save,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Star,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

// ─── Schema de validation ─────────────────────────────────────────────
const hotelSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  address: z.string().nullable().optional(),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères."),
  phone: z.string().nullable().optional(),
  email: z.string().email("Adresse email invalide.").nullable().optional(),
  description: z.string().max(1000, "La description ne doit pas dépasser 1000 caractères.").nullable().optional(),
  star_rating: z.number().int().min(1).max(5),
});

type HotelFormValues = z.infer<typeof hotelSchema>;

// ─── Animation variants ─────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Component ──────────────────────────────────────────────────────────
export default function ModifierHotelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<HotelFormValues>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      description: "",
      star_rating: 3,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  // ─── Load hotel data ────────────────────────────────────────────
  useEffect(() => {
    async function fetchHotel() {
      try {
        const res = await fetch("/api/hotel-admin/hotel");
        if (!res.ok) {
          toast.error("Impossible de charger les données de l'hôtel.");
          router.push("/dashboard/mon-hotel");
          return;
        }
        const data = await res.json();
        const h = data.hotel;
        reset({
          name: h.name ?? "",
          address: h.address ?? "",
          city: h.city ?? "",
          phone: h.phone ?? "",
          email: h.email ?? "",
          description: h.description ?? "",
          star_rating: h.star_rating ?? 3,
        });
      } catch {
        toast.error("Erreur de connexion.");
        router.push("/dashboard/mon-hotel");
      } finally {
        setLoading(false);
      }
    }
    fetchHotel();
  }, [reset, router]);

  // ─── Submit handler ─────────────────────────────────────────────
  async function onSubmit(values: HotelFormValues) {
    try {
      setSaving(true);

      // Build update payload — only send changed fields
      const payload: Record<string, unknown> = {};
      if (values.name !== undefined) payload.name = values.name;
      if (values.address !== undefined) payload.address = values.address || null;
      if (values.city !== undefined) payload.city = values.city;
      if (values.phone !== undefined) payload.phone = values.phone || null;
      if (values.email !== undefined) payload.email = values.email || null;
      if (values.description !== undefined) payload.description = values.description || null;
      if (values.star_rating !== undefined) payload.star_rating = values.star_rating;

      const res = await fetch("/api/hotel-admin/hotel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }));
        toast.error(err.error ?? "Impossible de sauvegarder.");
        return;
      }

      toast.success("Profil de l'hôtel mis à jour avec succès.");
      router.push("/dashboard/mon-hotel");
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
            <Link href="/dashboard/mon-hotel">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">Modifier mon hôtel</h1>
            <p className="text-sm text-slate">Mettez à jour les informations de votre établissement.</p>
          </div>
        </div>
      </motion.div>

      {/* ─── Form ────────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Hotel className="h-5 w-5 text-gold-dark" />
              <CardTitle className="font-serif text-base">Informations générales</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nom de l'hôtel */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1.5">
                  <Hotel className="h-3.5 w-3.5 text-slate" />
                  Nom de l&apos;hôtel <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Hôtel Le Palmier"
                  className={`rounded-xl border-border ${errors.name ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Classement étoiles */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-slate" />
                  Classement
                </Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => form.setValue("star_rating", star, { shouldDirty: true })}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= form.watch("star_rating")
                            ? "fill-gold text-gold"
                            : "text-slate/30"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-slate">
                    {form.watch("star_rating")} étoile{form.watch("star_rating") > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre établissement..."
                  rows={4}
                  className={`rounded-xl border-border resize-none ${errors.description ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.description.message}
                  </p>
                )}
              </div>

              <Separator />

              {/* Adresse + Ville */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate" />
                    Adresse
                  </Label>
                  <Input
                    id="address"
                    placeholder="Ex: Zone 4, Rue du Commerce"
                    className={`rounded-xl border-border ${errors.address ? "border-red-300" : ""}`}
                    {...register("address")}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.address.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate" />
                    Ville <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="Ex: Abidjan"
                    className={`rounded-xl border-border ${errors.city ? "border-red-300" : ""}`}
                    {...register("city")}
                  />
                  {errors.city && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.city.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Téléphone + Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Ex: +225 07 00 00 00 00"
                    className={`rounded-xl border-border ${errors.phone ? "border-red-300" : ""}`}
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ex: contact@hotel.com"
                    className={`rounded-xl border-border ${errors.email ? "border-red-300" : ""}`}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-border hover:bg-ivory"
                  onClick={() => router.push("/dashboard/mon-hotel")}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !isDirty}
                  className="rounded-xl bg-navy text-ivory hover:bg-navy-light disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les modifications
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
