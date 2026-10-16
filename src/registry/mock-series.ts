/**
 * A gently sloping series with a repeating wobble, the same on every call. For example data only:
 * it stands in for measurements so the demos need no random numbers and never read the clock.
 */
export function series(length: number, start: number, slope: number, wobble: number): number[] {
  return Array.from({ length }, (_, index) =>
    Math.round(
      start +
        slope * index +
        Math.sin(index * 1.7) * wobble +
        Math.sin(index * 0.45) * wobble * 1.4,
    ),
  )
}
