'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Flower2, Sun } from 'lucide-react';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';

interface Restaurant {
  name: string;
  description: string;
  icon: LucideIcon;
}

const restaurants: Restaurant[] = [
  {
    name: "L'Or D'Or",
    description: 'Michelin-starred French cuisine',
    icon: Star,
  },
  {
    name: 'Sakura',
    description: 'Authentic Japanese omakase',
    icon: Flower2,
  },
  {
    name: 'The Terrace',
    description: 'Mediterranean rooftop dining',
    icon: Sun,
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.12,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const imageReveal = {
  hidden: { opacity: 0, scale: 1.08 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1,
      ease: 'easeOut',
      delay: 0.1,
    },
  },
};

export default function Dining() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      id="dining"
      ref={sectionRef}
      className="bg-deep-black py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-0 min-h-[600px] md:min-h-[700px] rounded-xl overflow-hidden">
          {/* Left: Image */}
          <motion.div
            className="relative h-[350px] md:h-auto"
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={imageReveal}
          >
            <Image
              src="/images/dining.png"
              alt="Fine dining experience"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={false}
            />
            {/* Subtle gold accent at bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold/40" />
          </motion.div>

          {/* Right: Content */}
          <div className="bg-charcoal flex flex-col justify-center p-8 md:p-12 lg:p-20">
            <motion.div
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              custom={0}
              variants={fadeInUp}
            >
              <span className="text-gold text-sm tracking-[0.2em] uppercase font-medium">
                Culinary Excellence
              </span>
            </motion.div>

            <motion.h2
              className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-medium text-warm-white mt-4"
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              custom={1}
              variants={fadeInUp}
            >
              A Gastronomic Journey
            </motion.h2>

            <motion.div
              className="w-16 h-[2px] bg-gold mt-6 mb-6"
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              custom={2}
              variants={fadeInUp}
            />

            <motion.p
              className="text-warm-white/60 leading-relaxed mb-10 md:mb-12 text-base"
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              custom={3}
              variants={fadeInUp}
            >
              Our award-winning chefs craft extraordinary culinary experiences
              using the finest locally sourced ingredients. From intimate
              candlelit dinners to grand celebrations, every meal becomes an
              unforgettable memory.
            </motion.p>

            {/* Restaurant Highlights */}
            <div className="space-y-0 mb-10 md:mb-12">
              {restaurants.map((restaurant, index) => {
                const Icon = restaurant.icon;
                return (
                  <motion.div
                    key={restaurant.name}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    custom={4 + index}
                    variants={fadeInUp}
                  >
                    <div
                      className={`flex items-start gap-4 py-5 ${
                        index < restaurants.length - 1
                          ? 'border-b border-warm-white/10'
                          : ''
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <Icon
                          className="text-gold w-5 h-5"
                          strokeWidth={1.5}
                        />
                      </div>
                      <div>
                        <h4 className="text-warm-white font-semibold text-base">
                          {restaurant.name}
                        </h4>
                        <p className="text-warm-white/60 text-sm mt-1">
                          {restaurant.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA Button */}
            <motion.div
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              custom={7}
              variants={fadeInUp}
            >
              <button
                type="button"
                className="border border-gold text-gold px-8 py-3.5 text-sm tracking-[0.15em] uppercase font-medium hover:bg-gold hover:text-deep-black transition-all duration-300 cursor-pointer w-fit"
              >
                Reserve a Table
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
