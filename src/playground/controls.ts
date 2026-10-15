/** A value a control can hold. */
export type ControlValue = boolean | string | number
export type ControlValues = Readonly<Record<string, ControlValue>>

export interface BooleanControl {
  readonly kind: 'boolean'
  readonly label: string
  readonly default: boolean
}

export interface StringControl {
  readonly kind: 'string'
  readonly label: string
  readonly default: string
  /** In characters (code points). Bounds what can reach the preview and the code panel. */
  readonly maxLength: number
  /** A blank value is replaced by the default. */
  readonly required: boolean
}

export interface EnumControl<O extends string = string> {
  readonly kind: 'enum'
  readonly label: string
  readonly options: readonly [O, ...O[]]
  readonly default: O
  /** `segmented` shows a radio group; it suits two or three short options. */
  readonly display: 'select' | 'segmented'
}

export interface NumberControl {
  readonly kind: 'number'
  readonly label: string
  readonly default: number
  readonly min: number
  readonly max: number
  readonly step: number
  /** Whole numbers only. */
  readonly integer: boolean
}

export type ControlDef = BooleanControl | StringControl | EnumControl | NumberControl
export type ControlSchema = Readonly<Record<string, ControlDef>>

type ValueOf<C extends ControlDef> = C extends BooleanControl
  ? boolean
  : C extends StringControl
    ? string
    : C extends NumberControl
      ? number
      : C extends EnumControl<infer O>
        ? O
        : never

/** The value type of each control in a schema: an enum is the union of its options. */
export type ValuesOf<S extends ControlSchema> = { readonly [K in keyof S]: ValueOf<S[K]> }

const defaultMaxLength = 120

function invalid(label: string, problem: string): never {
  throw new Error(`Invalid control "${label}": ${problem}`)
}

export function booleanControl(def: { label: string; default: boolean }): BooleanControl {
  return { kind: 'boolean', label: def.label, default: def.default }
}

export function stringControl(def: {
  label: string
  default: string
  maxLength?: number
  required?: boolean
}): StringControl {
  const maxLength = def.maxLength ?? defaultMaxLength
  const control: StringControl = {
    kind: 'string',
    label: def.label,
    default: def.default,
    maxLength,
    required: def.required ?? false,
  }
  if (!Number.isInteger(maxLength) || maxLength < 1) invalid(def.label, 'maxLength must be >= 1')
  if (cleanString(control, def.default) !== def.default) {
    invalid(def.label, 'the default is too long or has control characters')
  }
  if (control.required && def.default.trim() === '') invalid(def.label, 'the default is blank')
  return control
}

export function enumControl<O extends string>(def: {
  label: string
  options: readonly [O, ...O[]]
  default: NoInfer<O>
  display?: 'select' | 'segmented'
  // NoInfer: inside `defineControls({...})` the expected `EnumControl<string>` would otherwise
  // widen the options to `string` and lose the union.
}): EnumControl<NoInfer<O>> {
  if (new Set(def.options).size !== def.options.length) invalid(def.label, 'options repeat')
  if (!def.options.includes(def.default)) invalid(def.label, 'the default is not an option')
  return {
    kind: 'enum',
    label: def.label,
    options: def.options,
    default: def.default,
    display: def.display ?? 'select',
  }
}

export function numberControl(def: {
  label: string
  default: number
  min: number
  max: number
  step?: number
  integer?: boolean
}): NumberControl {
  const control: NumberControl = {
    kind: 'number',
    label: def.label,
    default: def.default,
    min: def.min,
    max: def.max,
    step: def.step ?? 1,
    integer: def.integer ?? false,
  }
  const bounds = [control.default, control.min, control.max, control.step]
  if (!bounds.every((bound) => Number.isFinite(bound))) {
    invalid(def.label, 'default, min, max, and step must be finite')
  }
  if (control.min > control.max) invalid(def.label, 'min is above max')
  if (control.step <= 0) invalid(def.label, 'step must be positive')
  if (control.default < control.min || control.default > control.max) {
    invalid(def.label, 'the default is outside min and max')
  }
  const whole = [control.default, control.min, control.max].every((bound) =>
    Number.isInteger(bound),
  )
  if (control.integer && !whole) {
    invalid(def.label, 'an integer control needs whole default, min, and max')
  }
  return control
}

/** Identity that checks the shape of a schema and rejects keys that could pollute a plain object. */
export function defineControls<S extends ControlSchema>(schema: S): S {
  if (Object.keys(schema).length === 0) throw new Error('A control schema needs a control')
  if (Object.hasOwn(schema, '__proto__')) throw new Error('A control cannot be named "__proto__"')
  return schema
}

export function defaultValues(schema: ControlSchema): ControlValues {
  return Object.fromEntries(Object.entries(schema).map(([key, control]) => [key, control.default]))
}

// Control characters (tab and newline included) and the bidirectional overrides that can make
// text display differently from how it reads in the code panel.
const strippedCharacters = /[\p{Cc}‪-‮⁦-⁩]/gu

/** `text` with line breaks as single spaces, control characters removed, and at most `maxLength` characters. */
function cleanString(control: StringControl, text: string): string {
  return Array.from(text.replace(/\s*[\r\n\t]+\s*/g, ' ').replace(strippedCharacters, ''))
    .slice(0, control.maxLength)
    .join('')
}

function sanitizeString(control: StringControl, raw: unknown): string {
  if (typeof raw !== 'string') return control.default
  const text = cleanString(control, raw)
  return control.required && text.trim() === '' ? control.default : text
}

const numericText = /^\s*[+-]?(?:\d+\.?\d*|\.\d+)\s*$/

/** The number a value means, or undefined when it does not mean one. Exponents and hex are not numbers here. */
function parseNumber(raw: unknown): number | undefined {
  const value = typeof raw === 'string' && numericText.test(raw) ? Number(raw) : raw
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function sanitizeNumber(control: NumberControl, raw: unknown): number {
  const parsed = parseNumber(raw)
  if (parsed === undefined) return control.default
  const clamped = Math.min(Math.max(parsed, control.min), control.max)
  const value = control.integer ? Math.round(clamped) : clamped
  // Math.round(-0.4) is -0, which prints as 0 but is not equal to it.
  return value === 0 ? 0 : value
}

/**
 * A valid value for `control` whatever `raw` is: a wrong type or an unknown option gives the
 * default, and a number outside its range is clamped. Safe on untrusted input, and idempotent.
 */
export function sanitizeValue(control: ControlDef, raw: unknown): ControlValue {
  switch (control.kind) {
    case 'boolean':
      return typeof raw === 'boolean' ? raw : control.default
    case 'string':
      return sanitizeString(control, raw)
    case 'enum':
      // Compared one by one; an option is never looked up as an object key.
      return control.options.find((option) => option === raw) ?? control.default
    case 'number':
      return sanitizeNumber(control, raw)
  }
}

/** Sanitizes each control of `schema` from `raw`. Keys the schema does not define are ignored. */
export function sanitizeValues(
  schema: ControlSchema,
  raw: Readonly<Record<string, unknown>>,
): ControlValues {
  return Object.fromEntries(
    Object.entries(schema).map(([key, control]) => [
      key,
      Object.hasOwn(raw, key) ? sanitizeValue(control, raw[key]) : control.default,
    ]),
  )
}

export type DraftCheck<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly message: string }

/** Describes the range, e.g. "a whole number from 1 to 100". */
export function describeNumberRange(control: NumberControl): string {
  const noun = control.integer ? 'a whole number' : 'a number'
  return `${noun} from ${String(control.min)} to ${String(control.max)}`
}

/**
 * Checks what a user typed into a number field. Unlike `sanitizeValue` it does not clamp:
 * an out-of-range or malformed draft is refused with a message, so the preview never
 * receives a value the user did not mean.
 */
export function checkNumberDraft(control: NumberControl, text: string): DraftCheck<number> {
  const message = `Enter ${describeNumberRange(control)}.`
  const parsed = parseNumber(text)
  if (parsed === undefined) return { ok: false, message }
  if (control.integer && !Number.isInteger(parsed)) return { ok: false, message }
  if (parsed < control.min || parsed > control.max) return { ok: false, message }
  return { ok: true, value: parsed === 0 ? 0 : parsed }
}

/** Checks what a user typed into a text field; only a required field can be refused. */
export function checkStringDraft(control: StringControl, text: string): DraftCheck<string> {
  const value = cleanString(control, text)
  if (control.required && value.trim() === '') return { ok: false, message: 'Enter some text.' }
  return { ok: true, value }
}
