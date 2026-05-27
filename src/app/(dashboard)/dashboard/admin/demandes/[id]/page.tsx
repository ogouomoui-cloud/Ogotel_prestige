"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  BedDouble,
  CreditCard,
  Calendar,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import {
  REQUEST_STATUS_LABELS,
  PLAN_TIER_LABELS,
} from "@/types";
import type { SubscriptionRequest, RequestStatus, PlanTier } from "@/types";

// ─── Status badge styles ────────────────────────────────────────────────
const STATUS_BADGE_STYLES: Record<RequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-slate-100 text-slate-700 border-slate-200",
};

// ─── Helpers ────────────────────────────────────────────────────────────
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ──────────────────────────────────────────────────────────
export default function DemandeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [request, setRequest] = useState<SubscriptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activationCode, setActivationCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/requests/${id}`);
      if (!res.ok) throw new Error("Demande introuvable");
      const data = await res.json();
      setRequest(data);
    } catch {
      toast.error("Impossible de charger la demande");
      router.push("/dashboard/admin/demandes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  // ─── Approve ──────────────────────────────────────────────────────
  async function handleApprove() {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur lors de l'approbation");
      }
      const data = await res.json();
      toast.success("Demande approuvée avec succès");
      setApproveOpen(false);
      if (data.activation_code) {
        setActivationCode(data.activation_code);
      }
      fetchRequest();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'approbation");
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Reject ───────────────────────────────────────────────────────
  async function handleReject() {
    if (!rejectionReason.trim()) {
      toast.error("Veuillez indiquer la raison du rejet");
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur lors du rejet");
      }
      toast.success("Demande rejetée");
      setRejectOpen(false);
      setRejectionReason("");
      fetchRequest();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors du rejet");
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Copy activation code ─────────────────────────────────────────
  async function copyCode() {
    if (!activationCode) return;
    try {
      await navigator.clipboard.writeText(activationCode);
      setCopied(true);
      toast.success("Code copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
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

  if (!request) return null;

  // ─── Info row helper ──────────────────────────────────────────────
  function InfoRow({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number | null;
  }) {
    return (
      <div className="flex items-start gap-3 py-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate" />
        <div>
          <p className="text-xs text-slate">{label}</p>
          <p className="text-sm font-medium text-navy">
            {value ?? <span className="text-slate italic">Non renseigné</span>}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Back button + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-ivory"
          >
            <Link href="/dashboard/admin/demandes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Demande d&apos;abonnement
            </h1>
            <p className="text-sm text-slate">Détails de la demande</p>
          </div>
        </div>

        {/* Status badge (large) */}
        <Badge
          variant="outline"
          className={`px-4 py-1.5 text-sm font-semibold ${STATUS_BADGE_STYLES[request.status]}`}
        >
          {REQUEST_STATUS_LABELS[request.status]}
        </Badge>
      </div>

      {/* Info Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Hotel info */}
        <Card className="rounded-xl border-border shadow-sm lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-navy">
              <Building2 className="h-5 w-5 text-gold-dark" />
              Informations de l&apos;hôtel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={Building2} label="Nom de l'hôtel" value={request.hotel_name} />
            <InfoRow icon={MapPin} label="Ville" value={request.city} />
            <InfoRow icon={BedDouble} label="Nombre de chambres" value={request.room_count?.toString() ?? null} />
            <InfoRow icon={CreditCard} label="Plan souhaité" value={PLAN_TIER_LABELS[request.desired_plan as PlanTier]} />
            <Separator className="my-2" />
            <InfoRow icon={Building2} label="Contact" value={request.contact_name} />
            <InfoRow icon={Mail} label="Email" value={request.email} />
            <InfoRow icon={Phone} label="Téléphone" value={request.phone} />
            <InfoRow icon={MessageCircle} label="WhatsApp" value={request.whatsapp} />
            <Separator className="my-2" />
            <InfoRow icon={Calendar} label="Date de la demande" value={formatDate(request.created_at)} />
            {request.reviewed_at && (
              <InfoRow icon={Calendar} label="Date de traitement" value={formatDate(request.reviewed_at)} />
            )}

            {/* Message */}
            {request.message && (
              <>
                <Separator className="my-2" />
                <div className="py-2">
                  <p className="text-xs text-slate mb-1">Message</p>
                  <p className="text-sm text-navy bg-ivory/50 rounded-lg p-3 whitespace-pre-wrap">
                    {request.message}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: Actions */}
        <div className="space-y-4">
          {/* Action card for pending */}
          {request.status === "pending" && (
            <Card className="rounded-xl border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-navy">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate">
                  Cette demande est en attente de traitement. Vous pouvez l&apos;approuver ou la rejeter.
                </p>
                <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approuver
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-xl">
                    <DialogHeader>
                      <DialogTitle className="text-navy">
                        Confirmer l&apos;approbation
                      </DialogTitle>
                      <DialogDescription>
                        En approuvant cette demande, les actions suivantes seront effectuées :
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 rounded-lg bg-ivory/60 p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-navy">
                          Création de l&apos;hôtel <strong>{request.hotel_name}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-navy">
                          Abonnement <strong>{PLAN_TIER_LABELS[request.desired_plan as PlanTier]}</strong> activé
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-navy">
                          Code d&apos;activation généré
                        </span>
                      </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        variant="outline"
                        onClick={() => setApproveOpen(false)}
                        className="rounded-xl"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        {actionLoading ? "Traitement..." : "Confirmer l'approbation"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-xl">
                    <DialogHeader>
                      <DialogTitle className="text-navy">
                        Rejeter la demande
                      </DialogTitle>
                      <DialogDescription>
                        Indiquez la raison du rejet. Cette information sera transmise au demandeur.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Raison du rejet..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      className="rounded-xl border-border"
                    />
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        variant="outline"
                        onClick={() => setRejectOpen(false)}
                        className="rounded-xl"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={actionLoading || !rejectionReason.trim()}
                        className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                      >
                        {actionLoading ? "Traitement..." : "Confirmer le rejet"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {/* Approved info */}
          {request.status === "approved" && (
            <Card className="rounded-xl border-emerald-200 bg-emerald-50/30 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-800">Demande approuvée</h3>
                </div>
                <p className="text-sm text-emerald-700">
                  Cette demande a été approuvée et l&apos;hôtel a été créé.
                </p>
                {request.reviewed_at && (
                  <p className="mt-2 text-xs text-slate">
                    Approuvée le {formatDate(request.reviewed_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rejected info */}
          {request.status === "rejected" && (
            <Card className="rounded-xl border-red-200 bg-red-50/30 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-800">Demande rejetée</h3>
                </div>
                {request.rejection_reason && (
                  <div className="mt-2 rounded-lg bg-white p-3">
                    <p className="text-xs text-slate mb-1">Raison du rejet :</p>
                    <p className="text-sm text-navy">{request.rejection_reason}</p>
                  </div>
                )}
                {request.reviewed_at && (
                  <p className="mt-2 text-xs text-slate">
                    Rejetée le {formatDate(request.reviewed_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Expired info */}
          {request.status === "expired" && (
            <Card className="rounded-xl border-slate-200 bg-slate-50/30 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-slate" />
                  <h3 className="font-semibold text-slate-700">Demande expirée</h3>
                </div>
                <p className="text-sm text-slate">
                  Cette demande a expiré et ne peut plus être traitée.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Activation Code Dialog (shown after approval) */}
      {activationCode && (
        <Card className="rounded-xl border-gold/30 bg-gold/5 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 shrink-0">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-navy">
                    Code d&apos;activation généré
                  </h3>
                  <p className="text-sm text-slate mt-1">
                    Transmettez ce code au contact de l&apos;hôtel pour qu&apos;il puisse activer son compte.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg bg-white border border-gold/30 px-4 py-3">
                    <code className="text-lg font-mono font-bold tracking-widest text-navy">
                      {activationCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyCode}
                      className="h-8 w-8 shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
