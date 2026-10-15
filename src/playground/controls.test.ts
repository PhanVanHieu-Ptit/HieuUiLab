import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  booleanControl,
  checkNumberDraft,
  checkStringDraft,
  defaultValues,
  defineControls,
  enumControl,
  numberControl,
  sanitizeValue,
  sanitizeValues,
  stringControl,
  type ValuesOf,
} from './controls'

const count = numberControl({ label: 'Count', default: 5, min: 1, max: 10, integer: true })
const ratio = numberControl({ label: 'Ratio', default: 0.5, min: 0, max: 1, step: 0.1 })
const text = stringControl({ label: 'Text', default: 'Hello', maxLength: 8 })
const required = stringControl({ label: 'Name', default: 'Ada', required: true })
const size = enumControl({ label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' })
const flag = booleanControl({ label: 'Flag', default: false })

describe('sanitizeValue: boolean', () => {
  it('accepts only real booleans', () => {
    expect(sanitizeValue(flag, true)).toBe(true)
    expect(sanitizeValue(flag, false)).toBe(false)
    for (const raw of ['true', 'false', 1, 0, null, undefined, {}, []]) {
      expect(sanitizeValue(flag, raw)).toBe(false)
    }
  })
})

describe('sanitizeValue: enum', () => {
  it('accepts an option and falls back to the default for anything else', () => {
    expect(sanitizeValue(size, 'lg')).toBe('lg')
    for (const raw of ['xl', 'LG', ' lg', '', 1, null, undefined, ['lg'], {}]) {
      expect(sanitizeValue(size, raw)).toBe('md')
    }
  })

  it('never reads an option as an object key', () => {
    for (const raw of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'length', '0']) {
      expect(sanitizeValue(size, raw)).toBe('md')
    }
  })
})

describe('sanitizeValue: number', () => {
  it('accepts numbers and plain numeric text', () => {
    expect(sanitizeValue(count, 7)).toBe(7)
    expect(sanitizeValue(count, '7')).toBe(7)
    expect(sanitizeValue(count, '  7 ')).toBe(7)
    expect(sanitizeValue(count, '+7')).toBe(7)
    expect(sanitizeValue(ratio, '.25')).toBe(0.25)
    expect(sanitizeValue(ratio, '1.')).toBe(1)
  })

  it('falls back to the default for anything that is not a finite number', () => {
    const rejected = [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      '',
      '   ',
      'abc',
      '1e3',
      '0x10',
      '1,5',
      '1 2',
      '--1',
      '٣',
      null,
      undefined,
      true,
      [],
      [3],
      {},
    ]
    for (const [index, raw] of rejected.entries()) {
      expect(sanitizeValue(count, raw), `rejected input #${String(index)}`).toBe(5)
    }
  })

  it('clamps a number outside the range', () => {
    expect(sanitizeValue(count, 0)).toBe(1)
    expect(sanitizeValue(count, -100)).toBe(1)
    expect(sanitizeValue(count, 1e9)).toBe(10)
    expect(sanitizeValue(count, '999999999999999999999')).toBe(10)
  })

  it('rounds an integer control, and never returns negative zero', () => {
    expect(sanitizeValue(count, 2.4)).toBe(2)
    expect(sanitizeValue(count, 2.5)).toBe(3)
    expect(Object.is(sanitizeValue(ratio, -0), 0)).toBe(true)
    const wide = numberControl({ label: 'Offset', default: 0, min: -5, max: 5, integer: true })
    expect(Object.is(sanitizeValue(wide, -0.4), 0)).toBe(true)
  })

  it('keeps fractions on a control that is not an integer', () => {
    expect(sanitizeValue(ratio, 0.35)).toBe(0.35)
  })
})

describe('sanitizeValue: string', () => {
  it('keeps ordinary text, including whitespace and non-Latin scripts', () => {
    expect(sanitizeValue(text, 'a b')).toBe('a b')
    expect(sanitizeValue(text, ' x ')).toBe(' x ')
    expect(sanitizeValue(text, 'Xin chào')).toBe('Xin chào')
  })

  it('falls back to the default for a value that is not text', () => {
    for (const raw of [1, true, null, undefined, {}, ['a']]) {
      expect(sanitizeValue(text, raw)).toBe('Hello')
    }
  })

  it('turns line breaks into a space and removes control characters', () => {
    expect(sanitizeValue(text, 'a\nb')).toBe('a b')
    expect(sanitizeValue(text, 'a \r\n b')).toBe('a b')
    expect(sanitizeValue(text, 'a\tb')).toBe('a b')
    expect(sanitizeValue(text, 'a\u0000b\u0007c')).toBe('abc')
  })

  it('removes bidirectional overrides that make text read differently from how it is stored', () => {
    expect(sanitizeValue(text, 'ab‮cd')).toBe('abcd')
    expect(sanitizeValue(text, '⁦ab⁩')).toBe('ab')
  })

  it('truncates by character, never in the middle of one', () => {
    expect(sanitizeValue(text, 'abcdefghij')).toBe('abcdefgh')
    // Each emoji is two UTF-16 units but one character.
    expect(sanitizeValue(text, '😀'.repeat(20))).toBe('😀'.repeat(8))
    expect(sanitizeValue(text, '1234567😀x')).toBe('1234567😀')
  })

  it('replaces blank text only when the control is required', () => {
    expect(sanitizeValue(text, '')).toBe('')
    expect(sanitizeValue(text, '   ')).toBe('   ')
    expect(sanitizeValue(required, '')).toBe('Ada')
    expect(sanitizeValue(required, '  \n ')).toBe('Ada')
    expect(sanitizeValue(required, '‮')).toBe('Ada')
    expect(sanitizeValue(required, 'Grace')).toBe('Grace')
  })

  it('treats markup as plain text', () => {
    expect(sanitizeValue(text, '<b>x</b>')).toBe('<b>x</b>')
  })
})

describe('sanitizeValue is idempotent', () => {
  const cases: [string, ReturnType<typeof defineControls>[string], unknown[]][] = [
    ['number', count, [Number.NaN, 0, 3.7, 1e9, '4', 'x']],
    ['string', text, ['', 'a\nb', 'x'.repeat(30), '‮abc', 1]],
    ['required string', required, ['', ' ', 'ok', 5]],
    ['enum', size, ['sm', 'xl', 3]],
    ['boolean', flag, [true, 'no', null]],
  ]
  it.each(cases)('%s', (_name, control, inputs) => {
    for (const raw of inputs) {
      const once = sanitizeValue(control, raw)
      expect(sanitizeValue(control, once)).toBe(once)
    }
  })
})

describe('sanitizeValues', () => {
  const schema = defineControls({ size, flag, count, text })

  it('fills in defaults for missing keys', () => {
    expect(sanitizeValues(schema, {})).toEqual({ size: 'md', flag: false, count: 5, text: 'Hello' })
  })

  it('sanitizes every value it keeps', () => {
    expect(sanitizeValues(schema, { size: 'xl', flag: 'yes', count: '99', text: 'a\nb' })).toEqual({
      size: 'md',
      flag: false,
      count: 10,
      text: 'a b',
    })
  })

  it('ignores keys the schema does not define, including prototype keys', () => {
    const raw = JSON.parse(
      '{"__proto__": {"polluted": true}, "constructor": 1, "extra": 2}',
    ) as Record<string, unknown>
    const values = sanitizeValues(schema, raw)
    expect(Object.keys(values).sort()).toEqual(['count', 'flag', 'size', 'text'])
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('does not read inherited properties as values', () => {
    const inherited = Object.create({ size: 'lg' }) as Record<string, unknown>
    expect(sanitizeValues(schema, inherited).size).toBe('md')
  })

  it('round-trips the defaults', () => {
    expect(sanitizeValues(schema, defaultValues(schema))).toEqual(defaultValues(schema))
  })
})

describe('checkNumberDraft', () => {
  it('accepts a value in range', () => {
    expect(checkNumberDraft(count, '7')).toEqual({ ok: true, value: 7 })
    expect(checkNumberDraft(count, ' 10 ')).toEqual({ ok: true, value: 10 })
    expect(checkNumberDraft(ratio, '0.3')).toEqual({ ok: true, value: 0.3 })
  })

  it('refuses, with a message, what it would otherwise have to guess at', () => {
    for (const text of ['', ' ', 'abc', '1e1', '0x5', '0', '11', '-3', '2.5', '1,0']) {
      const result = checkNumberDraft(count, text)
      expect(result.ok, text).toBe(false)
      if (!result.ok) expect(result.message).toBe('Enter a whole number from 1 to 10.')
    }
    const fraction = checkNumberDraft(ratio, '2')
    expect(fraction).toEqual({ ok: false, message: 'Enter a number from 0 to 1.' })
  })
})

describe('checkStringDraft', () => {
  it('accepts text, cleaned the way sanitizing cleans it', () => {
    expect(checkStringDraft(text, 'a\nb')).toEqual({ ok: true, value: 'a b' })
    expect(checkStringDraft(text, '')).toEqual({ ok: true, value: '' })
  })

  it('refuses blank text for a required control', () => {
    for (const draft of ['', '   ', '\n', '‮']) {
      expect(checkStringDraft(required, draft), draft).toEqual({
        ok: false,
        message: 'Enter some text.',
      })
    }
    expect(checkStringDraft(required, 'Grace')).toEqual({ ok: true, value: 'Grace' })
  })
})

describe('control definitions', () => {
  it('reject a default that is not valid for the control', () => {
    expect(() => stringControl({ label: 'T', default: 'abcdef', maxLength: 3 })).toThrow(/too long/)
    expect(() => stringControl({ label: 'T', default: 'a\nb' })).toThrow(/control characters/)
    expect(() => stringControl({ label: 'T', default: ' ', required: true })).toThrow(/blank/)
    expect(() => stringControl({ label: 'T', default: 'a', maxLength: 0 })).toThrow(/maxLength/)
    expect(() => numberControl({ label: 'N', default: 0, min: 1, max: 5 })).toThrow(/outside/)
    expect(() => numberControl({ label: 'N', default: 3, min: 5, max: 1 })).toThrow(/min is above/)
    expect(() => numberControl({ label: 'N', default: 3, min: 1, max: 5, step: 0 })).toThrow(/step/)
    expect(() => numberControl({ label: 'N', default: Number.NaN, min: 1, max: 5 })).toThrow(
      /finite/,
    )
    expect(() =>
      numberControl({ label: 'N', default: 1.5, min: 1, max: 5, integer: true }),
    ).toThrow(/whole/)
    expect(() => enumControl({ label: 'E', options: ['a', 'a'], default: 'a' })).toThrow(/repeat/)
  })

  it('reject an enum default that is not an option, at runtime and at compile time', () => {
    expect(() =>
      enumControl({
        label: 'E',
        options: ['a', 'b'],
        // @ts-expect-error -- 'c' is not one of the options.
        default: 'c',
      }),
    ).toThrow(/not an option/)
  })

  it('give a schema nothing to hide behind', () => {
    expect(() => defineControls({})).toThrow(/needs a control/)
    expect(() => defineControls(JSON.parse('{"__proto__": {}}') as Record<string, never>)).toThrow(
      /__proto__/,
    )
  })

  it('apply the documented defaults', () => {
    expect(text.required).toBe(false)
    expect(stringControl({ label: 'T', default: '' }).maxLength).toBe(120)
    expect(count.step).toBe(1)
    expect(ratio.integer).toBe(false)
    expect(size.display).toBe('select')
  })
})

describe('ValuesOf', () => {
  it('gives each control the type of its values', () => {
    const schema = defineControls({ size, flag, count, text })
    expect(Object.keys(schema)).toEqual(['size', 'flag', 'count', 'text'])
    type Values = ValuesOf<typeof schema>
    expectTypeOf<Values['size']>().toEqualTypeOf<'sm' | 'md' | 'lg'>()
    expectTypeOf<Values['flag']>().toEqualTypeOf<boolean>()
    expectTypeOf<Values['count']>().toEqualTypeOf<number>()
    expectTypeOf<Values['text']>().toEqualTypeOf<string>()
  })

  it('keeps an enum a union when the control is written inside defineControls', () => {
    const schema = defineControls({
      tone: enumControl({ label: 'Tone', options: ['calm', 'loud'], default: 'calm' }),
    })
    expect(schema.tone.options).toEqual(['calm', 'loud'])
    expectTypeOf<ValuesOf<typeof schema>['tone']>().toEqualTypeOf<'calm' | 'loud'>()
  })
})
