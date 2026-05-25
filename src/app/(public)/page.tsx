"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SectionTitle from "@/components/shared/SectionTitle";
import {
  CalendarCheck,
  BedDouble,
  Receipt,
  Users,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

/* ─── Animation variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── Features data ─────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Gestion des réservations",
    description:
      "Planifiez, modifiez et suivez toutes vos réservations en temps réel.",
  },
  {
    icon: BedDouble,
    title: "Gestion des chambres",
    description:
      "Organisez vos chambres par type, étage et statut avec une vue claire.",
  },
  {
    icon: Receipt,
    title: "Facturation automatique",
    description:
      "Générez des factures professionnelles en un clic. Devise : FCFA.",
  },
  {
    icon: Users,
    title: "Suivi du personnel",
    description:
      "Gérez les accès et les rôles de votre équipe. Réceptionnistes, managers, admins.",
  },
  {
    icon: BarChart3,
    title: "Statistiques avancées",
    description:
      "Tableaux de bord et rapports détaillés pour prendre les bonnes décisions.",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité des données",
    description:
      "Hébergement sécurisé. Vos données restent confidentielles et protégées.",
  },
];

/* ─── Dashboard mini-stats ───────────────────────────────────────── */
const DASHBOARD_STATS = [
  { label: "Réservations aujourd'hui", value: "12" },
  { label: "Chambres disponibles", value: "34" },
  { label: "Revenus du mois", value: "4 500 000 FCFA" },
  { label: "Taux d'occupation", value: "78%" },
];

/* ─── Page ───────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      {/* ═══════ HERO ═══════ */}
      <section className="bg-navy min-h-[85vh] flex items-center relative overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute top-1/2 -right-40 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.07] blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="relative z-10"
            >
              <motion.span
                variants={fadeUp}
                custom={0}
                className="inline-block bg-white/10 text-ivory text-xs px-3 py-1.5 rounded-full"
              >
                🇨🇮 Conçu pour la Côte d&apos;Ivoire
              </motion.span>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-ivory text-4xl md:text-5xl lg:text-6xl font-serif font-medium leading-[1.1] mt-6"
              >
                La gestion hôtelière
                <br />
                réinventée.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-ivory/60 text-lg mt-6 max-w-lg leading-relaxed"
              >
                Réservations, facturation, personnel — tout en un seul endroit.
                OGOTEL Prestige simplifie le quotidien de votre établissement.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-wrap gap-3 mt-8"
              >
                <Button className="bg-gold text-white hover:bg-gold-light rounded-full px-8 py-3 font-semibold text-base">
                  <Link href="/connexion">Commencer gratuitement</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-ivory/30 text-ivory hover:bg-white/10 rounded-full px-8 py-3"
                  asChild
                >
                  <Link href="/tarifs">Voir les tarifs</Link>
                </Button>
              </motion.div>

              <motion.p
                variants={fadeUp}
                custom={4}
                className="text-ivory/40 text-sm mt-8"
              >
                ✓ Essai gratuit 14 jours · ✓ Sans carte bancaire · ✓ Support en
                français
              </motion.p>
            </motion.div>

            {/* Right column — Dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="relative z-10 hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6"
              >
                <p className="text-ivory/40 text-xs font-semibold tracking-wider uppercase mb-4">
                  Tableau de bord
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {DASHBOARD_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white/5 rounded-xl p-4"
                    >
                      <p className="text-gold text-xl font-bold">{stat.value}</p>
                      <p className="text-ivory/50 text-xs mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section className="bg-ivory py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            label="FONCTIONNALITÉS"
            title="Tout ce dont vous avez besoin"
            description="Des outils puissants conçus spécifiquement pour l'industrie hôtelière ivoirienne."
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="bg-white rounded-xl border border-border p-6 hover:shadow-lg hover:border-gold/30 transition-all group"
              >
                <div className="bg-ivory rounded-lg p-2.5 w-fit mb-4 text-gold group-hover:bg-gold/10 transition-colors">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-navy font-semibold text-lg">
                  {feature.title}
                </h3>
                <p className="text-slate text-sm mt-2 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="bg-navy py-20 relative overflow-hidden">
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full bg-gold opacity-[0.05] blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-ivory text-3xl md:text-4xl font-serif"
            >
              Prêt à transformer votre gestion hôtelière ?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-ivory/60 mt-4 max-w-lg mx-auto"
            >
              Rejoignez les hôtels qui font confiance à OGOTEL Prestige.
            </motion.p>
            <motion.div
              variants={fadeUp}
              custom={2}
              className="flex flex-wrap gap-3 justify-center mt-8"
            >
              <Button className="bg-gold text-white hover:bg-gold-light rounded-full px-8 py-3 font-semibold">
                Demander un essai
              </Button>
              <Button
                variant="outline"
                className="border-ivory/30 text-ivory hover:bg-white/10 rounded-full px-8 py-3"
                asChild
              >
                <Link href="/contact">Nous contacter</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
