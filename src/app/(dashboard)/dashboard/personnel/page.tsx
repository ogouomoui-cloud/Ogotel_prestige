"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCircle,
  Plus,
  Loader2,
  Power,
  PowerOff,
  AlertTriangle,
  Users,
  Shield,
  Mail,
  Phone,
  CalendarClock,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants/roles";
import type { Role } from "@/lib/constants";
import EmptyState from "@/components/shared/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────
interface Employee {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  avatar_url: string | null;
}

interface Quota {
  used: number;
  active: number;
  max: number;
  remaining: number;
}

// ─── Schema de formulaire ──────────────────────────────────────────────
const employeeSchema = z.object({
  full_name: z.string().min(2, "Minimum 2 caractères."),
  email: z.string().email("Email invalide."),
  phone: z.string().optional(),
  role: z.enum(["manager", "receptionist"], {
    message: "Sélectionnez un rôle.",
  }),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

// ─── Helpers ────────────────────────────────────────────────────────────
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Animation ─────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Component ──────────────────────────────────────────────────────────
export default function PersonnelPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: { full_name: "", email: "", phone: "", role: undefined },
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = form;
  const selectedRole = watch("role");

  // ─── Fetch employees ────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hotel-admin/employees");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(data.employees ?? []);
      setQuota(data.quota ?? null);
    } catch {
      toast.error("Impossible de charger le personnel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ─── Create employee ────────────────────────────────────────────
  async function onSubmit(values: EmployeeFormValues) {
    try {
      setCreating(true);
      const res = await fetch("/api/hotel-admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          phone: values.phone || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors de la création.");
        return;
      }

      // Si un mot de passe a été auto-généré, l'afficher
      if (data.generated_password) {
        setGeneratedPassword(data.generated_password);
      } else {
        toast.success(data.message);
        setDialogOpen(false);
        reset();
        fetchEmployees();
      }

      // Mettre à jour le quota
      if (data.quota) setQuota(data.quota);
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setCreating(false);
    }
  }

  // ─── Toggle employee status ─────────────────────────────────────
  async function toggleStatus(employee: Employee) {
    const action = employee.is_active ? "désactiver" : "activer";
    const confirmed = window.confirm(
      `Voulez-vous vraiment ${action} ${employee.full_name} ?`
    );
    if (!confirmed) return;

    try {
      setTogglingId(employee.id);
      const res = await fetch(`/api/hotel-admin/employees/${employee.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !employee.is_active }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur.");
        return;
      }

      toast.success(data.message);
      fetchEmployees();
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setTogglingId(null);
    }
  }

  // ─── Copy password ──────────────────────────────────────────────
  async function copyPassword() {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier.");
    }
  }

  // ─── Quota is full ──────────────────────────────────────────────
  const quotaFull = quota ? quota.remaining <= 0 : false;

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
            <UserCircle className="h-5 w-5 text-gold-dark" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">Personnel</h1>
            <p className="text-sm text-slate">Gérez les employés de votre établissement.</p>
          </div>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={quotaFull}
          className="rounded-xl bg-navy text-ivory hover:bg-navy-light disabled:opacity-50"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un employé
        </Button>
      </motion.div>

      {/* ─── Quota Banner ────────────────────────────────────────── */}
      {quota && (
        <motion.div variants={item}>
          <Card className={`rounded-xl border ${
            quotaFull
              ? "border-red-200 bg-red-50/50"
              : quota.remaining <= 2
                ? "border-amber-200 bg-amber-50/50"
                : "border-emerald-200 bg-emerald-50/50"
          }`}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Users className={`h-5 w-5 ${quotaFull ? "text-red-500" : quota.remaining <= 2 ? "text-amber-600" : "text-emerald-600"}`} />
                <div>
                  <p className="text-sm font-medium text-navy">
                    {quota.used} / {quota.max} employé{quota.max > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-slate">
                    {quotaFull
                      ? "Quota atteint — mettez à niveau votre abonnement pour ajouter plus d'employés."
                      : `${quota.remaining} place${quota.remaining > 1 ? "s" : ""} restante${quota.remaining > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              {/* Quota bar */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="h-2 w-32 rounded-full bg-white">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      quotaFull ? "bg-red-500" : quota.remaining <= 2 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (quota.used / quota.max) * 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold ${
                  quotaFull ? "text-red-600" : quota.remaining <= 2 ? "text-amber-600" : "text-emerald-600"
                }`}>
                  {quota.max > 999 ? "Illimité" : `${quota.used}/${quota.max}`}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Employee List ───────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm overflow-hidden">
          {employees.length === 0 ? (
            <EmptyState
              icon={UserCircle}
              title="Aucun employé"
              description="Ajoutez votre premier employé (manager ou réceptionniste) pour commencer."
              action={!quotaFull ? { label: "Ajouter un employé", href: "#" } : undefined}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-ivory/60">
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">Employé</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">Rôle</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">Téléphone</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">Statut</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">Ajouté le</th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {employees.map((emp) => (
                      <EmployeeRow
                        key={emp.id}
                        employee={emp}
                        togglingId={togglingId}
                        onToggle={toggleStatus}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border/50">
                {employees.map((emp) => (
                  <div key={emp.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                          emp.is_active ? "bg-navy text-ivory" : "bg-slate/20 text-slate"
                        }`}>
                          {emp.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${emp.is_active ? "text-navy" : "text-slate line-through"}`}>
                            {emp.full_name}
                          </p>
                          <p className="text-xs text-slate">{emp.email}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={emp.is_active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-600"
                        }
                      >
                        {emp.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={ROLE_COLORS[emp.role] ?? ""}>
                          {ROLE_LABELS[emp.role] ?? emp.role}
                        </Badge>
                        {emp.phone && (
                          <span className="text-xs text-slate">{emp.phone}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={togglingId === emp.id}
                        onClick={() => toggleStatus(emp)}
                        className={
                          emp.is_active
                            ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        }
                      >
                        {togglingId === emp.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : emp.is_active
                            ? <><PowerOff className="mr-1 h-4 w-4" /> Désactiver</>
                            : <><Power className="mr-1 h-4 w-4" /> Activer</>
                        }
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {/* ─── Create Dialog ───────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          reset();
          setGeneratedPassword(null);
          setShowPassword(false);
        }
        setDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          {/* ─── Formulaire ─── */}
          {!generatedPassword ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl text-navy">
                  Nouvel employé
                </DialogTitle>
                <DialogDescription className="text-sm text-slate">
                  Créez un compte pour un manager ou réceptionniste de votre hôtel.
                  <br />
                  Un mot de passe sécurisé sera généré automatiquement.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Nom complet */}
                <div className="space-y-2">
                  <Label htmlFor="emp-name" className="text-sm font-medium">
                    Nom complet <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emp-name"
                    placeholder="Ex: Amadou Koné"
                    className={`rounded-xl border-border ${errors.full_name ? "border-red-300" : ""}`}
                    {...register("full_name")}
                  />
                  {errors.full_name && (
                    <p className="text-xs text-red-500">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="emp-email" className="text-sm font-medium">
                    Adresse email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emp-email"
                    type="email"
                    placeholder="Ex: amadou@hotel.com"
                    className={`rounded-xl border-border ${errors.email ? "border-red-300" : ""}`}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="emp-phone" className="text-sm font-medium">Téléphone</Label>
                  <Input
                    id="emp-phone"
                    placeholder="Ex: +225 07 00 00 00 00"
                    className="rounded-xl border-border"
                    {...register("phone")}
                  />
                </div>

                {/* Rôle */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Rôle <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(val) => setValue("role", val as "manager" | "receptionist", { shouldValidate: true })}
                  >
                    <SelectTrigger className={`rounded-xl border-border ${errors.role ? "border-red-300" : ""}`}>
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gold-dark" />
                          Manager — accès gestion + réservations
                        </div>
                      </SelectItem>
                      <SelectItem value="receptionist">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-emerald-600" />
                          Réceptionniste — accès réservations uniquement
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-xs text-red-500">{errors.role.message}</p>
                  )}
                </div>

                {/* Info box */}
                <div className="rounded-lg border border-gold/20 bg-gold/5 p-3">
                  <p className="text-xs text-slate">
                    <span className="font-medium text-gold-dark">Note :</span> Un mot de passe sécurisé sera généré automatiquement.
                    Communiquez-le confidentiellement à l'employé (via WhatsApp par exemple).
                  </p>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="rounded-xl border-border">
                      Annuler
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
                  >
                    {creating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...</>
                    ) : (
                      <><Plus className="mr-2 h-4 w-4" /> Créer l'employé</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            /* ─── Password Display ─── */
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl text-navy flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  Employé créé avec succès
                </DialogTitle>
                <DialogDescription className="text-sm text-slate">
                  Le compte a été créé. Communiquez les identifiants ci-dessous à l'employé.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Password card */}
                <div className="rounded-xl border border-gold/30 bg-ivory p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate uppercase tracking-wide">
                      Mot de passe temporaire
                    </p>
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[11px]">
                      À modifier à la première connexion
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 rounded-lg bg-white px-3 py-2.5 text-sm font-mono tracking-wider ${
                      showPassword ? "text-navy" : "text-slate"
                    }`}>
                      {showPassword ? generatedPassword : "••••••••••••"}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="shrink-0 h-9 w-9 rounded-lg hover:bg-navy/10"
                    >
                      {showPassword
                        ? <EyeOff className="h-4 w-4 text-slate" />
                        : <Eye className="h-4 w-4 text-slate" />
                      }
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={copyPassword}
                      className="shrink-0 h-9 w-9 rounded-lg hover:bg-navy/10"
                    >
                      {copied
                        ? <Check className="h-4 w-4 text-emerald-500" />
                        : <Copy className="h-4 w-4 text-slate" />
                      }
                    </Button>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-800">
                    Ce mot de passe ne sera affiché qu'une seule fois.
                    Copiez-le et envoyez-le à l'employé par un canal sécurisé (WhatsApp, SMS, etc.).
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    reset();
                    setGeneratedPassword(null);
                    setShowPassword(false);
                    setDialogOpen(false);
                    fetchEmployees();
                  }}
                  className="w-full rounded-xl bg-navy text-ivory hover:bg-navy-light"
                >
                  J'ai copié le mot de passe
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Employee Table Row ────────────────────────────────────────────────
function EmployeeRow({
  employee,
  togglingId,
  onToggle,
}: {
  employee: Employee;
  togglingId: string | null;
  onToggle: (emp: Employee) => void;
}) {
  return (
    <tr className="group transition-colors hover:bg-ivory/30">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
            employee.is_active ? "bg-navy text-ivory" : "bg-slate/20 text-slate"
          }`}>
            {employee.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className={`text-sm font-medium ${employee.is_active ? "text-navy" : "text-slate"}`}>
              {employee.full_name}
            </p>
            <p className="text-xs text-slate">{employee.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <Badge variant="outline" className={ROLE_COLORS[employee.role] ?? ""}>
          {ROLE_LABELS[employee.role] ?? employee.role}
        </Badge>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-sm text-slate">{employee.phone ?? "—"}</span>
      </td>
      <td className="px-5 py-3.5">
        <Badge
          variant="outline"
          className={employee.is_active
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-600"
          }
        >
          {employee.is_active ? "Actif" : "Inactif"}
        </Badge>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-sm text-slate">{formatDate(employee.created_at)}</span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <Button
          variant="ghost"
          size="sm"
          disabled={togglingId === employee.id}
          onClick={() => onToggle(employee)}
          className={
            employee.is_active
              ? "text-red-600 hover:text-red-700 hover:bg-red-50"
              : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          }
        >
          {togglingId === employee.id
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : employee.is_active
              ? <><PowerOff className="mr-1 h-4 w-4" /> <span className="hidden sm:inline">Désactiver</span></>
              : <><Power className="mr-1 h-4 w-4" /> <span className="hidden sm:inline">Activer</span></>
          }
        </Button>
      </td>
    </tr>
  );
}
