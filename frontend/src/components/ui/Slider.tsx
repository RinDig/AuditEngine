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
      <div className={cn('space-y-3', className)}>
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
              <span className="text-lg font-mono font-semibold text-accent">
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
            'w-full h-2 bg-surface-muted rounded appearance-none cursor-pointer',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded',
            '[&::-webkit-slider-thumb]:shadow-glow-sm',
            '[&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-webkit-slider-thumb]:hover:shadow-glow-md',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:rounded',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:shadow-glow-sm',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
          )}
          {...props}
        />
        <div className="flex justify-between text-xs text-text-muted font-mono">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    )
  }
)

Slider.displayName = 'Slider'
