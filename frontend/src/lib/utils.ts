/**
 * Utility functions for the Ethics Engine frontend.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with proper precedence handling.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with commas for display.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString()
}

/**
 * Format duration in milliseconds to human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

/**
 * Estimate time for an assessment run.
 * Based on average response times and rate limiting.
 */
export function estimateRunTime(totalCalls: number, providerCount: number): string {
  // Rough estimate: 1.5 seconds per call on average, accounting for rate limits
  const estimatedMs = totalCalls * 1500 / Math.max(providerCount, 1)
  return formatDuration(estimatedMs)
}

/**
 * Format a timestamp to locale string.
 */
export function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString()
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1) + '...'
}

/**
 * Generate a deterministic color for a string (for charts/visualization).
 */
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const colors = [
    '#0F766E', // teal
    '#1E40AF', // blue
    '#7C3AED', // violet
    '#BE185D', // pink
    '#B45309', // amber
    '#166534', // green
    '#0369A1', // sky
    '#6D28D9', // purple
  ]

  return colors[Math.abs(hash) % colors.length]
}

/**
 * Calculate percentage.
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Debounce a function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
