"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  FileText,
  Search,
  Eye,
  Clock,
} from "lucide-react";
import { REQUEST_STATUS_LABELS, PLAN_TIER_LABELS } from "@/types";
import type { SubscriptionRequest, RequestStatus, PlanTier } from "@/types";
import EmptyState from "@/components/shared/EmptyState";

// ─── Status badge styles ────────────────────────────────────────────────
const STATUS_BADGE_STYLES: Record<RequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-slate-100 text-slate-700 border-slate-200",
};

// ─── Animation variants ─────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── Helpers ────────────────────────────────────────────────────────────
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DemandesPage() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/requests?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setRequests(data.requests ?? data ?? []);
      setPendingCount(data.pending_count ?? data.requests?.filter((r: SubscriptionRequest) => r.status === "pending").length ?? 0);
    } catch {
      toast.error("Impossible de charger les demandes");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter((r) => {
    if (activeTab !== "all" && r.status !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.hotel_name.toLowerCase().includes(q) ||
        r.contact_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    }
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
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
            <FileText className="h-5 w-5 text-gold-dark" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Demandes d&apos;abonnement
            </h1>
            <p className="text-sm text-slate">
              Gérez les demandes d&apos;inscription des hôtels.
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-amber-500 text-white hover:bg-amber-600">
              {pendingCount} en attente
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-ivory">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              En attente
            </TabsTrigger>
            <TabsTrigger value="approved">Approuvées</TabsTrigger>
            <TabsTrigger value="rejected">Rejetées</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            placeholder="Rechercher par nom, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-border"
          />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-10 w-full" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucune demande trouvée"
              description={
                activeTab === "all"
                  ? "Il n'y a aucune demande d'abonnement pour le moment."
                  : `Aucune demande avec le statut "${REQUEST_STATUS_LABELS[activeTab as RequestStatus] ?? activeTab}".`
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
                      <TableHead>Contact</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((req) => (
                      <TableRow key={req.id} className="hover:bg-ivory/30">
                        <TableCell className="font-medium text-navy">
                          {req.hotel_name}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-navy">{req.contact_name}</p>
                            <p className="text-xs text-slate">{req.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gold/30 text-gold-dark bg-gold/5">
                            {PLAN_TIER_LABELS[req.desired_plan as PlanTier] ?? req.desired_plan}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate">
                          {formatDate(req.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={STATUS_BADGE_STYLES[req.status]}
                          >
                            {req.status === "pending" && (
                              <Clock className="mr-1 h-3 w-3" />
                            )}
                            {REQUEST_STATUS_LABELS[req.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/admin/demandes/${req.id}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              Voir
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {filteredRequests.map((req) => (
                  <Link
                    key={req.id}
                    href={`/dashboard/admin/demandes/${req.id}`}
                    className="block p-4 transition-colors hover:bg-ivory/30"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-navy">{req.hotel_name}</p>
                        <p className="text-sm text-slate">{req.contact_name} · {req.email}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={STATUS_BADGE_STYLES[req.status]}
                      >
                        {REQUEST_STATUS_LABELS[req.status]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate">
                      <Badge variant="outline" className="border-gold/30 text-gold-dark bg-gold/5 text-[11px]">
                        {PLAN_TIER_LABELS[req.desired_plan as PlanTier]}
                      </Badge>
                      <span>{formatDate(req.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
