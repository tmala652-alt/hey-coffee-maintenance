import { LucideIcon, Plus } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6 animate-fade-in">
      <div className="w-20 h-20 bg-gradient-to-br from-cream-100 to-cream-200 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce-soft">
        <Icon className="h-10 w-10 text-coffee-400" />
      </div>
      <h3 className="text-xl font-bold text-coffee-900 mb-2">{title}</h3>
      <p className="text-coffee-500 mb-8 max-w-sm mx-auto">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary group">
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
