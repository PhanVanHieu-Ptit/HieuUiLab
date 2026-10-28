import { describe, expect, it } from 'vitest'

import { validateDocs, type DocsContext } from './docs-rules'
import { docFile, type DocEntry, type DocGroup, type DocNode } from './manifest'

const group: DocGroup = { id: 'group', title: 'Group', pages: [] }

interface PageOptions {
  slug?: string
  title?: string
  description?: string
  file?: string
}

function page(id: string, body: string, options: PageOptions = {}) {
  const slug = options.slug ?? (id === 'index' ? '' : id)
  const title = options.title ?? `Page ${id}`
  const entry: DocEntry = {
    id,
    slug,
    title,
    description: options.description ?? `About ${title}.`,
    ...(options.file ? { file: options.file } : {}),
    load: () => Promise.resolve({ default: '' }),
  }
  const node: DocNode = { entry, href: slug === '' ? '/docs' : `/docs/${slug}`, group, parents: [] }
  return { node, source: `# ${title}\n\n${body}` }
}

const sound = '## Section\n\nSome text.\n'

/** Files and routes the fixture repository has. */
const repoFiles = new Set(['package.json', 'src/lib/cn.ts', 'src/components/ui/button.tsx'])
const routes = new Set(['/', '/components', '/components/button', '/playground'])

function context(
  pages: ReturnType<typeof page>[],
  overrides: Partial<DocsContext> = {},
): DocsContext {
  return {
    pages,
    redirects: {},
    navHrefs: new Set(pages.map(({ node }) => node.href)),
    contentFiles: pages.map(({ node }) => docFile(node.entry)),
    readFile: (path) => pages.find(({ node }) => docFile(node.entry) === path)?.source,
    fileExists: (path) => repoFiles.has(path),
    pathExists: (path) =>
      repoFiles.has(path) || [...repoFiles].some((file) => file.startsWith(`${path}/`)),
    routeExists: (path) => routes.has(path),
    packages: new Set(['react', 'clsx']),
    sourcePaths: new Set(['src/lib/cn.ts']),
    tokenNames: new Set(['primary', 'background']),
    detailAnchors: new Set(['api', 'installation']),
    requirementHrefs: [],
    registry: {
      hasEntry: (slug) => slug === 'button',
      hasPart: (slug, part) => slug === 'button' && part === 'Button',
      hasExample: (slug, example) => slug === 'button' && example === 'variants',
      hasCategory: (category) => category === 'actions',
      texts: [],
    },
    ...overrides,
  }
}

/** The problems found in an index page plus one page with `body`, other pages given too. */
function problems(body: string, overrides: Partial<DocsContext> = {}, extra: PageOptions = {}) {
  return validateDocs(context([page('index', sound), page('other', body, extra)], overrides))
}

/** The problems in a page with `body`, reduced to the messages for that page. */
function messages(body: string, overrides: Partial<DocsContext> = {}): string[] {
  return problems(body, overrides)
    .filter((issue) => issue.startsWith('docs/other: '))
    .map((issue) => issue.slice('docs/other: '.length))
}

describe('validateDocs', () => {
  it('accepts sound pages', () => {
    expect(problems(sound)).toEqual([])
  })
})

describe('the manifest', () => {
  const issues = (pages: ReturnType<typeof page>[], overrides?: Partial<DocsContext>) =>
    validateDocs(context(pages, overrides))

  it('rejects a repeated id, URL, or title', () => {
    const found = issues([
      page('index', sound),
      page('a', sound, { slug: 'same', title: 'Same' }),
      page('a', sound, { slug: 'same', title: 'Same' }),
    ])
    expect(found).toContain('docs/a: the id is used by another page')
    expect(found).toContain('docs/a: the URL /docs/same is used by another page')
    expect(found).toContain('docs/a: the title "Same" is used by another page')
  })

  it('rejects a slug or id that is not kebab-case', () => {
    expect(issues([page('index', sound), page('Bad_Id', sound, { slug: 'Bad Slug' })])).toEqual(
      expect.arrayContaining([
        'docs/Bad_Id: the id must be kebab-case',
        'docs/Bad_Id: the slug "Bad Slug" must be kebab-case',
      ]),
    )
  })

  it('wants a description that is a sentence', () => {
    expect(
      issues([page('index', sound), page('a', sound, { description: 'No full stop' })]),
    ).toContain('docs/a: the description must be a sentence ending with a period')
  })

  it('wants every page in the sidebar', () => {
    expect(
      issues([page('index', sound), page('a', sound)], { navHrefs: new Set(['/docs']) }),
    ).toContain('docs/a: /docs/a is missing from the docs sidebar')
  })

  it('wants the file to exist and to be what the loader returns', () => {
    const pages = [page('index', sound), page('a', sound)]
    expect(issues(pages, { readFile: () => undefined })).toContain(
      'docs/a: its file src/docs/content/a.md does not exist',
    )
    expect(issues(pages, { readFile: () => 'something else' })).toContain(
      'docs/a: its loader returns something other than src/docs/content/a.md',
    )
  })

  it('rejects a Markdown file that no page uses', () => {
    const pages = [page('index', sound)]
    expect(
      issues(pages, {
        contentFiles: [
          ...pages.map(({ node }) => docFile(node.entry)),
          'src/docs/content/orphan.md',
        ],
      }),
    ).toContain('docs/manifest: src/docs/content/orphan.md belongs to no page in the manifest')
  })

  it('wants an index page', () => {
    expect(issues([page('a', sound)])).toContain('docs/manifest: there is no index page at /docs')
  })

  it('checks redirects', () => {
    const pages = [page('index', sound), page('a', sound)]
    expect(issues(pages, { redirects: { '/docs/old': '/docs/a' } })).toEqual([])
    expect(
      issues(pages, {
        redirects: { '/old': '/docs/a', '/docs/a': '/docs/a', '/docs/old': '/docs/gone' },
      }),
    ).toEqual([
      'docs/manifest: redirect /old is not under /docs',
      'docs/manifest: /docs/a is both a page and a redirect',
      'docs/manifest: redirect /docs/old points at /docs/gone, which is not a page',
    ])
  })
})

describe('the title and headings', () => {
  it('wants the file to start with the manifest title', () => {
    const wrong = page('other', sound)
    expect(
      validateDocs(
        context([page('index', sound), { ...wrong, source: `# Another title\n\n${sound}` }]),
      ),
    ).toContain(
      'docs/other: the file starts with "# Another title" but the manifest title is "Page other"',
    )
    expect(validateDocs(context([page('index', sound), { ...wrong, source: sound }]))).toContain(
      'docs/other: the file must start with "# Page other"',
    )
  })

  it('allows one h1', () => {
    expect(messages('## A\n\n# Second\n')).toContain(
      'has more than one # heading; the first line is the only h1',
    )
  })

  it('wants a section', () => {
    expect(messages('Only an intro.\n')).toContain('has no ## section')
  })

  it('rejects skipped levels and h5', () => {
    expect(messages('## A\n\n#### Deep\n')).toContain('heading "Deep" skips from h2 to h4')
    expect(messages('## A\n\n### B\n\n#### C\n\n##### Too deep\n')).toContain(
      'heading "Too deep" is h5; use ##, ###, or ####',
    )
  })

  it('rejects two headings with the same id and the reserved id', () => {
    expect(messages('## A {#same}\n\n## B {#same}\n')).toContain('two headings have the id "same"')
    expect(messages('## Main\n')).toContain('heading "main" would take the id of the page body')
  })

  it('rejects an empty heading', () => {
    expect(messages('## {#empty}\n')).toContain('has an empty heading')
  })
})

describe('unsupported Markdown', () => {
  it.each([
    ['a raw HTML block', '## A\n\n<div>hi</div>\n', 'raw HTML is not supported: "<div>hi</div>"'],
    ['inline HTML', '## A\n\nSome <b>bold</b>.\n', 'raw HTML is not supported: "<b>"'],
    ['an image', '## A\n\n![alt](/x.png)\n', 'images are not supported: "![alt](/x.png)"'],
    ['a task list', '## A\n\n- [ ] todo\n', 'task lists are not supported: "[ ]"'],
    [
      'an indented code block',
      '## A\n\ntext\n\n    indented\n',
      'indented code blocks are not supported; use a fenced block with a language: "indented"',
    ],
    [
      'a [!WARNING] alert',
      '## A\n\n> [!WARNING]\n> Careful.\n',
      '[!WARNING] is not a supported alert; use NOTE, TIP, IMPORTANT, CAUTION: "> [!WARNING] > Careful."',
    ],
  ])('rejects %s', (_, body, message) => {
    expect(messages(body)).toContain(message)
  })

  it('accepts the supported alerts', () => {
    expect(messages('## A\n\n> [!NOTE]\n> Fine.\n\n> [!CAUTION]\n> Careful.\n')).toEqual([])
  })

  it('rejects an alert with no text', () => {
    expect(messages('## A\n\n> [!NOTE]\n')).toContain('has an alert with no text')
  })
})

describe('text', () => {
  it('rejects HTML entities, which are shown as typed', () => {
    expect(messages('## A\n\nBread &amp; butter.\n')).toContain(
      'contains the HTML entity &amp;; write the character itself, since entities are shown as typed',
    )
  })

  it.each(['TODO', 'TBD', 'coming soon', 'upcoming', 'in a future release'])(
    'rejects "%s"',
    (phrase) => {
      expect(messages(`## A\n\nThis is ${phrase}.\n`)).toContain(
        `says "${phrase}"; document what exists, not what is promised`,
      )
    },
  )

  it('rejects "e2e" in prose but not in code', () => {
    expect(messages('## A\n\nRun the e2e tests.\n')).toContain(
      'writes "e2e" in prose; write "end-to-end" (e2e is for paths and commands)',
    )
    expect(messages('## A\n\nRun `pnpm test:e2e` and see `e2e/shell.spec.ts`.\n')).not.toContain(
      expect.stringContaining('e2e'),
    )
  })

  it.each([
    ['Github', 'GitHub'],
    ['typescript', 'TypeScript'],
    ['Nodejs', 'Node.js'],
    ['Pnpm', 'pnpm'],
    ['TailwindCSS', 'Tailwind" or "Tailwind CSS'],
    ['hieu ui lab', 'Hieu UI Lab'],
    ['Data Table', 'data table" or "Data table" or "DataTable'],
  ])('rejects the spelling "%s"', (wrong, right) => {
    expect(messages(`## A\n\nAbout ${wrong} here.\n`)).toContain(
      `writes "${wrong}"; the spelling is "${right}"`,
    )
  })

  it('accepts the right spellings, and any spelling inside code', () => {
    expect(
      messages(
        '## A\n\nGitHub, TypeScript, Node.js, pnpm, Tailwind CSS, Hieu UI Lab, a data table, and `github`.\n',
      ),
    ).toEqual([])
  })
})

describe('links', () => {
  it.each([
    ['an https URL', 'https://example.com/x'],
    ['a heading on the same page', '#section'],
    ['a docs page', '/docs/other'],
    ['a docs page heading', '/docs/other#section'],
    ['another page of the site', '/playground'],
    ['a page with a query', '/components?category=inputs'],
    ['a registry entry section', '/components/button#api'],
  ])('accepts %s', (_, href) => {
    expect(messages(`## Section\n\nSee [here](${href}).\n`)).toEqual([])
  })

  it.each([
    ['http://example.com', 'link http://example.com is not https'],
    [
      './relative.md',
      'link "./relative.md" must be an https:// URL, a /path on this site, or a #heading',
    ],
    [
      'mailto:a@b.c',
      'link "mailto:a@b.c" must be an https:// URL, a /path on this site, or a #heading',
    ],
    ['#nope', 'link #nope points at no heading on this page'],
    ['/docs/missing', 'link /docs/missing is not a docs page'],
    ['/docs/', 'link /docs/ is not a docs page'],
    ['/docs/other#nope', 'link /docs/other#nope points at no heading on /docs/other'],
    ['/nowhere', 'link /nowhere is not a page on this site'],
    [
      '/components/button#nope',
      'link /components/button#nope points at #nope, which is not a section of a registry entry page',
    ],
    [
      '/playground#top',
      'link /playground#top has a #heading that cannot be checked; link to the page instead',
    ],
  ])('rejects %s', (href, message) => {
    expect(messages(`## Section\n\nSee [here](${href}).\n`)).toContain(message)
  })

  it('rejects a link to a URL that moved', () => {
    expect(
      messages('## A\n\n[x](/docs/old)\n', { redirects: { '/docs/old': '/docs/index' } }),
    ).toContain('link /docs/old uses /docs/old, which moved to /docs/index')
  })

  it('checks links inside lists, tables, and alerts', () => {
    const bad = '[x](/docs/missing)'
    expect(messages(`## A\n\n- ${bad}\n`)).toHaveLength(1)
    expect(messages(`## A\n\n| H |\n| - |\n| ${bad} |\n`)).toHaveLength(1)
    expect(messages(`## A\n\n> [!NOTE]\n> ${bad}\n`)).toHaveLength(1)
  })

  it('checks where the registry sends its setup requirements', () => {
    expect(
      problems(sound, { requirementHrefs: ['/docs/other#section', '/docs/gone#section'] }),
    ).toEqual(['docs/registry: a setup requirement: link /docs/gone#section is not a docs page'])
    const pages = [page('index', '## Section\n\nx\n'), page('a', sound)]
    expect(
      validateDocs(context(pages, { requirementHrefs: ['/docs#section', '/docs#gone'] })),
    ).toEqual(['docs/registry: a setup requirement: link /docs#gone points at no heading on /docs'])
  })
})

describe('paths in code', () => {
  it('accepts a path that exists, a directory, and a root file', () => {
    expect(
      messages(
        '## A\n\nSee `src/lib/cn.ts`, `src/lib/`, `src/components/ui/`, and `package.json`.\n',
      ),
    ).toEqual([])
  })

  it('rejects a path that does not exist', () => {
    expect(messages('## A\n\nSee `src/lib/gone.ts` and `vite.config.ts`.\n')).toEqual([
      'src/lib/gone.ts does not exist in the repository',
      'vite.config.ts does not exist in the repository',
    ])
  })

  it('does not check placeholders, globs, or other words in code', () => {
    expect(
      messages(
        '## A\n\nSee `src/registry/<slug>/meta.ts`, `src/**/*.test.ts`, `cn.ts`, and `useTheme`.\n',
      ),
    ).toEqual([])
  })
})

describe('code blocks', () => {
  const fence = (info: string, code = 'const a = 1') => `## A\n\n\`\`\`${info}\n${code}\n\`\`\`\n`

  it('accepts a titled block in a known language', () => {
    for (const lang of ['tsx', 'ts', 'json', 'css', 'bash', 'text']) {
      expect(messages(fence(`${lang} title="example"`))).toEqual([])
    }
  })

  it('wants a title, a language, and only known attributes', () => {
    expect(messages(fence('tsx'))).toContain(
      'a tsx code block has no title="…"; the title names what is copied',
    )
    expect(messages(fence(''))).toContain(
      'code block "untitled" has no language; use tsx, ts, json, css, bash, text',
    )
    expect(messages(fence('python title="x"'))).toContain(
      'code block "x" has the language "python"; use tsx, ts, json, css, bash, text',
    )
    expect(messages(fence('ts title="x" copy="no"'))).toContain(
      'code block "x" has the unknown attribute "copy"',
    )
    expect(messages(fence('ts title=x'))).toEqual(
      expect.arrayContaining([expect.stringContaining('code block "ts": cannot read attributes')]),
    )
  })

  it('checks the imports of ts and tsx samples', () => {
    const ok =
      "import { clsx } from 'clsx'\nimport { Button } from '@/components/ui/button'\nimport { readFile } from 'node:fs/promises'\nimport cn from '@/lib/cn.ts?raw'\n"
    expect(messages(fence('ts title="ok"', ok))).toEqual([])
    expect(messages(fence('ts title="bad"', "import x from './local'"))).toContain(
      'code block "bad" imports "./local"; examples import with the @/ alias or a package name',
    )
    expect(messages(fence('ts title="bad"', "import x from '@/components/ui/gone'"))).toContain(
      'code block "bad" imports "@/components/ui/gone", which is no file under src/',
    )
    expect(messages(fence('tsx title="bad"', "import x from 'left-pad'"))).toContain(
      'code block "bad" imports "left-pad", which is not a dependency in package.json',
    )
    expect(messages(fence('tsx title="bad"', "import x from '@scope/pkg/deep'"))).toContain(
      'code block "bad" imports "@scope/pkg", which is not a dependency in package.json',
    )
    expect(messages(fence('ts title="bad"', "const m = await import('left-pad')"))).toContain(
      'code block "bad" imports "left-pad", which is not a dependency in package.json',
    )
    expect(messages(fence('ts title="bad"', "import 'left-pad'"))).toHaveLength(1)
  })

  it('does not read imports in other languages', () => {
    expect(messages(fence('bash title="x"', "import 'left-pad'"))).toEqual([])
  })

  it('rejects code pasted from a registry entry, but not a short snippet', () => {
    const copied =
      'export function Thing() {\n  return <div className="thing">A longer component body</div>\n}\n'
    const overrides = { registry: { ...context([]).registry, texts: [`// header\n${copied}`] } }
    expect(messages(fence('tsx title="copy"', copied), overrides)).toContain(
      'code block "copy" copies code from a registry entry; show it with ::registry-example or link to the entry',
    )
    expect(
      messages(fence('tsx title="short"', 'const a = 1'), {
        registry: { ...overrides.registry, texts: ['const a = 1'] },
      }),
    ).toEqual([])
  })
})

describe('directives', () => {
  it('accepts directives that name real things', () => {
    expect(
      messages(
        [
          '## A',
          '::registry-api{slug="button" part="Button"}',
          '::registry-example{slug="button" example="variants"}',
          '::registry-index{category="actions"}',
          '::source{path="src/lib/cn.ts"}',
          '::design-tokens{group="color"}',
          '::theme-switcher',
        ].join('\n\n'),
      ),
    ).toEqual([])
  })

  it.each([
    [
      '::registry-api{slug="nope"}',
      '::registry-api names "nope", which is no implemented registry entry',
    ],
    [
      '::registry-api{slug="button" part="Gone"}',
      '::registry-api names the part "Gone", which "button" does not document',
    ],
    [
      '::registry-example{slug="nope" example="x"}',
      '::registry-example names "nope", which is no implemented registry entry',
    ],
    [
      '::registry-example{slug="button" example="gone"}',
      '::registry-example names the example "gone", which "button" does not have',
    ],
    [
      '::registry-index{category="nope"}',
      '::registry-index names "nope", which is no registry category',
    ],
    [
      '::source{path="src/main.tsx"}',
      '::source names "src/main.tsx", which is not in src/docs/sources.ts',
    ],
  ])('rejects %s', (directive, message) => {
    expect(messages(`## A\n\n${directive}\n`)).toContain(message)
  })

  it('rejects malformed directives with the reason', () => {
    expect(messages('## A\n\n::nope\n')).toEqual([
      expect.stringContaining('unknown directive ::nope'),
    ])
    expect(messages('## A\n\n::registry-api\n')).toEqual([
      '::registry-api needs slug="…": "::registry-api"',
    ])
    expect(messages('## A\n\ntext\n::theme-switcher\n')).toEqual([
      expect.stringContaining('a directive is one line'),
    ])
  })

  it('rejects two examples with one id from different entries, which repeat a DOM id', () => {
    const overrides = {
      registry: { ...context([]).registry, hasEntry: () => true, hasExample: () => true },
    }
    expect(
      messages(
        '## A\n\n::registry-example{slug="a" example="basic"}\n\n::registry-example{slug="b" example="basic"}\n',
        overrides,
      ),
    ).toContain('examples "b" and "a" both have the id "basic" on one page')
  })
})

describe('duplicated content', () => {
  it('rejects a hand-written props table', () => {
    expect(messages('## A\n\n| Prop | Type | Default |\n| - | - | - |\n| a | b | c |\n')).toContain(
      'has a Prop and Type table; generate it with ::registry-api so it cannot drift',
    )
    expect(messages('## A\n\n| Name | Type |\n| - | - |\n| a | b |\n')).toEqual([])
  })

  it('rejects a hand-written table of design tokens', () => {
    expect(messages('## A\n\n| Token | Use |\n| - | - |\n| `--primary` | Links |\n')).toContain(
      'lists the token --primary by hand; generate token tables with ::design-tokens',
    )
    expect(messages('## A\n\n| Name | Use |\n| - | - |\n| `--unrelated` | Links |\n')).toEqual([])
  })
})

describe('the changelog', () => {
  const changelog = (body: string) =>
    validateDocs(
      context([
        page('index', sound),
        page('changelog', body, { title: 'Changelog', file: 'CHANGELOG.md' }),
      ]),
    )
      .filter((issue) => issue.startsWith('docs/changelog: '))
      .map((issue) => issue.slice('docs/changelog: '.length))

  const entry = '\n- A change.\n'

  it('accepts Unreleased followed by dates, newest first', () => {
    expect(
      changelog(`## Unreleased\n${entry}\n## 2026-10-16\n${entry}\n## 2026-10-14\n${entry}`),
    ).toEqual([])
  })

  it('wants Unreleased first', () => {
    expect(changelog(`## 2026-10-16\n${entry}`)).toContain(
      'the first ## section must be "Unreleased"',
    )
  })

  it('wants dates, real ones, newest first', () => {
    expect(changelog(`## Unreleased\n${entry}\n## Last week\n${entry}`)).toContain(
      'section "Last week" must be a date like 2026-10-16',
    )
    expect(changelog(`## Unreleased\n${entry}\n## 2026-02-30\n${entry}`)).toContain(
      'section "2026-02-30" must be a date like 2026-10-16',
    )
    expect(
      changelog(`## Unreleased\n${entry}\n## 2026-10-14\n${entry}\n## 2026-10-16\n${entry}`),
    ).toContain('section 2026-10-16 must come before 2026-10-14; newest first')
    expect(
      changelog(`## Unreleased\n${entry}\n## 2026-10-14\n${entry}\n## 2026-10-14\n${entry}`),
    ).toContain('section 2026-10-14 must come before 2026-10-14; newest first')
  })

  it('wants changes under every section', () => {
    expect(changelog('## Unreleased\n\nA sentence.\n')).toContain(
      'section "Unreleased" lists no changes',
    )
    expect(changelog(`## Unreleased\n${entry}\n## 2026-10-16\n\nA sentence.\n`)).toContain(
      'section "2026-10-16" lists no changes',
    )
  })

  it('lets Unreleased say "Nothing yet." and no other section', () => {
    expect(changelog('## Unreleased\n\nNothing yet.\n')).toEqual([])
    expect(changelog(`## Unreleased\n\nNothing yet.\n\n## 2026-10-16\n${entry}`)).toEqual([])
    expect(changelog(`## Unreleased\n${entry}\n## 2026-10-16\n\nNothing yet.\n`)).toContain(
      'section "2026-10-16" lists no changes',
    )
  })

  describe('versions', () => {
    it('accepts a version between Unreleased and the dates, tagged or not', () => {
      expect(
        changelog(`## Unreleased\n${entry}\n## 0.1.0\n${entry}\n## 2026-10-16\n${entry}`),
      ).toEqual([])
      expect(
        changelog(
          `## Unreleased\n${entry}\n## 0.1.0 - 2026-10-27\n${entry}\n## 2026-10-16\n${entry}`,
        ),
      ).toEqual([])
      // Tagged the day the last pull request merged.
      expect(
        changelog(
          `## Unreleased\n${entry}\n## 0.1.0 - 2026-10-16\n${entry}\n## 2026-10-16\n${entry}`,
        ),
      ).toEqual([])
    })

    it('wants versions newest first, with only the newest left untagged', () => {
      expect(
        changelog(`## Unreleased\n${entry}\n## 0.1.0 - 2026-10-20\n${entry}\n## 0.2.0\n${entry}`),
      ).toContain('version 0.2.0 must come before 0.1.0 - 2026-10-20; newest first')
      expect(
        changelog(`## Unreleased\n${entry}\n## 0.1.0\n${entry}\n## 0.0.9 - 2026-10-01\n${entry}`),
      ).toContain('0.1.0 has no date, so it must be the newest version')
      expect(
        changelog(`## Unreleased\n${entry}\n## 0.2.0\n${entry}\n## 0.1.0\n${entry}`),
      ).toContain('0.2.0 has no date, so it must be the newest version')
    })

    it('wants versions above the dated sections and tag dates that are real and not too old', () => {
      expect(
        changelog(`## Unreleased\n${entry}\n## 2026-10-16\n${entry}\n## 0.1.0\n${entry}`),
      ).toContain('version 0.1.0 must come before the dated sections')
      expect(changelog(`## Unreleased\n${entry}\n## 0.1.0 - 2026-02-30\n${entry}`)).toContain(
        'section "0.1.0 - 2026-02-30" must end in a real date like 0.1.0 - 2026-10-27',
      )
      expect(
        changelog(
          `## Unreleased\n${entry}\n## 0.1.0 - 2026-10-01\n${entry}\n## 2026-10-16\n${entry}`,
        ),
      ).toContain('a version dated 2026-10-01 is older than the section 2026-10-16 below it')
    })

    it('does not take a loose number for a version', () => {
      expect(changelog(`## Unreleased\n${entry}\n## v0.1\n${entry}`)).toContain(
        'section "v0.1" must be a date like 2026-10-16',
      )
    })
  })
})
