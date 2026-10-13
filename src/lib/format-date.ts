const formatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "2026-10-13" → "13 Oct 2026", independent of the viewer's time zone. */
export function formatDate(isoDate: string): string {
  return formatter.format(new Date(`${isoDate}T00:00:00Z`))
}
