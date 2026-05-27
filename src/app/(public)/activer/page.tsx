"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Building2,
  Star,
  Users,
  BedDouble,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE } from "@/lib/constants";
import { PLAN_TIER_LABELS } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────
interface CodeVerifyResult {
  valid: boolean;
  code: string;
  hotel: { name: string; city: string; country: string };
  plan: {
    name: string;
    tier: string;
    price_monthly: number;
    max_rooms: number;
    max_users: number;
  };
  expires_at: string | null;
}

type Step = "code" | "account" | "success";

interface ActivateResult {
  success: boolean;
  message: string;
  user: { email: string; full_name: string; role: string };
  hotel: { name: string; city: string; country: string } | null;
  plan: { name: string; tier: string; price_monthly: number } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────
function formatCode(value: string): string {
  const raw = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (raw.length <= 4) return raw;
  if (raw.length <= 8) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount);
}

// ─── Animation variants ──────────────────────────────────────────────
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 120 : -120,
    opacity: 0,
  }),
};

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// ─── Composant principal ──────────────────────────────────────────────
export default function ActiverPage() {
  const router = useRouter();

  // State
  const [step, setStep] = useState<Step>("code");
  const [direction, setDirection] = useState(1);
  const [codeInput, setCodeInput] = useState("");
  const [fullCode, setFullCode] = useState("");
  const [verifyData, setVerifyData] = useState<CodeVerifyResult | null>(null);
  const [activateResult, setActivateResult] = useState<ActivateResult | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading / errors
  const [verifying, setVerifying] = useState(false);
  const [activating, setActivating] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ─── Étape 1 : Vérification du code ────────────────────────
  const handleVerifyCode = useCallback(async () => {
    const code = codeInput.replace(/[^a-zA-Z0-9]/g, "");
    if (code.length < 4) {
      setVerifyError("Saisissez un code complet (12 caractères).");
      return;
    }

    setVerifying(true);
    setVerifyError("");

    try {
      const res = await fetch(
        `/api/auth/verify-code?code=${encodeURIComponent(code)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setVerifyError(data.error || "Code invalide.");
        return;
      }

      // Code valide !
      setFullCode(code.toUpperCase());
      setVerifyData(data);
      setDirection(1);
      setStep("account");
    } catch {
      setVerifyError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setVerifying(false);
    }
  }, [codeInput]);

  // ─── Étape 2 : Création du compte ──────────────────────────
  const handleCreateAccount = useCallback(async () => {
    // Validation client-side
    const errors: Record<string, string> = {};

    if (fullName.trim().length < 2) {
      errors.fullName = "Le nom doit contenir au moins 2 caractères.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Adresse e-mail invalide.";
    }

    if (password.length < 8) {
      errors.password = "Minimum 8 caractères.";
    } else {
      if (!/[A-Z]/.test(password)) {
        errors.password = "Doit contenir au moins une majuscule.";
      }
      if (!/[0-9]/.test(password)) {
        errors.password = "Doit contenir au moins un chiffre.";
      }
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setActivating(true);

    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: fullCode,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Si c'est un code invalid, revenir à l'étape 1
        if (res.status === 400 && data.error?.includes("Code")) {
          setDirection(-1);
          setStep("code");
          setVerifyError(data.error);
          setVerifyData(null);
        } else {
          toast.error(data.error || "Erreur lors de la création du compte.");
        }
        return;
      }

      // Succès !
      setActivateResult(data);
      setDirection(1);
      setStep("success");
    } catch {
      toast.error("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setActivating(false);
    }
  }, [fullName, email, password, confirmPassword, fullCode]);

  // ─── Retour à l'étape code ──────────────────────────────────
  const handleBackToCode = () => {
    setDirection(-1);
    setStep("code");
    setVerifyData(null);
    setVerifyError("");
    setFormErrors({});
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link
            href="/"
            className="inline-flex flex-col items-center select-none"
          >
            <span className="font-serif text-2xl font-medium text-navy">
              OGOTEL
            </span>
            <span className="text-[0.55rem] tracking-[0.3em] text-slate">
              PRESTIGE
            </span>
          </Link>
        </motion.div>

        {/* Steps indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          {[
            { key: "code", label: "Code" },
            { key: "account", label: "Compte" },
            { key: "success", label: "Terminé" },
          ].map((s, i) => {
            const stepOrder = ["code", "account", "success"];
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = i;
            const isActive = thisIdx <= currentIdx;
            const isCurrent = thisIdx === currentIdx;

            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-300 ${
                    isCurrent
                      ? "bg-gold text-white scale-110 shadow-md shadow-gold/30"
                      : isActive
                        ? "bg-gold/15 text-gold-dark"
                        : "bg-muted text-slate"
                  }`}
                >
                  {isActive && !isCurrent ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    thisIdx + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 h-0.5 rounded-full transition-colors duration-300 ${
                      thisIdx < currentIdx ? "bg-gold" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Card container */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ═══════════════════════════════════════════════════
                ÉTAPE 1 : Saisie du code
            ═══════════════════════════════════════════════════ */}
            {step === "code" && (
              <motion.div
                key="step-code"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" as const }}
                className="p-8 md:p-10"
              >
                {/* Header */}
                <div className="text-center">
                  <div className="mx-auto mb-4 flex w-fit rounded-full bg-gold/10 p-3">
                    <KeyRound className="h-6 w-6 text-gold" />
                  </div>
                  <h1 className="text-xl font-semibold text-navy">
                    Activer votre compte
                  </h1>
                  <p className="mt-2 text-sm text-slate leading-relaxed">
                    Saisissez le code d&apos;activation à 12 caractères que vous
                    avez reçu par e-mail ou WhatsApp.
                  </p>
                </div>

                {/* Code input */}
                <div className="mt-8">
                  <label className="block text-sm font-medium text-navy mb-2">
                    Code d&apos;activation
                  </label>
                  <Input
                    value={codeInput}
                    onChange={(e) => {
                      const formatted = formatCode(e.target.value);
                      if (formatted.length <= 14) {
                        setCodeInput(formatted);
                      }
                      setVerifyError("");
                    }}
                    placeholder="XXXX-XXXX-XXXX"
                    className="text-center text-lg font-mono uppercase tracking-widest h-14 rounded-xl border-border focus:border-gold focus:ring-gold/20"
                    maxLength={14}
                    autoFocus
                  />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {verifyError && (
                    <motion.div
                      {...fadeIn}
                      className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-3"
                    >
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700">{verifyError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <Button
                  onClick={handleVerifyCode}
                  disabled={verifying || codeInput.replace(/[^a-zA-Z0-9]/g, "").length < 4}
                  className="mt-6 w-full h-12 rounded-xl bg-gold text-white font-semibold hover:bg-gold-light disabled:opacity-50 transition-all shadow-md shadow-gold/20 hover:shadow-lg hover:shadow-gold/30"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vérification…
                    </>
                  ) : (
                    <>
                      Vérifier le code
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Help */}
                <p className="mt-6 text-center text-sm text-slate">
                  Pas de code ?{" "}
                  <Link
                    href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Bonjour, je souhaite obtenir un code d'activation OGOTEL Prestige.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Contactez-nous sur WhatsApp
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                ÉTAPE 2 : Informations de l'hôtel + Création compte
            ═══════════════════════════════════════════════════ */}
            {step === "account" && verifyData && (
              <motion.div
                key="step-account"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" as const }}
                className="p-8 md:p-10"
              >
                {/* Hotel & plan info card */}
                <div className="rounded-xl bg-gradient-to-br from-navy to-navy-light p-6 text-ivory">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/20">
                      <Building2 className="h-6 w-6 text-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold">
                        {verifyData.hotel.name}
                      </h2>
                      <p className="text-sm text-ivory/70 mt-0.5">
                        {verifyData.hotel.city}, {verifyData.hotel.country}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-white/10 p-3 text-center">
                      <Star className="h-4 w-4 text-gold mx-auto mb-1" />
                      <p className="text-[11px] text-ivory/60">Plan</p>
                      <p className="text-sm font-semibold">
                        {PLAN_TIER_LABELS[verifyData.plan.tier as keyof typeof PLAN_TIER_LABELS] ?? verifyData.plan.name}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-3 text-center">
                      <BedDouble className="h-4 w-4 text-gold mx-auto mb-1" />
                      <p className="text-[11px] text-ivory/60">Chambres</p>
                      <p className="text-sm font-semibold">
                        {verifyData.plan.max_rooms}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-3 text-center">
                      <Users className="h-4 w-4 text-gold mx-auto mb-1" />
                      <p className="text-[11px] text-ivory/60">Utilisateurs</p>
                      <p className="text-sm font-semibold">
                        {verifyData.plan.max_users}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-lg bg-gold/15 px-4 py-2.5">
                    <span className="text-xs text-ivory/80">Abonnement mensuel</span>
                    <span className="text-sm font-semibold text-gold">
                      {formatPrice(verifyData.plan.price_monthly)} FCFA
                    </span>
                  </div>
                </div>

                {/* Separator */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-slate font-medium">
                    CRÉER VOTRE COMPTE
                  </span>
                  <div className="flex-1 border-t border-border" />
                </div>

                {/* Account form */}
                <div className="space-y-4">
                  {/* Full name */}
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      <User className="inline h-3.5 w-3.5 mr-1 text-slate" />
                      Nom complet
                    </label>
                    <Input
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setFormErrors((prev) => ({ ...prev, fullName: "" }));
                      }}
                      placeholder="Prénom Nom"
                      className="rounded-xl border-border focus:border-gold focus:ring-gold/20"
                      autoFocus
                    />
                    {formErrors.fullName && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      <Mail className="inline h-3.5 w-3.5 mr-1 text-slate" />
                      E-mail professionnel
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFormErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="vous@votre-hotel.com"
                      className="rounded-xl border-border focus:border-gold focus:ring-gold/20"
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      <Lock className="inline h-3.5 w-3.5 mr-1 text-slate" />
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setFormErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        placeholder="Minimum 8 caractères"
                        className="rounded-xl border-border focus:border-gold focus:ring-gold/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-navy transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                    )}
                    {/* Password strength indicators */}
                    {password.length > 0 && (
                      <div className="mt-2 flex gap-1.5">
                        {[
                          password.length >= 8,
                          /[A-Z]/.test(password),
                          /[0-9]/.test(password),
                        ].map((ok, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              ok ? "bg-emerald-500" : "bg-border"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-slate mt-1">
                      Min. 8 caractères, 1 majuscule, 1 chiffre
                    </p>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      <ShieldCheck className="inline h-3.5 w-3.5 mr-1 text-slate" />
                      Confirmer le mot de passe
                    </label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFormErrors((prev) => ({
                          ...prev,
                          confirmPassword: "",
                        }));
                      }}
                      placeholder="Retapez le mot de passe"
                      className="rounded-xl border-border focus:border-gold focus:ring-gold/20"
                    />
                    {formErrors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBackToCode}
                    className="h-12 rounded-xl border-border hover:bg-muted"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                  <Button
                    onClick={handleCreateAccount}
                    disabled={
                      activating ||
                      !fullName.trim() ||
                      !email.trim() ||
                      !password ||
                      !confirmPassword
                    }
                    className="flex-1 h-12 rounded-xl bg-navy text-ivory font-semibold hover:bg-navy-light disabled:opacity-50 shadow-md"
                  >
                    {activating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création…
                      </>
                    ) : (
                      <>
                        Créer mon compte
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                ÉTAPE 3 : Succès
            ═══════════════════════════════════════════════════ */}
            {step === "success" && activateResult && (
              <motion.div
                key="step-success"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" as const }}
                className="p-8 md:p-10 text-center"
              >
                {/* Success icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </motion.div>

                <h1 className="text-2xl font-bold text-navy">
                  Compte créé avec succès !
                </h1>
                <p className="mt-2 text-sm text-slate">
                  Votre compte propriétaire a été activé. Vous pouvez dès
                  maintenant vous connecter.
                </p>

                {/* Summary card */}
                <div className="mt-8 rounded-xl border border-border bg-ivory/50 p-6 text-left space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-ivory">
                      {activateResult.user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        {activateResult.user.full_name}
                      </p>
                      <p className="text-xs text-slate">
                        {activateResult.user.email}
                      </p>
                    </div>
                  </div>

                  {activateResult.hotel && (
                    <div className="flex items-center gap-3 rounded-lg bg-white p-3">
                      <Building2 className="h-5 w-5 text-gold shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {activateResult.hotel.name}
                        </p>
                        <p className="text-xs text-slate">
                          {activateResult.hotel.city},{" "}
                          {activateResult.hotel.country}
                        </p>
                      </div>
                    </div>
                  )}

                  {activateResult.plan && (
                    <div className="flex items-center justify-between rounded-lg bg-white p-3">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-gold" />
                        <div>
                          <p className="text-sm font-medium text-navy">
                            {activateResult.plan.name}
                          </p>
                          <p className="text-xs text-slate">Plan actif</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-navy">
                        {formatPrice(activateResult.plan.price_monthly)} FCFA
                        <span className="text-xs font-normal text-slate">
                          /mois
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-8 space-y-3">
                  <Button
                    onClick={() => router.push("/connexion")}
                    className="w-full h-12 rounded-xl bg-gold text-white font-semibold hover:bg-gold-light shadow-md shadow-gold/20"
                  >
                    Me connecter maintenant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Link
                    href="/"
                    className="block text-center text-sm text-slate hover:text-navy transition-colors"
                  >
                    Retour à l&apos;accueil
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer help */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-xs text-slate"
        >
          Besoin d&apos;aide ?{" "}
          <a
            href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Bonjour, j'ai besoin d'aide pour activer mon compte OGOTEL Prestige.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Phone className="h-3 w-3" />
            {SITE.phone}
          </a>
        </motion.p>
      </div>
    </div>
  );
}
