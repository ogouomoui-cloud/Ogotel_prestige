import Link from "next/link";
import { SITE, SOCIALS, PUBLIC_NAV } from "@/lib/constants";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy text-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-gold text-2xl font-serif font-bold tracking-tight">
                OGOTEL
              </span>
              <span className="text-ivory/50 text-sm font-light ml-2">
                Prestige
              </span>
            </Link>
            <p className="text-ivory/50 text-sm mt-4 leading-relaxed max-w-xs">
              La solution de gestion hôtelière tout-en-un conçue pour les hôtels
              de la Côte d&apos;Ivoire.
            </p>
            {/* Social */}
            <div className="flex gap-3 mt-6">
              {Object.entries(SOCIALS).map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-ivory/50 hover:text-gold hover:border-gold/30 transition-all text-xs font-bold uppercase"
                >
                  {name[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-ivory text-sm font-semibold mb-4">Navigation</h4>
            <ul className="space-y-3">
              {PUBLIC_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-ivory/50 hover:text-gold text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-ivory text-sm font-semibold mb-4">Produit</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/tarifs"
                  className="text-ivory/50 hover:text-gold text-sm transition-colors"
                >
                  Tarifs
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-ivory/50 hover:text-gold text-sm transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <span className="text-ivory/50 text-sm">
                  Conditions d&apos;utilisation
                </span>
              </li>
              <li>
                <span className="text-ivory/50 text-sm">
                  Politique de confidentialité
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-ivory text-sm font-semibold mb-4">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-ivory/50 hover:text-gold text-sm transition-colors"
                >
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                <a
                  href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                  className="text-ivory/50 hover:text-gold text-sm transition-colors"
                >
                  {SITE.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                <span className="text-ivory/50 text-sm">{SITE.address}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-ivory/30 text-xs">
            &copy; {new Date().getFullYear()} OGOTEL Prestige. Tous droits réservés.
          </p>
          <p className="text-ivory/30 text-xs">
            Fait avec ❤️ en Côte d&apos;Ivoire
          </p>
        </div>
      </div>
    </footer>
  );
}
