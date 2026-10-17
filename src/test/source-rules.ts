/**
 * Things a copy-in block or template must not do: follow the window, reach the outside world, or
 * break theming. Checked on source text, because jsdom has no layout.
 */
export const forbiddenInSource: readonly [description: string, pattern: RegExp][] = [
  ['size itself from the viewport (min-h-screen / h-screen)', /\bmin-h-screen\b|\bh-screen\b/],
  ['use dynamic viewport units (dvh)', /\b\d*dvh\b|-\[\d+dvh\]/],
  ['position itself against the window (fixed)', /(?:^|[\s"'`])fixed(?=[\s"'`])/m],
  ['use dark: variants instead of tokens', /\bdark:/],
  ['read the window’s media queries (matchMedia)', /matchMedia/],
  ['read the clock during render (Date.now / new Date())', /Date\.now\(|new Date\(\)/],
  ['make network requests (fetch / XMLHttpRequest)', /\bfetch\(|XMLHttpRequest/],
  [
    'persist anything (localStorage / sessionStorage / cookies)',
    /localStorage|sessionStorage|document\.cookie/,
  ],
  ['depend on a router', /react-router/],
  [
    'use raw palette colors instead of semantic tokens',
    /\b(?:bg|text|border|ring|fill|stroke|outline|from|to|via)-(?:red|green|blue|yellow|orange|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d+)?\b/,
  ],
]
