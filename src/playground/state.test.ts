import { describe, expect, it } from 'vitest'

import { booleanControl, defineControls, enumControl, numberControl } from './controls'
import {
  initialWorkbenchState,
  reduceWorkbench,
  serializeConfiguration,
  type WorkbenchState,
} from './state'

const schema = defineControls({
  size: enumControl({ label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' }),
  loading: booleanControl({ label: 'Loading', default: false }),
  rows: numberControl({ label: 'Rows', default: 5, min: 0, max: 20, integer: true }),
})

function apply(state: WorkbenchState, ...actions: Parameters<typeof reduceWorkbench>[2][]) {
  return actions.reduce((current, action) => reduceWorkbench(schema, current, action), state)
}

describe('initialWorkbenchState', () => {
  it('starts from the documented defaults', () => {
    expect(initialWorkbenchState(schema)).toEqual({
      values: { size: 'md', loading: false, rows: 5 },
      theme: 'site',
      viewport: 'full',
      generation: 0,
    })
  })
})

describe('reduceWorkbench', () => {
  const start = initialWorkbenchState(schema)

  it('sets a control to a valid value', () => {
    const next = apply(start, { type: 'set', key: 'size', value: 'lg' })
    expect(next.values).toEqual({ size: 'lg', loading: false, rows: 5 })
  })

  it('sanitizes what it sets', () => {
    expect(apply(start, { type: 'set', key: 'size', value: 'huge' }).values.size).toBe('md')
    expect(apply(start, { type: 'set', key: 'rows', value: 500 }).values.rows).toBe(20)
    expect(apply(start, { type: 'set', key: 'rows', value: 'many' }).values.rows).toBe(5)
    expect(apply(start, { type: 'set', key: 'loading', value: 'true' }).values.loading).toBe(false)
  })

  it('ignores a control the schema does not define', () => {
    for (const key of ['nope', '__proto__', 'constructor', 'toString']) {
      expect(apply(start, { type: 'set', key, value: 'x' })).toBe(start)
    }
    expect(({} as Record<string, unknown>).x).toBeUndefined()
  })

  it('returns the same state when nothing changes', () => {
    expect(apply(start, { type: 'set', key: 'size', value: 'md' })).toBe(start)
    expect(apply(start, { type: 'set', key: 'size', value: 'huge' })).toBe(start)
    expect(apply(start, { type: 'theme', theme: 'site' })).toBe(start)
    expect(apply(start, { type: 'viewport', viewport: 'full' })).toBe(start)
  })

  it('changes the theme and the viewport, and refuses anything else', () => {
    expect(apply(start, { type: 'theme', theme: 'dark' }).theme).toBe('dark')
    expect(apply(start, { type: 'viewport', viewport: 'mobile' }).viewport).toBe('mobile')
    for (const bad of ['sepia', '', 1, null, undefined, {}]) {
      expect(apply(start, { type: 'theme', theme: bad })).toBe(start)
      expect(apply(start, { type: 'viewport', viewport: bad })).toBe(start)
    }
  })

  it('does not change the state it was given', () => {
    const before = JSON.stringify(start)
    apply(start, { type: 'set', key: 'size', value: 'lg' }, { type: 'theme', theme: 'dark' })
    expect(JSON.stringify(start)).toBe(before)
  })

  it('resets values, theme, and viewport to the defaults, and bumps the generation', () => {
    const changed = apply(
      start,
      { type: 'set', key: 'size', value: 'lg' },
      { type: 'set', key: 'rows', value: 12 },
      { type: 'theme', theme: 'dark' },
      { type: 'viewport', viewport: 'tablet' },
    )
    const reset = apply(changed, { type: 'reset' })
    expect(reset.values).toEqual(start.values)
    expect(reset.theme).toBe('site')
    expect(reset.viewport).toBe('full')
    expect(reset.generation).toBe(1)
    // Resetting again still bumps it, so drafts held in fields start over each time.
    expect(apply(reset, { type: 'reset' }).generation).toBe(2)
  })
})

describe('serializeConfiguration', () => {
  it('is plain JSON of the example, its controls, and the preview settings', () => {
    const state = apply(
      initialWorkbenchState(schema),
      { type: 'set', key: 'size', value: 'sm' },
      { type: 'theme', theme: 'dark' },
    )
    const text = serializeConfiguration('button', state)
    expect(JSON.parse(text)).toEqual({
      example: 'button',
      controls: { size: 'sm', loading: false, rows: 5 },
      theme: 'dark',
      viewport: 'full',
    })
    expect(text).toContain('\n  "example": "button"')
  })
})
