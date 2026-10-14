import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/cn'

export interface MetricChange {
  /** Preformatted magnitude, e.g. "12.4%" or "3 orders". */
  value: string
  direction: 'up' | 'down' | 'flat'
  /** Whether this change is good news. Decides the color only; the words carry the meaning. */
  sentiment?: 'positive' | 'negative' | 'neutral'
  /** What the change is measured against, e.g. "the previous 7 days". */
  period: string
}

export interface MetricCardProps extends Omit<ComponentProps<'div'>, 'children'> {
  label: string
  /** Preformatted value, e.g. "$12,480". Format numbers before passing them in. */
  value: string
  change?: MetricChange
  /** Supporting text under the value, e.g. how the metric is calculated. */
  footnote?: ReactNode
}

const directionIcon = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight }
const directionWord = { up: 'Up', down: 'Down', flat: 'No change,' }
const sentimentClass = {
  positive: 'text-success',
  negative: 'text-destructive',
  neutral: 'text-muted-foreground',
}

/**
 * One labelled number in a description list (`<dt>` label, `<dd>` value). The
 * change is shown as an arrow and a short figure; screen readers get the whole
 * sentence instead, e.g. "Up 12.4% compared with the previous 7 days".
 */
export function MetricCard({
  label,
  value,
  change,
  footnote,
  className,
  ...props
}: MetricCardProps) {
  const Icon = change ? directionIcon[change.direction] : null
  return (
    <Card className={cn('p-5', className)} {...props}>
      <dl className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="text-2xl font-semibold tracking-tight tabular-nums">{value}</dd>
        {change && Icon ? (
          <dd className="flex flex-wrap items-center gap-x-1.5 text-xs">
            <span
              aria-hidden="true"
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                sentimentClass[change.sentiment ?? 'neutral'],
              )}
            >
              <Icon className="size-3.5" />
              {change.value}
            </span>
            <span aria-hidden="true" className="text-muted-foreground">
              vs {change.period}
            </span>
            <span className="sr-only">
              {directionWord[change.direction]} {change.value} compared with {change.period}
            </span>
          </dd>
        ) : null}
        {footnote ? <dd className="text-xs text-muted-foreground">{footnote}</dd> : null}
      </dl>
    </Card>
  )
}
