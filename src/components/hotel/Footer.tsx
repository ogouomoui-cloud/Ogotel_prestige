'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const exploreLinks = [
  { label: 'Our Story', href: '#story' },
  { label: 'Suites & Rooms', href: '#suites' },
  { label: 'Dining', href: '#dining' },
  { label: 'Spa & Wellness', href: '#spa' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Offers', href: '#offers' },
]

const serviceLinks = [
  { label: 'Airport Transfer', href: '#airport-transfer' },
  { label: 'Private Dining', href: '#private-dining' },
  { label: 'Event Planning', href: '#event-planning' },
  { label: 'Yacht Charter', href: '#yacht-charter' },
  { label: 'Personal Shopper', href: '#personal-shopper' },
  { label: 'Kids Club', href: '#kids-club' },
]

const footerLinks = [
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms of Service', href: '#terms' },
  { label: 'Cookie Policy', href: '#cookies' },
]

export default function Footer() {
  const [email, setEmail] = useState('')

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Newsletter subscription:', email)
    setEmail('')
  }

  return (
    <footer className="bg-deep-black border-t border-white/5 mt-auto">
      {/* Top Section */}
      <div className="pt-16 pb-8 px-4 md:px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10"
        >
          {/* Column 1 — Brand */}
          <div>
            <span className="font-[family-name:var(--font-playfair)] text-gold text-2xl font-medium">
              OGOTEL
            </span>
            <span className="block text-warm-white/40 text-xs uppercase tracking-[0.3em] mt-0.5">
              Prestige
            </span>
            <p className="text-warm-white/50 text-sm mt-4 leading-relaxed">
              Where every moment is curated for the extraordinary.
            </p>
          </div>

          {/* Column 2 — Explore */}
          <div>
            <h3 className="text-warm-white text-sm font-semibold uppercase tracking-wider mb-4">
              Explore
            </h3>
            <nav aria-label="Explore links">
              <ul className="flex flex-col">
                {exploreLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-warm-white/50 hover:text-gold transition text-sm block py-1.5"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 3 — Services */}
          <div>
            <h3 className="text-warm-white text-sm font-semibold uppercase tracking-wider mb-4">
              Services
            </h3>
            <nav aria-label="Service links">
              <ul className="flex flex-col">
                {serviceLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-warm-white/50 hover:text-gold transition text-sm block py-1.5"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 4 — Newsletter */}
          <div>
            <h3 className="text-warm-white text-sm font-semibold uppercase tracking-wider mb-4">
              Stay Updated
            </h3>
            <p className="text-warm-white/50 text-sm mb-4">
              Subscribe for exclusive offers and updates
            </p>
            <form onSubmit={handleSubscribe} className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                aria-label="Email for newsletter"
                required
                className="flex-1 min-w-0 bg-charcoal border border-white/10 text-warm-white rounded-l-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition placeholder:text-warm-white/30"
              />
              <button
                type="submit"
                className="bg-gold text-deep-black font-semibold px-4 rounded-r-lg hover:bg-gold-light transition text-sm whitespace-nowrap cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/5 py-6 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <p className="text-warm-white/30 text-sm">
            &copy; 2024 OGOTEL Prestige. All rights reserved.
          </p>
          <nav aria-label="Legal links" className="flex items-center gap-4 flex-wrap">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-warm-white/30 hover:text-warm-white/60 text-sm transition"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
