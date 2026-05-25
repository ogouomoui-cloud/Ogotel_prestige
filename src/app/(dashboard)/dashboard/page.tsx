"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  BedDouble,
  Receipt,
  BarChart3,
  Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Données factices ──────────────────────────────────────────────────

const stats = [
  {
    title: "Réservations",
    value: "24",
    icon: CalendarCheck,
    trend: { value: "+12%", positive: true },
  },
  {
    title: "Chambres occupées",
    value: "34/45",
    icon: BedDouble,
    trend: { value: "75%", positive: true },
  },
  {
    title: "Revenus du mois",
    value: "4.5M FCFA",
    icon: Receipt,
    trend: { value: "+8%", positive: true },
  },
  {
    title: "Taux d'occupation",
    value: "78%",
    icon: BarChart3,
    trend: { value: "-3%", positive: false },
  },
] as const;

type StatusKey = "en_cours" | "confirmee" | "terminee" | "annulee";

interface Reservation {
  client: string;
  chambre: string;
  arrivee: string;
  depart: string;
  statut: StatusKey;
  statutLabel: string;
  montant: string;
}

const reservations: Reservation[] = [
  {
    client: "Amadou Koné",
    chambre: "Suite 101",
    arrivee: "15 Jan",
    depart: "18 Jan",
    statut: "en_cours",
    statutLabel: "En cours",
    montant: "225 000 FCFA",
  },
  {
    client: "Marie Dupont",
    chambre: "Deluxe 205",
    arrivee: "16 Jan",
    depart: "19 Jan",
    statut: "confirmee",
    statutLabel: "Confirmée",
    montant: "180 000 FCFA",
  },
  {
    client: "Jean-Marc Brou",
    chambre: "Standard 302",
    arrivee: "17 Jan",
    depart: "18 Jan",
    statut: "terminee",
    statutLabel: "Terminée",
    montant: "60 000 FCFA",
  },
  {
    client: "Fatou Diallo",
    chambre: "Suite 101",
    arrivee: "20 Jan",
    depart: "23 Jan",
    statut: "confirmee",
    statutLabel: "Confirmée",
    montant: "225 000 FCFA",
  },
  {
    client: "Olivier Assemian",
    chambre: "Deluxe 207",
    arrivee: "20 Jan",
    depart: "22 Jan",
    statut: "annulee",
    statutLabel: "Annulée",
    montant: "0 FCFA",
  },
];

const statusStyles: Record<StatusKey, string> = {
  en_cours: "bg-emerald-100 text-emerald-700",
  confirmee: "bg-[#c8a97e]/15 text-gold-dark",
  terminee: "bg-gray-100 text-gray-600",
  annulee: "bg-red-100 text-red-700",
};

const roomTypes = [
  { name: "Suites", current: 8, total: 10 },
  { name: "Deluxe", current: 15, total: 20 },
  { name: "Standard", current: 11, total: 15 },
] as const;

// ─── Composant ─────────────────────────────────────────────────────────

interface ProfileData {
  full_name: string;
  role: string;
  hotel_name?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CalendarCheck,
  BedDouble,
  Receipt,
  BarChart3,
};

export default function DashboardPage() {
  const router = useRouter();
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/connexion'); return; }
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role, hotels(name)')
          .eq('id', user.id)
          .single();
        if (data) setProfile({ full_name: data.full_name, role: data.role, hotel_name: (data as any).hotels?.name });
      } catch {
        // keep null profile
      }
    }
    loadProfile();
  }, [router]);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/connexion');
            return;
          }
          throw new Error('Erreur');
        }
        const data = await res.json();
        setStatsData(data);
      } catch {
        // Keep showing fake data as fallback
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [router]);

  // Resolve stats — use real data or fallback
  const displayStats = statsData?.stats?.map((s: any) => ({
    ...s,
    icon: ICON_MAP[s.icon] || CalendarCheck,
  })) || stats.map((s) => ({ ...s }));

  const displayReservations = statsData?.reservations || reservations;
  const displayRoomTypes = statsData?.roomTypes || roomTypes;
  const totalOccupied = statsData?.totalOccupied ?? 34;
  const totalRooms = statsData?.totalRooms ?? 45;

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate">
            Bienvenue, {profile?.full_name || ''} ! Voici un aperçu de votre activité.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate sm:inline">
            {formattedDate}
          </span>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white">
              3
            </span>
          </Button>
        </div>
      </div>

      {/* ─── Stats ─── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {displayStats.map((stat: any) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      )}

      {/* ─── Contenu principal ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── Réservations récentes ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="col-span-full rounded-xl border border-border bg-white p-6 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">
              Réservations récentes
            </h2>
            <Link
              href="#"
              className="text-sm font-medium text-gold hover:text-gold-dark transition-colors"
            >
              Voir tout
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-slate">Client</TableHead>
                  <TableHead className="text-slate">Chambre</TableHead>
                  <TableHead className="text-slate">Arrivée</TableHead>
                  <TableHead className="text-slate">Départ</TableHead>
                  <TableHead className="text-slate">Statut</TableHead>
                  <TableHead className="text-right text-slate">
                    Montant
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayReservations.map((r: any, i: number) => (
                  <TableRow key={r.id || i}>
                    <TableCell className="font-medium text-navy">
                      {r.client}
                    </TableCell>
                    <TableCell className="text-slate">{r.chambre}</TableCell>
                    <TableCell className="text-slate">{r.arrivee}</TableCell>
                    <TableCell className="text-slate">{r.depart}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[r.statut as StatusKey]}`}
                      >
                        {r.statutLabel}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-navy">
                      {r.montant}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* ─── Chambres ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-navy">Chambres</h2>
          <p className="mt-1 text-sm text-slate">
            Occupation par catégorie
          </p>

          <div className="mt-6 space-y-5">
            {displayRoomTypes.map((room: any) => {
              const percentage = (room.current / room.total) * 100;
              return (
                <div key={room.name}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-navy">
                      {room.name}
                    </span>
                    <span className="text-sm text-slate">
                      {room.current}/{room.total}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gold/15">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg bg-ivory p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate">Total occupées</span>
              <span className="text-lg font-semibold text-navy">{totalOccupied}/{totalRooms}</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gold/15">
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{ width: `${totalRooms > 0 ? (totalOccupied / totalRooms) * 100 : 0}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
