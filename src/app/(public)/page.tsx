"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import SectionTitle from "@/components/shared/SectionTitle";
import {
  CalendarCheck,
  BedDouble,
  Receipt,
  Users,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Eye,
  MessageSquare,
  CheckCircle2,
  Star,
  Phone,
  MessageCircle,
  Check,
  Zap,
  Lock,
  Headphones,
  CreditCard,
  ArrowRight,
  UserCheck,
  Send,
  MailCheck,
  Rocket,
  Search,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const WHATSAPP_URL =
  "https://wa.me/2250102030405?text=Bonjour%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20OGOTEL%20Prestige";

/* ─── Animation variants ─────────────────────────────────────────────────── */
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

/* ─── Data : Problèmes ──────────────────────────────────────────────────── */
interface ProblemItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PROBLEMS: ProblemItem[] = [
  {
    icon: Search,
    title: "Des réservations qui se perdent",
    description:
      "Les appels téléphoniques et messages WhatsApp finissent souvent par se perdre. Des clients potentiels se tournent vers la concurrence sans que vous le sachiez.",
  },
  {
    icon: FileText,
    title: "Une facturation chronophage",
    description:
      "Des factures rédigées à la main, des erreurs de calcul fréquentes, aucun suivi des paiements en attente. Le temps perdu est considérable.",
  },
  {
    icon: Eye,
    title: "Zéro visibilité en temps réel",
    description:
      "Combien de chambres sont disponibles ? Quel est le taux d'occupation du mois ? Impossible de répondre rapidement sans ouvrir plusieurs fichiers Excel.",
  },
  {
    icon: MessageSquare,
    title: "Une équipe désynchronisée",
    description:
      "Le réceptionniste du matin ne sait pas ce que celui du soir a fait. Les managers manquent d'outils pour superviser efficacement leur équipe.",
  },
];

/* ─── Data : Fonctionnalités ────────────────────────────────────────────── */
interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: CalendarCheck,
    title: "Gestion des réservations",
    description:
      "Planifiez, modifiez et suivez toutes vos réservations en temps réel. Calendrier interactif et alertes automatiques.",
  },
  {
    icon: BedDouble,
    title: "Gestion des chambres",
    description:
      "Organisez vos chambres par type, étage et statut. Vue grille ou liste, avec photos et équipements détaillés.",
  },
  {
    icon: Receipt,
    title: "Facturation professionnelle",
    description:
      "Générez des factures en un clic. Suivi des paiements, reçus automatiques et rapports financiers en FCFA.",
  },
  {
    icon: Users,
    title: "Fiches clients complètes",
    description:
      "Historique des séjours, préférences, documents d'identité. Tout est centralisé pour un service personnalisé.",
  },
  {
    icon: BarChart3,
    title: "Tableaux de bord analytiques",
    description:
      "Taux d'occupation, revenus mensuels, check-ins du jour. Prenez les bonnes décisions grâce à des données claires.",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité et confidentialité",
    description:
      "Hébergement sécurisé, isolation multi-tenant, sauvegarde automatique. Vos données restent protégées.",
  },
  {
    icon: UserCheck,
    title: "Gestion des rôles",
    description:
      "Définissez les accès pour chaque membre de votre équipe : réceptionniste, manager, administrateur.",
  },
  {
    icon: Headphones,
    title: "Support réactif",
    description:
      "Une équipe locale à votre écoute. Assistance par WhatsApp, e-mail et téléphone, du lundi au samedi.",
  },
];

/* ─── Data : Comment ça marche ──────────────────────────────────────────── */
interface StepItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: StepItem[] = [
  {
    icon: CreditCard,
    title: "Choisissez votre abonnement",
    description:
      "Parcourez nos 3 formules et sélectionnez celle qui correspond à la taille de votre établissement.",
  },
  {
    icon: FileText,
    title: "Remplissez le formulaire",
    description:
      "Donnez-nous les informations sur votre hôtel : nom, contact, plan souhaité. Simple et rapide.",
  },
  {
    icon: Phone,
    title: "Effectuez le paiement",
    description:
      "Payez par espèces, Wave, Orange Money ou virement bancaire. Pas de carte bancaire nécessaire.",
  },
  {
    icon: CheckCircle2,
    title: "Validation par notre équipe",
    description:
      "Notre équipe vérifie votre dossier et active votre compte sous 24 heures ouvrables.",
  },
  {
    icon: MailCheck,
    title: "Recevez votre code d'activation",
    description:
      "Un code unique et sécurisé est envoyé par e-mail et WhatsApp pour activer votre compte propriétaire.",
  },
  {
    icon: Rocket,
    title: "Configurez et commencez",
    description:
      "Utilisez le code pour créer votre compte, ajoutez vos chambres et commencez à gérer votre hôtel.",
  },
];

/* ─── Data : Plans tarifaires ───────────────────────────────────────────── */
interface PlanItem {
  name: string;
  tier: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  excluded?: string[];
  popular: boolean;
  cta: string;
}

const PLANS: PlanItem[] = [
  {
    name: "Essentiel",
    tier: "essentiel",
    price: 0,
    period: "",
    description: "Idéal pour démarrer avec les fonctionnalités essentielles.",
    features: [
      "Gestion des réservations",
      "Gestion des chambres",
      "Facturation basique",
      "Jusqu'à 15 chambres",
      "3 utilisateurs",
      "Support par e-mail",
    ],
    popular: false,
    cta: "Commencer gratuitement",
  },
  {
    name: "Pro",
    tier: "pro",
    price: 50000,
    period: "/mois",
    description: "Pour les hôtels en croissance qui ont besoin de plus.",
    features: [
      "Tout le plan Essentiel, plus :",
      "Jusqu'à 50 chambres",
      "10 utilisateurs",
      "Tableau de bord analytique",
      "Facturation avancée",
      "Export PDF des rapports",
      "Support prioritaire WhatsApp",
    ],
    popular: true,
    cta: "Choisir Pro",
  },
  {
    name: "Prestige",
    tier: "prestige",
    price: 150000,
    period: "/mois",
    description: "La solution complète pour les hôtels haut de gamme.",
    features: [
      "Tout le plan Pro, plus :",
      "Chambres illimitées",
      "Utilisateurs illimités",
      "Multi-hôtels",
      "API & intégrations",
      "Manager de compte dédié",
      "Formation personnalisée",
      "Support 24/7",
    ],
    popular: false,
    cta: "Choisir Prestige",
  },
];

/* ─── Data : Témoignages ────────────────────────────────────────────────── */
interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  hotel: string;
  initials: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      "Depuis que nous utilisons OGOTEL Prestige, nos réservations n'ont jamais été aussi bien gérées. L'interface est intuitive et le support est toujours réactif. Un vrai gain de temps au quotidien.",
    name: "Aminata Koné",
    role: "Directrice",
    hotel: "Hôtel Le Palmier, Cocody",
    initials: "AK",
  },
  {
    quote:
      "Le gain de temps est considérable. Avant, nous utilisions des fichiers Excel et des cahiers. Maintenant, tout est centralisé et accessible en temps réel. Même mon staff non technique l'adopte facilement.",
    name: "Jean-Marc Brou",
    role: "Gérant",
    hotel: "Résidence Plateau, Abidjan",
    initials: "JB",
  },
  {
    quote:
      "La facturation automatique et le suivi des paiements nous ont permis de réduire les erreurs de 90%. L'investissement est rentabilisé dès le premier mois. Je recommande OGOTEL à tous mes confrères.",
    name: "Mariam Touré",
    role: "Propriétaire",
    hotel: "Hôtel du Parc, Yamoussoukro",
    initials: "MT",
  },
];

/* ─── Data : FAQ ───────────────────────────────────────────────────────── */
interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "Qu'est-ce que OGOTEL Prestige ?",
    answer:
      "OGOTEL Prestige est une application de gestion hôtelière 100% en ligne, conçue spécifiquement pour les hôtels de Côte d'Ivoire. Elle vous permet de gérer vos réservations, vos chambres, votre facturation et votre équipe depuis un seul endroit, accessible sur ordinateur, tablette et téléphone.",
  },
  {
    question: "Comment fonctionne le système d'abonnement ?",
    answer:
      "Nous proposons 3 formules : Essentiel (gratuit), Pro et Prestige. Vous choisissez votre plan, remplissez un formulaire de demande, effectuez le paiement manuellement, puis notre équipe valide votre dossier et vous envoie un code d'activation pour créer votre compte.",
  },
  {
    question: "Le paiement se fait-il en ligne ?",
    answer:
      "Non, nous n'exigeons pas de paiement en ligne. Vous pouvez payer par espèces, Wave, Orange Money ou virement bancaire. Nous comprenons les réalités du terrain et avons simplifié ce processus pour votre confort.",
  },
  {
    question: "Combien de temps prend la mise en place ?",
    answer:
      "Après validation de votre demande, vous recevez votre code d'activation sous 24 heures. La configuration initiale de votre hôtel (chambres, utilisateurs) prend environ 30 minutes. Notre équipe vous accompagne si besoin.",
  },
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer:
      "Oui, vous pouvez passer à un plan supérieur à tout moment. La mise à niveau est effective immédiatement. Pour passer à un plan inférieur, contactez notre équipe et nous ajusterons votre abonnement.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Vos données sont hébergées de manière sécurisée avec un chiffrement de bout en bout. Chaque hôtel est isolé (multi-tenant) : personne d'autre que votre équipe ne peut accéder à vos données. Des sauvegardes automatiques sont effectuées quotidiennement.",
  },
  {
    question: "Y a-t-il un support technique ?",
    answer:
      "Oui, notre équipe locale est disponible du lundi au samedi. Le support est accessible par WhatsApp, e-mail et téléphone. Les clients Pro et Prestige bénéficient d'un support prioritaire avec un temps de réponse garanti.",
  },
  {
    question: "Puis-je essayer avant de m'abonner ?",
    answer:
      "Oui ! Le plan Essentiel est entièrement gratuit et vous permet de découvrir les fonctionnalités de base. Vous pouvez aussi demander une démonstration personnalisée avec notre équipe pour voir OGOTEL Prestige en action.",
  },
];

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function formatPrice(amount: number, period?: string) {
  if (amount === 0) return "Gratuit";
  const formatted = new Intl.NumberFormat("fr-FR").format(amount);
  return `${formatted} FCFA${period ? period : "/mois"}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function HomePage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          1. HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section
        id="accueil"
        className="relative bg-navy min-h-screen flex items-center overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-1/3 -right-48 w-[600px] h-[600px] rounded-full bg-gold opacity-[0.06] blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(200,169,126,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,126,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
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
                className="inline-flex items-center gap-2 bg-white/10 border border-white/10 text-ivory text-xs px-4 py-2 rounded-full"
              >
                <span className="text-sm">🇨🇮</span>
                Conçu pour la Côte d&apos;Ivoire
              </motion.span>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-ivory text-4xl sm:text-5xl lg:text-6xl font-serif font-medium leading-[1.1] mt-8"
              >
                La gestion hôtelière,{" "}
                <span className="text-gold">réinventée</span> pour votre
                succès.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-ivory/60 text-lg sm:text-xl mt-6 max-w-lg leading-relaxed"
              >
                Réservations, facturation, chambres, personnel — tout en un
                seul endroit. OGOTEL Prestige simplifie le quotidien de votre
                établissement.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-wrap gap-3 mt-8"
              >
                <Button
                  asChild
                  className="bg-gold text-white hover:bg-gold-light rounded-full px-7 py-3 font-semibold text-base shadow-lg shadow-gold/20 transition-all hover:shadow-gold/30"
                >
                  <Link href="/contact">
                    Demander un abonnement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 text-ivory hover:bg-white/10 hover:text-ivory rounded-full px-7 py-3"
                >
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={4}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 text-ivory/40 text-sm"
              >
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-gold" /> Essai gratuit
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-gold" /> Sans engagement
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-gold" /> Support local
                </span>
              </motion.div>
            </motion.div>

            {/* Right column — Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="relative z-10 hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20"
              >
                <div className="flex items-center justify-between mb-5">
                  <p className="text-ivory/40 text-xs font-semibold tracking-wider uppercase">
                    Tableau de bord
                  </p>
                  <span className="text-ivory/20 text-xs">Aujourd&apos;hui</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "12", label: "Réservations", color: "text-gold" },
                    {
                      value: "34",
                      label: "Chambres dispo.",
                      color: "text-emerald-400",
                    },
                    {
                      value: "4,5 M",
                      label: "Revenus (FCFA)",
                      color: "text-gold",
                    },
                    { value: "78%", label: "Occupation", color: "text-gold" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.04]"
                    >
                      <p className={`text-xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className="text-ivory/40 text-xs mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {/* Mini chart placeholder */}
                <div className="mt-4 bg-white/[0.04] rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-ivory/30 text-xs mb-3">
                    Réservations cette semaine
                  </p>
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gold/30 rounded-t-sm first:rounded-l-md last:rounded-r-md"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          2. PROBLÈMES
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-ivory py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            label="CONSTATS"
            title="Votre hôtel mérite mieux que le chaos"
            description="Ces problèmes vous sont familiers ? Vous n'êtes pas seul. Des centaines d'hôtels en Côte d'Ivoire font face aux mêmes défis chaque jour."
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-6"
          >
            {PROBLEMS.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="bg-white rounded-xl border border-border p-6 hover:shadow-lg hover:border-red-200 transition-all group"
              >
                <div className="bg-red-50 rounded-lg p-2.5 w-fit mb-4 text-red-500 group-hover:bg-red-100 transition-colors">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-navy font-semibold text-lg">
                  {item.title}
                </h3>
                <p className="text-slate text-sm mt-2 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. FONCTIONNALITÉS
          ═══════════════════════════════════════════════════════════════ */}
      <section id="fonctionnalites" className="scroll-mt-20 bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            label="FONCTIONNALITÉS"
            title="Tout ce dont votre hôtel a besoin"
            description="Des outils puissants, pensés spécifiquement pour l'industrie hôtelière ivoirienne."
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {FEATURES.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="bg-ivory rounded-xl border border-border p-6 hover:shadow-lg hover:border-gold/30 transition-all group"
              >
                <div className="bg-gold/10 rounded-lg p-2.5 w-fit mb-4 text-gold group-hover:bg-gold/20 transition-colors">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-navy font-semibold text-base">
                  {item.title}
                </h3>
                <p className="text-slate text-sm mt-2 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          4. COMMENT ÇA MARCHE
          ═══════════════════════════════════════════════════════════════ */}
      <section
        id="comment-ca-marche"
        className="scroll-mt-20 bg-navy py-20 md:py-28 relative overflow-hidden"
      >
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-4">
              PROCESSUS SIMPLE
            </span>
            <h2 className="text-ivory text-3xl md:text-4xl font-serif font-medium leading-tight">
              Comment ça marche ?
            </h2>
            <p className="text-ivory/50 text-base mt-4 max-w-2xl mx-auto leading-relaxed">
              De la demande à la mise en service, voici les étapes pour
              démarrer avec OGOTEL Prestige. Simple, rapide et sans
              complication.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                className="relative bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/[0.09] transition-all group"
              >
                {/* Step number */}
                <span className="absolute -top-3 -left-3 bg-gold text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg shadow-gold/30">
                  {idx + 1}
                </span>

                <div className="bg-gold/10 rounded-lg p-2.5 w-fit mb-4 text-gold group-hover:bg-gold/20 transition-colors">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="text-ivory font-semibold text-base">
                  {step.title}
                </h3>
                <p className="text-ivory/50 text-sm mt-2 leading-relaxed">
                  {step.description}
                </p>

                {/* Connector arrow (hidden on last item and on mobile) */}
                {idx < STEPS.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-ivory/20 h-5 w-5 z-20" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. TARIFS
          ═══════════════════════════════════════════════════════════════ */}
      <section id="tarifs" className="scroll-mt-20 bg-ivory py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            label="TARIFS"
            title="Choisissez la formule qui vous convient"
            description="Des prix transparents, sans frais cachés. Commencez gratuitement et évoluez à votre rythme."
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start"
          >
            {PLANS.map((plan) => (
              <motion.div
                key={plan.tier}
                variants={fadeUp}
                className={`relative rounded-2xl p-8 transition-all hover:shadow-xl ${
                  plan.popular
                    ? "bg-navy text-ivory border-2 border-gold shadow-lg shadow-gold/10 scale-[1.02] lg:scale-105"
                    : "bg-white border border-border hover:border-gold/30"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-xs px-4 py-1 rounded-full font-semibold border-0">
                    Le plus populaire
                  </Badge>
                )}

                <div className="mb-6">
                  <h3
                    className={`text-xl font-serif font-semibold ${
                      plan.popular ? "text-gold" : "text-navy"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      plan.popular ? "text-ivory/50" : "text-slate"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span
                    className={`text-3xl font-bold ${
                      plan.popular ? "text-ivory" : "text-navy"
                    }`}
                  >
                    {plan.price === 0 ? "Gratuit" : ""}
                  </span>
                  {plan.price > 0 && (
                    <>
                      <span
                        className={`text-3xl font-bold ${
                          plan.popular ? "text-ivory" : "text-navy"
                        }`}
                      >
                        {new Intl.NumberFormat("fr-FR").format(plan.price)}{" "}
                        FCFA
                      </span>
                      <span
                        className={`text-sm ${
                          plan.popular ? "text-ivory/50" : "text-slate"
                        }`}
                      >
                        {plan.period}
                      </span>
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-start gap-2 text-sm ${
                        plan.popular ? "text-ivory/80" : "text-slate"
                      }`}
                    >
                      <Check
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          plan.popular ? "text-gold" : "text-emerald-500"
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full rounded-full py-3 font-semibold transition-all ${
                    plan.popular
                      ? "bg-gold text-white hover:bg-gold-light shadow-lg shadow-gold/20"
                      : "bg-navy text-ivory hover:bg-navy-light"
                  }`}
                >
                  <Link href="/contact">{plan.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          6. TÉMOIGNAGES
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            label="TÉMOIGNAGES"
            title="Ils nous font confiance"
            description="Découvrez ce que les professionnels de l'hôtellerie en Côte d'Ivoire disent d'OGOTEL Prestige."
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((item) => (
              <motion.div
                key={item.name}
                variants={fadeUp}
                className="bg-ivory rounded-xl border border-border p-6 hover:shadow-lg hover:border-gold/20 transition-all flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-gold text-gold"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate text-sm leading-relaxed flex-1">
                  &ldquo;{item.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-gold text-xs font-bold">
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-navy font-semibold text-sm">
                      {item.name}
                    </p>
                    <p className="text-slate text-xs">
                      {item.role} — {item.hotel}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          7. FAQ
          ═══════════════════════════════════════════════════════════════ */}
      <section id="faq" className="scroll-mt-20 bg-ivory py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            label="FAQ"
            title="Questions fréquentes"
            description="Vous avez des questions ? Nous avons les réponses."
          />

          <Accordion type="single" collapsible className="w-full">
            {FAQ_DATA.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="bg-white rounded-xl border border-border mb-3 px-6 data-[state=open]:shadow-sm data-[state=open]:border-gold/30 transition-all"
              >
                <AccordionTrigger className="text-navy font-semibold text-sm hover:text-navy hover:no-underline py-5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate text-sm leading-relaxed pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-10">
            <p className="text-slate text-sm">
              Vous avez d&apos;autres questions ?{" "}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold font-semibold hover:underline"
              >
                Contactez-nous sur WhatsApp
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          8. CTA FINAL
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-navy py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-gold opacity-[0.05] blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold text-xs px-4 py-2 rounded-full mb-8"
            >
              <Zap className="h-3.5 w-3.5" />
              Commencez dès aujourd&apos;hui
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-ivory text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-tight"
            >
              Prêt à transformer{" "}
              <span className="text-gold">votre gestion</span>{" "}
              hôtelière ?
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-ivory/50 text-lg mt-6 max-w-2xl mx-auto leading-relaxed"
            >
              Rejoignez les hôtels qui ont choisi OGOTEL Prestige pour
              simplifier leur quotidien et améliorer leur rentabilité.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center mt-10"
            >
              <Button
                asChild
                size="lg"
                className="bg-gold text-white hover:bg-gold-light rounded-full px-8 py-3.5 font-semibold text-base shadow-lg shadow-gold/20"
              >
                <Link href="/contact">
                  Demander un abonnement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 text-ivory hover:bg-white/10 hover:text-ivory rounded-full px-8 py-3.5"
              >
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Nous contacter sur WhatsApp
                </a>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={4}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-ivory/30 text-xs"
            >
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Données sécurisées
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Support local
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Sans engagement
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FLOATING WHATSAPP BUTTON
          ═══════════════════════════════════════════════════════════════ */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter OGOTEL Prestige sur WhatsApp"
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </>
  );
}
