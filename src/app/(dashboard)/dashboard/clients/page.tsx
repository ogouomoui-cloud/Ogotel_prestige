"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Plus,
  Search,
  X,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Star,
} from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────
interface Guest {
  id: string;
  hotel_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  id_document_type: string | null;
  id_document_number: string | null;
  nationality: string;
  city: string | null;
  notes: string | null;
  is_vip: boolean;
  created_at: string;
  updated_at: string;
}

interface GuestStats {
  total_reservations: number;
  total_spent: number;
  total_nights: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────
function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-purple-100 text-purple-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
    "bg-orange-100 text-orange-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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
export default function ClientsPage() {
  const router = useRouter();
  const [guests, setGuests] = useState<(Guest & { stats?: GuestStats })[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // ─── Filtres ─────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [vipFilter, setVipFilter] = useState<"all" | "vip">("all");

  const hasFilters = search || vipFilter === "vip";

  // ─── Fetch clients ──────────────────────────────────────────────
  const fetchGuests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (search) params.set("search", search);
      if (vipFilter === "vip") params.set("is_vip", "true");

      const res = await fetch(`/api/hotel-admin/clients?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGuests(data.guests ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Impossible de charger les clients.");
    } finally {
      setLoading(false);
    }
  }, [search, vipFilter]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  // ─── Search on submit ───────────────────────────────────────────
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearch("");
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div
        variants={item}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Clients
            </h1>
            <p className="text-sm text-slate">
              Gérez votre base de clients et leurs informations.
            </p>
          </div>
        </div>
        <Button
          asChild
          className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
        >
          <Link href="/dashboard/clients/creer">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Link>
        </Button>
      </motion.div>

      {/* ─── Search & Filters ────────────────────────────────────── */}
      <motion.div variants={item} className="space-y-3">
        <div className="flex gap-2">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <Input
              placeholder="Rechercher par nom, téléphone ou e-mail..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="rounded-xl border-border pl-9 pr-9"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-navy"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* VIP Filter */}
          <Button
            variant="outline"
            onClick={() =>
              setVipFilter(vipFilter === "all" ? "vip" : "all")
            }
            className={`rounded-xl border-border ${
              vipFilter === "vip"
                ? "bg-gold/10 border-gold/30 text-gold-dark hover:bg-gold/20"
                : ""
            }`}
          >
            <Star
              className={`mr-2 h-4 w-4 ${
                vipFilter === "vip" ? "fill-gold text-gold-dark" : ""
              }`}
            />
            {vipFilter === "vip" ? "VIP uniquement" : "Tous"}
          </Button>
        </div>

        {/* Active filters indicator */}
        {hasFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate">Filtres actifs :</span>
            {search && (
              <Badge
                variant="outline"
                className="rounded-lg border-border bg-ivory text-xs"
              >
                &laquo; {search} &raquo;
                <button
                  onClick={handleClearSearch}
                  className="ml-1.5 text-slate hover:text-navy"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {vipFilter === "vip" && (
              <Badge
                variant="outline"
                className="rounded-lg border-gold/30 bg-gold/10 text-xs text-gold-dark"
              >
                <Star className="mr-1 h-3 w-3 fill-gold" />
                VIP
                <button
                  onClick={() => setVipFilter("all")}
                  className="ml-1.5 text-gold-dark hover:text-gold"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </motion.div>

      {/* ─── Client List ─────────────────────────────────────────── */}
      <motion.div variants={item}>
        {guests.length === 0 ? (
          <Card className="rounded-xl border-border shadow-sm overflow-hidden">
            <EmptyState
              icon={Users}
              title={
                hasFilters
                  ? "Aucun résultat"
                  : "Aucun client"
              }
              description={
                hasFilters
                  ? "Essayez de modifier vos critères de recherche."
                  : "Commencez par ajouter votre premier client."
              }
              action={
                !hasFilters
                  ? {
                      label: "Nouveau client",
                      href: "/dashboard/clients/creer",
                    }
                  : undefined
              }
            />
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <Card className="rounded-xl border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-ivory/60">
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Client
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Email
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Ville
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Nationalité
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          VIP
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Statistiques
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate">
                          Date d&apos;ajout
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {guests.map((guest) => (
                        <tr
                          key={guest.id}
                          onClick={() =>
                            router.push(`/dashboard/clients/${guest.id}`)
                          }
                          className="group cursor-pointer transition-colors hover:bg-ivory/30"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${getAvatarColor(
                                  `${guest.first_name} ${guest.last_name}`
                                )}`}
                              >
                                {getInitials(
                                  guest.first_name,
                                  guest.last_name
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-navy">
                                  {guest.first_name} {guest.last_name}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-slate">
                                  <Phone className="h-3 w-3" />
                                  {guest.phone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-sm text-slate">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              {guest.email || (
                                <span className="italic">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-sm text-slate">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {guest.city || (
                                <span className="italic">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm text-slate">
                              {guest.nationality || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {guest.is_vip ? (
                              <Badge
                                variant="outline"
                                className="bg-gold/10 border-gold/30 text-gold-dark"
                              >
                                <Star className="mr-1 h-3 w-3 fill-gold" />
                                VIP
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-navy">
                              {guest.stats?.total_spent
                                ? formatFCFA(guest.stats.total_spent)
                                : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm text-slate">
                              {formatDate(guest.created_at)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/clients/${guest.id}`
                                );
                              }}
                              className="h-8 w-8 p-0 text-slate hover:text-navy hover:bg-navy/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {guests.map((guest) => (
                <ClientCard
                  key={guest.id}
                  guest={guest}
                  onClick={() =>
                    router.push(`/dashboard/clients/${guest.id}`)
                  }
                />
              ))}
            </div>

            {/* Results count */}
            <p className="mt-4 text-center text-xs text-slate">
              {guests.length} client{guests.length > 1 ? "s" : ""} affiché
              {guests.length > 1 ? "s" : ""}
              {total > guests.length && ` sur ${total}`}
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Client Card (mobile) ───────────────────────────────────────────────
function ClientCard({
  guest,
  onClick,
}: {
  guest: Guest;
  onClick: () => void;
}) {
  const fullName = `${guest.first_name} ${guest.last_name}`;

  return (
    <Card
      className="rounded-xl border-border shadow-sm overflow-hidden cursor-pointer transition-colors hover:border-gold/30"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${getAvatarColor(
                fullName
              )}`}
            >
              {getInitials(guest.first_name, guest.last_name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-navy">{fullName}</p>
                {guest.is_vip && (
                  <Badge
                    variant="outline"
                    className="bg-gold/10 border-gold/30 text-gold-dark text-[10px] px-1.5 py-0"
                  >
                    <Star className="mr-0.5 h-2.5 w-2.5 fill-gold" />
                    VIP
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-slate">
                <Phone className="h-3 w-3" />
                {guest.phone}
              </div>
            </div>
          </div>
          <Pencil className="h-4 w-4 text-slate" />
        </div>

        {/* Details */}
        <div className="space-y-1.5">
          {guest.email && (
            <div className="flex items-center gap-1.5 text-xs text-slate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{guest.email}</span>
            </div>
          )}
          {guest.city && (
            <div className="flex items-center gap-1.5 text-xs text-slate">
              <MapPin className="h-3 w-3 shrink-0" />
              {guest.city}, {guest.nationality}
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-slate">
            {formatDate(guest.created_at)}
          </span>
          {guest.stats?.total_spent ? (
            <span className="text-xs font-semibold text-navy">
              {formatFCFA(guest.stats.total_spent)}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
