"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const activationSchema = z
  .object({
    code: z
      .string()
      .min(1, "Le code d'activation est requis")
      .min(10, "Le code doit contenir au moins 10 caractères"),
    hotel_name: z
      .string()
      .min(1, "Le nom de l'hôtel est requis")
      .min(2, "Le nom doit contenir au moins 2 caractères"),
    full_name: z
      .string()
      .min(1, "Votre nom complet est requis")
      .min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z
      .string()
      .min(1, "L'e-mail est requis")
      .email("Veuillez entrer un e-mail valide"),
    password: z
      .string()
      .min(1, "Le mot de passe est requis")
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirm_password: z
      .string()
      .min(1, "Veuillez confirmer votre mot de passe"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm_password"],
  });

type ActivationValues = z.infer<typeof activationSchema>;

export default function ActiverPage() {
  const form = useForm<ActivationValues>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      code: "",
      hotel_name: "",
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  function onSubmit(_data: ActivationValues) {
    toast.info(
      "Fonctionnalité bientôt disponible — activation Supabase en cours d'intégration."
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          {/* Icon */}
          <div className="mx-auto flex w-fit rounded-full bg-gold/10 p-3 text-gold">
            <KeyRound className="h-6 w-6" />
          </div>

          {/* Heading */}
          <h1 className="mt-4 text-center text-xl font-semibold text-navy">
            Activer votre compte
          </h1>
          <p className="mt-1 text-center text-sm text-slate">
            Saisissez le code d&apos;activation fourni par notre équipe pour
            créer votre compte propriétaire.
          </p>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate">
                      Code d&apos;activation
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="XXXX-XXXX-XXXX"
                        className="text-center text-lg font-mono uppercase tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hotel_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate">
                      Nom de l&apos;hôtel
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nom de votre établissement"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate">
                      Votre nom complet
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Prénom Nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate">
                      E-mail professionnel
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="votre@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate">Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Votre mot de passe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate">
                      Confirmer le mot de passe
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirmez votre mot de passe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full rounded-lg bg-gold py-2.5 font-semibold text-white hover:bg-gold-light"
              >
                Créer mon compte
              </Button>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}
