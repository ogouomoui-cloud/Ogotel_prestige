"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Building2,
} from "lucide-react";
import {
  PLAN_TIER_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/types";
import type { PlanTier, SubscriptionStatus } from "@/types";
import EmptyState from "@/components/shared/EmptyState";

// ─── Extended subscription type ──────────────────────────────────────────
interface SubscriptionWithHotel {
  id: string;
  hotel_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string;
  ends_at: string | null;
  trial_ends_at: string | null;
  max_rooms: number;
  max_users: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  hotel?: { name: string; city: string };
  plan?: { name: string; tier: PlanTier; price_monthly: number };
}

// ─── Status badge styles ────────────────────────────────────────────────
const SUBSCRIPTION_STATUS_STYLES: Record<SubscriptionStatus, string> = {
  trial: "bg-blue-100 text-blue-800 border-blue-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  past_due: "bg-amber-100 text-amber-800 border-amber-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-slate-100 text-slate-700 border-slate-200",
};

// ─── Animation ──────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── Helpers ────────────────────────────────────────────────────────────
function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export default function AbonnementsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);

      const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setSubscriptions(data.subscriptions ?? data ?? []);
    } catch {
      toast.error("Impossible de charger les abonnements");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const filteredSubscriptions = subscriptions.filter((s) => {
    if (activeTab !== "all" && s.status !== activeTab) return false;
    return true;
  });

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
          <CreditCard className="h-5 w-5 text-gold-dark" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy">
            Abonnements
          </h1>
          <p className="text-sm text-slate">
            Gérez les abonnements des hôtels de la plateforme.
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto bg-ivory">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="trial">Essai</TabsTrigger>
            <TabsTrigger value="active">Actif</TabsTrigger>
            <TabsTrigger value="past_due">En retard</TabsTrigger>
            <TabsTrigger value="cancelled">Annulé</TabsTrigger>
            <TabsTrigger value="expired">Expiré</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Content */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-10 w-full" />
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Aucun abonnement trouvé"
              description={
                activeTab === "all"
                  ? "Il n'y a aucun abonnement pour le moment."
                  : `Aucun abonnement avec le statut "${SUBSCRIPTION_STATUS_LABELS[activeTab as SubscriptionStatus] ?? activeTab}".`
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-ivory/60 hover:bg-ivory/60">
                      <TableHead>Hôtel</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Début</TableHead>
                      <TableHead>Fin</TableHead>
                      <TableHead className="text-right">Prix/mois</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-ivory/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate" />
                            <div>
                              <p className="font-medium text-navy">
                                {sub.hotel?.name ?? "Hôtel inconnu"}
                              </p>
                              {sub.hotel?.city && (
                                <p className="text-xs text-slate">
                                  {sub.hotel.city}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-gold/30 text-gold-dark bg-gold/5"
                          >
                            {sub.plan?.name ??
                              PLAN_TIER_LABELS[sub.plan?.tier as PlanTier] ??
                              "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              SUBSCRIPTION_STATUS_STYLES[
                                sub.status as SubscriptionStatus
                              ]
                            }
                          >
                            {SUBSCRIPTION_STATUS_LABELS[
                              sub.status as SubscriptionStatus
                            ] ?? sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate">
                          {formatDate(sub.starts_at)}
                        </TableCell>
                        <TableCell className="text-sm text-slate">
                          {formatDate(sub.ends_at)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-navy">
                          {sub.plan?.price_monthly
                            ? formatFCFA(sub.plan.price_monthly)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {filteredSubscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate" />
                        <div>
                          <p className="font-medium text-navy">
                            {sub.hotel?.name ?? "Hôtel inconnu"}
                          </p>
                          {sub.hotel?.city && (
                            <p className="text-xs text-slate">{sub.hotel.city}</p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          SUBSCRIPTION_STATUS_STYLES[
                            sub.status as SubscriptionStatus
                          ]
                        }
                      >
                        {SUBSCRIPTION_STATUS_LABELS[
                          sub.status as SubscriptionStatus
                        ]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate">
                      <Badge
                        variant="outline"
                        className="border-gold/30 text-gold-dark bg-gold/5 text-[11px]"
                      >
                        {sub.plan?.name ??
                          PLAN_TIER_LABELS[sub.plan?.tier as PlanTier]}
                      </Badge>
                      <span>{formatDate(sub.starts_at)}</span>
                      <span>→</span>
                      <span>{formatDate(sub.ends_at)}</span>
                    </div>
                    {sub.plan?.price_monthly && (
                      <p className="text-sm font-medium text-navy">
                        {formatFCFA(sub.plan.price_monthly)}/mois
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
