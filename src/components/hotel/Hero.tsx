'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CalendarDays, Users, BedDouble, Search } from 'lucide-react'

function FadeInUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function FloatingOrnament({
  className,
  delay = 0,
}: {
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -12, 0],
        rotate: [0, 3, -3, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  )
}

export default function Hero() {
  // Default check-in to today, check-out to 3 days from now
  const today = new Date()
  const checkout = new Date()
  checkout.setDate(today.getDate() + 3)

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col justify-end overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.png"
          alt="OGOTEL Prestige luxury hotel interior"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-deep-black via-deep-black/60 to-transparent" />

      {/* Decorative Floating Elements */}
      <FloatingOrnament
        className="pointer-events-none absolute right-[15%] top-[25%] z-[2] h-px w-32 bg-gradient-to-r from-transparent via-gold/30 to-transparent"
        delay={0}
      />
      <FloatingOrnament
        className="pointer-events-none absolute left-[10%] top-[35%] z-[2] h-px w-24 bg-gradient-to-r from-transparent via-gold/20 to-transparent"
        delay={2}
      />
      <FloatingOrnament
        className="pointer-events-none absolute right-[25%] top-[20%] z-[2] h-16 w-16 rounded-full border border-gold/10"
        delay={1}
      />

      {/* Content */}
      <div className="relative z-[3] px-4 pb-12 pt-32 sm:px-6 sm:pb-16 md:pb-20 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-5xl">
          {/* Gold Decorative Line */}
          <FadeInUp delay={0}>
            <div className="mx-auto mb-6 h-[2px] w-24 bg-gold" />
          </FadeInUp>

          {/* Main Heading */}
          <FadeInUp delay={0.15}>
            <h1 className="font-[family-name:var(--font-playfair)] text-center text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Where Luxury
              <br />
              <span className="text-gold">Meets Serenity</span>
            </h1>
          </FadeInUp>

          {/* Subheading */}
          <FadeInUp delay={0.3}>
            <p className="mx-auto mt-5 max-w-2xl text-center text-base font-light leading-relaxed text-white/70 sm:mt-6 sm:text-lg md:text-xl">
              Discover a world of unparalleled elegance and timeless sophistication
            </p>
          </FadeInUp>

          {/* Quick Booking Widget */}
          <FadeInUp delay={0.5}>
            <div className="mx-auto mt-10 max-w-4xl sm:mt-12">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {/* Check-in */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="checkin"
                      className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold/80"
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      CHECK-IN
                    </label>
                    <input
                      type="date"
                      id="checkin"
                      defaultValue={formatDateForInput(today)}
                      className="rounded-lg border border-white/30 bg-transparent px-4 py-2.5 text-sm text-white transition-colors placeholder:text-white/40 focus:border-gold focus:outline-none"
                    />
                  </div>

                  {/* Check-out */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="checkout"
                      className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold/80"
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      CHECK-OUT
                    </label>
                    <input
                      type="date"
                      id="checkout"
                      defaultValue={formatDateForInput(checkout)}
                      className="rounded-lg border border-white/30 bg-transparent px-4 py-2.5 text-sm text-white transition-colors placeholder:text-white/40 focus:border-gold focus:outline-none"
                    />
                  </div>

                  {/* Guests */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="guests"
                      className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold/80"
                    >
                      <Users className="h-3.5 w-3.5" />
                      GUESTS
                    </label>
                    <select
                      id="guests"
                      defaultValue="2"
                      className="appearance-none rounded-lg border border-white/30 bg-transparent px-4 py-2.5 text-sm text-white transition-colors focus:border-gold focus:outline-none"
                    >
                      <option value="1" className="bg-deep-black text-white">
                        1 Adult
                      </option>
                      <option value="2" className="bg-deep-black text-white">
                        2 Adults
                      </option>
                      <option value="3" className="bg-deep-black text-white">
                        3 Adults
                      </option>
                      <option value="4" className="bg-deep-black text-white">
                        4 Adults
                      </option>
                    </select>
                  </div>

                  {/* Room Type */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="room"
                      className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold/80"
                    >
                      <BedDouble className="h-3.5 w-3.5" />
                      ROOM TYPE
                    </label>
                    <select
                      id="room"
                      defaultValue="1"
                      className="appearance-none rounded-lg border border-white/30 bg-transparent px-4 py-2.5 text-sm text-white transition-colors focus:border-gold focus:outline-none"
                    >
                      <option value="1" className="bg-deep-black text-white">
                        1 Room
                      </option>
                      <option value="2" className="bg-deep-black text-white">
                        2 Rooms
                      </option>
                      <option value="3" className="bg-deep-black text-white">
                        3 Rooms
                      </option>
                    </select>
                  </div>

                  {/* Search Button */}
                  <div className="flex flex-col justify-end sm:col-span-2 lg:col-span-1">
                    <Button className="h-[46px] w-full bg-gold font-semibold text-deep-black transition-all duration-200 hover:bg-gold-light">
                      <Search className="mr-2 h-4 w-4" />
                      Search Availability
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </div>
    </section>
  )
}
