import { describe, expect, it } from 'vitest'

import {
  parseMarkdown,
  plainText,
  walkBlocks,
  walkInlines,
  type Block,
  type Inline,
} from './markdown'

function body(source: string): Block[] {
  return parseMarkdown(`# Title\n\n${source}`).blocks
}

describe('title and headings', () => {
  it('takes the leading # heading as the title and removes it from the blocks', () => {
    const doc = parseMarkdown('# Installation\n\nIntro.\n\n## Steps\n')
    expect(doc.title).toBe('Installation')
    expect(doc.h1Count).toBe(1)
    expect(doc.blocks.map((block) => block.type)).toEqual(['paragraph', 'heading'])
  })

  it('has no title when the file does not start with one, and counts every #', () => {
    const doc = parseMarkdown('Intro.\n\n# Late title\n\n# Another\n')
    expect(doc.title).toBeUndefined()
    expect(doc.h1Count).toBe(2)
  })

  it('derives ids from the heading text and numbers repeats', () => {
    const doc = parseMarkdown('# T\n\n## Add the cn helper\n\n## Usage\n\n### Usage\n\n## Usage\n')
    expect(doc.headings).toEqual([
      { depth: 2, id: 'add-the-cn-helper', text: 'Add the cn helper' },
      { depth: 2, id: 'usage', text: 'Usage' },
      { depth: 3, id: 'usage-1', text: 'Usage' },
      { depth: 2, id: 'usage-2', text: 'Usage' },
    ])
  })

  it('uses an explicit {#id} and removes it from the visible text', () => {
    const doc = parseMarkdown('# T\n\n## Add the tokens {#tokens}\n')
    expect(doc.headings).toEqual([{ depth: 2, id: 'tokens', text: 'Add the tokens' }])
    const heading = doc.blocks[0]
    expect(heading?.type === 'heading' && heading.explicitId).toBe('tokens')
    expect(heading?.type === 'heading' && plainText(heading.children)).toBe('Add the tokens')
  })

  it('lets an explicit id win over an automatic one with the same name', () => {
    const doc = parseMarkdown('# T\n\n## Tokens\n\n## Something else {#tokens}\n')
    expect(doc.headings.map((heading) => heading.id)).toEqual(['tokens-1', 'tokens'])
  })

  it('falls back to "section" when a heading has no letters or digits', () => {
    expect(parseMarkdown('# T\n\n## ???\n').headings[0]?.id).toBe('section')
  })

  it('does not treat headings inside other blocks as page headings', () => {
    const [quote] = body('> ## Inside\n')
    expect(quote).toMatchObject({ type: 'quote' })
    const nested = quote?.type === 'quote' ? quote.blocks : []
    expect(nested[0]).toMatchObject({ type: 'unsupported' })
  })
})

describe('directives', () => {
  it('turns a directive paragraph into a directive block', () => {
    expect(body('::registry-api{slug="data-table" part="DataTable"}\n')).toEqual([
      {
        type: 'directive',
        directive: { name: 'registry-api', attrs: { slug: 'data-table', part: 'DataTable' } },
      },
    ])
  })

  it('keeps underscores and asterisks in attributes untouched', () => {
    const [block] = body('::source{path="src/a_b_c.ts"}\n')
    expect(block).toMatchObject({ directive: { attrs: { path: 'src/a_b_c.ts' } } })
  })

  it('reports a malformed directive instead of showing it as prose', () => {
    const [block] = body('::registry-api{slug=button}\n')
    expect(block).toMatchObject({ type: 'invalid-directive' })
  })

  it('reports an unknown directive and a missing attribute', () => {
    expect(body('::nope\n')[0]).toMatchObject({
      type: 'invalid-directive',
      error: expect.stringContaining('unknown directive ::nope') as unknown,
    })
    expect(body('::registry-api\n')[0]).toMatchObject({
      type: 'invalid-directive',
      error: '::registry-api needs slug="…"',
    })
  })

  it('reports a directive run into the line above it', () => {
    expect(body('Some text\n::theme-switcher\n')[0]).toMatchObject({ type: 'invalid-directive' })
  })

  it('reports a directive inside a list or a quote', () => {
    const [list] = body('- ::theme-switcher\n')
    expect(list?.type === 'list' && list.items[0]?.[0]).toMatchObject({
      type: 'invalid-directive',
      error: 'directives are only allowed at the top level of a page',
    })
    const [quote] = body('> ::theme-switcher\n')
    expect(quote?.type === 'quote' && quote.blocks[0]).toMatchObject({ type: 'invalid-directive' })
  })

  it('does not treat a directive written in a code fence as one', () => {
    const [block] = body('```text title="example"\n::theme-switcher\n```\n')
    expect(block).toMatchObject({ type: 'code', text: '::theme-switcher' })
  })
})

describe('code fences', () => {
  it('reads the language and title from the info string', () => {
    const [block] = body('```tsx title="src/example.tsx"\nconst a = 1\n```\n')
    expect(block).toEqual({
      type: 'code',
      lang: 'tsx',
      attrs: { title: 'src/example.tsx' },
      error: undefined,
      text: 'const a = 1',
    })
  })

  it('keeps code as written, without HTML escaping or entity decoding', () => {
    const [block] = body('```tsx title="x"\n<div>&amp;</div>\n```\n')
    expect(block).toMatchObject({ text: '<div>&amp;</div>' })
  })

  it('accepts a fence without a language or title, and leaves the checks to validation', () => {
    expect(body('```\nplain\n```\n')[0]).toMatchObject({ lang: '', attrs: {}, text: 'plain' })
  })

  it('reports an info string that is not key="value" pairs', () => {
    const [block] = body('```tsx title=x\ncode\n```\n')
    expect(block).toMatchObject({ type: 'code', lang: 'tsx', error: expect.any(String) as unknown })
  })

  it('does not support indented code blocks', () => {
    expect(body('para\n\n    indented\n')[1]).toMatchObject({
      type: 'unsupported',
      reason: expect.stringContaining('indented') as unknown,
    })
  })
})

describe('alerts and quotes', () => {
  it.each(['NOTE', 'TIP', 'IMPORTANT', 'CAUTION'])('reads [!%s] as an alert', (kind) => {
    const [block] = body(`> [!${kind}]\n> Be **careful** with \`this\`.\n`)
    expect(block).toMatchObject({ type: 'alert', kind })
    const paragraph = block?.type === 'alert' ? block.blocks[0] : undefined
    expect(paragraph?.type === 'paragraph' && plainText(paragraph.children)).toBe(
      'Be careful with this.',
    )
  })

  it('keeps several paragraphs in one alert', () => {
    const [block] = body('> [!NOTE]\n> First.\n>\n> Second.\n')
    expect(block?.type === 'alert' && block.blocks.map((item) => item.type)).toEqual([
      'paragraph',
      'paragraph',
    ])
  })

  it('does not support alert kinds Prettier would strip, or lower-case kinds', () => {
    for (const marker of ['[!WARNING]', '[!note]']) {
      expect(body(`> ${marker}\n> Text.\n`)[0]).toMatchObject({
        type: 'unsupported',
        reason: expect.stringContaining('not a supported alert') as unknown,
      })
    }
  })

  it('reads a plain blockquote as a quote', () => {
    expect(body('> Just a quote.\n')[0]).toMatchObject({ type: 'quote' })
  })
})

describe('lists and tables', () => {
  it('reads tight, loose, ordered, and nested lists', () => {
    const [tight, ordered] = body('- one\n  - nested\n- two\n\n3. third\n4. fourth\n')
    expect(tight).toMatchObject({ type: 'list', ordered: false, start: 1 })
    expect(tight?.type === 'list' && tight.items).toHaveLength(2)
    const first = tight?.type === 'list' ? tight.items[0] : undefined
    expect(first?.map((block) => block.type)).toEqual(['paragraph', 'list'])
    expect(ordered).toMatchObject({ type: 'list', ordered: true, start: 3 })
  })

  it('reads a table with alignment and inline content in cells', () => {
    const [table] = body('| A | B |\n| --- | :-: |\n| `x` | **y** |\n')
    expect(table).toMatchObject({ type: 'table', align: [null, 'center'] })
    if (table?.type !== 'table') return
    expect(table.header.map(plainText)).toEqual(['A', 'B'])
    expect(table.rows[0]?.map(plainText)).toEqual(['x', 'y'])
    expect(table.rows[0]?.[0]?.[0]).toEqual({ type: 'code', text: 'x' })
  })
})

describe('inline content', () => {
  it('reads emphasis, deletion, code, links, and line breaks', () => {
    const [paragraph] = body('A **b** and *c* and ~~d~~ with `e`, [f](/docs/g#h)  \nnext\n')
    const types = paragraph?.type === 'paragraph' ? paragraph.children.map((item) => item.type) : []
    expect(types).toEqual([
      'text',
      'strong',
      'text',
      'em',
      'text',
      'del',
      'text',
      'code',
      'text',
      'link',
      'br',
      'text',
    ])
  })

  it('keeps the destination of a link and of an autolink', () => {
    const hrefs: string[] = []
    walkInlines(body('[a](/docs/a#b) and <https://example.com/x>\n'), (inline) => {
      if (inline.type === 'link') hrefs.push(inline.href)
    })
    expect(hrefs).toEqual(['/docs/a#b', 'https://example.com/x'])
  })

  it('leaves characters and entities as written, for React to escape', () => {
    const [paragraph] = body('Tom & "Jerry" &amp; co\n')
    expect(paragraph?.type === 'paragraph' && plainText(paragraph.children)).toBe(
      'Tom & "Jerry" &amp; co',
    )
  })

  it.each([
    ['raw inline HTML', 'a <b>bold</b> word', 'raw HTML'],
    ['an image', '![alt](/x.png)', 'images'],
  ])('flags %s as unsupported', (_, source, reason) => {
    const found: Inline[] = []
    walkInlines(body(`${source}\n`), (inline) => {
      if (inline.type === 'unsupported') found.push(inline)
    })
    expect(found[0]).toMatchObject({ reason: expect.stringContaining(reason) as unknown })
  })
})

describe('unsupported blocks', () => {
  it.each([
    ['a raw HTML block', '<div>hi</div>\n', 'raw HTML'],
    ['a task list', '- [ ] todo\n', 'task lists'],
  ])('flags %s', (_, source, reason) => {
    const found: Block[] = []
    walkBlocks(body(source), (block) => {
      if (block.type === 'unsupported') found.push(block)
    })
    expect(found[0]).toMatchObject({ reason: expect.stringContaining(reason) as unknown })
  })
})

describe('walkers', () => {
  const doc = parseMarkdown(
    '# T\n\nA [link](/a) in text.\n\n- item with [nested](/b)\n\n> [!NOTE]\n> alert with [third](/c)\n\n| H |\n| - |\n| [cell](/d) |\n',
  )

  it('visit blocks inside lists and alerts', () => {
    const types: string[] = []
    walkBlocks(doc.blocks, (block) => types.push(block.type))
    expect(types).toEqual(['paragraph', 'list', 'paragraph', 'alert', 'paragraph', 'table'])
  })

  it('visit inline nodes everywhere, tables and alerts included', () => {
    const hrefs: string[] = []
    walkInlines(doc.blocks, (inline) => {
      if (inline.type === 'link') hrefs.push(inline.href)
    })
    expect(hrefs).toEqual(['/a', '/b', '/c', '/d'])
  })
})
