/**
 * A URL fragment for a heading: lower case, runs of anything but a-z and 0-9 collapsed to one
 * hyphen, no leading or trailing hyphen. Returns '' when nothing is left.
 */
export function slugifyHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
