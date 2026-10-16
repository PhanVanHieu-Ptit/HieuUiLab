import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export type SparklineTone = 'primary' | 'success' | 'warning' | 'destructive' | 'muted'

export interface SparklineProps extends Omit<
  ComponentProps<'svg'>,
  'children' | 'viewBox' | 'values' | 'role' | 'aria-hidden' | 'aria-label' | 'aria-labelledby'
> {
  /** Values in order, oldest first. Non-finite numbers are ignored. */
  values: readonly number[]
  /**
   * What the chart shows, in words that include the takeaway, e.g. "p95 latency, last 24 hours:
   * low 82 ms, high 190 ms". Without it the chart is hidden from assistive technology, so only
   * omit it next to text that already says the same.
   */
  label?: string
  tone?: SparklineTone
  /** Fill the area under the line. */
  area?: boolean
}

const toneClass: Record<SparklineTone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  muted: 'text-muted-foreground',
}

const WIDTH = 100
const HEIGHT = 32

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Builds the SVG path data for a series: `line` for the stroke and `area` for the fill under it.
 * Values are scaled to the series' own range, so a flat or single-value series is drawn as a
 * level line in the middle. Non-finite values are skipped. An empty series gives empty paths.
 */
export function sparklinePath(
  values: readonly number[],
  width: number,
  height: number,
  inset = 2,
): { line: string; area: string } {
  const finite = values.filter((value) => Number.isFinite(value))
  const first = finite[0]
  if (first === undefined) return { line: '', area: '' }

  const min = Math.min(...finite)
  const max = Math.max(...finite)
  const span = max - min
  const usable = Math.max(height - inset * 2, 0)
  const y = (value: number) =>
    round(span === 0 ? height / 2 : inset + (1 - (value - min) / span) * usable)

  if (finite.length === 1) {
    const level = y(first)
    const line = `M0,${String(level)} L${String(width)},${String(level)}`
    return { line, area: `${line} L${String(width)},${String(height)} L0,${String(height)} Z` }
  }

  const step = width / (finite.length - 1)
  const points = finite.map((value, index) => `${String(round(index * step))},${String(y(value))}`)
  const line = `M${points.join(' L')}`
  return { line, area: `${line} L${String(width)},${String(height)} L0,${String(height)} Z` }
}

/**
 * A small line chart with no axes, for a trend next to a number. It stretches to its container,
 * draws in the current text color (set with `tone`), and has no scale: pair it with the figures
 * it summarises.
 */
export function Sparkline({
  values,
  label,
  tone = 'primary',
  area = false,
  className,
  ...props
}: SparklineProps) {
  const { line, area: areaPath } = sparklinePath(values, WIDTH, HEIGHT)
  return (
    <svg
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      preserveAspectRatio="none"
      {...(label === undefined
        ? { 'aria-hidden': true, focusable: false }
        : { role: 'img', 'aria-label': label })}
      className={cn('h-8 w-full overflow-visible', toneClass[tone], className)}
      {...props}
    >
      {area && areaPath ? <path d={areaPath} fill="currentColor" fillOpacity={0.14} /> : null}
      {line ? (
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  )
}
