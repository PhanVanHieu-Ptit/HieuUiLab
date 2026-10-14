import type { ComponentType } from 'react'

import type { PlaygroundValue, RegistryPlayground } from './types'

export type PlaygroundValues = Readonly<Record<string, PlaygroundValue>>

type StringKey<P> = Extract<keyof P, string>

/** Props whose type includes string literals, which a select can offer. */
type OptionProp<P> = {
  [K in StringKey<P>]-?: [Extract<NonNullable<P[K]>, string>] extends [never] ? never : K
}[StringKey<P>]
/** Props that accept a boolean. */
type FlagProp<P> = {
  [K in StringKey<P>]-?: boolean extends NonNullable<P[K]> ? K : never
}[StringKey<P>]
/** Props that accept any string, including `children` when it is a ReactNode. */
type TextProp<P> = {
  [K in StringKey<P>]-?: string extends NonNullable<P[K]> ? K : never
}[StringKey<P>]

type SelectControlOf<P> = {
  [K in OptionProp<P>]: {
    kind: 'select'
    prop: K
    label?: string
    options: readonly Extract<NonNullable<P[K]>, string>[]
    default: Extract<NonNullable<P[K]>, string>
  }
}[OptionProp<P>]

type ControlOf<P> =
  | SelectControlOf<P>
  | { kind: 'boolean'; prop: FlagProp<P>; label?: string; default: boolean }
  | { kind: 'text'; prop: TextProp<P>; label?: string; default: string }

interface PlaygroundConfig<P> {
  part: string
  controls: readonly ControlOf<P>[]
  staticProps?: { [K in StringKey<P>]?: Extract<P[K], PlaygroundValue> }
}

/**
 * A playground for `component`. Control props and select options are checked
 * against the component's own prop types, so a control the component does not
 * support fails to compile; `validateRegistry` checks them against the docs.
 */
export function definePlayground<P extends object>(
  component: ComponentType<P>,
  config: PlaygroundConfig<P>,
): RegistryPlayground {
  const { part, controls, staticProps } = config
  return {
    part,
    // Erased to a common shape for storage; the config above was checked against P.
    component: component as unknown as RegistryPlayground['component'],
    controls,
    ...(staticProps ? { staticProps: staticProps as Record<string, PlaygroundValue> } : {}),
  }
}

export function defaultPlaygroundValues(playground: RegistryPlayground): PlaygroundValues {
  return Object.fromEntries(playground.controls.map((control) => [control.prop, control.default]))
}

/**
 * The props to pass, in order: controls first, then static props. A select left at
 * its documented default, a false flag, and empty text are left out, exactly as
 * the generated code leaves them out.
 */
export function resolvePlaygroundProps(
  playground: RegistryPlayground,
  values: PlaygroundValues,
): [string, PlaygroundValue][] {
  const resolved: [string, PlaygroundValue][] = []
  for (const control of playground.controls) {
    const value = values[control.prop] ?? control.default
    const implicit =
      control.kind === 'select'
        ? value === control.default
        : control.kind === 'boolean'
          ? value === false
          : value === ''
    if (!implicit) resolved.push([control.prop, value])
  }
  for (const [prop, value] of Object.entries(playground.staticProps ?? {})) {
    resolved.push([prop, value])
  }
  return resolved
}

function jsxAttribute(prop: string, value: PlaygroundValue): string {
  if (typeof value === 'boolean') return value ? prop : `${prop}={false}`
  return /["\n]/.test(value) ? `${prop}={${JSON.stringify(value)}}` : `${prop}="${value}"`
}

function jsxText(text: string): string {
  return /[{}<>\n]|^\s|\s$/.test(text) ? `{${JSON.stringify(text)}}` : text
}

/** The JSX for `props`, formatted the way Prettier would at a 100-column width. */
export function playgroundJsx(tag: string, props: readonly [string, PlaygroundValue][]): string {
  const children = props.find(([prop]) => prop === 'children')?.[1]
  const attributes = props
    .filter(([prop]) => prop !== 'children')
    .map(([prop, value]) => jsxAttribute(prop, value))
  const content = typeof children === 'string' && children !== '' ? jsxText(children) : undefined

  const open = [tag, ...attributes].join(' ')
  const inline = content === undefined ? `<${open} />` : `<${open}>${content}</${tag}>`
  // `  return ` is 9 columns.
  if (inline.length + 9 <= 100) return inline

  const lines = [`<${tag}`, ...attributes.map((attribute) => `  ${attribute}`)]
  if (content === undefined) return [...lines, '/>'].join('\n')
  return [...lines, '>', `  ${content}`, `</${tag}>`].join('\n')
}

/** A self-contained example function rendering `tag` with `props`. */
export function playgroundSnippet(
  importLine: string,
  tag: string,
  props: readonly [string, PlaygroundValue][],
): string {
  const jsx = playgroundJsx(tag, props)
  const body = jsx.includes('\n')
    ? `  return (\n${jsx
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n')}\n  )`
    : `  return ${jsx}`
  return `${importLine}\n\nexport function ${tag}Example() {\n${body}\n}\n`
}
