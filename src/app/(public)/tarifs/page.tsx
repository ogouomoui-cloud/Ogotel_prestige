import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionTitle from "@/components/shared/SectionTitle";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export default function TarifsPage() {
  return (
    <section className="bg-ivory py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          label="TARIFS"
          title="Des formules adaptées à votre établissement"
          description="Choisissez le plan qui correspond à la taille de votre hôtel. Sans engagement, sans frais cachés."
        />

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border p-8 flex flex-col ${
                plan.popular
                  ? "border-gold ring-2 ring-gold/20 relative"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Le plus populaire
                </span>
              )}

              <h3 className="text-navy text-xl font-serif font-medium">
                {plan.name}
              </h3>

              <div className="mt-4 mb-6">
                <span className="text-navy text-4xl font-bold">
                  {plan.price.toLocaleString("fr-FR")} FCFA
                </span>
                <span className="text-slate text-sm ml-1">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    <span className="text-slate text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`mt-8 rounded-full px-6 py-2.5 font-semibold w-full ${
                  plan.popular
                    ? "bg-gold text-white hover:bg-gold-light"
                    : "bg-navy text-ivory hover:bg-navy-light"
                }`}
              >
                <Link href="/#tarifs">
                  {`Choisir ${plan.name}`}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="text-sm text-slate text-center mt-8">
          Tous les prix sont en FCFA. Paiement par Wave, Orange Money, espèces ou virement bancaire.
        </p>
      </div>
    </section>
  );
}
