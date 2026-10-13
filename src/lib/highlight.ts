import type { HighlighterCore } from 'shiki/core'

let highlighterPromise: Promise<HighlighterCore> | undefined

/**
 * Lazily create a fine-grained Shiki highlighter (TSX only, two themes,
 * JS regex engine — no WASM) so it stays out of the initial bundle.
 */
function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
    ])
    return createHighlighterCore({
      themes: [
        import('shiki/dist/themes/github-light.mjs'),
        import('shiki/dist/themes/github-dark.mjs'),
      ],
      langs: [import('shiki/dist/langs/tsx.mjs')],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return highlighterPromise
}

/** Returns Shiki HTML with light and dark token colors (switched via CSS variables). */
export async function highlightTsx(code: string): Promise<string> {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, {
    lang: 'tsx',
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: 'light',
  })
}
