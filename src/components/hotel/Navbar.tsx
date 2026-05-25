'use client'

import { useState, useEffect, useCallback } from 'react'
import { Menu, X, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet'

const navLinks = [
  { label: 'Experience', href: '#about' },
  { label: 'Suites', href: '#rooms' },
  { label: 'Dining', href: '#dining' },
  { label: 'Amenities', href: '#amenities' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    // Check initial scroll position
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault()
      const target = document.querySelector(href)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
      setMobileOpen(false)
    },
    []
  )

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-deep-black/95 backdrop-blur-md shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="#"
          className="flex flex-col items-start select-none"
          aria-label="OGOTEL Prestige - Home"
        >
          <span className="gold-shimmer font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-[0.2em] sm:text-3xl">
            OGOTEL
          </span>
          <span className="text-[0.6rem] font-light tracking-[0.45em] text-gold/80 sm:text-[0.65rem]">
            PRESTIGE
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 lg:flex">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-sm font-light tracking-wide text-white/80 transition-colors duration-200 hover:text-gold"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop Right Section */}
        <div className="hidden items-center gap-6 lg:flex">
          {/* Phone */}
          <a
            href="tel:+188855577378"
            className="flex items-center gap-2 text-sm font-light text-white/70 transition-colors duration-200 hover:text-gold"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>+1 (888) 555-PRESTIGE</span>
          </a>

          {/* Book Now */}
          <Button
            className="border border-gold bg-transparent text-sm font-medium text-gold transition-all duration-200 hover:bg-gold hover:text-deep-black"
          >
            Book Now
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 lg:hidden">
          <a
            href="tel:+188855577378"
            className="text-gold/80 transition-colors hover:text-gold"
            aria-label="Call us"
          >
            <Phone className="h-4.5 w-4.5" />
          </a>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-gold"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[300px] border-l border-white/10 bg-deep-black/98 backdrop-blur-xl"
            >
              <SheetHeader className="mb-8 mt-2">
                <SheetTitle className="flex flex-col items-start">
                  <span className="gold-shimmer font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-[0.2em]">
                    OGOTEL
                  </span>
                  <span className="text-[0.6rem] font-light tracking-[0.45em] text-gold/80">
                    PRESTIGE
                  </span>
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="rounded-lg px-4 py-3 text-base font-light tracking-wide text-white/80 transition-all duration-200 hover:bg-white/5 hover:text-gold"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="mt-8 flex flex-col gap-4 px-4">
                <a
                  href="tel:+188855577378"
                  className="flex items-center gap-2 text-sm font-light text-white/60 transition-colors hover:text-gold"
                >
                  <Phone className="h-4 w-4" />
                  <span>+1 (888) 555-PRESTIGE</span>
                </a>

                <Button className="w-full border border-gold bg-transparent font-medium text-gold transition-all duration-200 hover:bg-gold hover:text-deep-black">
                  Book Now
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
