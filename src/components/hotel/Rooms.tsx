'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

const rooms = [
  {
    name: 'Deluxe Room',
    image: '/images/room-deluxe.png',
    price: 'From $450/night',
    features: ['King Bed', 'Ocean View', '45m²', 'Private Balcony'],
  },
  {
    name: 'Grand Suite',
    image: '/images/room-suite.png',
    price: 'From $850/night',
    features: ['King Bed', 'Ocean View', '85m²', 'Living Room', 'Terrace'],
  },
  {
    name: 'Presidential Suite',
    image: '/images/room-presidential.png',
    price: 'From $2,500/night',
    features: ['Master Suite', 'Panoramic View', '180m²', 'Private Pool', 'Butler Service'],
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

export default function Rooms() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section
      id="rooms"
      ref={sectionRef}
      className="bg-deep-black py-20 md:py-32 px-4 md:px-8 lg:px-16"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="text-center mb-16"
        >
          <motion.p
            variants={headerVariants}
            className="text-gold text-sm uppercase tracking-[0.2em] font-medium"
          >
            Our Accommodations
          </motion.p>

          <motion.h2
            variants={headerVariants}
            className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl lg:text-5xl font-medium text-warm-white mt-4"
          >
            Suites &amp; Rooms
          </motion.h2>

          {/* Gold divider centered */}
          <motion.div
            variants={headerVariants}
            className="w-16 h-[2px] bg-gold mx-auto mt-6 mb-6"
          />

          <motion.p
            variants={headerVariants}
            className="text-warm-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            Each room is a masterpiece of design, offering breathtaking views and
            uncompromising comfort
          </motion.p>
        </motion.div>

        {/* Room Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {rooms.map((room) => (
            <motion.div
              key={room.name}
              variants={cardVariants}
              className="group rounded-xl border border-white/5 hover:border-gold/30 transition-all duration-500 overflow-hidden"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={room.image}
                  alt={room.name}
                  width={1152}
                  height={864}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient overlay on image bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />

                {/* Room type badge */}
                <div className="absolute top-4 left-4 bg-gold/90 text-deep-black text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                  {room.name}
                </div>
              </div>

              {/* Content */}
              <div className="bg-charcoal p-6">
                <h3 className="font-[family-name:var(--font-playfair)] text-warm-white text-xl">
                  {room.name}
                </h3>
                <p className="text-gold font-semibold mt-1">{room.price}</p>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {room.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-warm-white/60 text-sm border border-white/10 px-2.5 py-0.5 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Explore Room link */}
                <div className="mt-6 pt-4 border-t border-white/5">
                  <button className="flex items-center gap-2 text-warm-white/70 hover:text-gold transition-colors duration-300 group/link text-sm font-medium">
                    Explore Room
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
