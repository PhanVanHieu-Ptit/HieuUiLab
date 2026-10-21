import { describe, expect, it } from 'vitest'

import {
  MAP_VIEW,
  describeUnavailable,
  escapeHtml,
  redactSecrets,
  resolveOnlineBasemap,
  type MapEnv,
  type OnlineBasemap,
} from './config'

const ready: MapEnv = {
  VITE_MAP_STYLE_URL: 'https://tiles.example.com/styles/basic/style.json',
  VITE_MAP_ATTRIBUTION: '© Example Maps, © OpenStreetMap contributors',
}

describe('resolveOnlineBasemap', () => {
  it('is unconfigured when no style URL is set', () => {
    expect(resolveOnlineBasemap({})).toEqual({ status: 'unconfigured' })
    expect(resolveOnlineBasemap({ VITE_MAP_STYLE_URL: '   ' })).toEqual({ status: 'unconfigured' })
  })

  it('is ready with a https URL and an attribution', () => {
    expect(resolveOnlineBasemap(ready)).toEqual({
      status: 'ready',
      styleUrl: 'https://tiles.example.com/styles/basic/style.json',
      host: 'tiles.example.com',
      attribution: '© Example Maps, © OpenStreetMap contributors',
      providerName: 'tiles.example.com',
    })
  })

  it('uses the provider name when one is given', () => {
    const result = resolveOnlineBasemap({ ...ready, VITE_MAP_PROVIDER_NAME: ' Example Maps ' })
    expect(result).toMatchObject({ status: 'ready', providerName: 'Example Maps' })
  })

  it('refuses to enable a basemap without an attribution', () => {
    expect(resolveOnlineBasemap({ VITE_MAP_STYLE_URL: ready.VITE_MAP_STYLE_URL })).toEqual({
      status: 'missing-attribution',
    })
    expect(resolveOnlineBasemap({ ...ready, VITE_MAP_ATTRIBUTION: ' ' })).toEqual({
      status: 'missing-attribution',
    })
  })

  describe('API keys', () => {
    const keyed: MapEnv = {
      ...ready,
      VITE_MAP_STYLE_URL: 'https://tiles.example.com/style.json?key={key}',
    }

    it('needs a key when the URL has the placeholder', () => {
      expect(resolveOnlineBasemap(keyed)).toEqual({ status: 'missing-key' })
      expect(resolveOnlineBasemap({ ...keyed, VITE_MAP_API_KEY: '  ' })).toEqual({
        status: 'missing-key',
      })
    })

    it('substitutes the key, encoded', () => {
      const result = resolveOnlineBasemap({ ...keyed, VITE_MAP_API_KEY: 'a b&c' })
      expect(result).toMatchObject({
        status: 'ready',
        styleUrl: 'https://tiles.example.com/style.json?key=a%20b%26c',
      })
    })

    it('never puts the key in the host or the provider name', () => {
      const result = resolveOnlineBasemap({ ...keyed, VITE_MAP_API_KEY: 'sekret-123' })
      expect(result).toMatchObject({ status: 'ready', host: 'tiles.example.com' })
      if (result.status === 'ready') {
        expect(result.host).not.toContain('sekret')
        expect(result.providerName).not.toContain('sekret')
      }
    })

    it('ignores a key when the URL has no placeholder', () => {
      const result = resolveOnlineBasemap({ ...ready, VITE_MAP_API_KEY: 'sekret-123' })
      expect(result).toMatchObject({ status: 'ready', styleUrl: ready.VITE_MAP_STYLE_URL })
    })
  })

  describe('rejects an unsafe or malformed URL', () => {
    const cases: [string, string, OnlineBasemap][] = [
      ['plain http', 'http://tiles.example.com/style.json', { status: 'invalid', reason: 'not-https' }],
      ['a javascript: URL', 'javascript:alert(1)', { status: 'invalid', reason: 'not-https' }],
      ['a data: URL', 'data:text/plain,hello', { status: 'invalid', reason: 'not-https' }],
      ['text that is not a URL', 'not a url', { status: 'invalid', reason: 'not-a-url' }],
      [
        'credentials in the URL',
        'https://user:pass@tiles.example.com/style.json',
        { status: 'invalid', reason: 'has-credentials' },
      ],
      [
        'an unknown placeholder',
        'https://tiles.example.com/{token}/style.json',
        { status: 'invalid', reason: 'unresolved-placeholder' },
      ],
    ]
    it.each(cases)('%s', (_name, url, expected) => {
      expect(resolveOnlineBasemap({ ...ready, VITE_MAP_STYLE_URL: url })).toEqual(expected)
    })
  })

  it('allows plain http for a loopback host, for a local tile server', () => {
    for (const host of ['localhost:8080', '127.0.0.1:8080']) {
      const result = resolveOnlineBasemap({
        ...ready,
        VITE_MAP_STYLE_URL: `http://${host}/style.json`,
      })
      expect(result.status).toBe('ready')
    }
    expect(
      resolveOnlineBasemap({ ...ready, VITE_MAP_STYLE_URL: 'http://localhost.evil.example/s.json' }),
    ).toEqual({ status: 'invalid', reason: 'not-https' })
  })
})

describe('describeUnavailable', () => {
  it('explains every state that is not ready, without a URL or key', () => {
    const states: Exclude<OnlineBasemap, { status: 'ready' }>[] = [
      { status: 'unconfigured' },
      { status: 'missing-key' },
      { status: 'missing-attribution' },
      { status: 'invalid', reason: 'not-a-url' },
      { status: 'invalid', reason: 'not-https' },
      { status: 'invalid', reason: 'has-credentials' },
      { status: 'invalid', reason: 'unresolved-placeholder' },
    ]
    const texts = states.map(describeUnavailable)
    expect(new Set(texts).size).toBe(states.length)
    for (const text of texts) expect(text).not.toMatch(/https?:\/\//)
  })
})

describe('escapeHtml', () => {
  it('escapes the characters that start markup', () => {
    expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe(
      '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;',
    )
  })
})

describe('redactSecrets', () => {
  it('masks credential-looking query values', () => {
    expect(redactSecrets('GET https://x.test/style.json?key=abc123&lang=en failed')).toBe(
      'GET https://x.test/style.json?key=[redacted]&lang=en failed',
    )
    expect(redactSecrets('https://x.test/t?access_token=pk.xyz')).toBe(
      'https://x.test/t?access_token=[redacted]',
    )
    expect(redactSecrets('https://x.test/t?a=1&apikey=zzz')).toBe(
      'https://x.test/t?a=1&apikey=[redacted]',
    )
  })

  it('leaves text without a credential alone', () => {
    expect(redactSecrets('nothing to hide here')).toBe('nothing to hide here')
  })
})

describe('MAP_VIEW', () => {
  it('lets the online map zoom out further than the island', () => {
    expect(MAP_VIEW.onlineMinZoom).toBeLessThan(MAP_VIEW.minZoom)
    expect(MAP_VIEW.zoom).toBeGreaterThanOrEqual(MAP_VIEW.minZoom)
    expect(MAP_VIEW.zoom).toBeLessThanOrEqual(MAP_VIEW.maxZoom)
  })
})
