'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

const galleryImages = [
  {
    src: '/images/lobby.png',
    alt: 'Grand Hotel Lobby',
    className: 'col-span-2 row-span-2 aspect-square',
    large: true,
  },
  {
    src: '/images/pool.png',
    alt: 'Infinity Pool',
    className: 'col-span-1 aspect-[4/3]',
    large: false,
  },
  {
    src: '/images/spa.png',
    alt: 'Luxury Spa',
    className: 'col-span-1 aspect-[4/3]',
    large: false,
  },
  {
    src: '/images/dining.png',
    alt: 'Fine Dining Restaurant',
    className: 'col-span-1 aspect-[4/3]',
    large: false,
  },
  {
    src: '/images/bar.png',
    alt: 'Cocktail Bar',
    className: 'col-span-1 aspect-[4/3]',
    large: false,
  },
  {
    src: '/images/gallery-beach.png',
    alt: 'Private Beach',
    className: 'col-span-2 aspect-[16/9]',
    large: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

export default function Gallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="bg-cream py-20 md:py-32 px-4 md:px-8 lg:px-16"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-gold-dark text-sm tracking-[0.2em] uppercase font-medium">
            Captured Moments
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl lg:text-5xl font-medium text-charcoal mt-3 mb-6">
            Gallery
          </h2>
          {/* Gold Divider */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-[1px] bg-gold/40" />
            <div className="w-2 h-2 rounded-full bg-gold" />
            <div className="w-8 h-[1px] bg-gold/40" />
          </div>
        </motion.div>

        {/* Masonry Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[180px] md:auto-rows-[200px]"
        >
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`${image.className} rounded-lg overflow-hidden group cursor-pointer relative`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={
                  image.large
                    ? '(max-width: 768px) 100vw, 50vw'
                    : '(max-width: 768px) 50vw, 25vw'
                }
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-hover:brightness-110"
              />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-deep-black/0 group-hover:bg-deep-black/30 transition-all duration-500 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Camera className="w-5 h-5 md:w-6 md:h-6 text-charcoal" />
                  </div>
                </div>
              </div>
              {/* Image Label */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-deep-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-white/90 text-sm font-medium tracking-wide">
                  {image.alt}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
