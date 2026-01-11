'use client'

import { cn } from '@/lib/utils'
import { forwardRef, InputHTMLAttributes } from 'react'

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  showValue?: boolean
  valueFormatter?: (value: number) => string
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      showValue = true,
      valueFormatter = (v) => v.toString(),
      className,
      id,
      value,
      min = 0,
      max = 100,
      step = 1,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const currentValue = typeof value === 'number' ? value : Number(value) || 0

    return (
      <div className={cn('space-y-2', className)}>
        {(label || showValue) && (
          <div className="flex justify-between items-center">
            {label && (
              <label
                htmlFor={inputId}
                className="text-sm font-medium text-text-primary"
              >
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-sm font-mono text-text-secondary">
                {valueFormatter(currentValue)}
              </span>
            )}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          className={cn(
            'w-full h-2 bg-surface-muted rounded-full appearance-none cursor-pointer',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:shadow-sm',
            '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:border-0',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'
          )}
          {...props}
        />
        <div className="flex justify-between text-xs text-text-tertiary">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    )
  }
)

Slider.displayName = 'Slider'
