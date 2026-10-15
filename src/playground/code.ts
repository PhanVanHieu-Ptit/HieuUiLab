import { jsxAttribute, jsxText } from '@/registry/playground'

export { formatImport } from '@/registry/usage'
export { jsxText }

/** `name="text"`, `name={3}`, a bare `name` for true, or `name={false}`. */
export function jsxProp(name: string, value: string | number | boolean): string {
  return typeof value === 'number' ? `${name}={${String(value)}}` : jsxAttribute(name, value)
}

/** A single-quoted TypeScript string literal for `value`. */
export function tsString(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
  return `'${escaped}'`
}

/** `lines` indented by `spaces`; blank lines stay empty. */
export function indent(lines: readonly string[], spaces: number): string[] {
  const padding = ' '.repeat(spaces)
  return lines.map((line) => (line === '' ? line : `${padding}${line}`))
}

/** An opening tag with one attribute per line once it would pass 100 columns at `depth` indents. */
export function jsxOpenTag(tag: string, props: readonly string[], depth: number): string[] {
  const inline = `<${[tag, ...props].join(' ')}>`
  if (props.length === 0 || depth * 2 + inline.length <= 100) return [inline]
  return [`<${tag}`, ...indent(props, 2), '>']
}

/**
 * `<tag props>text</tag>` on one line, or on three once it would pass 100 columns at `depth`
 * indents, as Prettier would format it.
 */
export function jsxTextElement(
  tag: string,
  props: readonly string[],
  text: string,
  depth: number,
): string[] {
  const open = [tag, ...props].join(' ')
  const content = jsxText(text)
  const inline = `<${open}>${content}</${tag}>`
  if (depth * 2 + inline.length <= 100) return [inline]
  return [`<${open}>`, ...indent([content], 2), `</${tag}>`]
}
