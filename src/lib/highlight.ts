import type { HighlighterCore } from 'shiki/core'

/** Languages the highlighter knows. `bash` and plain text are shown unhighlighted. */
export type HighlightLanguage = 'tsx' | 'ts' | 'json' | 'css'

let highlighterPromise: Promise<HighlighterCore> | undefined

/**
 * Lazily create a fine-grained Shiki highlighter (TSX first, two themes, JS regex engine — no
 * WASM) so it stays out of the initial bundle. Other grammars load when first asked for.
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

const extraGrammars = new Map<'json' | 'css', Promise<void>>()

function loadGrammar(highlighter: HighlighterCore, language: 'json' | 'css'): Promise<void> {
  let loading = extraGrammars.get(language)
  if (loading === undefined) {
    loading = highlighter.loadLanguage(
      language === 'json'
        ? import('shiki/dist/langs/json.mjs')
        : import('shiki/dist/langs/css.mjs'),
    )
    extraGrammars.set(language, loading)
  }
  return loading
}

/**
 * Returns Shiki HTML with light and dark token colors (switched via CSS variables). `ts` is
 * highlighted with the TSX grammar, which is already loaded and reads plain TypeScript the same
 * except for angle-bracket type assertions, which the docs do not use.
 */
export async function highlightCode(code: string, language: HighlightLanguage): Promise<string> {
  const highlighter = await getHighlighter()
  if (language === 'json' || language === 'css') await loadGrammar(highlighter, language)
  return highlighter.codeToHtml(code, {
    lang: language === 'ts' ? 'tsx' : language,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: 'light',
    // Shiki makes its <pre> focusable by default so it can scroll; CodeBlock's scroll region
    // already is, and two tab stops for one area would be noise.
    tabindex: false,
  })
}
