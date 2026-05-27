"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  Key,
  UserPlus,
  ArrowRight,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

// ─── Schéma ────────────────────────────────────────────────────────────
const setupSchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères."),
  email: z.string().email("E-mail invalide."),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});

type SetupValues = z.infer<typeof setupSchema>;

// ─── Animation ─────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Types ─────────────────────────────────────────────────────────────
interface SetupStatus {
  env_ready: boolean;
  schema_ready: boolean;
  admin_exists: boolean;
  admin_email: string | null;
  message: string;
  step: "env" | "schema" | "create_admin" | "login" | "unknown";
}

// ─── Component ──────────────────────────────────────────────────────────
export default function InstallerPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // ─── Vérifier le statut d'initialisation ───────────────────────────
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/setup/init");
        const data = await res.json();
        setStatus(data);

        // Si tout est prêt et admin existe, rediriger vers connexion
        if (data.step === "login") {
          setTimeout(() => {
            router.push("/connexion");
          }, 2000);
        }
      } catch {
        setStatus({
          env_ready: false,
          schema_ready: false,
          admin_exists: false,
          admin_email: null,
          message: "Impossible de vérifier l'état.",
          step: "unknown",
        });
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [router]);

  // ─── Soumettre le formulaire ───────────────────────────────────────
  async function onSubmit(data: SetupValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/setup/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      // Recheck status
      const checkRes = await fetch("/api/setup/init");
      const checkData = await checkRes.json();
      setStatus(checkData);

      if (checkData.step === "login") {
        setTimeout(() => router.push("/connexion"), 1500);
      }
    } catch {
      toast.error("Une erreur s'est produite.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
      </div>
    );
  }

  // ─── Déterminer l'étape ────────────────────────────────────────────
  const currentStep = status?.step ?? "unknown";

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy/5 to-white py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-serif text-3xl font-bold text-navy">
            Configuration initiale
          </h1>
          <p className="mt-2 text-slate">
            Suivez ces étapes pour configurer OGOTEL Prestige.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* ─── Étape 1 : Variables d'environnement ──────────────── */}
          <motion.div variants={item}>
            <SetupStep
              number={1}
              title="Variables d'environnement"
              description="Configurez votre fichier .env.local avec les clés Supabase."
              status={status?.env_ready ? "done" : "pending"}
            >
              <div className="space-y-3">
                <div className="rounded-lg bg-ivory p-4 text-sm space-y-2">
                  <p className="font-medium text-navy">
                    1. Créez un projet sur{" "}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline inline-flex items-center gap-1"
                    >
                      supabase.com
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                  <p className="font-medium text-navy">
                    2. Copiez les variables :
                  </p>
                  <div className="rounded-md bg-navy p-3 text-ivory font-mono text-xs space-y-1 overflow-x-auto">
                    <p>NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co</p>
                    <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...</p>
                    <p>SUPABASE_SERVICE_ROLE_KEY=eyJ...</p>
                  </div>
                  <p className="font-medium text-navy">
                    3. Redémarrez le serveur (bun run dev)
                  </p>
                </div>
              </div>
            </SetupStep>
          </motion.div>

          {/* ─── Étape 2 : Schéma de base de données ──────────────── */}
          <motion.div variants={item}>
            <SetupStep
              number={2}
              title="Schéma de base de données"
              description="Installez les tables dans Supabase."
              status={status?.schema_ready ? "done" : "pending"}
              locked={!status?.env_ready}
            >
              <div className="space-y-3">
                <div className="rounded-lg bg-ivory p-4 text-sm space-y-2">
                  <p className="font-medium text-navy">
                    1. Ouvrez{" "}
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      supabase/schema.sql
                    </span>
                  </p>
                  <p className="font-medium text-navy">
                    2. Allez dans Supabase →{" "}
                    <strong>SQL Editor</strong> → <strong>New query</strong>
                  </p>
                  <p className="font-medium text-navy">
                    3. Collez le contenu du fichier et cliquez sur{" "}
                    <strong>Run</strong>
                  </p>
                  <p className="text-xs text-slate mt-2">
                    ⚠️ Cela créera toutes les tables, enums, triggers et fonctions RPC.
                  </p>
                </div>
              </div>
            </SetupStep>
          </motion.div>

          {/* ─── Étape 3 : Créer le super administrateur ──────────── */}
          <motion.div variants={item}>
            <SetupStep
              number={3}
              title="Créer le super administrateur"
              description="Premier compte pour gérer la plateforme."
              status={status?.admin_exists ? "done" : "pending"}
              locked={!status?.schema_ready}
            >
              {status?.admin_exists ? (
                <div className="rounded-lg bg-emerald-50 p-4 text-sm flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-medium text-emerald-800">
                      Super administrateur créé
                    </p>
                    <p className="text-emerald-600">
                      {status.admin_email} — Redirection vers la connexion...
                    </p>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Jean Dupont"
                              {...field}
                              className="rounded-xl border-border"
                            />
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
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="admin@ogotel.com"
                              {...field}
                              className="rounded-xl border-border"
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
                          <FormLabel>Mot de passe</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Minimum 8 caractères, 1 majuscule, 1 chiffre"
                              {...field}
                              className="rounded-xl border-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmer le mot de passe</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Retapez le mot de passe"
                              {...field}
                              className="rounded-xl border-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>
                        Ce compte aura tous les droits sur la plateforme. Ne perdez
                        pas vos identifiants.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-navy text-ivory hover:bg-navy-light"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Créer le super administrateur
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </SetupStep>
          </motion.div>

          {/* ─── Navigation ────────────────────────────────────────── */}
          <motion.div variants={item} className="text-center pt-4">
            {currentStep === "login" ? (
              <p className="text-sm text-emerald-600 font-medium">
                ✅ Configuration terminée ! Redirection...
              </p>
            ) : (
              <Link
                href="/connexion"
                className="text-sm text-slate hover:text-navy inline-flex items-center gap-1"
              >
                Passer et aller à la connexion
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Setup Step Component ─────────────────────────────────────────────
function SetupStep({
  number,
  title,
  description,
  status,
  locked,
  children,
}: {
  number: number;
  title: string;
  description: string;
  status: "done" | "pending";
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={`rounded-xl border shadow-sm overflow-hidden transition-opacity ${
        locked ? "opacity-60 pointer-events-none" : ""
      } ${status === "done" ? "border-emerald-200" : "border-border"}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Step number */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              status === "done"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-navy text-ivory"
            }`}
          >
            {status === "done" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              number
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-navy">{title}</h3>
              {status === "done" && (
                <Badge
                  variant="outline"
                  className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs"
                >
                  Terminé
                </Badge>
              )}
              {locked && (
                <Badge
                  variant="outline"
                  className="bg-slate-100 text-slate border-slate-200 text-xs"
                >
                  Verrouillé
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate mt-0.5">{description}</p>

            {/* Content */}
            <div className="mt-4">{children}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
