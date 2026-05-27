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
  Building2,
  Search,
  MapPin,
  Star,
  CreditCard,
  Eye,
  Users,
  Calendar,
} from "lucide-react";
import { PLAN_TIER_LABELS, SUBSCRIPTION_STATUS_LABELS } from "@/types";
import type { Hotel, PlanTier, SubscriptionStatus } from "@/types";
import EmptyState from "@/components/shared/EmptyState";

// ─── Hotel with subscription (extended) ─────────────────────────────────
interface HotelWithSubscription extends Hotel {
  subscription?: {
    plan_name?: string;
    plan_tier?: PlanTier;
    status?: SubscriptionStatus;
  };
  admin_name?: string;
  admin_email?: string;
}

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
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState<HotelWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 });

  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/hotels?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setHotels(data.hotels ?? data ?? []);
      setStats({
        total: data.total ?? data.hotels?.length ?? 0,
        active: data.active_count ?? data.hotels?.filter((h: HotelWithSubscription) => h.is_active).length ?? 0,
        suspended: data.suspended_count ?? data.hotels?.filter((h: HotelWithSubscription) => !h.is_active).length ?? 0,
      });
    } catch {
      toast.error("Impossible de charger les hôtels");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const filteredHotels = hotels.filter((h) => {
    if (activeTab === "active" && !h.is_active) return false;
    if (activeTab === "suspended" && h.is_active) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.country.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const subscriptionBadgeColor = (status?: SubscriptionStatus) => {
    if (!status) return "bg-slate-100 text-slate-700 border-slate-200";
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "trial": return "bg-blue-100 text-blue-800 border-blue-200";
      case "past_due": return "bg-amber-100 text-amber-800 border-amber-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      case "expired": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

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
            <Building2 className="h-5 w-5 text-gold-dark" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Hôtels
            </h1>
            <p className="text-sm text-slate">
              Gérez les hôtels de la plateforme.
            </p>
          </div>
        </div>

        {/* Stats badges */}
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {stats.total} total
          </Badge>
          <Badge variant="outline" className="px-3 py-1 border-emerald-200 text-emerald-700 bg-emerald-50">
            {stats.active} actifs
          </Badge>
          <Badge variant="outline" className="px-3 py-1 border-red-200 text-red-700 bg-red-50">
            {stats.suspended} suspendus
          </Badge>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-ivory">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="active">Actifs</TabsTrigger>
            <TabsTrigger value="suspended">Suspendus</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            placeholder="Rechercher un hôtel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-border"
          />
        </div>
      </motion.div>

      {/* Hotel Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : filteredHotels.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucun hôtel trouvé"
          description={
            activeTab === "all"
              ? "Il n'y a aucun hôtel enregistré pour le moment."
              : `Aucun hôtel ${
                  activeTab === "active" ? "actif" : "suspendu"
                } trouvé.`
          }
        />
      ) : (
        <motion.div variants={container} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHotels.map((hotel) => (
            <motion.div key={hotel.id} variants={item}>
              <Card className="group rounded-xl border-border shadow-sm transition-all hover:shadow-md hover:border-gold/30 overflow-hidden">
                {/* Colored top bar */}
                <div className={`h-1.5 ${hotel.is_active ? "bg-emerald-500" : "bg-red-400"}`} />
                <CardContent className="p-5 space-y-4">
                  {/* Name + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-serif font-semibold text-navy truncate group-hover:text-gold-dark transition-colors">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-sm text-slate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {hotel.city}{hotel.country !== hotel.city ? `, ${hotel.country}` : ""}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 ${
                        hotel.is_active
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      }`}
                    >
                      {hotel.is_active ? "Actif" : "Suspendu"}
                    </Badge>
                  </div>

                  {/* Stars */}
                  {hotel.star_rating > 0 && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < hotel.star_rating
                              ? "fill-gold text-gold"
                              : "text-slate/30"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Subscription badge */}
                  {hotel.subscription?.plan_tier && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-slate" />
                      <Badge
                        variant="outline"
                        className={`text-xs ${subscriptionBadgeColor(hotel.subscription.status)}`}
                      >
                        {PLAN_TIER_LABELS[hotel.subscription.plan_tier as PlanTier]}
                        {hotel.subscription.status && (
                          <span className="ml-1">
                            · {SUBSCRIPTION_STATUS_LABELS[hotel.subscription.status]}
                          </span>
                        )}
                      </Badge>
                    </div>
                  )}

                  {/* Admin */}
                  {hotel.admin_name && (
                    <div className="flex items-center gap-2 text-xs text-slate">
                      <Users className="h-3.5 w-3.5" />
                      <span>{hotel.admin_name}</span>
                      {hotel.admin_email && (
                        <span className="text-slate/60">· {hotel.admin_email}</span>
                      )}
                    </div>
                  )}

                  {/* Created date */}
                  <div className="flex items-center gap-2 text-xs text-slate/60">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Créé le {formatDate(hotel.created_at)}</span>
                  </div>

                  {/* Action button */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl border-border hover:bg-ivory hover:border-gold/30"
                  >
                    <Link href={`/dashboard/admin/hotels/${hotel.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir les détails
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
