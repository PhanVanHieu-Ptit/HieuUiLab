import { MetricCard } from '@/components/ui/metric-card'

// Example figures, held in memory; not live data.
export function MetricCardDemo() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <MetricCard
        label="Active projects"
        value="24"
        change={{ value: '3', direction: 'up', sentiment: 'positive', period: 'last month' }}
      />
      <MetricCard
        label="Median build time"
        value="1m 42s"
        change={{ value: '8.5%', direction: 'down', sentiment: 'positive', period: 'last week' }}
      />
      <MetricCard
        label="Failed deploys"
        value="2"
        change={{ value: '1', direction: 'up', sentiment: 'negative', period: 'last week' }}
        footnote="Production only"
      />
    </div>
  )
}

export function MetricCardPlainDemo() {
  return (
    <MetricCard
      className="w-full max-w-xs"
      label="Seats in use"
      value="38 of 50"
      footnote="Renews on Nov 1, 2026"
    />
  )
}
