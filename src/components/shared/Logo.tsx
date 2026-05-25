import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showTagline?: boolean
}

const sizeConfig = {
  sm: {
    logo: 'text-lg tracking-[0.15em]',
    tagline: 'text-[0.5rem] tracking-[0.35em]',
    gap: 'gap-0',
  },
  md: {
    logo: 'text-xl tracking-[0.18em]',
    tagline: 'text-[0.55rem] tracking-[0.4em]',
    gap: 'gap-0',
  },
  lg: {
    logo: 'text-2xl sm:text-3xl tracking-[0.2em]',
    tagline: 'text-[0.6rem] sm:text-[0.65rem] tracking-[0.45em]',
    gap: 'gap-0',
  },
}

export function Logo({ size = 'md', className, showTagline = true }: LogoProps) {
  const config = sizeConfig[size]

  return (
    <Link
      href="/"
      className={cn('flex flex-col items-start select-none', config.gap, className)}
      aria-label="OGOTEL Prestige — Accueil"
    >
      <span
        className={cn(
          'font-serif font-bold gold-shimmer',
          config.logo
        )}
      >
        OGOTEL
      </span>
      {showTagline && (
        <span className={cn('font-light text-gold/80', config.tagline)}>
          PRESTIGE
        </span>
      )}
    </Link>
  )
}
