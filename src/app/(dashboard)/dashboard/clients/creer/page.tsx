"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Loader2,
  Plus,
  ArrowLeft,
  Star,
  FileText,
} from "lucide-react";

// ─── Schéma de validation ──────────────────────────────────────────────
const clientSchema = z.object({
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
    .max(100, "La nationalité est trop longue.")
    .default("Ivoirienne"),
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
  is_vip: z.boolean().default(false),
  notes: z
    .string()
    .max(500, "Les notes ne doivent pas dépasser 500 caractères.")
    .nullable()
    .optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

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
export default function CreerClientPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as any,
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
    formState: { errors },
  } = form;

  const selectedDocType = watch("id_document_type");
  const isVip = watch("is_vip");

  // ─── Submit ─────────────────────────────────────────────────────
  async function onSubmit(values: ClientFormValues) {
    try {
      setSubmitting(true);
      const res = await fetch("/api/hotel-admin/clients", {
        method: "POST",
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
        toast.error(data.error ?? "Erreur lors de la création.");
        return;
      }

      toast.success(data.message);
      router.push("/dashboard/clients");
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
      className="space-y-6 max-w-2xl"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Nouveau client
            </h1>
            <p className="text-sm text-slate">
              Ajoutez un client à votre base de données.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── Form ───────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* ─── Nom & Prénom ─────────────────────────────────── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
                  Informations personnelles
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Prénom */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="client-firstname"
                      className="text-sm font-medium"
                    >
                      Prénom <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="client-firstname"
                      placeholder="Ex: Jean"
                      className={`rounded-xl border-border ${
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

                  {/* Nom */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="client-lastname"
                      className="text-sm font-medium"
                    >
                      Nom <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="client-lastname"
                      placeholder="Ex: Koné"
                      className={`rounded-xl border-border ${
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
              </div>

              {/* ─── Contact ────────────────────────────────────── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
                  Contact
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Téléphone */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="client-phone"
                      className="text-sm font-medium"
                    >
                      Téléphone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="client-phone"
                      placeholder="Ex: +225 07 00 00 00"
                      className={`rounded-xl border-border ${
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

                  {/* Email */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="client-email"
                      className="text-sm font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="Ex: jean@email.com"
                      className={`rounded-xl border-border ${
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
              </div>

              {/* ─── Localisation ────────────────────────────────── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
                  Localisation
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Nationalité */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="client-nationality"
                      className="text-sm font-medium"
                    >
                      Nationalité
                    </Label>
                    <Input
                      id="client-nationality"
                      placeholder="Ivoirienne"
                      defaultValue="Ivoirienne"
                      className={`rounded-xl border-border ${
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

                  {/* Ville */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="client-city"
                      className="text-sm font-medium"
                    >
                      Ville
                    </Label>
                    <Input
                      id="client-city"
                      placeholder="Ex: Abidjan"
                      className={`rounded-xl border-border ${
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
              </div>

              {/* ─── Pièce d'identité ───────────────────────────── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
                  Pièce d&apos;identité
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Type de pièce */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Type de pièce
                    </Label>
                    <Select
                      value={selectedDocType || undefined}
                      onValueChange={(val) =>
                        setValue("id_document_type", val === "none" ? "" : val)
                      }
                    >
                      <SelectTrigger className="rounded-xl border-border">
                        <SelectValue placeholder="Aucune" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune</SelectItem>
                        {DOCUMENT_TYPES.map((doc) => (
                          <SelectItem key={doc.value} value={doc.value}>
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-slate" />
                              {doc.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Numéro de pièce */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="client-doc-number"
                      className="text-sm font-medium"
                    >
                      Numéro de pièce
                    </Label>
                    <Input
                      id="client-doc-number"
                      placeholder="Numéro de la pièce"
                      className={`rounded-xl border-border ${
                        errors.id_document_number ? "border-red-300" : ""
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
              </div>

              {/* ─── VIP ────────────────────────────────────────── */}
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isVip ? "bg-gold/20" : "bg-ivory"
                    }`}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        isVip
                          ? "fill-gold text-gold-dark"
                          : "text-slate"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy">
                      Client VIP
                    </p>
                    <p className="text-xs text-slate">
                      Activer pour accorder un statut privilégié.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isVip}
                  onCheckedChange={(checked) =>
                    setValue("is_vip", checked, { shouldValidate: true })
                  }
                />
              </div>

              {/* ─── Notes ──────────────────────────────────────── */}
              <div className="space-y-2">
                <Label htmlFor="client-notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="client-notes"
                  placeholder="Informations supplémentaires sur le client..."
                  rows={3}
                  className={`rounded-xl border-border resize-none ${
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

              {/* ─── Actions ─────────────────────────────────────── */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="rounded-xl border-border hover:bg-ivory"
                >
                  <Link href="/dashboard/clients">Annuler</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" /> Créer le client
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
