import { describe, expect, it } from 'vitest'

import {
  classifyError,
  classifyStatus,
  extractUrls,
  isCheckable,
  isInsecure,
  withoutFragment,
} from './external-links.ts'

describe('extractUrls', () => {
  it('finds addresses in prose, Markdown links, quotes and code, without the punctuation after them', () => {
    const text = [
      'See https://react.dev. Also [Vite](https://vite.dev/guide), "https://lucide.dev",',
      "href: 'https://cva.style' and (https://tailwindcss.com/docs#v4).",
    ].join('\n')
    expect(extractUrls(text)).toEqual([
      'https://react.dev',
      'https://vite.dev/guide',
      'https://lucide.dev',
      'https://cva.style',
      'https://tailwindcss.com/docs#v4',
    ])
  })

  it('finds nothing in text without an address', () => {
    expect(extractUrls('no links here, only a/relative/path and ftp-like words')).toEqual([])
  })
})

describe('isCheckable', () => {
  it('accepts the address of a real site', () => {
    expect(isCheckable('https://github.com/PhanVanHieu-Ptit/HieuUiLab')).toBe(true)
    expect(isCheckable('https://operations.osmfoundation.org/policies/tiles/')).toBe(true)
  })

  it.each([
    'https://tiles.example.com/style.json',
    'https://example.com',
    'http://localhost:5173',
    'http://127.0.0.1:4173',
    'https://www.w3.org/2000/svg',
    'https://openapi.vercel.sh/vercel.json',
    'https://github.com/<owner>/<repo>',
    'https://tiles.example.org/{token}/style.json',
    'not a url',
  ])('skips %s', (url) => {
    expect(isCheckable(url)).toBe(false)
  })
})

describe('classifyStatus', () => {
  it.each([
    [200, 'ok'],
    [301, 'ok'],
    [404, 'broken'],
    [410, 'broken'],
    [401, 'unverified'],
    [403, 'unverified'],
    [429, 'unverified'],
    [500, 'unverified'],
    [503, 'unverified'],
  ] as const)('reads %i as %s', (status, verdict) => {
    expect(classifyStatus(status)).toBe(verdict)
  })
})

describe('classifyError', () => {
  it('calls an unknown host or a bad certificate broken, and a timeout unverified', () => {
    const wrapped = (code: string) =>
      new TypeError('fetch failed', { cause: Object.assign(new Error(code), { code }) })
    expect(classifyError(wrapped('ENOTFOUND'))).toEqual({ verdict: 'broken', reason: 'ENOTFOUND' })
    expect(classifyError(wrapped('ERR_TLS_CERT_ALTNAME_INVALID')).verdict).toBe('broken')
    expect(classifyError(wrapped('ECONNRESET')).verdict).toBe('unverified')
    expect(classifyError(new DOMException('timed out', 'TimeoutError'))).toEqual({
      verdict: 'unverified',
      reason: 'TimeoutError',
    })
  })
})

describe('small helpers', () => {
  it('drops a fragment and spots plain http', () => {
    expect(withoutFragment('https://a.dev/page#top')).toBe('https://a.dev/page')
    expect(withoutFragment('https://a.dev/page')).toBe('https://a.dev/page')
    expect(isInsecure('http://a.dev')).toBe(true)
    expect(isInsecure('https://a.dev')).toBe(false)
  })
})
