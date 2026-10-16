import { Sparkline } from '@/components/ui/sparkline'

// Example values, invented for this page.
const signups = [12, 14, 13, 18, 17, 22, 21, 27]
const errors = [9, 8, 11, 7, 6, 6, 4, 3]

export function SparklineDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-1">
      <p className="text-sm font-medium">New signups</p>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">27</p>
      <Sparkline values={signups} label="New signups, last 8 days: up from 12 to 27" />
    </div>
  )
}

export function SparklineTonesDemo() {
  return (
    <div className="grid w-full gap-6 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Signups, last 8 days</p>
        <Sparkline
          area
          tone="success"
          values={signups}
          label="Signups, last 8 days: up from 12 to 27"
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Errors, last 8 days</p>
        <Sparkline
          area
          tone="destructive"
          values={errors}
          label="Errors, last 8 days: down from 9 to 3"
        />
      </div>
    </div>
  )
}
