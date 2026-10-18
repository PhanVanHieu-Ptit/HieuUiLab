/** `key="value"` pairs from a directive line or a code fence's info string. */
export type Attrs = Readonly<Record<string, string>>

const ATTRIBUTE = /^([a-z][a-z0-9-]*)="([^"\n]*)"(?:\s+|$)/

/**
 * Parses `key="value" other="value"`. Values are quoted and have no escapes; a key may appear once.
 * Anything else (an unquoted value, trailing text, a repeated key) is an error, not a guess.
 */
export function parseAttrs(source: string): { attrs: Attrs } | { error: string } {
  const attrs: Record<string, string> = {}
  let rest = source.trim()
  while (rest.length > 0) {
    const match = ATTRIBUTE.exec(rest)
    const key = match?.[1]
    const value = match?.[2]
    if (match === null || key === undefined || value === undefined) {
      return { error: `cannot read attributes at "${rest.slice(0, 24)}"; write key="value"` }
    }
    if (Object.hasOwn(attrs, key)) return { error: `attribute "${key}" is given twice` }
    attrs[key] = value
    rest = rest.slice(match[0].length)
  }
  return { attrs }
}
