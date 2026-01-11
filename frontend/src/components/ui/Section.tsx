'use client'

import { cn } from '@/lib/utils'
import { ReactNode, useState } from 'react'

interface SectionProps {
  number: number
  title: string
  description?: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function Section({
  number,
  title,
  description,
  children,
  defaultOpen = true,
  className,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className={cn('card', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-start gap-4 text-left hover:bg-surface-muted/50 transition-colors"
      >
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-surface-muted flex items-center justify-center text-sm font-medium text-text-secondary">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-text-primary">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-text-secondary">
              {description}
            </p>
          )}
        </div>
        <svg
          className={cn(
            'w-5 h-5 text-text-tertiary transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 animate-fade-in">
          {children}
        </div>
      )}
    </section>
  )
}
