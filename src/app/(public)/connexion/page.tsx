"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { signInWithEmail } from "@/lib/auth/client";
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

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'e-mail est requis")
    .email("Veuillez entrer un e-mail valide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function ConnexionPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [setupNeeded, setSetupNeeded] = useState<boolean | null>(null);

  // ─── Vérifier si l'app est initialisée ──────────────────────────
  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch("/api/setup/init");
        if (!res.ok) return;
        const data = await res.json();
        setSetupNeeded(data.step === "env" || data.step === "schema");
      } catch {
        // Silently fail
      }
    }
    checkSetup();
  }, []);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginValues) {
    setLoading(true);
    try {
      const { error } = await signInWithEmail(data.email, data.password);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Connexion réussie !");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
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
          {/* Logo */}
          <div className="flex flex-col items-center text-center">
            <div>
              <span className="font-serif text-2xl font-medium text-navy">
                OGOTEL
              </span>
              <span className="block text-xs tracking-[0.3em] text-slate">
                PRESTIGE
              </span>
            </div>
            <h1 className="mt-6 text-xl font-semibold text-navy">
              Connexion à votre espace
            </h1>
            <p className="mt-1 text-sm text-slate">
              Accédez au tableau de bord de votre établissement.
            </p>
          </div>

          {/* Banner setup */}
          {setupNeeded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Configuration requise
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Supabase n&apos;est pas encore configuré ou la base de données n&apos;est pas installée.
                    Suivez le guide d&apos;initialisation pour configurer votre plateforme.
                  </p>
                  <Link
                    href="/installer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 hover:text-amber-900 hover:underline"
                  >
                    Guide d&apos;initialisation
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate">E-mail</FormLabel>
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

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-gold hover:text-gold-dark transition-colors"
                  onClick={() => toast.info("Fonctionnalité bientôt disponible")}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-navy py-2.5 font-semibold text-ivory hover:bg-navy-light"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className="relative my-6 flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-xs text-slate">ou</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Social login */}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-lg py-2.5 text-sm font-medium"
            onClick={() => toast.info("Bientôt disponible")}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuer avec Google
          </Button>

          {/* Bottom link */}
          <p className="mt-6 text-center text-sm text-slate">
            Pas encore de compte ?{" "}
            <Link
              href="/tarifs"
              className="font-medium text-gold hover:text-gold-dark transition-colors"
            >
              Demander un essai
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
