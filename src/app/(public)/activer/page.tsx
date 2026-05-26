"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const activationSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  full_name: z.string().min(2, "Nom requis (min. 2 car.)"),
  email: z.string().min(1, "E-mail requis").email("E-mail invalide"),
  password: z.string().min(8, "Min. 8 caractères"),
});

type ActivationValues = z.infer<typeof activationSchema>;

export default function ActiverPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ActivationValues>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      code: "",
      full_name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: ActivationValues) {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erreur lors de l'activation.");
        return;
      }
      toast.success(result.message || "Compte créé avec succès !");
      router.push("/connexion");
    } catch {
      toast.error("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gold py-2.5 font-semibold text-white hover:bg-gold-light"
              >
                {loading ? "Création..." : "Créer mon compte"}
              </Button>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}
