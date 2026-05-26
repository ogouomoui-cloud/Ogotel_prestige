import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { type LucideIcon } from 'lucide-react'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      {/* Icon */}
      <Icon className="mb-4 size-12 text-gold/40" />

      {/* Title */}
      <h3 className="text-lg font-semibold text-navy">{title}</h3>

      {/* Description */}
      <p className="mt-1 max-w-md text-sm text-slate">{description}</p>

      {/* Action */}
      {action && (
        <Button
          asChild
          variant="outline"
          className="mt-6 border-gold text-gold hover:bg-gold hover:text-white"
        >
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  )
}
