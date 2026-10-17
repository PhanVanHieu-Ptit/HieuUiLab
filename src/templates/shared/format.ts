const dateTime = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

/** "2026-10-12T18:00:00Z" → "Oct 12, 2026, 6:00 PM UTC", the same for every viewer. */
export function formatUtc(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : `${dateTime.format(date)} UTC`
}

/** The time `minutes` after `iso`: how the examples order changes without reading the clock. */
export function minutesAfter(iso: string, minutes: number): string {
  return new Date(Date.parse(iso) + minutes * 60_000).toISOString()
}
