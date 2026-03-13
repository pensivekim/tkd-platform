import Link from 'next/link'
import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  onCta?: () => void
}

export default function EmptyState({ icon, title, description, ctaLabel, ctaHref, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
        {icon ?? <Inbox size={22} className="text-[#606070]" />}
      </div>
      <h3 className="text-base font-semibold text-[#F0F0F5] mb-2" style={{ wordBreak: 'keep-all' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[#606070] mb-6 max-w-xs leading-relaxed" style={{ wordBreak: 'keep-all' }}>
          {description}
        </p>
      )}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center px-5 py-2.5 bg-[#E63946] hover:bg-[#C53030] text-white text-sm font-semibold rounded-xl transition-colors no-underline"
        >
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="inline-flex items-center px-5 py-2.5 bg-[#E63946] hover:bg-[#C53030] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer border-none"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
