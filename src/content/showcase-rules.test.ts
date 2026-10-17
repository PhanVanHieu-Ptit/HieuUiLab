import { describe, expect, it } from 'vitest'

import {
  findUnsupportedClaim,
  isOwnRepositoryUrl,
  isPublicDeploymentUrl,
  isSafeRepoPath,
  validateShowcase,
  type ShowcaseContext,
} from './showcase-rules'
import type { ShowcaseMedia, ShowcaseProject } from './showcase-types'

const owner = 'https://github.com/example-owner'

const files: Record<string, string> = {
  'src/example.ts': 'export const example = 1 // anchor-text',
  'src/example.test.ts': 'it("proves the claim")',
}

const ctx: ShowcaseContext = {
  ownerProfileUrl: owner,
  fileExists: (path) => path in files,
  fileContains: (path, text) => files[path]?.includes(text) ?? false,
  hasLabDemo: (slug) => slug === 'known-demo',
  hasRegistryExample: (entry, kind, example) =>
    entry === 'button' && kind === 'component' && example === 'variants',
  hasTemplate: (slug) => slug === 'known-template',
  hasPublicAsset: (path) => path === '/showcase/example/home.png',
  routeExists: (href) => href === '/components',
  caseStudySlugs: ['existing-case-study'],
}

const valid: ShowcaseProject = {
  visibility: 'public',
  slug: 'example-project',
  category: 'platform',
  title: 'Example project',
  summary: 'A project used to test the rules.',
  role: 'Design and implementation',
  period: '2026',
  stack: ['React'],
  problem: ['Docs drift from code.'],
  scope: { summary: 'Everything here.', includes: ['Routing'], excludes: ['A backend'] },
  decisions: [
    { title: 'One registry', rationale: 'A single source.', tradeoff: 'Hand-written docs.' },
  ],
  architecture: {
    summary: 'Two layers.',
    parts: [{ name: 'Example', responsibility: 'Holds the example.', path: 'src/example.ts' }],
  },
  challenges: [
    {
      challenge: 'Drift.',
      solution: 'A test.',
      evidence: [
        { label: 'Example test', path: 'src/example.test.ts', anchor: 'proves the claim' },
      ],
    },
  ],
  media: [{ kind: 'lab-demo', slug: 'known-demo', caption: 'The demo.' }],
  repository: { url: `${owner}/example-repo`, verifiedOn: '2026-10-17' },
  deployment: { status: 'none' },
  limitations: ['Not deployed.'],
  improvements: ['Deploy it.'],
}

function problemsFor(change: (project: ShowcaseProject) => ShowcaseProject): string[] {
  return validateShowcase([change(valid)], ctx)
}

function withMedia(media: ShowcaseMedia): string[] {
  return problemsFor((project) => ({ ...project, media: [media] }))
}

describe('validateShowcase', () => {
  it('accepts a well-formed project', () => {
    expect(validateShowcase([valid], ctx)).toEqual([])
  })

  it('rejects a duplicate slug, a bad slug, and a clash with a case study', () => {
    expect(validateShowcase([valid, valid], ctx).join('\n')).toMatch(/slug is used twice/)
    expect(problemsFor((p) => ({ ...p, slug: 'Bad Slug' })).join('\n')).toMatch(/slug must be/)
    expect(problemsFor((p) => ({ ...p, slug: 'existing-case-study' })).join('\n')).toMatch(
      /collides with a case study/,
    )
  })

  it('rejects a project that is not public', () => {
    const problems = problemsFor((p) => ({ ...p, visibility: 'private' as unknown as 'public' }))
    expect(problems.join('\n')).toMatch(/only public projects/)
  })

  it('rejects a repository outside the owner’s account', () => {
    for (const url of [
      'https://github.com/some-company/secret-repo',
      'http://github.com/example-owner/example-repo',
      'https://gitlab.com/example-owner/example-repo',
      'https://github.com/example-owner',
      'https://github.com/example-owner/example-repo/tree/main',
      'https://github.com/example-owner/example-repo?tab=readme',
      'https://token@github.com/example-owner/example-repo',
      'not a url',
    ]) {
      const problems = problemsFor((p) => ({ ...p, repository: { ...p.repository, url } }))
      expect(problems.join('\n'), url).toMatch(/repository must be/)
    }
  })

  it('requires an ISO verification date on the repository and a live deployment', () => {
    expect(
      problemsFor((p) => ({ ...p, repository: { ...p.repository, verifiedOn: 'yesterday' } })).join(
        '\n',
      ),
    ).toMatch(/repository\.verifiedOn/)
    expect(
      problemsFor((p) => ({
        ...p,
        deployment: { status: 'live', url: 'https://demo.example.com', verifiedOn: '17/10/2026' },
      })).join('\n'),
    ).toMatch(/deployment\.verifiedOn/)
  })

  it('accepts a live deployment on a public https host', () => {
    expect(
      problemsFor((p) => ({
        ...p,
        deployment: { status: 'live', url: 'https://demo.example.com', verifiedOn: '2026-10-17' },
      })),
    ).toEqual([])
  })

  it('rejects an application without a live deployment', () => {
    const application = { ...valid, category: 'application' } as unknown as ShowcaseProject
    expect(validateShowcase([application], ctx).join('\n')).toMatch(/needs a live deployment/)
  })

  it('rejects deployment URLs that are not public https pages', () => {
    for (const url of [
      'http://demo.example.com',
      'https://localhost:3000',
      'https://192.168.0.10',
      'https://[::1]',
      'https://intranet',
      'https://user:pass@demo.example.com',
      'https://github.com/example-owner/example-repo',
    ]) {
      const problems = problemsFor((p) => ({
        ...p,
        deployment: { status: 'live', url, verifiedOn: '2026-10-17' },
      }))
      expect(problems.join('\n'), url).toMatch(/deployment\.url/)
    }
  })

  it('requires each section to have content', () => {
    const problems = problemsFor((p) => ({
      ...p,
      problem: [],
      decisions: [],
      architecture: { ...p.architecture, parts: [] },
      challenges: [],
      limitations: [],
      improvements: [],
    })).join('\n')
    for (const message of [
      /problem statement/,
      /technical decision/,
      /architecture parts/,
      /challenge with evidence/,
      /known limitations/,
      /future improvements/,
    ]) {
      expect(problems).toMatch(message)
    }
  })

  it('rejects evidence that is missing, unsafe, or does not contain its anchor', () => {
    const evidence = (path: string, anchor?: string) =>
      problemsFor((p) => ({
        ...p,
        challenges: [
          {
            challenge: 'c',
            solution: 's',
            evidence: [{ label: 'x', path, ...(anchor ? { anchor } : {}) }],
          },
        ],
      })).join('\n')

    expect(evidence('src/missing.ts')).toMatch(/does not exist/)
    expect(evidence('src/example.test.ts', 'not in the file')).toMatch(/does not contain/)
    for (const unsafe of [
      '../secrets.txt',
      '/etc/passwd',
      'src/../.env',
      '.env.local',
      'node_modules/x',
    ]) {
      expect(evidence(unsafe), unsafe).toMatch(/not a safe repository-relative path/)
    }
  })

  it('checks architecture part paths', () => {
    const problems = problemsFor((p) => ({
      ...p,
      architecture: {
        ...p.architecture,
        parts: [{ name: 'Gone', responsibility: 'Nothing.', path: 'src/gone.ts' }],
      },
    }))
    expect(problems.join('\n')).toMatch(/architecture part 1 \(Gone\).*does not exist/)
  })

  it('checks every kind of media', () => {
    expect(withMedia({ kind: 'lab-demo', slug: 'nope', caption: 'c' }).join('\n')).toMatch(
      /no lab demo/,
    )
    expect(
      withMedia({
        kind: 'registry-example',
        entry: 'button',
        entryKind: 'component',
        example: 'nope',
        caption: 'c',
      }).join('\n'),
    ).toMatch(/no component example/)
    expect(withMedia({ kind: 'template', slug: 'nope', caption: 'c' }).join('\n')).toMatch(
      /no template/,
    )
    expect(
      withMedia({ kind: 'route-link', href: '/nowhere', label: 'l', description: 'd' }).join('\n'),
    ).toMatch(/not a page of this site/)
    expect(
      withMedia({
        kind: 'route-link',
        href: 'https://example.com',
        label: 'l',
        description: 'd',
      }).join('\n'),
    ).toMatch(/not a page of this site/)
  })

  it('accepts media that exists', () => {
    expect(
      withMedia({ kind: 'route-link', href: '/components', label: 'l', description: 'd' }),
    ).toEqual([])
    expect(
      withMedia({
        kind: 'registry-example',
        entry: 'button',
        entryKind: 'component',
        example: 'variants',
        caption: 'c',
      }),
    ).toEqual([])
    expect(withMedia({ kind: 'template', slug: 'known-template', caption: 'c' })).toEqual([])
  })

  it('requires a screenshot to be a real, described file', () => {
    const screenshot = (change: Partial<Extract<ShowcaseMedia, { kind: 'screenshot' }>>) =>
      withMedia({
        kind: 'screenshot',
        src: '/showcase/example/home.png',
        alt: 'The home page',
        caption: 'Home',
        width: 1280,
        height: 720,
        ...change,
      }).join('\n')

    expect(screenshot({})).toBe('')
    expect(screenshot({ src: '/showcase/example/missing.png' })).toMatch(/no screenshot file/)
    expect(screenshot({ src: '/elsewhere/home.png' })).toMatch(/no screenshot file/)
    expect(screenshot({ alt: ' ' })).toMatch(/alt text/)
    expect(screenshot({ caption: '' })).toMatch(/caption/)
    expect(screenshot({ width: 0 })).toMatch(/width/)
    expect(screenshot({ height: 1.5 })).toMatch(/height/)
  })

  it('rejects a related case study that does not exist', () => {
    expect(
      problemsFor((p) => ({ ...p, relatedCaseStudies: ['existing-case-study', 'nope'] })).join(
        '\n',
      ),
    ).toMatch(/related case study "nope"/)
  })

  it('rejects unsupported claims in any prose field', () => {
    const claims = [
      'Cut load time by 40%.',
      'Used by 200 users.',
      'Runs in production at scale.',
      'Built for a customer.',
      'Shipped at my employer.',
      'See https://example.com for more.',
      'Mail me at someone@example.com.',
    ]
    for (const claim of claims) {
      expect(problemsFor((p) => ({ ...p, summary: claim })).join('\n'), claim).toMatch(/contains/)
      expect(problemsFor((p) => ({ ...p, limitations: [claim] })).join('\n'), claim).toMatch(
        /contains/,
      )
    }
  })
})

describe('isOwnRepositoryUrl', () => {
  it('matches the owner case-insensitively and nothing else', () => {
    expect(isOwnRepositoryUrl('https://github.com/Example-Owner/repo.name', owner)).toBe(true)
    expect(isOwnRepositoryUrl('https://github.com/example-owner/', owner)).toBe(false)
    expect(isOwnRepositoryUrl('https://github.com/example-owner/repo', 'https://example.com')).toBe(
      false,
    )
  })
})

describe('isPublicDeploymentUrl', () => {
  it('accepts a normal https host', () => {
    expect(isPublicDeploymentUrl('https://example-owner.github.io/repo/')).toBe(true)
  })
})

describe('isSafeRepoPath', () => {
  it('allows source, test, CI, public and a few root files', () => {
    for (const path of [
      'src/router/routes.tsx',
      'e2e/routes.spec.ts',
      '.github/workflows/ci.yml',
      'public/favicon.svg',
      'README.md',
    ]) {
      expect(isSafeRepoPath(path), path).toBe(true)
    }
    for (const path of ['dist/index.html', 'pnpm-lock.yaml', 'src//x.ts', 'src/./x.ts', '']) {
      expect(isSafeRepoPath(path), path).toBe(false)
    }
  })
})

describe('findUnsupportedClaim', () => {
  it('lets ordinary engineering prose through', () => {
    for (const text of [
      'Metadata is set client-side, so crawlers without JavaScript see defaults.',
      'Checks every route at three viewports in both themes.',
      'A small tested mat4 module and WebGL2 shaders.',
      'Colours are written in OKLCH.',
      'The scale factor is shown beside the map.',
    ]) {
      expect(findUnsupportedClaim(text), text).toBeUndefined()
    }
  })
})

describe('type guards', () => {
  it('does not let an application omit its deployment', () => {
    // @ts-expect-error An application must have a live deployment.
    const withoutDeployment: ShowcaseProject = { ...valid, category: 'application' }
    expect(withoutDeployment.category).toBe('application')
  })

  it('does not let a project be anything but public', () => {
    // @ts-expect-error Only public projects exist; a private one has nowhere to live.
    const priv: ShowcaseProject = { ...valid, visibility: 'private' }
    expect(priv.visibility).toBe('private')
  })

  it('requires evidence for a challenge', () => {
    const challenge: ShowcaseProject['challenges'][number] = {
      challenge: 'c',
      solution: 's',
      // @ts-expect-error Evidence is required and must not be empty.
      evidence: [],
    }
    expect(challenge.evidence).toHaveLength(0)
  })
})
