'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

interface Testimonial {
  quote: string;
  name: string;
  location: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote:
      'An absolutely transcendent experience. From the moment we arrived, every detail was perfect. The Presidential Suite exceeded all expectations.',
    name: 'Victoria Chen',
    location: 'Singapore',
    rating: 5,
  },
  {
    quote:
      'The spa was heavenly and the dining was world-class. OGOTEL Prestige has set a new standard for luxury hospitality.',
    name: 'James & Sarah Mitchell',
    location: 'London',
    rating: 5,
  },
  {
    quote:
      'We celebrated our anniversary here and it was magical. The staff anticipated our every need. Truly exceptional service.',
    name: 'Alejandro & Maria Torres',
    location: 'Barcelona',
    rating: 5,
  },
  {
    quote:
      "The attention to detail is remarkable. From the fresh orchids in our suite to the personalized welcome amenity, everything felt thoughtfully curated.",
    name: 'Hiroshi Nakamura',
    location: 'Tokyo',
    rating: 5,
  },
  {
    quote:
      "Best family vacation we've ever had. The kids club was wonderful, and we finally had time to relax. Already planning our return visit.",
    name: 'The Anderson Family',
    location: 'New York',
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating
              ? 'fill-gold text-gold'
              : 'fill-transparent text-gold/30'
          }`}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const cards = container.querySelectorAll('[data-testimonial-card]');
      const targetCard = cards[index] as HTMLElement;
      if (!targetCard) return;

      const containerRect = container.getBoundingClientRect();
      const cardRect = targetCard.getBoundingClientRect();
      const scrollLeft =
        cardRect.left -
        containerRect.left +
        container.scrollLeft -
        (containerRect.width - cardRect.width) / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    },
    []
  );

  const handlePrev = useCallback(() => {
    const newIndex = Math.max(activeIndex - 1, 0);
    setActiveIndex(newIndex);
    scrollToIndex(newIndex);
  }, [activeIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    const newIndex = Math.min(activeIndex + 1, testimonials.length - 1);
    setActiveIndex(newIndex);
    scrollToIndex(newIndex);
  }, [activeIndex, scrollToIndex]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cards = container.querySelectorAll('[data-testimonial-card]');

    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardEl = card as HTMLElement;
      const cardCenter =
        cardEl.offsetLeft + cardEl.offsetWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="bg-gradient-to-b from-warm-white to-cream py-20 md:py-32 px-4 md:px-8 lg:px-16 overflow-hidden"
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
            Guest Experiences
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl lg:text-5xl font-medium text-charcoal mt-3 mb-6">
            What Our Guests Say
          </h2>
          {/* Gold Divider */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-[1px] bg-gold/40" />
            <div className="w-2 h-2 rounded-full bg-gold" />
            <div className="w-8 h-[1px] bg-gold/40" />
          </div>
        </motion.div>

        {/* Carousel Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg border border-gold/20 flex items-center justify-center transition-all duration-300 hover:bg-gold/10 hover:border-gold/40 ${
              activeIndex === 0
                ? 'opacity-0 pointer-events-none'
                : 'opacity-100'
            }`}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 text-charcoal" />
          </button>

          {/* Scrollable Cards */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-8 md:px-12"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                data-testimonial-card
                className="min-w-[320px] md:min-w-[400px] snap-center flex-shrink-0"
              >
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gold/10 h-full flex flex-col transition-all duration-300 hover:shadow-md hover:border-gold/20">
                  {/* Quote Icon */}
                  <div className="relative mb-4">
                    <Quote className="w-10 h-10 text-gold/15" />
                  </div>

                  {/* Star Rating */}
                  <StarRating rating={testimonial.rating} />

                  {/* Quote Text */}
                  <p className="text-charcoal/80 leading-relaxed text-base mt-4 flex-grow">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  {/* Divider */}
                  <div className="w-12 h-[1px] bg-gold/30 my-4" />

                  {/* Guest Info */}
                  <div>
                    <p className="font-semibold text-charcoal">
                      {testimonial.name}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            disabled={activeIndex === testimonials.length - 1}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg border border-gold/20 flex items-center justify-center transition-all duration-300 hover:bg-gold/10 hover:border-gold/40 ${
              activeIndex === testimonials.length - 1
                ? 'opacity-0 pointer-events-none'
                : 'opacity-100'
            }`}
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 text-charcoal" />
          </button>
        </motion.div>

        {/* Navigation Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-2 mt-8"
        >
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveIndex(index);
                scrollToIndex(index);
              }}
              className={`transition-all duration-300 rounded-full ${
                index === activeIndex
                  ? 'w-8 h-2 bg-gold'
                  : 'w-2 h-2 bg-gold/30 hover:bg-gold/50'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
