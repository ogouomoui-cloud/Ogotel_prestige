'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'

const stats = [
  { number: '95+', label: 'Years of Excellence' },
  { number: '200+', label: 'Luxury Suites' },
  { number: '5', label: 'Michelin Stars' },
  { number: '50k+', label: 'Happy Guests' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export default function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section
      id="about"
      ref={sectionRef}
      className="bg-cream py-20 md:py-32 px-4 md:px-8 lg:px-16"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center"
        >
          {/* Left side - Image */}
          <motion.div variants={itemVariants} className="relative group">
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src="/images/lobby.png"
                alt="OGOTEL Prestige Grand Lobby"
                width={1152}
                height={864}
                className="w-full h-auto object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.02]"
              />
              {/* Gold border accent on left side */}
              <div className="absolute left-0 top-6 bottom-6 w-[3px] bg-gold rounded-full" />
              {/* Subtle gold corner accent */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-gold/40 rounded-tl-2xl" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-gold/40 rounded-br-2xl" />
            </div>
          </motion.div>

          {/* Right side - Content */}
          <div>
            <motion.p
              variants={itemVariants}
              className="text-gold-dark text-sm uppercase tracking-[0.2em] font-medium"
            >
              Our Legacy
            </motion.p>

            <motion.h2
              variants={itemVariants}
              className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl lg:text-5xl font-medium text-charcoal mt-4"
            >
              A Legacy of Timeless Elegance
            </motion.h2>

            {/* Decorative gold divider */}
            <motion.div
              variants={itemVariants}
              className="w-16 h-[2px] bg-gold mt-6 mb-6"
            />

            <motion.p
              variants={itemVariants}
              className="text-muted-foreground leading-relaxed"
            >
              Since 1927, OGOTEL Prestige has been the epitome of refined luxury.
              Nestled along the pristine coastline, our hotel offers an intimate
              sanctuary where timeless elegance meets modern sophistication.
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="text-muted-foreground leading-relaxed mt-4"
            >
              Every detail has been meticulously crafted — from our world-class spa
              to our Michelin-starred dining — ensuring each moment of your stay
              transcends the ordinary.
            </motion.p>

            {/* Stats Row */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-10 border-t border-charcoal/10"
            >
              {stats.map((stat) => (
                <motion.div key={stat.label} variants={statVariants}>
                  <div className="text-gold text-2xl font-bold">
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground text-sm mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
