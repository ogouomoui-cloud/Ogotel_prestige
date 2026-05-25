'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Instagram, Facebook, Twitter } from 'lucide-react'

export default function Contact() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: '',
    specialRequests: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form submission logic
    console.log('Form submitted:', formData)
  }

  return (
    <section id="contact" className="bg-deep-black py-20 md:py-32 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-20">
        {/* Left Side — Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex flex-col justify-center"
        >
          <span className="text-gold text-sm tracking-[0.2em] uppercase mb-4">
            Begin Your Journey
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-medium text-warm-white">
            Reserve Your Experience
          </h2>
          <div className="w-16 h-[2px] bg-gold mt-6 mb-6" />
          <p className="text-warm-white/70 text-base leading-relaxed">
            Allow our dedicated team to craft your perfect stay. Whether it&apos;s a romantic
            getaway, family celebration, or business retreat, we&apos;ll tailor every detail to
            your desires.
          </p>

          {/* Contact Info */}
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-warm-white/80">
              <Phone className="w-4 h-4 text-gold shrink-0" />
              <span className="text-sm">+1 (888) 555-PRESTIGE</span>
            </div>
            <div className="flex items-center gap-3 text-warm-white/80">
              <Mail className="w-4 h-4 text-gold shrink-0" />
              <span className="text-sm">reservations@ogotel-prestige.com</span>
            </div>
            <div className="flex items-center gap-3 text-warm-white/80">
              <MapPin className="w-4 h-4 text-gold shrink-0" />
              <span className="text-sm">1 Oceanfront Drive, Paradise Bay</span>
            </div>
          </div>

          {/* Social Media */}
          <div className="flex items-center gap-5 mt-8">
            <a
              href="#"
              aria-label="Instagram"
              className="text-gold hover:text-gold-light transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="text-gold hover:text-gold-light transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="text-gold hover:text-gold-light transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </motion.div>

        {/* Right Side — Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        >
          <div className="bg-charcoal rounded-2xl p-6 md:p-8 border border-white/5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="fullName" className="text-warm-white/60 text-sm mb-2 block">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-deep-black border border-white/10 text-warm-white rounded-lg px-4 py-3 focus:border-gold focus:outline-none placeholder:text-warm-white/30 transition"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-warm-white/60 text-sm mb-2 block">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full bg-deep-black border border-white/10 text-warm-white rounded-lg px-4 py-3 focus:border-gold focus:outline-none placeholder:text-warm-white/30 transition"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="text-warm-white/60 text-sm mb-2 block">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-deep-black border border-white/10 text-warm-white rounded-lg px-4 py-3 focus:border-gold focus:outline-none placeholder:text-warm-white/30 transition"
                />
              </div>

              {/* Check-in & Check-out Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="checkIn" className="text-warm-white/60 text-sm mb-2 block">
                    Check-in Date
                  </label>
                  <input
                    id="checkIn"
                    name="checkIn"
                    type="date"
                    value={formData.checkIn}
                    onChange={handleChange}
                    className="w-full bg-deep-black border border-white/10 text-warm-white rounded-lg px-4 py-3 focus:border-gold focus:outline-none placeholder:text-warm-white/30 transition [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label htmlFor="checkOut" className="text-warm-white/60 text-sm mb-2 block">
                    Check-out Date
                  </label>
                  <input
                    id="checkOut"
                    name="checkOut"
                    type="date"
                    value={formData.checkOut}
                    onChange={handleChange}
                    className="w-full bg-deep-black border border-white/10 text-warm-white rounded-lg px-4 py-3 focus:border-gold focus:outline-none placeholder:text-warm-white/30 transition [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Number of Guests */}
              <div>
                <label htmlFor="guests" className="text-warm-white/60 text-sm mb-2 block">
                  Number of Guests
                </label>
                <select
                  id="guests"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  className="w-full bg-deep-black border border-white/10 text-warm-white rounded-lg px-4 py-3 focus:border-gold focus:outline-none placeholder:text-warm-white/30 transition appearance-none cursor-pointer"
                >
                  <option value="" disabled className="text-warm-white/30">
                    Select guests
                  </option>
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5+ Guests</option>
                </select>
              </div>

              {/* Special Requests */}
              <div>
                <label
                  htmlFor="specialRequests"
                  className="text-warm-white/60 text-sm mb-2 block"
                >
                  Special Requests
                </label>
                <textarea
                  id="specialRequests"
                  name="specialRequests"
                  rows={3}
                  value={formData.specialRequests}
                  onChange={handleChange}
                  placeholder="Tell us about any special requirements..."
                  className="w-full bg-deep-black border border-white/10 text-warm-white rounded-lg px-4 py-3 focus:border-gold focus:outline-none placeholder:text-warm-white/30 transition resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gold text-deep-black font-semibold py-3 rounded-lg hover:bg-gold-light transition text-center cursor-pointer mt-1"
              >
                Submit Inquiry
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
