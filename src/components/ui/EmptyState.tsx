import Link from 'next/link'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  ctaLabel,
  ctaHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4" role="img" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ wordBreak: 'keep-all' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-xs" style={{ wordBreak: 'keep-all' }}>
          {description}
        </p>
      )}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
