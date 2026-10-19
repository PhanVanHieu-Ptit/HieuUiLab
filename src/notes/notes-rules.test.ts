import { describe, expect, it } from 'vitest'

import { noteFile, type NoteEntry } from './manifest'
import { excerptProblem, validateNotes, type NotesContext } from './notes-rules'

const words = (count: number) => `${Array.from({ length: count }, () => 'word').join(' ')}.`

const files: Record<string, string> = {
  'src/example.ts':
    'export const example = 1\nexport function add(a: number, b: number) {\n  return a + b\n}\n',
  'package.json': '{ "scripts": { "test": "vitest run" } }',
}

const sections: Record<string, string> = {
  'Context and problem': words(110),
  Constraints: words(110),
  'Approach and alternatives considered': words(110),
  'Implementation example': `${words(110)}\n\n\`\`\`ts title="src/example.ts"\nexport const example = 1\n\`\`\``,
  Verification: `${words(60)}\n\n\`\`\`bash title="Command: pnpm test"\npnpm test\n\`\`\`\n\n### What this does not verify\n\n${words(20)}`,
  'Trade-offs and lessons learned': words(110),
}

function source(parts: Record<string, string> = sections, title = 'Sound note'): string {
  const body = Object.entries(parts)
    .map(([heading, text]) => `## ${heading}\n\n${text}`)
    .join('\n\n')
  return `# ${title}\n\n${body}\n`
}

/** The default sections with one replaced, or with `extra` appended to one. */
function withSection(heading: string, text: string, mode: 'replace' | 'append' = 'replace') {
  return source({
    ...sections,
    [heading]: mode === 'replace' ? text : `${sections[heading] ?? ''}\n\n${text}`,
  })
}

function entry(overrides: Partial<NoteEntry> = {}): NoteEntry {
  return {
    slug: 'sound',
    title: 'Sound note',
    summary: 'A sound note.',
    date: '2026-10-19',
    tags: ['react'],
    evidence: [{ label: 'The example', path: 'src/example.ts', anchor: 'example' }],
    load: () => Promise.resolve({ default: '' }),
    ...overrides,
  }
}

interface Setup {
  entry?: NoteEntry
  md?: string
  others?: readonly { entry: NoteEntry; source: string }[]
  disk?: Record<string, string>
  contentFiles?: readonly string[]
}

function context(setup: Setup = {}): NotesContext {
  const main = setup.entry ?? entry()
  const md = setup.md ?? source()
  const articles = [{ entry: main, source: md }, ...(setup.others ?? [])]
  const disk: Record<string, string> = { ...files, ...setup.disk }
  for (const article of articles) disk[noteFile(article.entry)] = article.source
  return {
    articles,
    contentFiles: setup.contentFiles ?? articles.map((article) => noteFile(article.entry)),
    readFile: (path) => disk[path],
    fileExists: (path) => path in disk,
    fileContains: (path, text) => disk[path]?.includes(text) ?? false,
    pathExists: (path) => path in disk || path === 'src',
    routeExists: (path) => ['/docs/testing', '/notes/other'].includes(path),
    scripts: new Set(['test', 'test:e2e', 'typecheck']),
  }
}

function issues(setup: Setup): string[] {
  return validateNotes(context(setup))
}

function expectIssue(found: readonly string[], text: string) {
  expect(
    found.some((issue) => issue.includes(text)),
    `${text}\n${found.join('\n')}`,
  ).toBe(true)
}

describe('a sound note', () => {
  it('has no issues', () => {
    expect(issues({})).toEqual([])
  })

  it('names the article in every issue', () => {
    const found = issues({ entry: entry({ summary: 'No period' }) })
    expect(found.every((issue) => issue.startsWith('notes/sound: '))).toBe(true)
  })
})

describe('the manifest', () => {
  it('rejects a slug or title used twice', () => {
    const other = { entry: entry({ slug: 'other' }), source: source() }
    expectIssue(issues({ others: [{ ...other, entry: entry() }] }), 'the slug is used by another')
    expectIssue(issues({ others: [other] }), 'the title "Sound note" is used by another')
  })

  it('rejects a slug that is not kebab-case', () => {
    expectIssue(issues({ entry: entry({ slug: 'Not_Kebab' }) }), 'the slug must be kebab-case')
  })

  it('rejects an empty title', () => {
    expectIssue(issues({ entry: entry({ title: ' ' }) }), 'the title is empty')
  })

  it('requires a summary that is a sentence and short enough for a card', () => {
    expectIssue(issues({ entry: entry({ summary: 'No period' }) }), 'ending with a period')
    expectIssue(
      issues({ entry: entry({ summary: `${'a'.repeat(230)}.` }) }),
      'longer than 220 characters',
    )
  })

  it('requires real dates', () => {
    expectIssue(issues({ entry: entry({ date: '2026-02-30' }) }), 'is not a date like')
    expectIssue(issues({ entry: entry({ date: '19-10-2026' }) }), 'is not a date like')
    expectIssue(issues({ entry: entry({ updated: 'yesterday' }) }), 'the update date')
  })

  it('rejects an update date before the date', () => {
    expectIssue(
      issues({ entry: entry({ date: '2026-10-19', updated: '2026-10-01' }) }),
      'is before the date',
    )
  })

  it('requires one to four distinct tags from the vocabulary', () => {
    expectIssue(issues({ entry: entry({ tags: [] as never }) }), 'has 0 tags')
    expectIssue(
      issues({ entry: entry({ tags: ['react', 'forms', 'testing', 'theming', 'tooling'] }) }),
      'has 5 tags',
    )
    expectIssue(issues({ entry: entry({ tags: ['react', 'react'] }) }), 'is listed twice')
    expectIssue(
      issues({ entry: entry({ tags: ['reactive'] as never }) }),
      'is not in the vocabulary',
    )
  })

  it('checks the related slugs', () => {
    expectIssue(issues({ entry: entry({ related: ['sound'] }) }), 'lists itself as related')
    expectIssue(issues({ entry: entry({ related: ['nope'] }) }), 'which is no article')
    const other = {
      entry: entry({ slug: 'other', title: 'Other' }),
      source: source(sections, 'Other'),
    }
    expectIssue(
      issues({ entry: entry({ related: ['other', 'other'] }), others: [other] }),
      'as related twice',
    )
  })

  it('requires every article to have a related article once there are two', () => {
    const lonely = {
      entry: entry({ slug: 'other', title: 'Other', tags: ['testing'] }),
      source: source(sections, 'Other'),
    }
    expectIssue(issues({ others: [lonely] }), 'has no related article')
    expect(issues({ entry: entry({ related: ['other'] }), others: [lonely] })).toEqual([])
  })

  it('requires evidence that exists', () => {
    expectIssue(issues({ entry: entry({ evidence: [] as never }) }), 'names no evidence')
    expectIssue(
      issues({ entry: entry({ evidence: [{ label: ' ', path: 'src/example.ts' }] }) }),
      'evidence with no label',
    )
    expectIssue(
      issues({ entry: entry({ evidence: [{ label: 'A', path: '../secrets' }] }) }),
      'not a safe repository path',
    )
    expectIssue(
      issues({ entry: entry({ evidence: [{ label: 'A', path: 'src/missing.ts' }] }) }),
      'src/missing.ts" does not exist',
    )
    expectIssue(
      issues({
        entry: entry({ evidence: [{ label: 'A', path: 'src/example.ts', anchor: 'nope' }] }),
      }),
      'does not contain "nope"',
    )
    expectIssue(
      issues({
        entry: entry({
          evidence: [
            { label: 'A', path: 'src/example.ts' },
            { label: 'A', path: 'package.json' },
          ],
        }),
      }),
      'two pieces of evidence labelled "A"',
    )
  })

  it('requires the file, and that the loader returns it', () => {
    const base = context()
    expectIssue(
      validateNotes({ ...base, readFile: () => undefined }),
      'its file src/notes/content/sound.md does not exist',
    )
    expectIssue(
      validateNotes({
        ...base,
        readFile: (path) => (path.endsWith('sound.md') ? 'other' : files[path]),
      }),
      'returns something other than',
    )
  })

  it('rejects a Markdown file that belongs to no article', () => {
    expectIssue(
      issues({ contentFiles: ['src/notes/content/sound.md', 'src/notes/content/orphan.md'] }),
      'orphan.md belongs to no article',
    )
  })

  it('applies the prose guards to the title and summary', () => {
    expectIssue(
      issues({ entry: entry({ summary: 'It cut load time by 40%.' }) }),
      'the summary makes a numeric metric',
    )
    expectIssue(
      issues({ entry: entry({ title: 'Sound note after the outage' }) }),
      'the title makes a history',
    )
  })
})

describe('the template', () => {
  it('requires the title to match the manifest', () => {
    expectIssue(
      issues({ md: source(sections, 'Another title') }),
      'the manifest title is "Sound note"',
    )
  })

  it('requires every section', () => {
    const rest = Object.fromEntries(
      Object.entries(sections).filter(([heading]) => heading !== 'Constraints'),
    )
    expectIssue(issues({ md: source(rest) }), 'is missing the "## Constraints" section')
  })

  it('rejects a section the template does not have', () => {
    expectIssue(
      issues({ md: source({ ...sections, Extras: words(40) }) }),
      'has the section "## Extras"',
    )
  })

  it('requires the sections in order', () => {
    const { Constraints, ...rest } = sections
    expectIssue(issues({ md: source({ ...rest, Constraints: Constraints ?? '' }) }), 'out of order')
  })

  it('requires References when the note links to an external source, and only then', () => {
    const cited = withSection(
      'Context and problem',
      'See [the spec](https://example.com/spec).',
      'append',
    )
    expectIssue(issues({ md: cited }), 'has no "## References" section')

    const listed = source({
      ...sections,
      'Context and problem': `${sections['Context and problem'] ?? ''}\n\nSee [the spec](https://example.com/spec).`,
      References: '- [The spec](https://example.com/spec)',
    })
    expect(issues({ md: listed })).toEqual([])

    expectIssue(
      issues({ md: source({ ...sections, References: '- Nothing to cite.' }) }),
      'links to no external source',
    )
  })

  it('requires an external link to be listed under References', () => {
    const md = source({
      ...sections,
      'Context and problem': `${sections['Context and problem'] ?? ''}\n\nSee [the spec](https://example.com/spec).`,
      References: '- [Another](https://example.com/other)',
    })
    expectIssue(
      issues({ md }),
      'https://example.com/spec, which is not listed under "## References"',
    )
  })

  it('rejects two headings with the same text', () => {
    const md = withSection('Constraints', '### Same\n\nText.\n\n### Same\n\nText.', 'append')
    expectIssue(issues({ md }), 'two headings are called "Same"')
  })

  it('rejects a heading that takes an id the page uses', () => {
    const md = withSection('Constraints', '### Related articles\n\nText.', 'append')
    expectIssue(issues({ md }), 'would take the id "related-articles"')
  })

  it('requires an article to have substance', () => {
    expectIssue(
      issues({ md: withSection('Constraints', words(5)) }),
      '"## Constraints" has 5 words',
    )
    const thin = source(
      Object.fromEntries(
        Object.entries(sections).map(([heading, text]) => [
          heading,
          text.startsWith('word') ? words(40) : text,
        ]),
      ),
    )
    expectIssue(issues({ md: thin }), 'words outside code; an article has at least 600')
  })

  it('requires the implementation example to have code', () => {
    expectIssue(
      issues({ md: withSection('Implementation example', words(110)) }),
      '"## Implementation example" has no code block',
    )
  })

  it('rejects a directive', () => {
    expectIssue(
      issues({ md: withSection('Constraints', '::registry-index{kind="component"}', 'append') }),
      'directives belong in the docs',
    )
  })

  it('rejects raw HTML', () => {
    expectIssue(
      issues({ md: withSection('Constraints', '<div>raw</div>', 'append') }),
      'raw HTML is not supported',
    )
  })
})

describe('verification', () => {
  const body = (extra: string) => `${words(60)}\n\n${extra}`
  const command = '```bash title="Command: pnpm test"\npnpm test\n```'

  it('requires the subsection that says what was not verified', () => {
    expectIssue(
      issues({ md: withSection('Verification', body(command)) }),
      `has no "### What this does not verify" subsection`,
    )
  })

  it('requires that subsection to say something', () => {
    expectIssue(
      issues({
        md: withSection(
          'Verification',
          body(`${command}\n\n### What this does not verify\n\nNothing.`),
        ),
      }),
      'is empty or too short',
    )
  })

  it('requires a command or a repository path', () => {
    const md = withSection(
      'Verification',
      `${words(60)}\n\n### What this does not verify\n\n${words(20)}`,
    )
    expectIssue(issues({ md }), 'names no command and no repository path')
  })

  it('accepts a repository path in code instead of a command', () => {
    const md = withSection(
      'Verification',
      `Read \`src/example.ts\` and compare. ${words(60)}\n\n### What this does not verify\n\n${words(20)}`,
    )
    expect(issues({ md })).toEqual([])
  })
})

describe('links', () => {
  const link = (href: string) => withSection('Constraints', `See [it](${href}).`, 'append')

  it('accepts a page on this site', () => {
    expect(issues({ md: link('/docs/testing') })).toEqual([])
  })

  it('rejects a page that does not exist, a heading it cannot check, and http', () => {
    expectIssue(issues({ md: link('/docs/nope') }), 'is not a page on this site')
    expectIssue(issues({ md: link('/docs/testing#x') }), 'cannot be checked')
    expectIssue(issues({ md: link('http://example.com') }), 'is not https')
    expectIssue(issues({ md: link('relative.md') }), 'must be an https:// URL')
  })

  it('checks a link to a heading on the same page', () => {
    expect(issues({ md: link('#constraints') })).toEqual([])
    expectIssue(issues({ md: link('#nowhere') }), 'points at no heading on this page')
  })

  it('checks a repository path written in code', () => {
    const md = withSection('Constraints', 'See `src/missing/file.ts`.', 'append')
    expectIssue(issues({ md }), 'src/missing/file.ts does not exist in the repository')
  })
})

describe('code blocks', () => {
  const block = (info: string, code: string) =>
    withSection('Implementation example', `\`\`\`${info}\n${code}\n\`\`\``, 'append')

  it('requires a title and a known language', () => {
    expectIssue(issues({ md: block('ts', 'const a = 1') }), 'has no title=')
    expectIssue(issues({ md: block('ruby title="x.rb"', 'puts 1') }), 'has the language "ruby"')
  })

  it('accepts an excerpt of a repository file, whatever its layout', () => {
    expect(
      issues({
        md: block(
          'ts title="src/example.ts (the helper)"',
          'export function add(\n  a: number,\n  b: number,\n) {\n  return a + b\n}',
        ),
      }),
    ).toEqual([])
  })

  it('accepts omitted code between gap markers', () => {
    expect(
      issues({
        md: block(
          'ts title="src/example.ts (two parts)"',
          'export const example = 1\n// …\nreturn a + b',
        ),
      }),
    ).toEqual([])
  })

  it('rejects a line the file does not have', () => {
    expectIssue(
      issues({ md: block('ts title="src/example.ts (invented)"', 'export const example = 2') }),
      'is not an excerpt of src/example.ts',
    )
  })

  it('rejects parts that come in a different order than the file', () => {
    expectIssue(
      issues({
        md: block(
          'ts title="src/example.ts (swapped)"',
          'return a + b\n// …\nexport const example = 1',
        ),
      }),
      'after the part before it',
    )
  })

  it('rejects an excerpt of a file that does not exist', () => {
    expectIssue(
      issues({ md: block('ts title="src/nowhere.ts"', 'export const x = 1') }),
      'is no repository file; label invented code',
    )
  })

  it('rejects a title that is neither a file nor labelled', () => {
    expectIssue(
      issues({ md: block('ts title="Example"', 'export const x = 1') }),
      'neither a repository file nor labelled',
    )
  })

  it('accepts code labelled hypothetical', () => {
    expect(
      issues({ md: block('ts title="Hypothetical example: a query hook"', 'export const x = 1') }),
    ).toEqual([])
    expectIssue(
      issues({ md: block('ts title="Hypothetical example: "', 'export const x = 1') }),
      'says what it is hypothetical about',
    )
  })

  it('accepts commands the repository defines', () => {
    expect(
      issues({
        md: block(
          'bash title="Command: run the test"',
          'pnpm test\npnpm exec vitest run src/example.ts',
        ),
      }),
    ).toEqual([])
  })

  it('rejects a command the repository does not define', () => {
    const run = (code: string) => issues({ md: block('bash title="Command: x"', code) })
    expectIssue(run('pnpm nope'), 'which is no script in package.json')
    expectIssue(run('npm test'), 'which is not a pnpm command')
    expectIssue(run('pnpm test src/missing.test.ts'), 'src/missing.test.ts, which does not exist')
    expectIssue(
      run('pnpm test:e2e e2e/missing.spec.ts'),
      'e2e/missing.spec.ts, which does not exist',
    )
    expectIssue(
      issues({ md: block('ts title="Command: x"', 'pnpm test') }),
      'use the bash language',
    )
  })

  it('rejects two blocks with one title', () => {
    const md = withSection(
      'Implementation example',
      '```ts title="src/example.ts (a)"\nexport const example = 1\n```\n\n```ts title="src/example.ts (a)"\nexport const example = 1\n```',
      'append',
    )
    expectIssue(issues({ md }), 'two code blocks are titled')
  })
})

describe('prose', () => {
  const prose = (text: string) => withSection('Constraints', text, 'append')

  it('rejects a numeric metric, a customer or employer claim, and a link in prose', () => {
    expectIssue(issues({ md: prose('It runs in 12 ms.') }), 'a numeric metric')
    expectIssue(
      issues({ md: prose('Customers rely on it.') }),
      'a customer, employer, or production claim',
    )
    expectIssue(
      issues({ md: prose('Visit https://example.com for more.') }),
      'a link or email in prose',
    )
  })

  it('rejects wording that claims a history the repository cannot show', () => {
    for (const text of [
      'After the outage we changed it.',
      'My team agreed.',
      'I fixed the bug.',
      'We shipped it on Friday.',
      'It runs on-call duty.',
    ]) {
      expectIssue(issues({ md: prose(text) }), 'a note describes the code')
    }
  })

  it('does not flag code spans', () => {
    expect(issues({ md: prose('The `incident` field is a name.') })).toEqual([])
  })

  it('applies the shared spelling and placeholder rules', () => {
    expectIssue(issues({ md: prose('Written in typescript.') }), 'the spelling is "TypeScript"')
    expectIssue(issues({ md: prose('Coming soon.') }), 'document what exists')
  })
})

describe('excerptProblem', () => {
  const file = [
    'import { a } from "x"',
    '',
    'export function add(left: number, right: number) {',
    '  const total = left + right',
    '  return total',
    '}',
    '',
    'export const later = [1, 2, 3]',
  ].join('\n')

  it('accepts a verbatim excerpt', () => {
    expect(excerptProblem('const total = left + right\nreturn total', file)).toBeUndefined()
  })

  it('accepts an excerpt that Prettier re-wrapped or dedented', () => {
    // Wrapped one parameter per line, with the trailing comma Prettier adds.
    expect(
      excerptProblem(
        'export function add(\n  left: number,\n  right: number,\n) {\n  const total = left + right',
        file,
      ),
    ).toBeUndefined()
    // Dedented out of its function.
    expect(excerptProblem('const total = left + right\nreturn total', file)).toBeUndefined()
    // The array wrapped, with and without a trailing comma.
    expect(excerptProblem('export const later = [\n  1,\n  2,\n  3,\n]', file)).toBeUndefined()
    expect(excerptProblem('export const later = [\n  1,\n  2,\n  3\n]', file)).toBeUndefined()
  })

  it('still rejects an excerpt that skips a line without a gap marker', () => {
    expect(
      excerptProblem('export function add(left: number, right: number) {\nreturn total', file),
    ).toContain('does not occur')
  })

  it('accepts a leading semicolon that Prettier adds', () => {
    expect(excerptProblem(';[1, 2, 3]', file)).toBeUndefined()
  })

  it('rejects an invented line', () => {
    expect(excerptProblem('const total = left * right', file)).toContain('does not occur')
  })

  it('accepts every kind of gap marker, in order', () => {
    for (const marker of ['// …', '// ...', '/* … */', '{/* … */}', '# …', '<!-- … -->']) {
      expect(
        excerptProblem(`import { a } from "x"\n${marker}\nreturn total`, file),
        marker,
      ).toBeUndefined()
    }
  })

  it('rejects parts in the wrong order', () => {
    expect(excerptProblem('return total\n// …\nimport { a } from "x"', file)).toContain(
      'after the part before it',
    )
  })

  it('rejects a block with no code', () => {
    expect(excerptProblem('// …', file)).toBe('has no code')
    expect(excerptProblem('', file)).toBe('has no code')
  })
})
