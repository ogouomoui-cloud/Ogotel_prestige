"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ScrollText,
  Filter,
} from "lucide-react";
import {
  ACTIVITY_ACTION_LABELS,
} from "@/types";
import type { ActivityAction, ActivityLog } from "@/types";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants/roles";
import type { Role } from "@/lib/constants";
import EmptyState from "@/components/shared/EmptyState";

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
function getRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  const diffW = Math.floor(diffD / 7);
  const diffM = Math.floor(diffD / 30);

  if (diffSec < 60) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  if (diffW < 4) return `il y a ${diffW} sem.`;
  if (diffM < 12) return `il y a ${diffM} mois`;
  return `il y a ${Math.floor(diffM / 12)} ans`;
}

function formatFullDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionEmoji(action: ActivityAction): string {
  switch (action) {
    case "create": return "✨";
    case "update": return "✏️";
    case "delete": return "🗑️";
    case "login": return "🔑";
    case "logout": return "🚪";
    case "approve": return "✅";
    case "reject": return "❌";
    case "activate": return "⚡";
    case "export": return "📤";
    default: return "📌";
  }
}

function getActionBadgeStyle(action: ActivityAction): string {
  switch (action) {
    case "create": return "bg-blue-100 text-blue-800 border-blue-200";
    case "update": return "bg-amber-100 text-amber-800 border-amber-200";
    case "delete": return "bg-red-100 text-red-800 border-red-200";
    case "login": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "logout": return "bg-slate-100 text-slate-700 border-slate-200";
    case "approve": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "reject": return "bg-red-100 text-red-800 border-red-200";
    case "activate": return "bg-purple-100 text-purple-800 border-purple-200";
    case "export": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

// ─── Action options ─────────────────────────────────────────────────────
const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Toutes les actions" },
  { value: "create", label: "Création" },
  { value: "update", label: "Modification" },
  { value: "delete", label: "Suppression" },
  { value: "login", label: "Connexion" },
  { value: "logout", label: "Déconnexion" },
  { value: "approve", label: "Approbation" },
  { value: "reject", label: "Rejet" },
  { value: "activate", label: "Activation" },
  { value: "export", label: "Export" },
];

export default function JournalPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (actionFilter !== "all") params.set("action", actionFilter);

      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setLogs(data.logs ?? data ?? []);
    } catch {
      toast.error("Impossible de charger le journal d'activité");
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
          <ScrollText className="h-5 w-5 text-gold-dark" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy">
            Journal d&apos;activité
          </h1>
          <p className="text-sm text-slate">
            Suivez toutes les actions effectuées sur la plateforme.
          </p>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div variants={item} className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-slate" />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[220px] rounded-xl border-border">
            <SelectValue placeholder="Filtrer par action" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-slate">
          {logs.length} entrée{logs.length > 1 ? "s" : ""}
        </span>
      </motion.div>

      {/* Content */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-10 w-full" />
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Aucune activité enregistrée"
              description={
                actionFilter !== "all"
                  ? `Aucune action de type "${ACTION_OPTIONS.find((o) => o.value === actionFilter)?.label ?? actionFilter}" trouvée.`
                  : "Le journal d'activité est vide pour le moment."
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-ivory/60 hover:bg-ivory/60">
                      <TableHead className="w-[180px]">Date</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entité</TableHead>
                      <TableHead className="hidden xl:table-cell">Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-ivory/30">
                        <TableCell>
                          <div>
                            <span className="text-sm text-slate">
                              {getRelativeTime(log.created_at)}
                            </span>
                            <span
                              className="block text-[11px] text-slate/60"
                              title={formatFullDate(log.created_at)}
                            >
                              {formatFullDate(log.created_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-ivory">
                              {(
                                (log.details?.user_name as string) ??
                                "U"
                              ).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-navy">
                                {(log.details?.user_name as string) ?? "Utilisateur inconnu"}
                              </p>
                              {log.user_role && (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${
                                    ROLE_COLORS[log.user_role as Role] ??
                                    "bg-slate-100 text-slate"
                                  }`}
                                >
                                  {ROLE_LABELS[log.user_role as Role] ?? log.user_role}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getActionBadgeStyle(log.action as ActivityAction)}
                          >
                            <span className="mr-1">{getActionEmoji(log.action as ActivityAction)}</span>
                            {ACTIVITY_ACTION_LABELS[log.action as ActivityAction] ?? log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-navy">
                              {log.entity_type}
                              {log.entity_id ? (
                                <span className="text-slate/60"> #{log.entity_id.slice(0, 8)}</span>
                              ) : null}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <div className="max-w-xs truncate text-xs text-slate">
                              {Object.entries(log.details)
                                .filter(([key]) => key !== "user_name")
                                .slice(0, 3)
                                .map(([key, value]) => (
                                  <span key={key} className="mr-3">
                                    <span className="font-medium text-navy/70">{key}:</span>{" "}
                                    {typeof value === "string"
                                      ? value.length > 30
                                        ? value.slice(0, 30) + "..."
                                        : value
                                      : JSON.stringify(value).slice(0, 30)}
                                  </span>
                                ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate/60">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile/tablet cards */}
              <div className="lg:hidden divide-y divide-border">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getActionEmoji(log.action as ActivityAction)}</span>
                        <Badge
                          variant="outline"
                          className={getActionBadgeStyle(log.action as ActivityAction)}
                        >
                          {ACTIVITY_ACTION_LABELS[log.action as ActivityAction]}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate whitespace-nowrap">
                        {getRelativeTime(log.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-semibold text-ivory">
                        {((log.details?.user_name as string) ?? "U").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-navy">
                        {(log.details?.user_name as string) ?? "Utilisateur inconnu"}
                      </span>
                      {log.user_role && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            ROLE_COLORS[log.user_role as Role] ?? "bg-slate-100 text-slate"
                          }`}
                        >
                          {ROLE_LABELS[log.user_role as Role]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate">
                      {log.entity_type}
                      {log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ""}
                    </p>
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
