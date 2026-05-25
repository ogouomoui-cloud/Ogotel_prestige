'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Waves,
  Sparkles,
  UtensilsCrossed,
  Dumbbell,
  TreePine,
  ConciergeBell,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';

interface Amenity {
  title: string;
  icon: LucideIcon;
  image?: string;
  description: string;
  gradient?: string;
}

const amenities: Amenity[] = [
  {
    title: 'Infinity Pool',
    icon: Waves,
    image: '/images/pool.png',
    description:
      'Our stunning infinity pool offers panoramic ocean views and private cabanas',
  },
  {
    title: 'Luxury Spa',
    icon: Sparkles,
    image: '/images/spa.png',
    description:
      'Rejuvenate with world-class treatments and holistic wellness experiences',
  },
  {
    title: 'Fine Dining',
    icon: UtensilsCrossed,
    image: '/images/dining.png',
    description:
      'Savor exquisite cuisine at our Michelin-starred restaurants',
  },
  {
    title: 'Fitness Center',
    icon: Dumbbell,
    image: '/images/gym.png',
    description:
      'State-of-the-art equipment with personal trainers available',
  },
  {
    title: 'Beach Club',
    icon: TreePine,
    description:
      'Private beach access with premium lounge service and water sports',
    gradient: 'from-amber-900/80 via-charcoal/70 to-deep-black/90',
  },
  {
    title: 'Concierge',
    icon: ConciergeBell,
    description:
      '24/7 dedicated concierge service for bespoke experiences',
    gradient: 'from-gold-dark/60 via-charcoal/70 to-deep-black/90',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
    },
  },
};

export default function Amenities() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="amenities"
      ref={sectionRef}
      className="bg-cream py-20 md:py-32 px-4 md:px-8 lg:px-16"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={headerVariants}
        >
          <span className="text-gold-dark text-sm tracking-[0.2em] uppercase font-medium">
            World-Class Amenities
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl lg:text-5xl font-medium text-charcoal mt-4">
            Elevate Your Stay
          </h2>
          <div className="w-16 h-[2px] bg-gold mx-auto mt-6 mb-6" />
          <p className="text-charcoal/60 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Indulge in our curated collection of exceptional amenities designed
            for the discerning traveler
          </p>
        </motion.div>

        {/* Amenity Cards Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={containerVariants}
        >
          {amenities.map((amenity) => {
            const Icon = amenity.icon;
            return (
              <motion.div
                key={amenity.title}
                variants={itemVariants}
                className="group relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer"
              >
                {/* Background */}
                {amenity.image ? (
                  <div className="absolute inset-0">
                    <Image
                      src={amenity.image}
                      alt={amenity.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${amenity.gradient}`}
                  />
                )}

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-charcoal/50 transition-all duration-500 group-hover:bg-charcoal/30" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 md:p-6 text-center">
                  <div className="mb-4 md:mb-6">
                    <Icon
                      className="text-gold w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-warm-white font-semibold text-base md:text-lg lg:text-xl mb-2 md:mb-3">
                    {amenity.title}
                  </h3>
                  <p className="text-warm-white/70 text-xs md:text-sm leading-relaxed max-w-[200px] md:max-w-[260px]">
                    {amenity.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
