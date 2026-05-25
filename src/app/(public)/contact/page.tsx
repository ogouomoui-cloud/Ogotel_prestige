"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SectionTitle from "@/components/shared/SectionTitle";
import { SITE } from "@/lib/constants";

/* ─── Schema ─────────────────────────────────────────────────────── */
const contactSchema = z.object({
  name: z.string().min(2, "Le nom est requis (min. 2 caractères)"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z
    .string()
    .min(1, "Le numéro de téléphone est requis"),
  subject: z.string().min(1, "Veuillez choisir un sujet"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});

type ContactForm = z.infer<typeof contactSchema>;

/* ─── Contact info cards ─────────────────────────────────────────── */
const CONTACT_INFO = [
  {
    icon: Mail,
    label: "E-mail",
    value: SITE.email,
    href: `mailto:${SITE.email}`,
  },
  {
    icon: Phone,
    label: "Téléphone",
    value: SITE.phone,
    href: `tel:${SITE.phone.replace(/\s/g, "")}`,
  },
  {
    icon: MapPin,
    label: "Adresse",
    value: SITE.address,
  },
  {
    icon: Clock,
    label: "Horaires",
    value: "Lun–Ven : 8h–18h",
  },
];

const SUBJECTS = [
  "Demande d'information",
  "Demande de démo",
  "Support technique",
  "Partenariat",
  "Autre",
];

/* ─── Page ───────────────────────────────────────────────────────── */
export default function ContactPage() {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(_data: ContactForm) {
    // Simulate sending
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Message envoyé avec succès !");
    reset();
  }

  return (
    <section className="bg-ivory py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          label="CONTACT"
          title="Parlons de votre projet"
          description="Une question ? Envie de découvrir OGOTEL Prestige ? Notre équipe est à votre écoute."
        />

        <div className="grid lg:grid-cols-2 gap-12">
          {/* ─── Form ─── */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-2xl border border-border p-6 md:p-8 space-y-5"
          >
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Nom complet
              </label>
              <Input
                placeholder="Jean Dupont"
                {...register("name")}
                className="rounded-xl border-border focus:border-gold focus:ring-gold/20"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                E-mail
              </label>
              <Input
                type="email"
                placeholder="jean@exemple.com"
                {...register("email")}
                className="rounded-xl border-border focus:border-gold focus:ring-gold/20"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Téléphone
              </label>
              <Input
                type="tel"
                placeholder="+225 XX XX XX XX"
                {...register("phone")}
                className="rounded-xl border-border focus:border-gold focus:ring-gold/20"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Sujet */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Sujet
              </label>
              <Select onValueChange={(v) => setValue("subject", v, { shouldValidate: true })}>
                <SelectTrigger className="rounded-xl border-border focus:border-gold focus:ring-gold/20">
                  <SelectValue placeholder="Choisir un sujet" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Message
              </label>
              <Textarea
                rows={5}
                placeholder="Décrivez votre demande..."
                {...register("message")}
                className="rounded-xl border-border focus:border-gold focus:ring-gold/20 resize-none"
              />
              {errors.message && (
                <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-navy text-ivory hover:bg-navy-light rounded-full py-3 font-semibold"
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
            </Button>
          </form>

          {/* ─── Contact info ─── */}
          <div className="space-y-4">
            {CONTACT_INFO.map((item) => (
              <div
                key={item.label}
                className="bg-ivory rounded-xl p-5 flex items-start gap-4"
              >
                <div className="bg-gold/10 rounded-lg p-2.5 text-gold shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate">{item.label}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-navy font-medium mt-1 block hover:text-gold transition-colors"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-navy font-medium mt-1">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
